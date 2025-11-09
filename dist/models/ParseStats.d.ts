/**
 * Parsing statistics class
 */
import { ParseStats as IParseStats } from '../types';
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
     * Convert to plain object
     * @returns Plain object representation
     */
    toObject(): Record<string, unknown>;
    /**
     * Get a summary string of the statistics
     * @returns Formatted summary string
     */
    getSummary(): string;
}
//# sourceMappingURL=ParseStats.d.ts.map