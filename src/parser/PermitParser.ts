/**
 * Enhanced PermitParser with performance monitoring and better error handling
 * Location: src/parser/PermitParser.ts
 * 
 * REPLACE your existing PermitParser.ts with this version
 */

import * as fs from 'fs';
import * as readline from 'readline';
import { Config } from '../config';
import { Permit, ParseStats } from '../models';
import { Validator } from '../validators';
import { ValidationReport } from '../validators/ValidationReport';
import { 
  PermitData, 
  RecordData, 
  ILogger, 
  ConsoleLogger,
  StorageKey
} from '../types';
import { parseDate, parseIntValue, parseFloatValue } from '../utils';
import { ParseError } from '../utils/ParseError';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

export interface ParserOptions {
  strictMode?: boolean;
  verbose?: boolean;
  enablePerformanceMonitoring?: boolean;
  onProgress?: (lineNumber: number, stats: ParseStats) => void;
}

export interface ParseResult {
  permits: Record<string, PermitData>;
  stats: ParseStats;
  validationReport: ValidationReport;
  performance?: Record<string, any>;
}

export class PermitParser {
  private config: Config;
  private strictMode: boolean;
  private validator: Validator;
  private validationReport: ValidationReport;
  private stats: ParseStats;
  private logger: ILogger;
  private perfMonitor: PerformanceMonitor;
  private onProgress?: (lineNumber: number, stats: ParseStats) => void;
  
  // State machine variables
  private permits: Map<string, Permit> = new Map();
  private currentPermit: string | null = null;
  private pendingRoot: RecordData | null = null;
  private pendingChildren: Array<{ recordType: string; data: RecordData }> = [];
  
  constructor(config?: Config, options: ParserOptions = {}) {
    this.config = config || new Config();
    this.strictMode = options.strictMode || false;
    this.validator = new Validator(this.config);
    this.validationReport = new ValidationReport();
    this.stats = new ParseStats();
    this.logger = new ConsoleLogger(options.verbose || false);
    this.perfMonitor = new PerformanceMonitor(options.enablePerformanceMonitoring);
    this.onProgress = options.onProgress;
  }
  
  /**
   * Parse a DAF420 file
   */
  async parseFile(inputPath: string): Promise<ParseResult> {
    return this.perfMonitor.timeAsync('parseFile', async () => {
      return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(inputPath, {
          encoding: this.config.settings.encoding as BufferEncoding
        });
        
        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity
        });
        
        let lineNumber = 0;
        
        rl.on('line', (line: string) => {
          lineNumber++;
          
          try {
            this.perfMonitor.time('processLine', () => {
              this.processLine(lineNumber, line.trimEnd());
            });
            
            // Call progress callback periodically
            if (this.onProgress && lineNumber % 100 === 0) {
              this.onProgress(lineNumber, this.stats);
            }
          } catch (error) {
            if (this.strictMode) {
              rl.close();
              reject(error);
            }
          }
        });
        
        rl.on('close', () => {
          try {
            this.finalizeParsing();
            
            const result: ParseResult = {
              permits: this.getPermitsAsObjects(),
              stats: this.stats,
              validationReport: this.validationReport,
              performance: this.perfMonitor.getReport()
            };
            
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        
        rl.on('error', (error) => {
          reject(error);
        });
      });
    });
  }
  
  /**
   * Process a single line from the input file
   */
  private processLine(lineNumber: number, record: string): void {
    this.stats.linesProcessed++;
    
    // Validate record structure
    if (!this.validateRecordStructure(lineNumber, record)) {
      return;
    }
    
    const recType = record.substring(0, 2);
    const recLen = record.length;
    
    // Track statistics
    this.stats.addRecordLength(recType, recLen);
    this.stats.incrementRecordType(recType);
    
    // Check expected length
    const schema = this.config.getSchema(recType);
    if (schema?.expectedMinLength && recLen < schema.expectedMinLength) {
      this.logger.warn(
        `Line ${lineNumber}: ${schema.name} shorter than expected ` +
        `(${recLen} < ${schema.expectedMinLength})`
      );
    }
    
    // Parse and route the record
    try {
      const parsed = this.parseRecord(record, recType, lineNumber);
      if (parsed) {
        this.routeRecord(recType, parsed, lineNumber);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.stats.logMalformed(lineNumber, `Parse error: ${errorMsg}`);
      
      if (this.strictMode) {
        if (error instanceof ParseError) {
          throw error;
        }
        throw new ParseError(errorMsg, lineNumber, recType, error as Error);
      }
    }
  }
  
  /**
   * Validate the structure of a record
   */
  private validateRecordStructure(lineNumber: number, record: string): boolean {
    if (record.length < this.config.settings.minRecordLength) {
      this.stats.logMalformed(lineNumber, `Too short (${record.length} bytes)`);
      return false;
    }
    
    const recType = record.length >= 2 ? record.substring(0, 2) : '';
    
    if (!/^\d{2}$/.test(recType)) {
      this.stats.logMalformed(lineNumber, `Invalid type '${recType}'`);
      return false;
    }
    
    if (!this.config.getSchema(recType)) {
      this.stats.logMalformed(lineNumber, `Unknown record type ${recType}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Parse a record according to its schema
   */
  private parseRecord(record: string, recType: string, lineNumber: number): RecordData | null {
    const schema = this.config.getSchema(recType);
    if (!schema) {
      throw new ParseError(`Unknown record type: ${recType}`, lineNumber, recType);
    }
    
    let parsed: RecordData;
    
    try {
      parsed = schema.parseRecord(record);
    } catch (error) {
      throw new ParseError(
        `Failed to parse record type ${recType}`,
        lineNumber,
        recType,
        error instanceof Error ? error : undefined
      );
    }
    
    // Type conversion and validation
    for (const fieldSpec of schema.fields) {
      const rawValue = parsed[fieldSpec.name] as string;
      
      // Type conversion
      try {
        if (fieldSpec.type === 'date') {
          parsed[fieldSpec.name] = parseDate(rawValue);
        } else if (fieldSpec.type === 'int') {
          parsed[fieldSpec.name] = parseIntValue(rawValue);
        } else if (fieldSpec.type === 'float') {
          parsed[fieldSpec.name] = parseFloatValue(rawValue);
        }
      } catch (error) {
        this.logger.warn(
          `Line ${lineNumber}: Failed to convert ${fieldSpec.name} to ${fieldSpec.type}: ${rawValue}`
        );
      }
      
      // Validation
      if (fieldSpec.validator && rawValue) {
        const context = `line_${lineNumber}_${fieldSpec.name}`;
        const isValid = this.validator.validate(fieldSpec.validator, rawValue, context);
        
        if (!isValid) {
          // Add to validation report
          this.validationReport.addWarning(
            fieldSpec.name,
            rawValue,
            `Failed ${fieldSpec.validator} validation`,
            fieldSpec.validator,
            { lineNumber }
          );
        }
      }
      
      // Required field check
      if (fieldSpec.required && !rawValue) {
        this.logger.warn(`Line ${lineNumber}: Missing required field ${fieldSpec.name}`);
        this.validationReport.addError(
          fieldSpec.name,
          '',
          'Required field is missing',
          'required',
          { lineNumber }
        );
      }
    }
    
    return parsed;
  }
  
  /**
   * Route a parsed record to the appropriate handler
   */
  private routeRecord(recType: string, parsed: RecordData, lineNumber: number): void {
    if (recType === '01') {
      // DAROOT - store in pending buffer
      this.pendingRoot = parsed;
    } else if (recType === '02') {
      // DAPERMIT - create or update permit
      this.handlePermitRecord(parsed, lineNumber);
    } else {
      // Child records
      this.handleChildRecord(recType, parsed, lineNumber);
    }
  }
  
  /**
   * Handle a DAPERMIT record (02)
   */
  private handlePermitRecord(parsed: RecordData, lineNumber: number): void {
    const permitNum = (parsed.permit_number as string || '').trim();
    
    // Validate permit number
    if (!permitNum || !/^\d+$/.test(permitNum)) {
      this.stats.logOrphan(lineNumber, `DAPERMIT with invalid permit# '${permitNum}'`);
      this.currentPermit = null;
      return;
    }
    
    // Create or get existing permit
    if (!this.permits.has(permitNum)) {
      this.permits.set(permitNum, new Permit(permitNum));
    }
    
    const permit = this.permits.get(permitNum)!;
    
    // Set or update DAPERMIT record
    if (permit.dapermit) {
      permit.dapermit = { ...permit.dapermit, ...parsed } as any;
    } else {
      permit.dapermit = parsed as any;
    }
    
    // Merge pending DAROOT if available
    if (this.pendingRoot) {
      if (permit.daroot) {
        permit.daroot = { ...permit.daroot, ...this.pendingRoot } as any;
      } else {
        permit.daroot = this.pendingRoot as any;
      }
      this.pendingRoot = null;
    }
    
    // Set current permit
    this.currentPermit = permitNum;
    
    // Recover pending children
    if (this.pendingChildren.length > 0) {
      for (const { recordType, data } of this.pendingChildren) {
        const schema = this.config.getSchema(recordType);
        if (schema?.storageKey) {
          permit.addChildRecord(schema.storageKey as StorageKey, data);
          this.stats.recoveredRecords++;
        }
      }
      this.pendingChildren = [];
    }
    
    // Update success count
    this.stats.successfulPermits = this.permits.size;
  }
  
  /**
   * Handle a child record (03-15)
   */
  private handleChildRecord(recType: string, parsed: RecordData, lineNumber: number): void {
    const schema = this.config.getSchema(recType);
    if (!schema) {
      return;
    }
    
    // If no current permit, buffer the record (orphan recovery)
    if (!this.currentPermit) {
      this.pendingChildren.push({ recordType: recType, data: parsed });
      this.stats.logOrphan(lineNumber, `${schema.name} before DAPERMIT (buffered)`);
      return;
    }
    
    // Add to current permit
    const permit = this.permits.get(this.currentPermit);
    if (permit && schema.storageKey) {
      permit.addChildRecord(schema.storageKey as StorageKey, parsed);
    }
  }
  
  /**
   * Finalize parsing (called after all lines are processed)
   */
  private finalizeParsing(): void {
    // Check for remaining orphaned records
    if (this.pendingChildren.length > 0) {
      this.logger.warn(
        `File ended with ${this.pendingChildren.length} orphaned records`
      );
    }
    
    // Get validation summary
    const valSummary = this.validator.getSummary();
    this.stats.validationErrors = valSummary.errorCount;
    this.stats.validationWarnings = valSummary.warningCount;
  }
  
  /**
   * Get permits as plain objects
   */
  private getPermitsAsObjects(): Record<string, PermitData> {
    const result: Record<string, PermitData> = {};
    
    for (const [permitNum, permit] of this.permits.entries()) {
      result[permitNum] = permit.toObject();
    }
    
    return result;
  }
  
  /**
   * Get the current statistics
   */
  getStats(): ParseStats {
    return this.stats;
  }
  
  /**
   * Get the validation report
   */
  getValidationReport(): ValidationReport {
    return this.validationReport;
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceReport(): Record<string, any> {
    return this.perfMonitor.getReport();
  }
  
  /**
   * Reset the parser state
   */
  reset(): void {
    this.permits.clear();
    this.currentPermit = null;
    this.pendingRoot = null;
    this.pendingChildren = [];
    this.stats = new ParseStats();
    this.validator.reset();
    this.validationReport.clear();
    this.perfMonitor.reset();
  }
}