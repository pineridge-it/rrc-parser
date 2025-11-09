/**
 * Type conversion utilities for parsing field values
 */
/**
 * Parse a date string in YYYYMMDD format to MM/DD/YYYY format
 * @param value - The date string to parse
 * @returns Formatted date string or null if invalid
 */
export declare function parseDate(value: string): string | null;
/**
 * Parse a string to integer
 * @param value - The string to parse
 * @returns Parsed integer or null if invalid
 */
export declare function parseIntValue(value: string): number | null;
/**
 * Parse a string to float
 * @param value - The string to parse
 * @returns Parsed float or null if invalid
 */
export declare function parseFloatValue(value: string): number | null;
/**
 * Parse a numeric value, handling special cases for coordinates
 * @param value - The string to parse
 * @param validatorName - The validator type (for coordinate handling)
 * @returns Parsed numeric value or null
 */
export declare function parseNumeric(value: string, validatorName?: string): number | null;
/**
 * Extract a substring from a record, handling bounds checking
 * @param record - The full record string
 * @param start - Start position (0-based)
 * @param end - End position (exclusive)
 * @returns Extracted and trimmed string
 */
export declare function extractField(record: string, start: number, end: number): string;
//# sourceMappingURL=typeConverters.d.ts.map