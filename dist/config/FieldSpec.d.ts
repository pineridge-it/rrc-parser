/**
 * Field specification class
 */
import { IFieldSpec, FieldType, ValidatorType } from '../types';
export declare class FieldSpec implements IFieldSpec {
    name: string;
    start: number;
    end: number;
    type: FieldType;
    required: boolean;
    validator?: ValidatorType;
    constructor(spec: IFieldSpec);
    /**
     * Extract the field value from a record string
     * @param record - The full record string
     * @returns Extracted field value
     */
    extract(record: string): string;
    /**
     * Validate the field specification
     * @throws Error if invalid
     */
    validate(): void;
}
//# sourceMappingURL=FieldSpec.d.ts.map