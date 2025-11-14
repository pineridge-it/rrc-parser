/**
 * Diagnostic script to analyze DAF420 field positions
 * Save as: diagnose-fields.ts
 * Run: npx ts-node diagnose-fields.ts daf420.dat
 */

import * as fs from 'fs';
import * as readline from 'readline';

// The FieldAnalysis interface was removed as it was declared but never used.

async function analyzeDaf420File(filePath: string) {
  const fileStream = fs.createReadStream(filePath, { encoding: 'latin1' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNum = 0;
  let record02Count = 0;
  let record14Count = 0;

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          DAF420 Field Position Diagnostic Tool                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  for await (const line of rl) {
    lineNum++;
    const recType = line.substring(0, 2);

    // Analyze first DAPERMIT record (02)
    if (recType === '02' && record02Count === 0) {
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`RECORD TYPE 02 (DAPERMIT) - Line ${lineNum}`);
      console.log(`${'═'.repeat(70)}\n`);
      console.log(`Record Length: ${line.length} characters\n`);

      analyzeDapermitRecord(line);
      record02Count++;
    }

    // Analyze first GIS_SURFACE record (14)
    if (recType === '14' && record14Count === 0) {
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`RECORD TYPE 14 (GIS_SURFACE) - Line ${lineNum}`);
      console.log(`${'═'.repeat(70)}\n`);
      console.log(`Record Length: ${line.length} characters\n`);

      analyzeGisRecord(line);
      record14Count++;
    }

    // Stop after analyzing both types
    if (record02Count > 0 && record14Count > 0) {
      break;
    }
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log('ANALYSIS COMPLETE');
  console.log(`${'═'.repeat(70)}\n`);
}

function analyzeDapermitRecord(record: string) {
  // Critical fields to analyze
  const fields = [
    { name: 'permit_number', start: 2, end: 9 },
    { name: 'county_code', start: 11, end: 14 },
    { name: 'lease_name', start: 14, end: 46 },
    { name: 'district', start: 46, end: 48 },
    { name: 'well_number', start: 48, end: 54 },
    { name: 'total_depth', start: 54, end: 59 },
    { name: 'operator_number', start: 59, end: 65 },
    { name: 'application_type', start: 65, end: 67 },
    
    // The problematic surface fields
    { name: 'surface_section', start: 244, end: 252 },
    { name: 'surface_block', start: 252, end: 261 },
    { name: 'surface_survey', start: 261, end: 316 },
    { name: 'surface_abstract', start: 316, end: 322 },
    
    // Flags
    { name: 'directional_flag', start: 481, end: 482 },
    { name: 'sidetrack_flag', start: 482, end: 483 },
    { name: 'horizontal_flag', start: 493, end: 494 }
  ];

  console.log('Field Analysis:');
  console.log('─'.repeat(70));

  for (const field of fields) {
    const value = extractField(record, field.start, field.end);
    const context = getContext(record, field.start, field.end, 5);
    
    console.log(`\n📍 ${field.name.toUpperCase()}`);
    console.log(`   Position: ${field.start}-${field.end} (length: ${field.end - field.start})`);
    console.log(`   Value: "${value}"`);
    console.log(`   Context: ...${context}...`);
    
    // Highlight potential issues
    if (field.name === 'surface_abstract' && /^\d+$/.test(value.trim())) {
      console.log(`   ⚠️  WARNING: Numeric value detected! Expected text.`);
    }
    
    if (field.name === 'total_depth' && !/^\d*$/.test(value.trim())) {
      console.log(`   ⚠️  WARNING: Non-numeric value in depth field!`);
    }
  }

  // Additional diagnostic: Check around position 481
  console.log(`\n\n${'─'.repeat(70)}`);
  console.log('POSITION 481 DIAGNOSTIC (Where "481" value comes from):');
  console.log('─'.repeat(70));
  console.log(`Position 476-486: "${record.substring(476, 486)}"`);
  console.log(`Position 481-482: "${record.substring(481, 482)}" (directional_flag)`);
  console.log(`Position 316-322: "${record.substring(316, 322)}" (surface_abstract)`);
  console.log(`\nIf surface_abstract shows "481", positions are WRONG!`);

  // Check the full record around surface fields
  console.log(`\n\n${'─'.repeat(70)}`);
  console.log('SURFACE FIELDS SECTION (positions 240-330):');
  console.log('─'.repeat(70));
  console.log(record.substring(240, 330));
  console.log('\nCharacter positions:');
  for (let i = 240; i < 330; i += 10) {
    console.log(`  ${i}: "${record.substring(i, Math.min(i + 10, 330))}"`);
  }
}

function analyzeGisRecord(record: string) {
  const fields = [
    { name: 'longitude', start: 2, end: 14 },
    { name: 'latitude', start: 14, end: 26 }
  ];

  console.log('Field Analysis:');
  console.log('─'.repeat(70));

  for (const field of fields) {
    const value = extractField(record, field.start, field.end);
    const context = getContext(record, field.start, field.end, 3);
    
    console.log(`\n📍 ${field.name.toUpperCase()}`);
    console.log(`   Position: ${field.start}-${field.end}`);
    console.log(`   Value: "${value}"`);
    console.log(`   Context: ...${context}...`);
    
    // Try to parse as coordinate
    const parsed = parseCoordinate(value);
    if (parsed !== null) {
      console.log(`   Parsed: ${parsed}`);
    } else {
      console.log(`   ⚠️  WARNING: Failed to parse as coordinate!`);
    }
  }

  console.log(`\n\n${'─'.repeat(70)}`);
  console.log('FULL GIS RECORD:');
  console.log('─'.repeat(70));
  console.log(record);
}

function extractField(record: string, start: number, end: number): string {
  if (start >= record.length) return '';
  const actualEnd = Math.min(end, record.length);
  return record.substring(start, actualEnd).trimEnd();
}

function getContext(record: string, start: number, end: number, padding: number): string {
  const contextStart = Math.max(0, start - padding);
  const contextEnd = Math.min(record.length, end + padding);
  
  const before = record.substring(contextStart, start);
  const value = record.substring(start, end);
  const after = record.substring(end, contextEnd);
  
  return `${before}[${value}]${after}`;
}

function parseCoordinate(value: string): number | null {
  const trimmed = value.trim().replace(/\+/g, '');
  if (!trimmed) return null;
  
  if (trimmed.includes('.')) {
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? null : parsed;
  }
  
  const sign = trimmed.startsWith('-') ? -1 : 1;
  const digits = trimmed.replace(/^[+-]/, '');
  
  if (!/^\d+$/.test(digits)) return null;
  
  return sign * (parseInt(digits, 10) / 1e7);
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npx ts-node diagnose-fields.ts <daf420-file>');
  console.error('Example: npx ts-node diagnose-fields.ts daf420.dat');
  process.exit(1);
}

// FIX: Use the non-null assertion operator (!) to tell TypeScript that args[0] 
// is definitely a string after the args.length check. This resolves TS2322.
const filePath: string = args[0]!; 

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

analyzeDaf420File(filePath).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});