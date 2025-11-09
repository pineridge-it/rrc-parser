"use strict";
/**
 * Parsing statistics class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseStats = void 0;
class ParseStats {
    constructor() {
        this.linesProcessed = 0;
        this.recordsByType = new Map();
        this.recordLengths = new Map();
        this.validationErrors = 0;
        this.validationWarnings = 0;
        this.orphanedRecords = 0;
        this.malformedRecords = 0;
        this.successfulPermits = 0;
        this.recoveredRecords = 0;
        this.orphanDetails = [];
        this.malformedDetails = [];
    }
    /**
     * Increment record count for a specific type
     * @param recordType - The record type
     */
    incrementRecordType(recordType) {
        const current = this.recordsByType.get(recordType) || 0;
        this.recordsByType.set(recordType, current + 1);
    }
    /**
     * Add record length for a specific type
     * @param recordType - The record type
     * @param length - The record length
     */
    addRecordLength(recordType, length) {
        const lengths = this.recordLengths.get(recordType) || [];
        lengths.push(length);
        this.recordLengths.set(recordType, lengths);
    }
    /**
     * Log an orphaned record
     * @param lineNumber - Line number where the orphan occurred
     * @param message - Description of the orphan
     */
    logOrphan(lineNumber, message) {
        this.orphanedRecords++;
        this.orphanDetails.push(`Line ${lineNumber}: ${message}`);
    }
    /**
     * Log a malformed record
     * @param lineNumber - Line number where the malformed record occurred
     * @param message - Description of the problem
     */
    logMalformed(lineNumber, message) {
        this.malformedRecords++;
        this.malformedDetails.push(`Line ${lineNumber}: ${message}`);
    }
    /**
     * Convert to plain object
     * @returns Plain object representation
     */
    toObject() {
        return {
            linesProcessed: this.linesProcessed,
            recordsByType: Object.fromEntries(this.recordsByType),
            validationErrors: this.validationErrors,
            validationWarnings: this.validationWarnings,
            orphanedRecords: this.orphanedRecords,
            malformedRecords: this.malformedRecords,
            successfulPermits: this.successfulPermits,
            recoveredRecords: this.recoveredRecords
        };
    }
    /**
     * Get a summary string of the statistics
     * @returns Formatted summary string
     */
    getSummary() {
        return `
Processing Summary:
  Lines Processed: ${this.linesProcessed.toLocaleString()}
  Unique Permits: ${this.successfulPermits.toLocaleString()}
  Malformed Records: ${this.malformedRecords.toLocaleString()}
  Orphaned Records: ${this.orphanedRecords.toLocaleString()}
    - Recovered: ${this.recoveredRecords.toLocaleString()}
    - Lost: ${(this.orphanedRecords - this.recoveredRecords).toLocaleString()}
  Validation Errors: ${this.validationErrors.toLocaleString()}
  Validation Warnings: ${this.validationWarnings.toLocaleString()}
    `.trim();
    }
}
exports.ParseStats = ParseStats;
//# sourceMappingURL=ParseStats.js.map