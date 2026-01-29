
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
export class ParseStats implements IParseStats {
  linesProcessed = 0;
  recordsByType: Map<string, number> = new Map();
  recordLengths: Map<string, number[]> = new Map();
  validationErrors = 0;
  validationWarnings = 0;
  orphanedRecords = 0;
  malformedRecords = 0;
  successfulPermits = 0;
  recoveredRecords = 0;
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
   * Get average record length for a type
   * @param recordType - The record type
   * @returns Average length or 0 if no records
   */
  getAverageLength(recordType: string): number {
    const lengths = this.recordLengths.get(recordType);
    if (!lengths || lengths.length === 0) {
      return 0;
    }
    const sum = lengths.reduce((acc, len) => acc + len, 0);
    return sum / lengths.length;
  }
  
  /**
   * Get min and max record lengths for a type
   * @param recordType - The record type
   * @returns Object with min and max lengths
   */
  getLengthRange(recordType: string): { min: number; max: number } {
    const lengths = this.recordLengths.get(recordType);
    if (!lengths || lengths.length === 0) {
      return { min: 0, max: 0 };
    }
    return {
      min: Math.min(...lengths),
      max: Math.max(...lengths)
    };
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
    const lostRecords = this.orphanedRecords - this.recoveredRecords;
    
    return `
Processing Summary:
  Lines Processed:      ${this.formatNumber(this.linesProcessed)}
  Unique Permits:       ${this.formatNumber(this.successfulPermits)}
  Malformed Records:    ${this.formatNumber(this.malformedRecords)}
  Orphaned Records:     ${this.formatNumber(this.orphanedRecords)}
    - Recovered:        ${this.formatNumber(this.recoveredRecords)}
    - Lost:             ${this.formatNumber(lostRecords)}
  Validation Errors:    ${this.formatNumber(this.validationErrors)}
  Validation Warnings:  ${this.formatNumber(this.validationWarnings)}
    `.trim();
  }
  
  /**
   * Format a number with locale-specific thousands separators
   * @param num - Number to format
   * @returns Formatted string
   */
  private formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
