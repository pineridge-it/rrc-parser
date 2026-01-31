/**
 * Enhanced PermitParser with Checkpoint/Recovery Support
 * Location: src/parser/PermitParser.ts
 *
 * REPLACE your existing src/parser/PermitParser.ts with this version
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
  ConsoleLogger
} from '../types';
import { parseDate, parseIntValue, parseFloatValue } from '../utils';
import { ParseError } from '../utils/ParseError';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

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
  performance?: Record<string, any>;
  resumedFromCheckpoint?: boolean;
  checkpointInfo?: {
    enabled: boolean;
    lastSavedLine?: number;
    checkpointsCreated?: number;
  };
}

export class PermitParser {
  private config: Config;
  private strictMode: boolean;
  private validator: Validator;
  private validationReport: ValidationReport;
  private stats: ParseStats;
  private logger: ILogger;
  private perfMonitor: PerformanceMonitor;
  private checkpointManager?: CheckpointManager;
  private onProgress?: (lineNumber: number, stats: ParseStats) => void;

  // State machine variables
  private permits: Map<string, Permit> = new Map();
  private currentPermit: string | null = null;
  private pendingRoot: RecordData | null = null;
  private pendingChildren: Array<{ recordType: string; data: RecordData }> = [];

  // Checkpoint tracking
  private checkpointCount: number = 0;
  private lastCheckpointLine: number = 0;

  constructor(config?: Config, options: ParserOptions = {}) {
    this.config = config || new Config();
    this.strictMode = options.strictMode ?? false;
    this.validator = new Validator(this.config);
    this.validationReport = new ValidationReport();
    this.stats = new ParseStats();
    this.logger = new ConsoleLogger(options.verbose ?? false);
    this.perfMonitor = new PerformanceMonitor(options.enablePerformanceMonitoring);
    this.onProgress = options.onProgress;

    // Initialize checkpoint manager if enabled
    if (options.enableCheckpoints !== false) {
      const checkpointPath = options.checkpointPath ||
        path.join(process.cwd(), '.checkpoints', 'parser-checkpoint.json');

      this.checkpointManager = new CheckpointManager(checkpointPath, {
        enabled: true,
        checkpointInterval: options.checkpointInterval ?? 10000,
        maxCheckpoints: 3,
        validateChecksum: true
      });
    }
  }

  /**
   * Parse a DAF420 file with full checkpoint/resume support
   */
  async parseFile(inputPath: string, options: ParserOptions = {}): Promise<ParseResult> {
    return this.perfMonitor.timeAsync('parseFile', async () => {
      let resumedFromCheckpoint = false;
      let startLine = 1;

      // Attempt to resume from checkpoint
      if (this.checkpointManager && (options.resumeFromCheckpoint ?? true)) {
        const checkpoint = await this.checkpointManager.loadCheckpoint(inputPath);

        if (checkpoint) {
          this.logger.info('Resuming parsing from checkpoint...');
          this.restoreFromCheckpoint(checkpoint);
          startLine = checkpoint.lastProcessedLine + 1;
          resumedFromCheckpoint = true;
          this.logger.info(`Resumed from line ${startLine}`);
          this.logger.info(`Recovered ${Object.keys(checkpoint.permits).length} permits`);
        }
      }

      return new Promise<ParseResult>((resolve, reject) => {
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

          // Skip already-processed lines
          if (lineNumber < startLine) return;

          try {
            this.perfMonitor.time('processLine', () => {
              this.processLine(lineNumber, line.trimEnd());
            });

            // Periodic checkpoint save
            if (this.checkpointManager &&
                this.checkpointManager.shouldSaveCheckpoint(lineNumber)) {
              this.saveCheckpointAsync(lineNumber, inputPath).catch(err => {
                this.logger.warn(`Checkpoint save failed: ${err.message}`);
              });
            }

            // Progress callback
            if (this.onProgress && lineNumber % 100 === 0) {
              this.onProgress(lineNumber, this.stats);
            }
          } catch (error) {
            if (this.strictMode) {
              rl.close();
              fileStream.destroy();
              reject(error);
            } else {
              this.logger.error(`Error on line ${lineNumber}: ${(error as Error).message}`);
            }
          }
        });

        rl.on('close', async () => {
          try {
            this.finalizeParsing();

            // Final checkpoint save before clearing
            if (this.checkpointManager && this.lastCheckpointLine < lineNumber) {
              await this.saveCheckpointAsync(lineNumber, inputPath);
            }

            // Clear checkpoints on successful completion
            if (this.checkpointManager && resumedFromCheckpoint) {
              await this.checkpointManager.clearCheckpoint();
              this.logger.info('Checkpoints cleared after successful parse');
            }

            const result: ParseResult = {
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
            };

            resolve(result);
          } catch (err) {
            reject(err);
          }
        });

        rl.on('error', reject);
        fileStream.on('error', reject);
      });
    });
  }

  /**
   * Save checkpoint asynchronously (fire-and-forget)
   */
  private async saveCheckpointAsync(lineNumber: number, inputPath: string): Promise<void> {
    if (!this.checkpointManager) return;

    try {
      await this.checkpointManager.saveCheckpoint({
        lastProcessedLine: lineNumber,
        permits: this.getPermitsAsObjects(),
        stats: this.stats,
        inputFilePath: inputPath
      });

      this.lastCheckpointLine = lineNumber;
      this.checkpointCount++;
      this.logger.info(`Checkpoint saved at line ${lineNumber}`);
    } catch (error) {
      this.logger.warn(`Failed to save checkpoint: ${(error as Error).message}`);
    }
  }

  /**
   * Restore full parser state from checkpoint
   */
  private restoreFromCheckpoint(checkpoint: {
    lastProcessedLine: number;
    permits: Record<string, PermitData>;
    stats: ParseStats;
  }): void {
    // Restore permits
    this.permits.clear();
    for (const [permitNum, data] of Object.entries(checkpoint.permits)) {
      const permit = new Permit(permitNum);
      permit.daroot = data.daroot;
      permit.dapermit = data.dapermit;
      permit.dafield = data.dafield;
      permit.dalease = data.dalease;
      permit.dasurvey = data.dasurvey;
      permit.dacanres = data.dacanres;
      permit.daareas = data.daareas;
      permit.daremarks = data.daremarks;
      permit.daareares = data.daareares;
      permit.daaddress = data.daaddress;
      permit.gis_surface = data.gis_surface;
      permit.gis_bottomhole = data.gis_bottomhole;

      this.permits.set(permitNum, permit);
    }

    // Restore stats
    this.stats = checkpoint.stats;

    // Update internal tracking
    this.currentPermit = null;
    this.pendingRoot = null;
    this.pendingChildren = [];
    this.lastCheckpointLine = checkpoint.lastProcessedLine;
    this.checkpointCount = 1; // at least one exists
  }

  /**
   * Process a single line from the input file
   */
  private processLine(lineNumber: number, record: string): void {
    this.stats.linesProcessed++;

    if (!this.validateRecordStructure(lineNumber, record)) {
      return;
    }

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
      if (parsed) {
        this.routeRecord(recType, parsed, lineNumber);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.stats.logMalformed(lineNumber, `Parse error: ${msg}`);

      if (this.strictMode) {
        throw error instanceof ParseError ? error : new ParseError(msg, lineNumber, recType, error as Error);
      }
    }
  }

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

  private parseRecord(record: string, recType: string, lineNumber: number): RecordData | null {
    const schema = this.config.getSchema(recType);
    if (!schema) {
      throw new ParseError(`Unknown record type: ${recType}`, lineNumber, recType);
    }

    let parsed: RecordData;
    try {
      parsed = schema.parseRecord(record);
    } catch (error) {
      throw new ParseError(`Failed to parse ${recType}`, lineNumber, recType, error instanceof Error ? error : undefined);
    }

    for (const fieldSpec of schema.fields) {
      const rawValue = parsed[fieldSpec.name] as string;

      // Type conversion
      try {
        if (fieldSpec.type === 'date') parsed[fieldSpec.name] = parseDate(rawValue);
        else if (fieldSpec.type === 'int') parsed[fieldSpec.name] = parseIntValue(rawValue);
        else if (fieldSpec.type === 'float') parsed[fieldSpec.name] = parseFloatValue(rawValue);
      } catch (convErr) {
        this.logger.warn(`Line ${lineNumber}: Failed converting ${fieldSpec.name}: ${rawValue}`);
      }

      // Validation
      if (fieldSpec.validator && rawValue) {
        const context = `line_${lineNumber}_${fieldSpec.name}`;
        if (!this.validator.validate(fieldSpec.validator, rawValue, context)) {
          this.validationReport.addWarning(
            fieldSpec.name,
            rawValue,
            `Failed ${fieldSpec.validator}`,
            fieldSpec.validator,
            { lineNumber }
          );
        }
      }

      // Required field
      if (fieldSpec.required && !rawValue) {
        this.validationReport.addError(
          fieldSpec.name,
          '',
          'Required field missing',
          'required',
          { lineNumber }
        );
      }
    }

    return parsed;
  }

  private routeRecord(recType: string, parsed: RecordData, lineNumber: number): void {
    if (recType === '01') {
      this.pendingRoot = parsed;
    } else if (recType === '02') {
      this.handlePermitRecord(parsed, lineNumber);
    } else {
      this.handleChildRecord(recType, parsed, lineNumber);
    }
  }

  private handlePermitRecord(parsed: RecordData, lineNumber: number): void {
    const permitNum = (parsed.permit_number as string || '').trim();

    if (!permitNum || !/^\d+$/.test(permitNum)) {
      this.stats.logOrphan(lineNumber, `Invalid permit# '${permitNum}'`);
      this.currentPermit = null;
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

    // Apply buffered children
    if (this.pendingChildren.length > 0) {
      for (const { recordType, data } of this.pendingChildren) {
        const schema = this.config.getSchema(recordType);
        if (schema?.storageKey) {
          permit.addChildRecord(schema.storageKey, data);
          this.stats.recoveredRecords++;
        }
      }
      this.pendingChildren = [];
    }

    this.stats.successfulPermits = this.permits.size;
  }

  private handleChildRecord(recType: string, parsed: RecordData, lineNumber: number): void {
    const schema = this.config.getSchema(recType);
    if (!schema?.storageKey) return;

    if (!this.currentPermit) {
      this.pendingChildren.push({ recordType: recType, data: parsed });
      this.stats.logOrphan(lineNumber, `${schema.name} buffered`);
      return;
    }

    const permit = this.permits.get(this.currentPermit);
    if (permit) {
      permit.addChildRecord(schema.storageKey, parsed);
    }
  }

  private finalizeParsing(): void {
    if (this.pendingChildren.length > 0) {
      this.logger.warn(`Parse ended with ${this.pendingChildren.length} orphaned child records`);
    }

    const summary = this.validator.getSummary();
    this.stats.validationErrors = summary.errorCount;
    this.stats.validationWarnings = summary.warningCount;
  }

  private getPermitsAsObjects(): Record<string, PermitData> {
    const result: Record<string, PermitData> = {};
    this.permits.forEach((permit, num) => {
      result[num] = permit.toObject();
    });
    return result;
  }

  getStats(): ParseStats { return this.stats; }
  getValidationReport(): ValidationReport { return this.validationReport; }
  getPerformanceReport(): Record<string, any> { return this.perfMonitor.getReport(); }

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