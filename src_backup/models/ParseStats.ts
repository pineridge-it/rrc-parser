
/**
 * Parsing statistics class
 */

import { ParseStats as IParseStats } from '../types';

export class ParseStats implements IParseStats {
  linesProcessed: number = 0;
  recordsByType: Map<string, number> = new Map();
  recordLengths: Map<string, number[]> = new Map();
  validationErrors: number = 0;
  validationWarnings: number = 0;
  orphanedRecords: number = 0;
  malformedRecords: number = 0;
  successfulPermits: number = 0;
  recoveredRecords: number = 0;
  orphanDetails: string[] = [];
  malformedDetails: string[] = [];
  
  /**
   * Increment record count for a specific type
   * @param recordType - The record type
   */
  incrementRecordType(recordType: string): void {
    const current = this.recordsByType.get(recordType) || 0;
    this.recordsByType.set(recordType, current + 1);
  }
  
  /**
   * Add record length for a specific type
   * @param recordType - The record type
   * @param length - The record length
   */
  addRecordLength(recordType: string, length: number): void {
    const lengths = this.recordLengths.get(recordType) || [];
    lengths.push(length);
    this.recordLengths.set(recordType, lengths);
  }
  
  /**
   * Log an orphaned record
   * @param lineNumber - Line number where the orphan occurred
   * @param message - Description of the orphan
   */
  logOrphan(lineNumber: number, message: string): void {
    this.orphanedRecords++;
    this.orphanDetails.push(`Line ${lineNumber}: ${message}`);
  }
  
  /**
   * Log a malformed record
   * @param lineNumber - Line number where the malformed record occurred
   * @param message - Description of the problem
   */
  logMalformed(lineNumber: number, message: string): void {
    this.malformedRecords++;
    this.malformedDetails.push(`Line ${lineNumber}: ${message}`);
  }
  
  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): Record<string, unknown> {
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
  getSummary(): string {
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
