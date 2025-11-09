"use strict";
/**
 * Enhanced PermitParser with performance monitoring and better error handling
 * Location: src/parser/PermitParser.ts
 *
 * REPLACE your existing PermitParser.ts with this version
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermitParser = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const readline = tslib_1.__importStar(require("readline"));
const config_1 = require("../config");
const models_1 = require("../models");
const validators_1 = require("../validators");
const ValidationReport_1 = require("../validators/ValidationReport");
const types_1 = require("../types");
const utils_1 = require("../utils");
const ParseError_1 = require("../utils/ParseError");
const PerformanceMonitor_1 = require("../utils/PerformanceMonitor");
class PermitParser {
    constructor(config, options = {}) {
        // State machine variables
        this.permits = new Map();
        this.currentPermit = null;
        this.pendingRoot = null;
        this.pendingChildren = [];
        this.config = config || new config_1.Config();
        this.strictMode = options.strictMode || false;
        this.validator = new validators_1.Validator(this.config);
        this.validationReport = new ValidationReport_1.ValidationReport();
        this.stats = new models_1.ParseStats();
        this.logger = new types_1.ConsoleLogger(options.verbose || false);
        this.perfMonitor = new PerformanceMonitor_1.PerformanceMonitor(options.enablePerformanceMonitoring);
        this.onProgress = options.onProgress;
    }
    /**
     * Parse a DAF420 file
     */
    async parseFile(inputPath) {
        return this.perfMonitor.timeAsync('parseFile', async () => {
            return new Promise((resolve, reject) => {
                const fileStream = fs.createReadStream(inputPath, {
                    encoding: this.config.settings.encoding
                });
                const rl = readline.createInterface({
                    input: fileStream,
                    crlfDelay: Infinity
                });
                let lineNumber = 0;
                rl.on('line', (line) => {
                    lineNumber++;
                    try {
                        this.perfMonitor.time('processLine', () => {
                            this.processLine(lineNumber, line.trimEnd());
                        });
                        // Call progress callback periodically
                        if (this.onProgress && lineNumber % 100 === 0) {
                            this.onProgress(lineNumber, this.stats);
                        }
                    }
                    catch (error) {
                        if (this.strictMode) {
                            rl.close();
                            reject(error);
                        }
                    }
                });
                rl.on('close', () => {
                    try {
                        this.finalizeParsing();
                        const result = {
                            permits: this.getPermitsAsObjects(),
                            stats: this.stats,
                            validationReport: this.validationReport,
                            performance: this.perfMonitor.getReport()
                        };
                        resolve(result);
                    }
                    catch (error) {
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
    processLine(lineNumber, record) {
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
            this.logger.warn(`Line ${lineNumber}: ${schema.name} shorter than expected ` +
                `(${recLen} < ${schema.expectedMinLength})`);
        }
        // Parse and route the record
        try {
            const parsed = this.parseRecord(record, recType, lineNumber);
            if (parsed) {
                this.routeRecord(recType, parsed, lineNumber);
            }
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.stats.logMalformed(lineNumber, `Parse error: ${errorMsg}`);
            if (this.strictMode) {
                if (error instanceof ParseError_1.ParseError) {
                    throw error;
                }
                throw new ParseError_1.ParseError(errorMsg, lineNumber, recType, error);
            }
        }
    }
    /**
     * Validate the structure of a record
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
            throw new ParseError_1.ParseError(`Failed to parse record type ${recType}`, lineNumber, recType, error instanceof Error ? error : undefined);
        }
        // Type conversion and validation
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
            catch (error) {
                this.logger.warn(`Line ${lineNumber}: Failed to convert ${fieldSpec.name} to ${fieldSpec.type}: ${rawValue}`);
            }
            // Validation
            if (fieldSpec.validator && rawValue) {
                const context = `line_${lineNumber}_${fieldSpec.name}`;
                const isValid = this.validator.validate(fieldSpec.validator, rawValue, context);
                if (!isValid) {
                    // Add to validation report
                    this.validationReport.addWarning(fieldSpec.name, rawValue, `Failed ${fieldSpec.validator} validation`, fieldSpec.validator, { lineNumber });
                }
            }
            // Required field check
            if (fieldSpec.required && !rawValue) {
                this.logger.warn(`Line ${lineNumber}: Missing required field ${fieldSpec.name}`);
                this.validationReport.addError(fieldSpec.name, '', 'Required field is missing', 'required', { lineNumber });
            }
        }
        return parsed;
    }
    /**
     * Route a parsed record to the appropriate handler
     */
    routeRecord(recType, parsed, lineNumber) {
        if (recType === '01') {
            // DAROOT - store in pending buffer
            this.pendingRoot = parsed;
        }
        else if (recType === '02') {
            // DAPERMIT - create or update permit
            this.handlePermitRecord(parsed, lineNumber);
        }
        else {
            // Child records
            this.handleChildRecord(recType, parsed, lineNumber);
        }
    }
    /**
     * Handle a DAPERMIT record (02)
     */
    handlePermitRecord(parsed, lineNumber) {
        const permitNum = (parsed.permit_number || '').trim();
        // Validate permit number
        if (!permitNum || !/^\d+$/.test(permitNum)) {
            this.stats.logOrphan(lineNumber, `DAPERMIT with invalid permit# '${permitNum}'`);
            this.currentPermit = null;
            return;
        }
        // Create or get existing permit
        if (!this.permits.has(permitNum)) {
            this.permits.set(permitNum, new models_1.Permit(permitNum));
        }
        const permit = this.permits.get(permitNum);
        // Set or update DAPERMIT record
        if (permit.dapermit) {
            permit.dapermit = { ...permit.dapermit, ...parsed };
        }
        else {
            permit.dapermit = parsed;
        }
        // Merge pending DAROOT if available
        if (this.pendingRoot) {
            if (permit.daroot) {
                permit.daroot = { ...permit.daroot, ...this.pendingRoot };
            }
            else {
                permit.daroot = this.pendingRoot;
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
                    permit.addChildRecord(schema.storageKey, data);
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
    handleChildRecord(recType, parsed, lineNumber) {
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
            permit.addChildRecord(schema.storageKey, parsed);
        }
    }
    /**
     * Finalize parsing (called after all lines are processed)
     */
    finalizeParsing() {
        // Check for remaining orphaned records
        if (this.pendingChildren.length > 0) {
            this.logger.warn(`File ended with ${this.pendingChildren.length} orphaned records`);
        }
        // Get validation summary
        const valSummary = this.validator.getSummary();
        this.stats.validationErrors = valSummary.errorCount;
        this.stats.validationWarnings = valSummary.warningCount;
    }
    /**
     * Get permits as plain objects
     */
    getPermitsAsObjects() {
        const result = {};
        for (const [permitNum, permit] of this.permits.entries()) {
            result[permitNum] = permit.toObject();
        }
        return result;
    }
    /**
     * Get the current statistics
     */
    getStats() {
        return this.stats;
    }
    /**
     * Get the validation report
     */
    getValidationReport() {
        return this.validationReport;
    }
    /**
     * Get performance metrics
     */
    getPerformanceReport() {
        return this.perfMonitor.getReport();
    }
    /**
     * Reset the parser state
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
    }
}
exports.PermitParser = PermitParser;
//# sourceMappingURL=PermitParser.js.map