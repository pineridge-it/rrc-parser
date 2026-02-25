import * as fs from 'fs';
import * as readline from 'readline';
import { Config } from '../config';
import { PermitParser, ParseResult } from '../parser';
import { CSVRow, DaRootRecord, DaPermitRecord, GisSurfaceRecord } from '../types/permit';

export interface DryRunResult {
  configValid: boolean;
  warnings: string[];
  errors: string[];
  estimatedTime: number;
  estimatedPermits: number;
  sampleOutput: CSVRow[];
  fileInfo: {
    size: number;
    sizeFormatted: string;
    estimatedLines: number;
  };
}

export interface DryRunOptions {
  inputPath: string;
  outputPath: string;
  configPath?: string;
  strictMode?: boolean;
  sampleLines?: number;
}

export class DryRunSimulator {
  private config: Config;
  private sampleLines: number;

  constructor(config: Config, sampleLines: number = 100) {
    this.config = config;
    this.sampleLines = sampleLines;
  }

  async simulate(options: DryRunOptions): Promise<DryRunResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    const fileStats = fs.statSync(options.inputPath);
    const estimatedLines = Math.floor(fileStats.size / 100);

    const configValid = this.validateConfig(warnings, errors);

    const sampleOutput = await this.generateSampleOutput(options.inputPath);

    const estimatedPermits = this.estimatePermitCount(estimatedLines);
    const estimatedTime = this.estimateProcessingTime(fileStats.size, estimatedPermits);

    return {
      configValid,
      warnings,
      errors,
      estimatedTime,
      estimatedPermits,
      sampleOutput,
      fileInfo: {
        size: fileStats.size,
        sizeFormatted: this.formatFileSize(fileStats.size),
        estimatedLines,
      },
    };
  }

  private validateConfig(warnings: string[], errors: string[]): boolean {
    const configSummary = this.config.getSummary();

    if (configSummary.schemasCount === 0) {
      errors.push('No schemas loaded - configuration may be invalid');
      return false;
    }

    if (configSummary.lookupTablesCount === 0) {
      warnings.push('No lookup tables loaded - some validations may be skipped');
    }

    const schemas = this.config.schemas;
    const schemaEntries = Array.from(schemas.entries());
    for (const [code, schema] of schemaEntries) {
      if (!schema.name || schema.name.trim() === '') {
        warnings.push(`Schema ${code} has empty name`);
      }
      if (!schema.fields || schema.fields.length === 0) {
        warnings.push(`Schema ${code} has no fields defined`);
      }
    }

    return true;
  }

  private async generateSampleOutput(inputPath: string): Promise<CSVRow[]> {
    const samplePermits = await this.parseSampleFile(inputPath);

    if (Object.keys(samplePermits).length === 0) {
      return [];
    }

    const rows: CSVRow[] = [];
    const permitEntries = Object.entries(samplePermits).slice(0, 3);

    for (const [permitNum, data] of permitEntries) {
      const daroot = data.daroot as DaRootRecord | undefined;
      const dapermit = data.dapermit as DaPermitRecord | undefined;
      const gisSurf = data.gis_surface as GisSurfaceRecord | undefined;

      rows.push({
        permit_number: permitNum.padStart(7, '0'),
        lease_name: (daroot?.lease_name || dapermit?.lease_name || '') as string,
        operator_name: (daroot?.operator_name || '') as string,
        operator_number: (daroot?.operator_number || dapermit?.operator_number || '') as string,
        county_code: (daroot?.county_code || dapermit?.county_code || '') as string,
        county_name: '',
        district: (daroot?.district || dapermit?.district || '') as string,
        issue_date: (daroot?.issue_date || dapermit?.issued_date || '') as string,
        received_date: (daroot?.received_date || dapermit?.received_date || '') as string,
        amended_date: (dapermit?.amended_date || '') as string,
        extended_date: (dapermit?.extended_date || '') as string,
        spud_date: (dapermit?.spud_date || '') as string,
        well_number: (dapermit?.well_number || '') as string,
        well_status: (dapermit?.well_status || '') as string,
        total_depth: dapermit?.total_depth ?? '',
        application_type: (dapermit?.application_type || '') as string,
        app_type_desc: '',
        horizontal_flag: (dapermit?.horizontal_flag || '') as string,
        directional_flag: (dapermit?.directional_flag || '') as string,
        sidetrack_flag: (dapermit?.sidetrack_flag || '') as string,
        surface_section: (dapermit?.surface_section || '') as string,
        surface_block: (dapermit?.surface_block || '') as string,
        surface_survey: (dapermit?.surface_survey || '') as string,
        surface_abstract: (dapermit?.surface_abstract || '') as string,
        gis_surface_lat: gisSurf?.latitude ?? '',
        gis_surface_lon: gisSurf?.longitude ?? '',
        gis_bottomhole_lat: data.gis_bottomhole?.latitude ?? '',
        gis_bottomhole_lon: data.gis_bottomhole?.longitude ?? '',
        field_count: data.dafield?.length ?? 0,
        field_numbers: data.dafield?.map(f => f.field_number || '').filter(Boolean).join(', ') || '',
        lease_count: data.dalease?.length ?? 0,
        survey_count: data.dasurvey?.length ?? 0,
        restriction_count: data.dacanres?.length ?? 0,
        remark_count: data.daremarks?.length ?? 0,
        address: data.daaddress?.map(a => a.address_line).filter(Boolean).join('; ') || ''
      });
    }

    return rows;
  }

  private async parseSampleFile(inputPath: string): Promise<ParseResult['permits']> {
    const parser = new PermitParser(this.config, {
      strictMode: false,
      verbose: false,
      enablePerformanceMonitoring: false,
    });

    const fileStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const sampleLines: string[] = [];
    let lineCount = 0;

    for await (const line of rl) {
      sampleLines.push(line);
      lineCount++;
      if (lineCount >= this.sampleLines) {
        break;
      }
    }

    rl.close();
    fileStream.destroy();

    if (sampleLines.length === 0) {
      return {};
    }

    const tempFile = `${inputPath}.dryrun-sample.tmp`;
    fs.writeFileSync(tempFile, sampleLines.join('\n'));

    try {
      const result = await parser.parseFile(tempFile);
      return result.permits;
    } finally {
      fs.unlinkSync(tempFile);
    }
  }

  private estimatePermitCount(estimatedLines: number): number {
    const avgLinesPerPermit = 15;
    return Math.floor(estimatedLines / avgLinesPerPermit);
  }

  private estimateProcessingTime(fileSize: number, estimatedPermits: number): number {
    const baseMs = 100;
    const msPerKB = 0.5;
    const msPerPermit = 0.1;
    
    const sizeMs = (fileSize / 1024) * msPerKB;
    const permitMs = estimatedPermits * msPerPermit;
    
    return Math.ceil(baseMs + sizeMs + permitMs);
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  printPreview(result: DryRunResult, inputPath: string, outputPath: string): void {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 DRY-RUN PREVIEW');
    console.log('═'.repeat(80));

    if (result.configValid && result.errors.length === 0) {
      console.log('✅ Configuration Valid');
    } else {
      console.log('❌ Configuration Issues Detected');
    }

    console.log(`   • Schemas loaded: ${this.config.getSummary().schemasCount}`);
    console.log(`   • Lookup tables: ${this.config.getSummary().lookupTablesCount}`);

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of result.warnings) {
        console.log(`   • ${warning}`);
      }
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of result.errors) {
        console.log(`   • ${error}`);
      }
    }

    console.log('\n📊 Processing Preview:');
    console.log(`   • Input file: ${inputPath} (${result.fileInfo.sizeFormatted}, ~${result.fileInfo.estimatedLines.toLocaleString()} lines)`);
    console.log(`   • Output file: ${outputPath}`);
    console.log(`   • Estimated time: ${this.formatTime(result.estimatedTime)}`);
    console.log(`   • Expected permits: ${result.estimatedPermits.toLocaleString()}`);

    if (result.sampleOutput.length > 0) {
      console.log('\n┌─── Sample Output (first 3 rows) ───┐');

      const firstRow = result.sampleOutput[0];
      if (!firstRow) {
        console.log('└' + '─'.repeat(35) + '┘');
      } else {
        const headers = Object.keys(firstRow).slice(0, 6);
        console.log(`| ${headers.map(h => h.padEnd(12)).join(' | ')} |`);
        console.log(`|${headers.map(() => '-'.repeat(12)).join('|')}|`);

        for (const row of result.sampleOutput) {
          const values = headers.map(h => {
            const val = row[h as keyof CSVRow];
            const strVal = val !== null && val !== undefined ? String(val) : '';
            return strVal.substring(0, 12).padEnd(12);
          });
          console.log(`| ${values.join(' | ')} |`);
        }
        console.log('└' + '─'.repeat(headers.length * 14 + 1) + '┘');
      }
    }

    console.log('\n' + '═'.repeat(80));

    if (result.errors.length > 0) {
      console.log('❌ Fix these errors before running without --dry-run');
    } else {
      console.log('✅ Ready to process! Run without --dry-run to execute.');
    }
  }
}
