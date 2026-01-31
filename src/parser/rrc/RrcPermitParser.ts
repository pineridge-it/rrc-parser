import * as fs from 'fs';
import * as readline from 'readline';
import { EventEmitter } from 'events';
import {
  RrcParserOptions,
  RrcParseResult,
  RrcParserStats,
  ParseErrorContext,
  RecordSchema,
  MalformedHandlerResult,
  RrcPermit
} from './types';
import { recordSchemas, getSchema, isSupportedRecordType } from './recordParsers';
import { RrcParseError, RrcMalformedRecordError, RrcOrphanRecordError } from './errors';
import { PermitData } from '../../types/permit';

/**
 * Parser statistics implementation
 */
class ParserStats implements RrcParserStats {
  linesProcessed = 0;
  recordsByType = new Map<string, number>();
  recordLengths = new Map<string, number[]>();
  validationErrors = 0;
  validationWarnings = 0;
  orphanedRecords = 0;
  malformedRecords = 0;
  successfulPermits = 0;
  recoveredRecords = 0;
  orphanDetails: string[] = [];
  malformedDetails: string[] = [];

  incrementRecordType(type: string): void {
    this.recordsByType.set(type, (this.recordsByType.get(type) || 0) + 1);
  }

  addRecordLength(type: string, length: number): void {
    if (!this.recordLengths.has(type)) {
      this.recordLengths.set(type, []);
    }
    this.recordLengths.get(type)!.push(length);
  }

  logOrphan(lineNumber: number, detail: string): void {
    this.orphanedRecords++;
    this.orphanDetails.push(`Line ${lineNumber}: ${detail}`);
  }

  logMalformed(lineNumber: number, detail: string): void {
    this.malformedRecords++;
    this.malformedDetails.push(`Line ${lineNumber}: ${detail}`);
  }

  reset(): void {
    this.linesProcessed = 0;
    this.recordsByType.clear();
    this.recordLengths.clear();
    this.validationErrors = 0;
    this.validationWarnings = 0;
    this.orphanedRecords = 0;
    this.malformedRecords = 0;
    this.successfulPermits = 0;
    this.recoveredRecords = 0;
    this.orphanDetails = [];
    this.malformedDetails = [];
  }
}

/**
 * Permit builder for accumulating records
 */
class PermitBuilder {
  permitNumber: string | null = null;
  daroot: PermitData['daroot'] = null;
  dapermit: PermitData['dapermit'] = null;
  dafield: PermitData['dafield'] = [];
  dalease: PermitData['dalease'] = [];
  dasurvey: PermitData['dasurvey'] = [];
  dacanres: PermitData['dacanres'] = [];
  daareas: PermitData['daareas'] = [];
  daremarks: PermitData['daremarks'] = [];
  daareares: PermitData['daareares'] = [];
  daaddress: PermitData['daaddress'] = [];
  gis_surface: PermitData['gis_surface'] = null;
  gis_bottomhole: PermitData['gis_bottomhole'] = null;

  addRecord(storageKey: string, data: Record<string, unknown>): void {
    switch (storageKey) {
      case 'daroot':
        this.daroot = data as PermitData['daroot'];
        this.permitNumber = (data.permit_number as string) || this.permitNumber;
        break;
      case 'dapermit':
        this.dapermit = data as PermitData['dapermit'];
        this.permitNumber = (data.permit_number as string) || this.permitNumber;
        break;
      case 'dafield':
        this.dafield.push(data as PermitData['dafield'][0]);
        break;
      case 'dalease':
        this.dalease.push(data as PermitData['dalease'][0]);
        break;
      case 'dasurvey':
        this.dasurvey.push(data as PermitData['dasurvey'][0]);
        break;
      case 'dacanres':
        this.dacanres.push(data as PermitData['dacanres'][0]);
        break;
      case 'daareas':
        this.daareas.push(data as PermitData['daareas'][0]);
        break;
      case 'daremarks':
        this.daremarks.push(data as PermitData['daremarks'][0]);
        break;
      case 'daareares':
        this.daareares.push(data as PermitData['daareares'][0]);
        break;
      case 'daaddress':
        this.daaddress.push(data as PermitData['daaddress'][0]);
        break;
      case 'gis_surface':
        this.gis_surface = data as PermitData['gis_surface'];
        break;
      case 'gis_bottomhole':
        this.gis_bottomhole = data as PermitData['gis_bottomhole'];
        break;
    }
  }

  build(): PermitData {
    return {
      daroot: this.daroot,
      dapermit: this.dapermit,
      dafield: this.dafield,
      dalease: this.dalease,
      dasurvey: this.dasurvey,
      dacanres: this.dacanres,
      daareas: this.daareas,
      daremarks: this.daremarks,
      daareares: this.daareares,
      daaddress: this.daaddress,
      gis_surface: this.gis_surface,
      gis_bottomhole: this.gis_bottomhole
    };
  }

  isValid(): boolean {
    return this.permitNumber !== null && this.daroot !== null;
  }
}

/**
 * RRC Permit Parser
 * 
 * Parses DAF420 format permit data from RRC with support for:
 * - Fixed-width record parsing
 * - Malformed data recovery
 * - Progress tracking
 * - Error handling with context
 */
export class RrcPermitParser extends EventEmitter {
  private options: Required<RrcParserOptions>;
  private stats: ParserStats;
  private errors: ParseErrorContext[] = [];
  private warnings: string[] = [];

  constructor(options: RrcParserOptions = {}) {
    super();
    this.options = {
      strictMode: options.strictMode ?? false,
      verbose: options.verbose ?? false,
      encoding: options.encoding ?? 'utf-8',
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? false,
      maxMalformedTolerance: options.maxMalformedTolerance ?? 100,
      onParseError: options.onParseError,
      onProgress: options.onProgress
    };
    this.stats = new ParserStats();
  }

  /**
   * Parse a DAF420 file
   */
  async parseFile(filePath: string): Promise<RrcParseResult> {
    this.reset();
    
    const startTime = Date.now();
    const permits = new Map<string, PermitBuilder>();
    let currentPermit: PermitBuilder | null = null;
    let pendingRoot: Record<string, unknown> | null = null;
    const pendingChildren: Array<{ storageKey: string; data: Record<string, unknown> }> = [];

    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath, {
        encoding: this.options.encoding
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let lineNumber = 0;

      rl.on('line', (line: string) => {
        lineNumber++;
        this.stats.linesProcessed++;

        try {
          const result = this.processLine(lineNumber, line);
          
          if (result) {
            const { recordType, storageKey, data } = result;

            // Handle root record
            if (recordType === '01') {
              pendingRoot = data;
            }
            // Handle permit record
            else if (recordType === '02') {
              const permitNum = (data.permit_number as string)?.trim();
              
              if (!permitNum || !/^\d+$/.test(permitNum)) {
                this.stats.logOrphan(lineNumber, `Invalid permit number: ${permitNum}`);
                currentPermit = null;
              } else {
                if (!permits.has(permitNum)) {
                  permits.set(permitNum, new PermitBuilder());
                }
                currentPermit = permits.get(permitNum)!;
                currentPermit.addRecord('dapermit', data);
                
                // Apply pending root
                if (pendingRoot) {
                  currentPermit.addRecord('daroot', pendingRoot);
                  pendingRoot = null;
                }

                // Apply buffered children
                if (pendingChildren.length > 0) {
                  for (const child of pendingChildren) {
                    currentPermit.addRecord(child.storageKey, child.data);
                    this.stats.recoveredRecords++;
                  }
                  pendingChildren.length = 0;
                }
              }
            }
            // Handle child records
            else if (storageKey) {
              if (!currentPermit) {
                pendingChildren.push({ storageKey, data });
                this.stats.logOrphan(lineNumber, `${recordType} buffered (no current permit)`);
              } else {
                currentPermit.addRecord(storageKey, data);
              }
            }
          }

          // Progress callback
          if (this.options.onProgress && lineNumber % 100 === 0) {
            this.options.onProgress(lineNumber, this.stats);
          }

          // Check malformed tolerance
          if (this.stats.malformedRecords > this.options.maxMalformedTolerance) {
            const error = new RrcParseError(
              `Malformed record tolerance exceeded (${this.stats.malformedRecords} > ${this.options.maxMalformedTolerance})`,
              lineNumber,
              'unknown',
              { recoverable: false }
            );
            rl.close();
            fileStream.destroy();
            reject(error);
            return;
          }
        } catch (error) {
          const handled = this.handleParseError(error as Error, lineNumber, line);
          
          if (handled.action === 'abort') {
            rl.close();
            fileStream.destroy();
            reject(new RrcParseError(handled.reason, lineNumber, 'unknown', { recoverable: false }));
            return;
          }
          // 'skip' and 'recover' continue processing
        }
      });

      rl.on('close', () => {
        // Log orphaned children at end
        if (pendingChildren.length > 0) {
          this.warnings.push(`Parse ended with ${pendingChildren.length} orphaned child records`);
        }

        // Build final permits
        const result: Record<string, PermitData> = {};
        permits.forEach((builder, permitNum) => {
          if (builder.isValid()) {
            result[permitNum] = builder.build();
          } else {
            this.warnings.push(`Permit ${permitNum} incomplete - skipped`);
          }
        });

        this.stats.successfulPermits = Object.keys(result).length;

        const duration = Date.now() - startTime;

        resolve({
          permits: result,
          stats: this.stats,
          errors: this.errors,
          warnings: this.warnings,
          performance: this.options.enablePerformanceMonitoring ? {
            durationMs: duration,
            linesPerSecond: Math.round((lineNumber / duration) * 1000)
          } : undefined
        });
      });

      rl.on('error', reject);
      fileStream.on('error', reject);
    });
  }

  /**
   * Process a single line
   */
  private processLine(lineNumber: number, record: string): { recordType: string; storageKey?: string; data: Record<string, unknown> } | null {
    // Validate record structure
    if (record.length < 2) {
      this.stats.logMalformed(lineNumber, 'Record too short (< 2 chars)');
      throw new RrcMalformedRecordError('Record too short', lineNumber, record, 'insufficient_length');
    }

    const recordType = record.substring(0, 2);

    // Validate record type
    if (!/^\d{2}$/.test(recordType)) {
      this.stats.logMalformed(lineNumber, `Invalid record type format: ${recordType}`);
      throw new RrcMalformedRecordError('Invalid record type', lineNumber, record, 'invalid_type_format');
    }

    if (!isSupportedRecordType(recordType)) {
      this.stats.logMalformed(lineNumber, `Unknown record type: ${recordType}`);
      throw new RrcMalformedRecordError('Unknown record type', lineNumber, record, 'unsupported_type');
    }

    const schema = getSchema(recordType)!;
    
    // Check length constraints
    if (record.length < schema.expectedMinLength) {
      this.stats.logMalformed(lineNumber, `${schema.name} too short (${record.length} < ${schema.expectedMinLength})`);
    }

    // Parse the record
    try {
      const data = schema.parseRecord(record);
      this.stats.incrementRecordType(recordType);
      this.stats.addRecordLength(recordType, record.length);

      return {
        recordType,
        storageKey: schema.storageKey,
        data
      };
    } catch (error) {
      throw new RrcParseError(
        `Failed to parse ${schema.name}`,
        lineNumber,
        recordType,
        { rawRecord: record, recoverable: true, cause: error as Error }
      );
    }
  }

  /**
   * Handle parse errors with recovery options
   */
  private handleParseError(error: Error, lineNumber: number, rawRecord: string): MalformedHandlerResult {
    const context: ParseErrorContext = {
      lineNumber,
      recordType: error instanceof RrcParseError ? error.recordType : 'unknown',
      rawRecord,
      error: error.message,
      recoverable: error instanceof RrcParseError ? error.recoverable : true
    };

    this.errors.push(context);

    // Call custom handler if provided
    if (this.options.onParseError) {
      const action = this.options.onParseError(context);
      
      switch (action) {
        case 'abort':
          return { action: 'abort', reason: error.message };
        case 'recover':
          // Attempt recovery - return partial data
          return { 
            action: 'recover', 
            recoveredData: this.attemptRecovery(rawRecord, context.recordType)
          };
        case 'skip':
        default:
          return { action: 'skip' };
      }
    }

    // Default behavior based on strict mode
    if (this.options.strictMode) {
      return { action: 'abort', reason: error.message };
    }

    return { action: 'skip' };
  }

  /**
   * Attempt to recover data from a malformed record
   */
  private attemptRecovery(rawRecord: string, recordType: string): Record<string, unknown> {
    const schema = getSchema(recordType);
    if (!schema) {
      return { segment: recordType, _recovery: true };
    }

    const result: Record<string, unknown> = { segment: recordType, _recovery: true };

    // Try to extract each field, using defaults on failure
    for (const field of schema.fields) {
      try {
        if (rawRecord.length >= field.start + field.length) {
          const rawValue = rawRecord.substring(field.start, field.start + field.length).trim();
          result[field.name] = rawValue || field.defaultValue;
        } else {
          result[field.name] = field.defaultValue;
        }
      } catch {
        result[field.name] = field.defaultValue;
      }
    }

    return result;
  }

  /**
   * Get current statistics
   */
  getStats(): RrcParserStats {
    return this.stats;
  }

  /**
   * Get accumulated errors
   */
  getErrors(): ParseErrorContext[] {
    return this.errors;
  }

  /**
   * Get accumulated warnings
   */
  getWarnings(): string[] {
    return this.warnings;
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.stats.reset();
    this.errors = [];
    this.warnings = [];
  }
}

// Export factory function
export function createRrcParser(options?: RrcParserOptions): RrcPermitParser {
  return new RrcPermitParser(options);
}
