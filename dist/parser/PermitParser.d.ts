import { Config } from '../config';
import { ParseStats } from '../models';
import { ValidationReport } from '../validators/ValidationReport';
import { PermitData } from '../types';
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
export declare class PermitParser {
    private readonly config;
    private readonly strictMode;
    private readonly validator;
    private readonly options;
    private validationReport;
    private stats;
    private readonly logger;
    private readonly perfMonitor;
    private readonly checkpointManager?;
    private readonly onProgress?;
    private permits;
    private currentPermit;
    private pendingRoot;
    private pendingChildren;
    private checkpointCount;
    private lastCheckpointLine;
    constructor(config?: Config, options?: ParserOptions);
    /**
     * Parse a DAF420 file with full checkpoint/resume support
     * @param inputPath - Path to the input file
     * @returns Promise resolving to parse results
     */
    parseFile(inputPath: string): Promise<ParseResult>;
    /**
     * Save checkpoint asynchronously (fire-and-forget)
     * @param lineNumber - Current line number
     * @param inputPath - Path to the input file
     */
    private saveCheckpointAsync;
    /**
     * Restore full parser state from checkpoint
     * @param checkpoint - Checkpoint data to restore from
     */
    private restoreFromCheckpoint;
    /**
     * Process a single line from the input file
     * @param lineNumber - Current line number
     * @param record - Record string to process
     */
    private processLine;
    /**
     * Validate the basic structure of a record
     * @param lineNumber - Current line number
     * @param record - Record string to validate
     * @returns True if valid, false otherwise
     */
    private validateRecordStructure;
    /**
     * Parse a record according to its schema
     * @param record - Record string
     * @param recType - Record type
     * @param lineNumber - Line number for error reporting
     * @returns Parsed record data or null on error
     */
    private parseRecord;
    /**
     * Route a parsed record to the appropriate handler
     * @param recType - Record type
     * @param parsed - Parsed record data
     * @param lineNumber - Line number for error reporting
     */
    private routeRecord;
    /**
     * Handle a permit (02) record
     * @param parsed - Parsed record data
     * @param lineNumber - Line number for error reporting
     */
    private handlePermitRecord;
    /**
     * Handle a child record (not root or permit)
     * @param recType - Record type
     * @param parsed - Parsed record data
     * @param lineNumber - Line number for error reporting
     */
    private handleChildRecord;
    /**
     * Finalize parsing and compute final statistics
     */
    private finalizeParsing;
    /**
     * Convert permits map to plain objects
     * @returns Record of permit number to permit data
     */
    private getPermitsAsObjects;
    /**
     * Get current parsing statistics
     * @returns Parse statistics
     */
    getStats(): ParseStats;
    /**
     * Get validation report
     * @returns Validation report
     */
    getValidationReport(): ValidationReport;
    /**
     * Get performance report
     * @returns Performance metrics
     */
    getPerformanceReport(): Record<string, unknown>;
    /**
     * Reset parser state for reuse
     */
    reset(): void;
}
//# sourceMappingURL=PermitParser.d.ts.map