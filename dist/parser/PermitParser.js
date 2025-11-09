"use strict";
/**
 * Core permit parsing engine with state machine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermitParser = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const readline = tslib_1.__importStar(require("readline"));
const config_1 = require("../config");
const models_1 = require("../models");
const validators_1 = require("../validators");
const types_1 = require("../types");
const utils_1 = require("../utils");
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
        this.stats = new models_1.ParseStats();
        this.logger = new types_1.ConsoleLogger(options.verbose || false);
    }
    /**
     * Parse a DAF420 file
     * @param inputPath - Path to the input file
     * @returns Object containing permits and statistics
     */
    async parseFile(inputPath) {
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
                this.processLine(lineNumber, line.trimEnd());
            });
            rl.on('close', () => {
                this.finalizeParsing();
                const result = {
                    permits: this.getPermitsAsObjects(),
                    stats: this.stats
                };
                resolve(result);
            });
            rl.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Process a single line from the input file
     * @param lineNumber - The line number
     * @param record - The record string
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
            this.stats.logMalformed(lineNumber, `Parse error: ${String(error)}`);
            if (this.strictMode) {
                throw error;
            }
        }
    }
    /**
     * Validate the structure of a record
     * @param lineNumber - The line number
     * @param record - The record string
     * @returns True if valid
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
     * @param record - The record string
     * @param recType - The record type
     * @param lineNumber - The line number
     * @returns Parsed record data or null
     */
    parseRecord(record, recType, lineNumber) {
        const schema = this.config.getSchema(recType);
        if (!schema) {
            return null;
        }
        const parsed = schema.parseRecord(record);
        // Type conversion and validation
        for (const fieldSpec of schema.fields) {
            const rawValue = parsed[fieldSpec.name];
            // Type conversion
            if (fieldSpec.type === 'date') {
                parsed[fieldSpec.name] = (0, utils_1.parseDate)(rawValue);
            }
            else if (fieldSpec.type === 'int') {
                parsed[fieldSpec.name] = (0, utils_1.parseIntValue)(rawValue);
            }
            else if (fieldSpec.type === 'float') {
                parsed[fieldSpec.name] = (0, utils_1.parseFloatValue)(rawValue);
            }
            // Validation
            if (fieldSpec.validator && rawValue) {
                const context = `line_${lineNumber}_${fieldSpec.name}`;
                this.validator.validate(fieldSpec.validator, rawValue, context);
            }
            // Required field check
            if (fieldSpec.required && !rawValue) {
                this.logger.warn(`Line ${lineNumber}: Missing required field ${fieldSpec.name}`);
            }
        }
        return parsed;
    }
    /**
     * Route a parsed record to the appropriate handler
     * @param recType - The record type
     * @param parsed - The parsed record data
     * @param lineNumber - The line number
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
     * @param parsed - The parsed record data
     * @param lineNumber - The line number
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
     * @param recType - The record type
     * @param parsed - The parsed record data
     * @param lineNumber - The line number
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
     * @returns Record of permit number to permit data
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
     * @returns Parse statistics
     */
    getStats() {
        return this.stats;
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
    }
}
exports.PermitParser = PermitParser;
//# sourceMappingURL=PermitParser.js.map