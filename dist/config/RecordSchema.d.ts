/**
 * Record schema class
 */
import { IRecordSchema, RecordData } from '../types';
import { FieldSpec } from './FieldSpec';
export declare class RecordSchema implements IRecordSchema {
    name: string;
    expectedMinLength: number | null;
    storageKey: string | null;
    fields: FieldSpec[];
    constructor(schema: IRecordSchema);
    /**
     * Parse a record string according to this schema
     * @param record - The record string to parse
     * @returns Parsed record data with segment name
     */
    parseRecord(record: string): RecordData;
    /**
     * Get a field specification by name
     * @param fieldName - The field name
     * @returns Field specification or undefined
     */
    getField(fieldName: string): FieldSpec | undefined;
    /**
     * Check if this schema has a specific validator
     * @param validatorType - The validator type
     * @returns True if any field uses this validator
     */
    hasValidator(validatorType: string): boolean;
}
//# sourceMappingURL=RecordSchema.d.ts.map