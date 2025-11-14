// src/utils/addressDiagnostic.ts
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface FieldSpec {
  name: string;
  start: number;
  end: number;
}

interface Schema {
  fields: FieldSpec[];
}

console.log('Analyzing DAADDRESS records in: daf420.dat');
console.log('='.repeat(80));
console.log('DAADDRESS (Type 11) RECORD ANALYSIS');
console.log('='.repeat(80));

// Load config to know real start/end
const configPath = path.join(process.cwd(), 'config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as any;
const daaddressSchema = config.schemas['11'] as Schema;

// FIXED: Add null check + throw helpful error if field missing
const addressLineField = daaddressSchema.fields.find((f: any) => f.name === 'address_line');
if (!addressLineField) {
  console.error("ERROR: Could not find 'address_line' field in config.yaml for record type 11");
  console.error("Check your config.yaml has:");
  console.error("  - name: address_line");
  console.error("    start: 5");
  console.error("    end: 46");
  process.exit(1);
}

const realStart = addressLineField.start;
const realEnd = addressLineField.end;

console.log(`Config says address_line: positions ${realStart}-${realEnd} (length ${realEnd - realStart + 1})`);

const filePath = path.join(process.cwd(), 'daf420.dat');
const data = fs.readFileSync(filePath, 'latin1');
const lines = data.split('\n');

const daaddressLines: { lineNum: number; text: string }[] = [];
lines.forEach((line, idx) => {
  if (line.startsWith('11')) daaddressLines.push({ lineNum: idx + 1, text: line });
});

console.log(`Total DAADDRESS records found: ${daaddressLines.length}`);

const lengths = daaddressLines.map(r => r.text.length);
const minLen = Math.min(...lengths);
const maxLen = Math.max(...lengths);
const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;

console.log(`Record Length Statistics:
  Min Length: ${minLen}
  Max Length: ${maxLen}
  Avg Length: ${avgLen.toFixed(1)}`);

console.log('Sample Records (first 10):');
console.log('-'.repeat(80));

daaddressLines.slice(0, 10).forEach(rec => {
  const raw = rec.text;
  const key = raw.substring(2, 4);
  const currentExtract = raw.substring(realStart - 1, realEnd).trim();
  const fullFromConfig = raw.substring(realStart - 1, Math.min(realEnd, raw.length)).trim();
  const dataAfter = realEnd < raw.length ? raw.substring(realEnd) : '';

  console.log(`Line ${rec.lineNum}:`);
  console.log(`  Length: ${raw.length}`);
  console.log(`  Address Key: "${key}"`);
  console.log(`  Current Extract (${realStart}-${realEnd}): "${currentExtract}"`);
  console.log(`  Full Line (${realStart}-end): "${fullFromConfig}"`);
  if (dataAfter) console.log(`  Data After Pos ${realEnd}: "${dataAfter}"`);
  console.log(`  Raw: ${raw}`);
});

const truncated = daaddressLines.filter(r => r.text.length > realEnd);
console.log('='.repeat(80));
console.log('FINDINGS:');
console.log('='.repeat(80));
console.log(`Records with data after position ${realEnd}: ${truncated.length} of ${daaddressLines.length}`);

if (truncated.length > 0) {
  console.log(`WARNING: Address data extends beyond position ${realEnd}!`);
  console.log(`Current config extracts positions ${realStart}-${realEnd} (${realEnd - realStart + 1} chars)`);

  console.log('Examples of truncated addresses:');
  truncated.slice(0, 5).forEach(rec => {
    const truncatedText = rec.text.substring(realStart - 1, 39);
    const fullText = rec.text.substring(realStart - 1, realEnd);
    console.log(`  Line ${rec.lineNum}:`);
    console.log(`    Truncated: "${truncatedText}"`);
    console.log(`    Full: "${fullText}"`);
  });
} else {
  console.log('All addresses captured correctly! No truncation!');
}

console.log('='.repeat(80));
console.log('Analysis complete!');