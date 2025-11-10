/**
 * Parsing statistics class
 * Location: src/models/ParseStats.ts
 *
 * IMPROVEMENTS:
 * - Added readonly for immutable properties
 * - Better type safety
 * - Improved documentation
 * - Better formatting methods
 */
import { ParseStats as IParseStats } from '../types';
/**
 * Parse statistics tracker
 */
export declare class ParseStats implements IParseStats {
    linesProcessed: number;
    recordsByType: Map<string, number>;
    recordLengths: Map<string, number[]>;
    validationErrors: number;
    validationWarnings: number;
    orphanedRecords: number;
    malformedRecords: number;
    successfulPermits: number;
    recoveredRecords: number;
    orphanDetails: string[];
    malformedDetails: string[];
    /**
     * Increment record count for a specific type
     * @param recordType - The record type
     */
    incrementRecordType(recordType: string): void;
    /**
     * Add record length for a specific type
     * @param recordType - The record type
     * @param length - The record length
     */
    addRecordLength(recordType: string, length: number): void;
    /**
     * Log an orphaned record
     * @param lineNumber - Line number where the orphan occurred
     * @param message - Description of the orphan
     */
    logOrphan(lineNumber: number, message: string): void;
    /**
     * Log a malformed record
     * @param lineNumber - Line number where the malformed record occurred
     * @param message - Description of the problem
     */
    logMalformed(lineNumber: number, message: string): void;
    /**
     * Get average record length for a type
     * @param recordType - The record type
     * @returns Average length or 0 if no records
     */
    getAverageLength(recordType: string): number;
    /**
     * Get min and max record lengths for a type
     * @param recordType - The record type
     * @returns Object with min and max lengths
     */
    getLengthRange(recordType: string): {
        min: number;
        max: number;
    };
    /**
     * Convert to plain object
     * @returns Plain object representation
     */
    toObject(): Record<string, unknown>;
    /**
     * Get a summary string of the statistics
     * @returns Formatted summary string
     */
    getSummary(): string;
    /**
     * Format a number with locale-specific thousands separators
     * @param num - Number to format
     * @returns Formatted string
     */
    private formatNumber;
}
//# sourceMappingURL=ParseStats.d.ts.map