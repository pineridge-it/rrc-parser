/**
 * Parsed record wrapper class
 */
import { RecordData } from '../types';
export declare class ParsedRecord {
    readonly segment: string;
    readonly data: RecordData;
    readonly lineNumber: number;
    constructor(segment: string, data: RecordData, lineNumber: number);
    /**
     * Get a field value from the record data
     * @param fieldName - Name of the field
     * @returns Field value or undefined
     */
    getField<T = string | number | null | undefined>(fieldName: string): T | undefined;
    /**
     * Convert to plain object
     * @returns Plain object representation
     */
    toObject(): {
        segment: string;
        data: RecordData;
        lineNumber: number;
    };
}
//# sourceMappingURL=ParsedRecord.d.ts.map