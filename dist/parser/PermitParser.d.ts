/**
 * Enhanced PermitParser with performance monitoring and better error handling
 * Location: src/parser/PermitParser.ts
 *
 * REPLACE your existing PermitParser.ts with this version
 */
import { Config } from '../config';
import { ParseStats } from '../models';
import { ValidationReport } from '../validators/ValidationReport';
import { PermitData } from '../types';
export interface ParserOptions {
    strictMode?: boolean;
    verbose?: boolean;
    enablePerformanceMonitoring?: boolean;
    onProgress?: (lineNumber: number, stats: ParseStats) => void;
}
export interface ParseResult {
    permits: Record<string, PermitData>;
    stats: ParseStats;
    validationReport: ValidationReport;
    performance?: Record<string, any>;
}
export declare class PermitParser {
    private config;
    private strictMode;
    private validator;
    private validationReport;
    private stats;
    private logger;
    private perfMonitor;
    private onProgress?;
    private permits;
    private currentPermit;
    private pendingRoot;
    private pendingChildren;
    constructor(config?: Config, options?: ParserOptions);
    /**
     * Parse a DAF420 file
     */
    parseFile(inputPath: string): Promise<ParseResult>;
    /**
     * Process a single line from the input file
     */
    private processLine;
    /**
     * Validate the structure of a record
     */
    private validateRecordStructure;
    /**
     * Parse a record according to its schema
     */
    private parseRecord;
    /**
     * Route a parsed record to the appropriate handler
     */
    private routeRecord;
    /**
     * Handle a DAPERMIT record (02)
     */
    private handlePermitRecord;
    /**
     * Handle a child record (03-15)
     */
    private handleChildRecord;
    /**
     * Finalize parsing (called after all lines are processed)
     */
    private finalizeParsing;
    /**
     * Get permits as plain objects
     */
    private getPermitsAsObjects;
    /**
     * Get the current statistics
     */
    getStats(): ParseStats;
    /**
     * Get the validation report
     */
    getValidationReport(): ValidationReport;
    /**
     * Get performance metrics
     */
    getPerformanceReport(): Record<string, any>;
    /**
     * Reset the parser state
     */
    reset(): void;
}
//# sourceMappingURL=PermitParser.d.ts.map