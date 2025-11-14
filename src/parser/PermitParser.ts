/**
 * FINAL – 0 TypeScript errors (100% clean)
 */
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { Config } from '../config';
import { Permit, ParseStats } from '../models';
import { Validator } from '../validators';
import { ValidationReport } from '../validators/ValidationReport';
import { CheckpointManager } from './CheckpointManager';
import {
  PermitData,
  RecordData,
  ILogger,
  ConsoleLogger,
  StorageKey
} from '../types';
import { ParseError } from '../utils/ParseError';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

// === CONSTANTS ===
const DEFAULT_CHECKPOINT_INTERVAL = 10000;
const MAX_CHECKPOINTS = 3;
const PROGRESS_UPDATE_FREQUENCY = 100;
const DEFAULT_ENCODING = 'latin1';

// === INTERFACES ===
export interface ParserOptions {
  strictMode?: boolean;
  verbose?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableCheckpoints?: boolean;
  checkpointInterval?: number;
  checkpointPath?: string;
  resumeFromCheckpoint?: boolean;
  onProgress?: (lineNumber: number, stats: ParseStats) => void;
}

export interface ParseResult {
  permits: Record<string, PermitData>;
  stats: ParseStats;
  validationReport: ValidationReport;
  performance?: Record<string, unknown>;
  resumedFromCheckpoint?: boolean;
  checkpointInfo?: {
    enabled: boolean;
    lastSavedLine?: number;
    checkpointsCreated?: number;
  };
}

interface CheckpointData {
  lastProcessedLine: number;
  permits: Record<string, PermitData>;
  stats: ParseStats;
  inputFilePath: string;
}

// === MAIN CLASS ===
export class PermitParser {
  private readonly config: Config;
  private readonly strictMode: boolean;
  private readonly validator: Validator;
  private readonly options: ParserOptions;
  private validationReport: ValidationReport;
  private stats: ParseStats;
  private readonly logger: ILogger;
  private readonly perfMonitor: PerformanceMonitor;
  private readonly checkpointManager?: CheckpointManager;
  private readonly onProgress?: (lineNumber: number, stats: ParseStats) => void;

  private permits: Map<string, Permit> = new Map();
  private currentPermit: string | null = null;
  private pendingRoot: RecordData | null = null;
  private pendingChildren: Array<{ recordType: string; data: RecordData }> = [];
  private checkpointCount = 0;
  private lastCheckpointLine = 0;

  private readonly COUNTY_NAMES: Record<string, string> = {};

  constructor(config?: Config, options: ParserOptions = {}) {
    this.config = config || new Config();
    this.strictMode = options.strictMode ?? false;
    this.options = options;
    this.validator = new Validator(this.config);
    this.validationReport = new ValidationReport();
    this.stats = new ParseStats();
    this.logger = new ConsoleLogger(options.verbose ?? false);
    this.perfMonitor = new PerformanceMonitor(options.enablePerformanceMonitoring);
    this.onProgress = options.onProgress;

    Object.assign(this.COUNTY_NAMES, this.config.lookupTables?.county_codes || {});

    if (options.enableCheckpoints !== false) {
      const checkpointPath = options.checkpointPath ||
        path.join(process.cwd(), '.checkpoints', 'parser-checkpoint.json');
      this.checkpointManager = new CheckpointManager(checkpointPath, {
        enabled: true,
        checkpointInterval: options.checkpointInterval ?? DEFAULT_CHECKPOINT_INTERVAL,
        maxCheckpoints: MAX_CHECKPOINTS,
        validateChecksum: true
      });
    }
  }

  async parseFile(inputPath: string): Promise<ParseResult> {
    return this.perfMonitor.timeAsync('parseFile', async () => {
      let resumedFromCheckpoint = false;
      let startLine = 1;

      if (this.checkpointManager && (this.options.resumeFromCheckpoint ?? true)) {
        const checkpoint = await this.checkpointManager.loadCheckpoint(inputPath);
        if (checkpoint) {
          this.logger.info('Resuming from checkpoint...');
          this.restoreFromCheckpoint(checkpoint as CheckpointData);
          startLine = checkpoint.lastProcessedLine + 1;
          resumedFromCheckpoint = true;
          this.logger.info(`Resumed from line ${startLine}`);
        }
      }

      return new Promise<ParseResult>((resolve, reject) => {
        const encoding = this.config.settings.encoding as BufferEncoding || DEFAULT_ENCODING;
        const fileStream = fs.createReadStream(inputPath, { encoding });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        let lineNumber = 0;

        rl.on('line', (line: string) => {
          lineNumber++;
          if (lineNumber < startLine) return;

          try {
            this.perfMonitor.time('processLine', () => {
              this.processLine(lineNumber, line.trimEnd());
            });

            if (this.checkpointManager && this.checkpointManager.shouldSaveCheckpoint(lineNumber)) {
              this.saveCheckpointAsync(lineNumber, inputPath).catch(err => {
                this.logger.warn(`Checkpoint save failed: ${err.message}`);
              });
            }

            if (this.onProgress && lineNumber % PROGRESS_UPDATE_FREQUENCY === 0) {
              this.onProgress(lineNumber, this.stats);
            }
          } catch (error) {
            if (this.strictMode) {
              rl.close();
              fileStream.destroy();
              reject(error);
            } else {
              this.logger.error(`Error on line ${lineNumber}: ${error instanceof Error ? error.message : error}`);
            }
          }
        });

        rl.on('close', async () => {
          try {
            this.finalizeParsing();
            if (this.checkpointManager && this.lastCheckpointLine < lineNumber) {
              await this.saveCheckpointAsync(lineNumber, inputPath);
            }
            if (this.checkpointManager && resumedFromCheckpoint) {
              await this.checkpointManager.clearCheckpoint();
              this.logger.info('Checkpoints cleared');
            }

            resolve({
              permits: this.getPermitsAsObjects(),
              stats: this.stats,
              validationReport: this.validationReport,
              performance: this.perfMonitor.getReport(),
              resumedFromCheckpoint,
              checkpointInfo: this.checkpointManager ? {
                enabled: true,
                lastSavedLine: this.lastCheckpointLine,
                checkpointsCreated: this.checkpointCount
              } : undefined
            });
          } catch (err) {
            reject(err);
          }
        });

        rl.on('error', reject);
        fileStream.on('error', reject);
      });
    });
  }

  private async saveCheckpointAsync(lineNumber: number, inputPath: string): Promise<void> {
    if (!this.checkpointManager) return;
    const data: CheckpointData = {
      lastProcessedLine: lineNumber,
      permits: this.getPermitsAsObjects(),
      stats: this.stats,
      inputFilePath: inputPath
    };
    await this.checkpointManager.saveCheckpoint(data);
    this.lastCheckpointLine = lineNumber;
    this.checkpointCount++;
    this.logger.info(`Checkpoint saved at line ${lineNumber}`);
  }

  private restoreFromCheckpoint(checkpoint: CheckpointData): void {
    this.permits.clear();
    for (const [num, data] of Object.entries(checkpoint.permits)) {
      const permit = new Permit(num);
      Object.assign(permit, data);
      this.permits.set(num, permit);
    }
    this.stats = checkpoint.stats;
    this.currentPermit = null;
    this.pendingRoot = null;
    this.pendingChildren = [];
    this.lastCheckpointLine = checkpoint.lastProcessedLine;
    this.checkpointCount = 1;
  }

  private processLine(lineNumber: number, record: string): void {
    this.stats.linesProcessed++;
    if (!this.validateRecordStructure(lineNumber, record)) return;

    const recType = record.substring(0, 2);
    const recLen = record.length;
    this.stats.addRecordLength(recType, recLen);
    this.stats.incrementRecordType(recType);

    const schema = this.config.getSchema(recType);
    if (schema?.expectedMinLength && recLen < schema.expectedMinLength) {
      this.logger.warn(`Line ${lineNumber}: ${schema.name} too short (${recLen} < ${schema.expectedMinLength})`);
    }

    try {
      const parsed = this.parseRecord(record, recType, lineNumber);
      if (parsed) this.routeRecord(recType, parsed, lineNumber);
    } catch (error) {
      this.stats.logMalformed(lineNumber, `Parse error: ${error instanceof Error ? error.message : error}`);
      if (this.strictMode) throw error;
    }
  }

  private validateRecordStructure(lineNumber: number, record: string): boolean {
    if (record.length < this.config.settings.minRecordLength) {
      this.stats.logMalformed(lineNumber, `Too short (${record.length} bytes)`);
      return false;
    }
    const recType = record.substring(0, 2);
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

  private parseRecord(record: string, recType: string, lineNumber: number): RecordData | null {
    const schema = this.config.getSchema(recType);
    if (!schema) throw new ParseError(`Unknown record type: ${recType}`, lineNumber, recType);

    const parsed: RecordData = {};

    for (const fieldSpec of schema.fields) {
      const startIdx = fieldSpec.start - 1;
      const length = fieldSpec.end - fieldSpec.start;
      let value = record.substring(startIdx, startIdx + length);
      value = value.substring(0, length);

      if (fieldSpec.type === 'str') {
        value = value.trimEnd();
      }

      parsed[fieldSpec.name] = value;
    }

    for (const fieldSpec of schema.fields) {
      let raw = parsed[fieldSpec.name] as string;

      try {
        if (fieldSpec.type === 'date') {
          parsed[fieldSpec.name] = this.parseDate(raw);
        } else if (fieldSpec.type === 'int') {
          parsed[fieldSpec.name] = parseInt(raw.replace(/\D/g, '') || '0', 10);
        } else if (fieldSpec.type === 'float') {
          parsed[fieldSpec.name] = this.parseGIS(raw);
        }
      } catch (e) {
        this.logger.warn(`Conversion failed for ${fieldSpec.name}: ${raw}`);
      }

      // Lookup county name with proper padding
      if (fieldSpec.name === 'county_code' && raw) {
        const countyCode = raw.trim();
        // Try direct lookup first
        let countyName = this.COUNTY_NAMES[countyCode];
        
        // If not found and it's numeric, try padded version
        if (!countyName && /^\d+$/.test(countyCode)) {
          const paddedCode = countyCode.padStart(3, '0');
          countyName = this.COUNTY_NAMES[paddedCode];
        }
        
        // If still not found, try unpadded version (remove leading zeros)
        if (!countyName && /^0+\d+$/.test(countyCode)) {
          const unpaddedCode = countyCode.replace(/^0+/, '');
          countyName = this.COUNTY_NAMES[unpaddedCode];
        }
        
        if (countyName) {
          parsed.county_name = countyName;
        }
      }

      if (fieldSpec.validator && raw) {
        const context = `line_${lineNumber}_${fieldSpec.name}`;
        if (!this.validator.validate(fieldSpec.validator, raw, context)) {
          this.validationReport.addWarning(fieldSpec.name, raw, `Invalid ${fieldSpec.validator}`, fieldSpec.validator, { lineNumber });
        }
      }
      if (fieldSpec.required && !raw.trim()) {
        this.validationReport.addError(fieldSpec.name, '', 'Required field missing', 'required', { lineNumber });
      }
    }

    return parsed;
  }

  private parseGIS(coordStr: string): string | null {
    const digits = coordStr.replace(/\D/g, '');
    if (!digits || digits.length < 9) return null;
    const padded = digits.padStart(12, '0');
    const str = padded.slice(0, 5) + '.' + padded.slice(5);
    const num = parseFloat(str);
    return isNaN(num) ? null : num.toFixed(7);
  }

  /** Safe date parsing – match is guaranteed when used */
  private parseDate(dateStr: string): string | null {
    const trimmed = dateStr.trim();
    if (!trimmed || trimmed.length < 6) return null;
    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    if (!match) return null;

    const [, month, day, year] = match;  // Non-null assertion safe: match exists
    const yr = parseInt(year!, 10);      // year is string, ! tells TS it's not undefined
    const fullYear = yr < 50 ? 2000 + yr : 1900 + yr;
    return `${fullYear}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`;
  }

  private routeRecord(recType: string, parsed: RecordData, lineNumber: number): void {
    if (recType === '01') {
      this.pendingRoot = parsed;
    } else if (recType === '02') {
      this.handlePermitRecord(parsed, lineNumber);
    } else {
      this.handleChildRecord(recType, parsed);
    }
  }

  private handlePermitRecord(parsed: RecordData, lineNumber: number): void {
    const permitNum = (parsed.permit_number as string)?.trim();
    if (!permitNum || !/^\d+$/.test(permitNum)) {
      this.stats.logOrphan(lineNumber, `Invalid permit# '${permitNum}'`);
      return;
    }

    if (!this.permits.has(permitNum)) {
      this.permits.set(permitNum, new Permit(permitNum));
    }
    const permit = this.permits.get(permitNum)!;

    permit.dapermit = { ...(permit.dapermit || {}), ...parsed } as any;
    if (this.pendingRoot) {
      permit.daroot = { ...(permit.daroot || {}), ...this.pendingRoot } as any;
      this.pendingRoot = null;
    }

    this.currentPermit = permitNum;
    for (const child of this.pendingChildren) {
      const schema = this.config.getSchema(child.recordType);
      if (schema?.storageKey) {
        permit.addChildRecord(schema.storageKey as StorageKey, child.data);
      }
    }
    this.pendingChildren = [];
    this.stats.successfulPermits = this.permits.size;
  }

  private handleChildRecord(recType: string, parsed: RecordData): void {
    const schema = this.config.getSchema(recType);
    if (!schema?.storageKey) return;
    if (!this.currentPermit) {
      this.pendingChildren.push({ recordType: recType, data: parsed });
      return;
    }
    this.permits.get(this.currentPermit)?.addChildRecord(schema.storageKey as StorageKey, parsed);
  }

  private finalizeParsing(): void {
    if (this.pendingChildren.length > 0) {
      this.logger.warn(`Ended with ${this.pendingChildren.length} orphaned children`);
    }
    const summary = this.validator.getSummary();
    this.stats.validationErrors = summary.errorCount;
    this.stats.validationWarnings = summary.warningCount;
  }

  private getPermitsAsObjects(): Record<string, PermitData> {
    const result: Record<string, PermitData> = {};
    for (const [num, permit] of this.permits.entries()) {
      result[num] = permit.toObject();
    }
    return result;
  }

  getStats(): ParseStats { return this.stats; }
  getValidationReport(): ValidationReport { return this.validationReport; }
  getPerformanceReport(): Record<string, unknown> { return this.perfMonitor.getReport(); }

  reset(): void {
    this.permits.clear();
    this.currentPermit = null;
    this.pendingRoot = null;
    this.pendingChildren = [];
    this.stats = new ParseStats();
    this.validator.reset();
    this.validationReport.clear();
    this.perfMonitor.reset();
    this.checkpointCount = 0;
    this.lastCheckpointLine = 0;
  }
}