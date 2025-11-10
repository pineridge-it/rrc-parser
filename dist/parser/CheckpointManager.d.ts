/**
 * Checkpoint Manager for Parser Backup/Recovery
 * Location: src/parser/CheckpointManager.ts
 *
 * CREATE NEW FILE at: src/parser/CheckpointManager.ts
 */
import { PermitData } from '../types';
import { ParseStats } from '../models';
export interface CheckpointState {
    version: string;
    timestamp: string;
    lastProcessedLine: number;
    permits: Record<string, PermitData>;
    stats: {
        linesProcessed: number;
        recordsByType: Record<string, number>;
        validationErrors: number;
        validationWarnings: number;
        orphanedRecords: number;
        malformedRecords: number;
        successfulPermits: number;
        recoveredRecords: number;
    };
    inputFileHash?: string;
    inputFilePath?: string;
}
export interface CheckpointOptions {
    enabled?: boolean;
    checkpointInterval?: number;
    maxCheckpoints?: number;
    compressionEnabled?: boolean;
    validateChecksum?: boolean;
}
export declare class CheckpointManager {
    private checkpointPath;
    private options;
    private lastCheckpointLine;
    private version;
    constructor(checkpointPath: string, options?: CheckpointOptions);
    /**
     * Ensure the checkpoint directory exists
     */
    private ensureCheckpointDirectory;
    /**
     * Check if a checkpoint should be saved
     */
    shouldSaveCheckpoint(currentLine: number): boolean;
    /**
     * Save a checkpoint of the current parsing state
     */
    saveCheckpoint(state: {
        lastProcessedLine: number;
        permits: Record<string, PermitData>;
        stats: ParseStats;
        inputFilePath?: string;
    }): Promise<void>;
    /**
     * Load the most recent checkpoint
     */
    loadCheckpoint(inputFilePath?: string): Promise<{
        lastProcessedLine: number;
        permits: Record<string, PermitData>;
        stats: ParseStats;
    } | null>;
    /**
     * Check if a valid checkpoint exists
     */
    hasCheckpoint(): Promise<boolean>;
    /**
     * Clear all checkpoints
     */
    clearCheckpoint(): Promise<void>;
    /**
     * Get list of checkpoint files sorted by timestamp (newest first)
     */
    private getCheckpointFiles;
    /**
     * Extract timestamp from checkpoint filename
     */
    private extractTimestamp;
    /**
     * Generate checkpoint file path with timestamp
     */
    private getCheckpointFilePath;
    /**
     * Clean up old checkpoints, keeping only the most recent N
     */
    private cleanupOldCheckpoints;
    /**
     * Calculate SHA256 hash of a file
     */
    private calculateFileHash;
    /**
     * Validate that input file matches checkpoint
     */
    private validateInputFile;
    /**
     * Get checkpoint statistics
     */
    getCheckpointInfo(): Promise<{
        count: number;
        latestTimestamp?: string;
        latestLine?: number;
        totalSize: number;
    }>;
    /**
     * Format bytes to human-readable size
     */
    private formatBytes;
    /**
     * Print checkpoint information to console
     */
    printCheckpointInfo(): Promise<void>;
}
//# sourceMappingURL=CheckpointManager.d.ts.map