/**
 * Checkpoint Manager for Parser Backup/Recovery
 * Location: src/parser/CheckpointManager.ts
 * 
 * CREATE NEW FILE at: src/parser/CheckpointManager.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
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
  checkpointInterval?: number; // Save every N lines
  maxCheckpoints?: number; // Keep last N checkpoints
  compressionEnabled?: boolean;
  validateChecksum?: boolean;
}

export class CheckpointManager {
  private checkpointPath: string;
  private options: Required<CheckpointOptions>;
  private lastCheckpointLine: number = 0;
  private version: string = '1.0.0';
  
  constructor(
    checkpointPath: string,
    options: CheckpointOptions = {}
  ) {
    this.checkpointPath = checkpointPath;
    this.options = {
      enabled: options.enabled ?? true,
      checkpointInterval: options.checkpointInterval ?? 10000,
      maxCheckpoints: options.maxCheckpoints ?? 3,
      compressionEnabled: options.compressionEnabled ?? false,
      validateChecksum: options.validateChecksum ?? true
    };
    
    // Ensure checkpoint directory exists
    this.ensureCheckpointDirectory();
  }
  
  /**
   * Ensure the checkpoint directory exists
   */
  private ensureCheckpointDirectory(): void {
    const dir = path.dirname(this.checkpointPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  /**
   * Check if a checkpoint should be saved
   */
  shouldSaveCheckpoint(currentLine: number): boolean {
    if (!this.options.enabled) return false;
    
    const linesSinceLastCheckpoint = currentLine - this.lastCheckpointLine;
    return linesSinceLastCheckpoint >= this.options.checkpointInterval;
  }
  
  /**
   * Save a checkpoint of the current parsing state
   */
  async saveCheckpoint(
    state: {
      lastProcessedLine: number;
      permits: Record<string, PermitData>;
      stats: ParseStats;
      inputFilePath?: string;
    }
  ): Promise<void> {
    if (!this.options.enabled) return;
    
    try {
      // Convert stats to serializable format
      const serializableStats = {
        linesProcessed: state.stats.linesProcessed,
        recordsByType: Object.fromEntries(state.stats.recordsByType),
        validationErrors: state.stats.validationErrors,
        validationWarnings: state.stats.validationWarnings,
        orphanedRecords: state.stats.orphanedRecords,
        malformedRecords: state.stats.malformedRecords,
        successfulPermits: state.stats.successfulPermits,
        recoveredRecords: state.stats.recoveredRecords
      };
      
      // Calculate input file hash if path provided
      let inputFileHash: string | undefined;
      if (state.inputFilePath && this.options.validateChecksum) {
        inputFileHash = await this.calculateFileHash(state.inputFilePath);
      }
      
      const checkpoint: CheckpointState = {
        version: this.version,
        timestamp: new Date().toISOString(),
        lastProcessedLine: state.lastProcessedLine,
        permits: state.permits,
        stats: serializableStats,
        inputFileHash,
        inputFilePath: state.inputFilePath
      };
      
      // Generate checkpoint filename with timestamp
      const timestamp = Date.now();
      const checkpointFile = this.getCheckpointFilePath(timestamp);
      
      // Write checkpoint
      const data = JSON.stringify(checkpoint, null, 2);
      await fs.promises.writeFile(checkpointFile, data, 'utf8');
      
      // Update last checkpoint line
      this.lastCheckpointLine = state.lastProcessedLine;
      
      // Clean up old checkpoints
      await this.cleanupOldCheckpoints();
      
      console.log(`✓ Checkpoint saved at line ${state.lastProcessedLine}`);
    } catch (error) {
      console.error('Failed to save checkpoint:', error);
      throw error;
    }
  }
  
  /**
   * Load the most recent checkpoint
   */
  async loadCheckpoint(inputFilePath?: string): Promise<{
    lastProcessedLine: number;
    permits: Record<string, PermitData>;
    stats: ParseStats;
  } | null> {
    try {
      const checkpointFiles = await this.getCheckpointFiles();
      
      if (checkpointFiles.length === 0) {
        return null;
      }
      
      // Load most recent checkpoint
      const latestCheckpoint = checkpointFiles[0];
      if (!latestCheckpoint) {
        return null;
      }
      const data = await fs.promises.readFile(latestCheckpoint, 'utf8');
      const checkpoint: CheckpointState = JSON.parse(data);
      
      // Validate checkpoint version
      if (checkpoint.version !== this.version) {
        console.warn(`Checkpoint version mismatch: ${checkpoint.version} vs ${this.version}`);
      }
      
      // Validate input file if provided
      if (inputFilePath && this.options.validateChecksum) {
        if (!await this.validateInputFile(checkpoint, inputFilePath)) {
          console.warn('Input file has changed since checkpoint was created');
          return null;
        }
      }
      
      // Reconstruct ParseStats
      const stats = new ParseStats();
      stats.linesProcessed = checkpoint.stats.linesProcessed;
      stats.recordsByType = new Map(Object.entries(checkpoint.stats.recordsByType));
      stats.validationErrors = checkpoint.stats.validationErrors;
      stats.validationWarnings = checkpoint.stats.validationWarnings;
      stats.orphanedRecords = checkpoint.stats.orphanedRecords;
      stats.malformedRecords = checkpoint.stats.malformedRecords;
      stats.successfulPermits = checkpoint.stats.successfulPermits;
      stats.recoveredRecords = checkpoint.stats.recoveredRecords;
      
      console.log(`✓ Loaded checkpoint from line ${checkpoint.lastProcessedLine}`);
      console.log(`  Checkpoint created: ${checkpoint.timestamp}`);
      console.log(`  Permits recovered: ${checkpoint.stats.successfulPermits}`);
      
      return {
        lastProcessedLine: checkpoint.lastProcessedLine,
        permits: checkpoint.permits,
        stats
      };
    } catch (error) {
      console.error('Failed to load checkpoint:', error);
      return null;
    }
  }
  
  /**
   * Check if a valid checkpoint exists
   */
  async hasCheckpoint(): Promise<boolean> {
    const checkpointFiles = await this.getCheckpointFiles();
    return checkpointFiles.length > 0;
  }
  
  /**
   * Clear all checkpoints
   */
  async clearCheckpoint(): Promise<void> {
    try {
      const checkpointFiles = await this.getCheckpointFiles();
      
      for (const file of checkpointFiles) {
        await fs.promises.unlink(file);
      }
      
      this.lastCheckpointLine = 0;
      console.log('✓ All checkpoints cleared');
    } catch (error) {
      // Ignore errors if files don't exist
    }
  }
  
  /**
   * Get list of checkpoint files sorted by timestamp (newest first)
   */
  private async getCheckpointFiles(): Promise<string[]> {
    const dir = path.dirname(this.checkpointPath);
    const basename = path.basename(this.checkpointPath, '.json');
    
    try {
      const files = await fs.promises.readdir(dir);
      const checkpointFiles = files
        .filter(f => f.startsWith(basename) && f.endsWith('.json'))
        .map(f => path.join(dir, f));
      
      // Sort by timestamp (newest first)
      checkpointFiles.sort((a, b) => {
        const timeA = this.extractTimestamp(a);
        const timeB = this.extractTimestamp(b);
        return timeB - timeA;
      });
      
      return checkpointFiles;
    } catch {
      return [];
    }
  }
  
  /**
   * Extract timestamp from checkpoint filename
   */
  private extractTimestamp(filepath: string): number {
    const basename = path.basename(filepath, '.json');
    const match = basename.match(/-(\d+)$/);
    return match && match[1] ? parseInt(match[1], 10) : 0;
  }
  
  /**
   * Generate checkpoint file path with timestamp
   */
  private getCheckpointFilePath(timestamp: number): string {
    const dir = path.dirname(this.checkpointPath);
    const basename = path.basename(this.checkpointPath, '.json');
    return path.join(dir, `${basename}-${timestamp}.json`);
  }
  
  /**
   * Clean up old checkpoints, keeping only the most recent N
   */
  private async cleanupOldCheckpoints(): Promise<void> {
    const checkpointFiles = await this.getCheckpointFiles();
    
    if (checkpointFiles.length > this.options.maxCheckpoints) {
      const filesToDelete = checkpointFiles.slice(this.options.maxCheckpoints);
      
      for (const file of filesToDelete) {
        try {
          await fs.promises.unlink(file);
        } catch (error) {
          console.warn(`Failed to delete old checkpoint: ${file}`);
        }
      }
    }
  }
  
  /**
   * Calculate SHA256 hash of a file
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
  
  /**
   * Validate that input file matches checkpoint
   */
  private async validateInputFile(
    checkpoint: CheckpointState,
    inputFilePath: string
  ): Promise<boolean> {
    if (!checkpoint.inputFileHash) {
      return true; // No hash to validate
    }
    
    try {
      const currentHash = await this.calculateFileHash(inputFilePath);
      return currentHash === checkpoint.inputFileHash;
    } catch {
      return false;
    }
  }
  
  /**
   * Get checkpoint statistics
   */
  async getCheckpointInfo(): Promise<{
    count: number;
    latestTimestamp?: string;
    latestLine?: number;
    totalSize: number;
  }> {
    const checkpointFiles = await this.getCheckpointFiles();
    
    if (checkpointFiles.length === 0) {
      return { count: 0, totalSize: 0 };
    }
    
    // Get info from latest checkpoint
    const latestFile = checkpointFiles[0];
    if (!latestFile) {
      return { count: 0, totalSize: 0 };
    }
    const data = await fs.promises.readFile(latestFile, 'utf8');
    const checkpoint: CheckpointState = JSON.parse(data);
    
    // Calculate total size
    let totalSize = 0;
    for (const file of checkpointFiles) {
      const stats = await fs.promises.stat(file);
      totalSize += stats.size;
    }
    
    return {
      count: checkpointFiles.length,
      latestTimestamp: checkpoint.timestamp,
      latestLine: checkpoint.lastProcessedLine,
      totalSize
    };
  }
  
  /**
   * Format bytes to human-readable size
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  
  /**
   * Print checkpoint information to console
   */
  async printCheckpointInfo(): Promise<void> {
    const info = await this.getCheckpointInfo();
    
    console.log('\nCheckpoint Information:');
    console.log(`  Count: ${info.count}`);
    
    if (info.latestTimestamp) {
      console.log(`  Latest: ${info.latestTimestamp}`);
      console.log(`  Last Line: ${info.latestLine?.toLocaleString()}`);
    }
    
    console.log(`  Total Size: ${this.formatBytes(info.totalSize)}`);
  }
}