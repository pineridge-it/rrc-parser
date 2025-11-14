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
    private readonly COUNTY_NAMES;
    constructor(config?: Config, options?: ParserOptions);
    parseFile(inputPath: string): Promise<ParseResult>;
    private saveCheckpointAsync;
    private restoreFromCheckpoint;
    private processLine;
    private validateRecordStructure;
    private parseRecord;
    private parseGIS;
    /** Safe date parsing – match is guaranteed when used */
    private parseDate;
    private routeRecord;
    private handlePermitRecord;
    private handleChildRecord;
    private finalizeParsing;
    private getPermitsAsObjects;
    getStats(): ParseStats;
    getValidationReport(): ValidationReport;
    getPerformanceReport(): Record<string, unknown>;
    reset(): void;
}
//# sourceMappingURL=PermitParser.d.ts.map