/**
 * Core permit parsing engine with state machine
 */
import { Config } from '../config';
import { ParseStats } from '../models';
import { PermitData } from '../types';
export declare class PermitParser {
    private config;
    private strictMode;
    private validator;
    private stats;
    private logger;
    private permits;
    private currentPermit;
    private pendingRoot;
    private pendingChildren;
    constructor(config?: Config, options?: {
        strictMode?: boolean;
        verbose?: boolean;
    });
    /**
     * Parse a DAF420 file
     * @param inputPath - Path to the input file
     * @returns Object containing permits and statistics
     */
    parseFile(inputPath: string): Promise<{
        permits: Record<string, PermitData>;
        stats: ParseStats;
    }>;
    /**
     * Process a single line from the input file
     * @param lineNumber - The line number
     * @param record - The record string
     */
    private processLine;
    /**
     * Validate the structure of a record
     * @param lineNumber - The line number
     * @param record - The record string
     * @returns True if valid
     */
    private validateRecordStructure;
    /**
     * Parse a record according to its schema
     * @param record - The record string
     * @param recType - The record type
     * @param lineNumber - The line number
     * @returns Parsed record data or null
     */
    private parseRecord;
    /**
     * Route a parsed record to the appropriate handler
     * @param recType - The record type
     * @param parsed - The parsed record data
     * @param lineNumber - The line number
     */
    private routeRecord;
    /**
     * Handle a DAPERMIT record (02)
     * @param parsed - The parsed record data
     * @param lineNumber - The line number
     */
    private handlePermitRecord;
    /**
     * Handle a child record (03-15)
     * @param recType - The record type
     * @param parsed - The parsed record data
     * @param lineNumber - The line number
     */
    private handleChildRecord;
    /**
     * Finalize parsing (called after all lines are processed)
     */
    private finalizeParsing;
    /**
     * Get permits as plain objects
     * @returns Record of permit number to permit data
     */
    private getPermitsAsObjects;
    /**
     * Get the current statistics
     * @returns Parse statistics
     */
    getStats(): ParseStats;
    /**
     * Reset the parser state
     */
    reset(): void;
}
//# sourceMappingURL=PermitParser.d.ts.map