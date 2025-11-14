/**
 * CSV export engine with FIXED ADDRESS HANDLING and COUNTY CODE PADDING
 * Location: src/exporter/CSVExporter.ts
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
     * FIXED: Get county code from records with fallback and zero-padding
     * @param daroot - Root record
     * @param dapermit - Permit record
     * @returns County code string (zero-padded to 3 digits)
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
     * FIXED: Extract and concatenate all address lines from address records
     *
     * DAADDRESS records (type 11) contain:
     *   address_key  → columns 3-4
     *   address_line → columns 5-47 (43 characters, right-padded with spaces)
     *
     * Multiple records are used for long addresses, identified by address_key:
     *   "00" = Street address
     *   "01" = City, State, ZIP
     *   etc.
     *
     * @param addresses - Array of address records
     * @returns Complete address string with lines separated by spaces
     */
    private extractAddress;
    /**
     * Lookup county name from county code with fallback for both padded and unpadded codes
     * @param countyCode - The county code (may or may not be padded)
     * @param countyCodes - The county code lookup table
     * @returns County name or empty string if not found
     */
    private lookupCountyName;
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