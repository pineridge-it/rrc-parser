"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermitParser = void 0;
const tslib_1 = require("tslib");
/**
 * Enhanced PermitParser with Checkpoint/Recovery Support
 * Location: src/parser/PermitParser.ts
 *
 * IMPROVEMENTS:
 * - Fixed undefined 'options' variable bug (line 104)
 * - Added comprehensive type safety
 * - Improved error handling with specific error types
 * - Better documentation and code organization
 * - Added constants for magic numbers
 * - Improved null safety checks
 */
const fs = tslib_1.__importStar(require("fs"));
const readline = tslib_1.__importStar(require("readline"));
const path = tslib_1.__importStar(require("path"));
const config_1 = require("../config");
const models_1 = require("../models");
const validators_1 = require("../validators");
const ValidationReport_1 = require("../validators/ValidationReport");
const CheckpointManager_1 = require("./CheckpointManager");
const types_1 = require("../types");
const utils_1 = require("../utils");
const ParseError_1 = require("../utils/ParseError");
const PerformanceMonitor_1 = require("../utils/PerformanceMonitor");
// Constants
const DEFAULT_CHECKPOINT_INTERVAL = 10000;
const MAX_CHECKPOINTS = 3;
const PROGRESS_UPDATE_FREQUENCY = 100; // Update progress every N lines
const DEFAULT_ENCODING = 'latin1';
class PermitParser {
    constructor(config, options = {}) {
        // State machine variables
        this.permits = new Map();
        this.currentPermit = null;
        this.pendingRoot = null;
        this.pendingChildren = [];
        // Checkpoint tracking
        this.checkpointCount = 0;
        this.lastCheckpointLine = 0;
        this.config = config || new config_1.Config();
        this.strictMode = options.strictMode ?? false;
        this.options = options;
        this.validator = new validators_1.Validator(this.config);
        this.validationReport = new ValidationReport_1.ValidationReport();
        this.stats = new models_1.ParseStats();
        this.logger = new types_1.ConsoleLogger(options.verbose ?? false);
        this.perfMonitor = new PerformanceMonitor_1.PerformanceMonitor(options.enablePerformanceMonitoring);
        this.onProgress = options.onProgress;
        // Initialize checkpoint manager if enabled
        if (options.enableCheckpoints !== false) {
            const checkpointPath = options.checkpointPath ||
                path.join(process.cwd(), '.checkpoints', 'parser-checkpoint.json');
            this.checkpointManager = new CheckpointManager_1.CheckpointManager(checkpointPath, {
                enabled: true,
                checkpointInterval: options.checkpointInterval ?? DEFAULT_CHECKPOINT_INTERVAL,
                maxCheckpoints: MAX_CHECKPOINTS,
                validateChecksum: true
            });
        }
    }
    /**
     * Parse a DAF420 file with full checkpoint/resume support
     * @param inputPath - Path to the input file
     * @returns Promise resolving to parse results
     */
    async parseFile(inputPath) {
        return this.perfMonitor.timeAsync('parseFile', async () => {
            let resumedFromCheckpoint = false;
            let startLine = 1;
            // Attempt to resume from checkpoint
            if (this.checkpointManager && (this.options.resumeFromCheckpoint ?? true)) {
                const checkpoint = await this.checkpointManager.loadCheckpoint(inputPath);
                if (checkpoint) {
                    this.logger.info('Resuming parsing from checkpoint...');
                    const checkpointData = {
                        lastProcessedLine: checkpoint.lastProcessedLine,
                        permits: checkpoint.permits,
                        stats: checkpoint.stats,
                        inputFilePath: inputPath
                    };
                    this.restoreFromCheckpoint(checkpointData);
                    startLine = checkpoint.lastProcessedLine + 1;
                    resumedFromCheckpoint = true;
                    this.logger.info(`Resumed from line ${startLine}`);
                    this.logger.info(`Recovered ${Object.keys(checkpoint.permits).length} permits`);
                }
            }
            return new Promise((resolve, reject) => {
                const encoding = this.config.settings.encoding || DEFAULT_ENCODING;
                const fileStream = fs.createReadStream(inputPath, { encoding });
                const rl = readline.createInterface({
                    input: fileStream,
                    crlfDelay: Infinity
                });
                let lineNumber = 0;
                rl.on('line', (line) => {
                    lineNumber++;
                    // Skip already-processed lines
                    if (lineNumber < startLine)
                        return;
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
                        if (this.onProgress && lineNumber % PROGRESS_UPDATE_FREQUENCY === 0) {
                            this.onProgress(lineNumber, this.stats);
                        }
                    }
                    catch (error) {
                        if (this.strictMode) {
                            rl.close();
                            fileStream.destroy();
                            reject(error);
                        }
                        else {
                            const errorMsg = error instanceof Error ? error.message : String(error);
                            this.logger.error(`Error on line ${lineNumber}: ${errorMsg}`);
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
                        const result = {
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
                    }
                    catch (err) {
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
     * @param lineNumber - Current line number
     * @param inputPath - Path to the input file
     */
    async saveCheckpointAsync(lineNumber, inputPath) {
        if (!this.checkpointManager)
            return;
        try {
            const checkpointData = {
                lastProcessedLine: lineNumber,
                permits: this.getPermitsAsObjects(),
                stats: this.stats,
                inputFilePath: inputPath
            };
            await this.checkpointManager.saveCheckpoint(checkpointData);
            this.lastCheckpointLine = lineNumber;
            this.checkpointCount++;
            this.logger.info(`Checkpoint saved at line ${lineNumber}`);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to save checkpoint: ${errorMsg}`);
        }
    }
    /**
     * Restore full parser state from checkpoint
     * @param checkpoint - Checkpoint data to restore from
     */
    restoreFromCheckpoint(checkpoint) {
        // Restore permits
        this.permits.clear();
        for (const [permitNum, data] of Object.entries(checkpoint.permits)) {
            const permit = new models_1.Permit(permitNum);
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
     * @param lineNumber - Current line number
     * @param record - Record string to process
     */
    processLine(lineNumber, record) {
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
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.stats.logMalformed(lineNumber, `Parse error: ${msg}`);
            if (this.strictMode) {
                const parseError = error instanceof ParseError_1.ParseError
                    ? error
                    : new ParseError_1.ParseError(msg, lineNumber, recType, error instanceof Error ? error : undefined);
                throw parseError;
            }
        }
    }
    /**
     * Validate the basic structure of a record
     * @param lineNumber - Current line number
     * @param record - Record string to validate
     * @returns True if valid, false otherwise
     */
    validateRecordStructure(lineNumber, record) {
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
     * @param record - Record string
     * @param recType - Record type
     * @param lineNumber - Line number for error reporting
     * @returns Parsed record data or null on error
     */
    parseRecord(record, recType, lineNumber) {
        const schema = this.config.getSchema(recType);
        if (!schema) {
            throw new ParseError_1.ParseError(`Unknown record type: ${recType}`, lineNumber, recType);
        }
        let parsed;
        try {
            parsed = schema.parseRecord(record);
        }
        catch (error) {
            throw new ParseError_1.ParseError(`Failed to parse ${recType}`, lineNumber, recType, error instanceof Error ? error : undefined);
        }
        // Process each field according to its specification
        for (const fieldSpec of schema.fields) {
            const rawValue = parsed[fieldSpec.name];
            // Type conversion
            try {
                if (fieldSpec.type === 'date') {
                    parsed[fieldSpec.name] = (0, utils_1.parseDate)(rawValue);
                }
                else if (fieldSpec.type === 'int') {
                    parsed[fieldSpec.name] = (0, utils_1.parseIntValue)(rawValue);
                }
                else if (fieldSpec.type === 'float') {
                    parsed[fieldSpec.name] = (0, utils_1.parseFloatValue)(rawValue);
                }
            }
            catch (convErr) {
                const errorMsg = convErr instanceof Error ? convErr.message : String(convErr);
                this.logger.warn(`Line ${lineNumber}: Failed converting ${fieldSpec.name}: ${rawValue} - ${errorMsg}`);
            }
            // Validation
            if (fieldSpec.validator && rawValue) {
                const context = `line_${lineNumber}_${fieldSpec.name}`;
                if (!this.validator.validate(fieldSpec.validator, rawValue, context)) {
                    this.validationReport.addWarning(fieldSpec.name, rawValue, `Failed ${fieldSpec.validator}`, fieldSpec.validator, { lineNumber });
                }
            }
            // Required field check
            if (fieldSpec.required && !rawValue) {
                this.validationReport.addError(fieldSpec.name, '', 'Required field missing', 'required', { lineNumber });
            }
        }
        return parsed;
    }
    /**
     * Route a parsed record to the appropriate handler
     * @param recType - Record type
     * @param parsed - Parsed record data
     * @param lineNumber - Line number for error reporting
     */
    routeRecord(recType, parsed, lineNumber) {
        if (recType === '01') {
            this.pendingRoot = parsed;
        }
        else if (recType === '02') {
            this.handlePermitRecord(parsed, lineNumber);
        }
        else {
            this.handleChildRecord(recType, parsed, lineNumber);
        }
    }
    /**
     * Handle a permit (02) record
     * @param parsed - Parsed record data
     * @param lineNumber - Line number for error reporting
     */
    handlePermitRecord(parsed, lineNumber) {
        const permitNum = (parsed.permit_number || '').trim();
        if (!permitNum || !/^\d+$/.test(permitNum)) {
            this.stats.logOrphan(lineNumber, `Invalid permit# '${permitNum}'`);
            this.currentPermit = null;
            return;
        }
        if (!this.permits.has(permitNum)) {
            this.permits.set(permitNum, new models_1.Permit(permitNum));
        }
        const permit = this.permits.get(permitNum);
        if (!permit) {
            this.logger.error(`Failed to get permit ${permitNum}`);
            return;
        }
        // Merge permit data - create new object instead of mutating
        permit.dapermit = { ...(permit.dapermit || {}), ...parsed };
        // Attach pending root if available
        if (this.pendingRoot) {
            permit.daroot = { ...(permit.daroot || {}), ...this.pendingRoot };
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
    /**
     * Handle a child record (not root or permit)
     * @param recType - Record type
     * @param parsed - Parsed record data
     * @param lineNumber - Line number for error reporting
     */
    handleChildRecord(recType, parsed, lineNumber) {
        const schema = this.config.getSchema(recType);
        if (!schema?.storageKey)
            return;
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
    /**
     * Finalize parsing and compute final statistics
     */
    finalizeParsing() {
        if (this.pendingChildren.length > 0) {
            this.logger.warn(`Parse ended with ${this.pendingChildren.length} orphaned child records`);
        }
        const summary = this.validator.getSummary();
        this.stats.validationErrors = summary.errorCount;
        this.stats.validationWarnings = summary.warningCount;
    }
    /**
     * Convert permits map to plain objects
     * @returns Record of permit number to permit data
     */
    getPermitsAsObjects() {
        const result = {};
        for (const [num, permit] of this.permits.entries()) {
            result[num] = permit.toObject();
        }
        return result;
    }
    /**
     * Get current parsing statistics
     * @returns Parse statistics
     */
    getStats() {
        return this.stats;
    }
    /**
     * Get validation report
     * @returns Validation report
     */
    getValidationReport() {
        return this.validationReport;
    }
    /**
     * Get performance report
     * @returns Performance metrics
     */
    getPerformanceReport() {
        return this.perfMonitor.getReport();
    }
    /**
     * Reset parser state for reuse
     */
    reset() {
        this.permits.clear();
        this.currentPermit = null;
        this.pendingRoot = null;
        this.pendingChildren = [];
        this.stats = new models_1.ParseStats();
        this.validator.reset();
        this.validationReport.clear();
        this.perfMonitor.reset();
        this.checkpointCount = 0;
        this.lastCheckpointLine = 0;
    }
}
exports.PermitParser = PermitParser;
//# sourceMappingURL=PermitParser.js.map