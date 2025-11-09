
/**
 * Record schema class
 */

import { IRecordSchema, RecordData } from '../types';
import { FieldSpec } from './FieldSpec';

export class RecordSchema implements IRecordSchema {
  name: string;
  expectedMinLength: number | null;
  storageKey: string | null;
  fields: FieldSpec[];
  
  constructor(schema: IRecordSchema) {
    this.name = schema.name;
    this.expectedMinLength = schema.expectedMinLength;
    this.storageKey = schema.storageKey;
    this.fields = schema.fields.map(f => new FieldSpec(f));
    
    // Validate all fields
    this.fields.forEach(field => field.validate());
  }
  
  /**
   * Parse a record string according to this schema
   * @param record - The record string to parse
   * @returns Parsed record data with segment name
   */
  parseRecord(record: string): RecordData {
    const data: RecordData = {
      segment: this.name
    };
    
    for (const field of this.fields) {
      data[field.name] = field.extract(record);
    }
    
    return data;
  }
  
  /**
   * Get a field specification by name
   * @param fieldName - The field name
   * @returns Field specification or undefined
   */
  getField(fieldName: string): FieldSpec | undefined {
    return this.fields.find(f => f.name === fieldName);
  }
  
  /**
   * Check if this schema has a specific validator
   * @param validatorType - The validator type
   * @returns True if any field uses this validator
   */
  hasValidator(validatorType: string): boolean {
    return this.fields.some(f => f.validator === validatorType);
  }
}
