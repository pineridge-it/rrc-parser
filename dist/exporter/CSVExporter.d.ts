/**
 * CSV export engine
 * Location: src/exporter/CSVExporter.ts
 *
 * IMPROVEMENTS:
 * - Removed all 'as any' type casts
 * - Added proper type guards and null safety
 * - Better error handling
 * - Extracted field access into type-safe helper functions
 * - Added comprehensive documentation
 * - Improved code organization
 */
import { Config } from '../config';
import { PermitData } from '../types';
/**
 * CSV Exporter class for converting permits to CSV format
 */
export declare class CSVExporter {
    private readonly config;
    constructor(config: Config);
    /**
     * Export permits to CSV file
     * @param permits - Map of permit number to permit data
     * @param outputPath - Output CSV file path
     */
    export(permits: Record<string, PermitData>, outputPath: string): Promise<void>;
    /**
     * Build a CSV row from permit data
     * @param permitNum - The permit number
     * @param data - The permit data
     * @returns CSV row object
     */
    private buildRow;
    /**
     * Get county code from records with fallback
     * @param daroot - Root record
     * @param dapermit - Permit record
     * @returns County code string
     */
    private getCountyCode;
    /**
     * Get application type from permit record
     * @param dapermit - Permit record
     * @returns Application type string
     */
    private getApplicationType;
    /**
     * Get a string value with fallback support
     * @param primary - Primary value
     * @param fallback - Optional fallback value
     * @returns Trimmed string
     */
    private getStringValue;
    /**
     * Get a date value with fallback support
     * @param primary - Primary date value
     * @param fallback - Optional fallback date value
     * @returns Date string
     */
    private getDateValue;
    /**
     * Get a generic field value
     * @param value - Field value
     * @returns String representation of value
     */
    private getFieldValue;
    /**
     * Extract field numbers from field records
     * @param fields - Array of field records
     * @returns Semicolon-separated string of field numbers
     */
    private extractFieldNumbers;
    /**
     * Extract address from address records
     * @param addresses - Array of address records
     * @returns Address string or empty string
     */
    private extractAddress;
    /**
     * Convert a value to string safely
     * @param value - Value to convert
     * @returns String representation
     */
    private convertToString;
    /**
     * Trim a value if it's a string
     * @param value - The value to trim
     * @returns Trimmed string
     */
    private trimValue;
}
//# sourceMappingURL=CSVExporter.d.ts.map