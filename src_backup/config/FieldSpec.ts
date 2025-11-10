
/**
 * Field specification class
 */

import { IFieldSpec, FieldType, ValidatorType } from '../types';
import { extractField } from '../utils';

export class FieldSpec implements IFieldSpec {
  name: string;
  start: number;
  end: number;
  type: FieldType;
  required: boolean;
  validator?: ValidatorType;
  
  constructor(spec: IFieldSpec) {
    this.name = spec.name;
    this.start = spec.start;
    this.end = spec.end;
    this.type = spec.type;
    this.required = spec.required;
    this.validator = spec.validator;
  }
  
  /**
   * Extract the field value from a record string
   * @param record - The full record string
   * @returns Extracted field value
   */
  extract(record: string): string {
    return extractField(record, this.start, this.end);
  }
  
  /**
   * Validate the field specification
   * @throws Error if invalid
   */
  validate(): void {
    if (this.start < 0) {
      throw new Error(`Field '${this.name}': start position cannot be negative`);
    }
    
    if (this.end <= this.start) {
      throw new Error(`Field '${this.name}': end position must be greater than start`);
    }
  }
}
