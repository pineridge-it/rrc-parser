
/**
 * Parsed record wrapper class
 */

import { RecordData } from '../types';

export class ParsedRecord {
  constructor(
    public readonly segment: string,
    public readonly data: RecordData,
    public readonly lineNumber: number
  ) {}
  
  /**
   * Get a field value from the record data
   * @param fieldName - Name of the field
   * @returns Field value or undefined
   */
  getField<T = string | number | null | undefined>(fieldName: string): T | undefined {
    return this.data[fieldName] as T | undefined;
  }
  
  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): { segment: string; data: RecordData; lineNumber: number } {
    return {
      segment: this.segment,
      data: this.data,
      lineNumber: this.lineNumber
    };
  }
}
