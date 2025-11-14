/**
 * CSV export engine with FIXED ADDRESS HANDLING and COUNTY CODE PADDING
 * Location: src/exporter/CSVExporter.ts
 */

import { createObjectCsvWriter } from 'csv-writer';
import { Config } from '../config';
import { 
  PermitData, 
  CSVRow, 
  DaRootRecord, 
  DaPermitRecord,
  GisSurfaceRecord,
  GisBottomholeRecord,
  DaFieldRecord,
  DaAddressRecord
} from '../types';

/**
 * CSV Exporter class for converting permits to CSV format
 */
export class CSVExporter {
  constructor(private readonly config: Config) {}
  
  /**
   * Export permits to CSV file
   * @param permits - Map of permit number to permit data
   * @param outputPath - Output CSV file path
   */
  async export(permits: Record<string, PermitData>, outputPath: string): Promise<void> {
    const fieldnames: Array<keyof CSVRow> = [
      'permit_number', 'lease_name', 'operator_name', 'operator_number',
      'county_code', 'county_name', 'district',
      'issue_date', 'received_date', 'amended_date', 'extended_date', 'spud_date',
      'well_number', 'well_status', 'total_depth', 'application_type', 'app_type_desc',
      'horizontal_flag', 'directional_flag', 'sidetrack_flag',
      'surface_section', 'surface_block', 'surface_survey', 'surface_abstract',
      'gis_surface_lat', 'gis_surface_lon',
      'gis_bottomhole_lat', 'gis_bottomhole_lon',
      'field_count', 'field_numbers', 'lease_count', 'survey_count',
      'restriction_count', 'remark_count', 'address'
    ];
    
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: fieldnames.map(name => ({ id: name, title: name }))
    });
    
    const rows: CSVRow[] = [];
    
    for (const [permitNum, data] of Object.entries(permits)) {
      rows.push(this.buildRow(permitNum, data));
    }
    
    await csvWriter.writeRecords(rows);
  }
  
  /**
   * Build a CSV row from permit data
   * @param permitNum - The permit number
   * @param data - The permit data
   * @returns CSV row object
   */
  private buildRow(permitNum: string, data: PermitData): CSVRow {
    const daroot = data.daroot || ({} as DaRootRecord);
    const dapermit = data.dapermit || ({} as DaPermitRecord);
    const gisSurf = data.gis_surface || ({} as GisSurfaceRecord);
    const gisBh = data.gis_bottomhole || ({} as GisBottomholeRecord);
    
    const fields = data.dafield || [];
    const addresses = data.daaddress || [];
    
    // Get county code from either DAROOT or DAPERMIT (now with padding)
    const countyCode = this.getCountyCode(daroot, dapermit);
    const appType = this.getApplicationType(dapermit);
    
    // Lookup tables
    const countyCodes = this.config.getLookup('county_codes');
    const appTypeCodes = this.config.getLookup('app_type_codes');
    
    // Try to get county name with fallback (try both padded and unpadded)
    const countyName = this.lookupCountyName(countyCode, countyCodes);
    
    return {
      permit_number: permitNum.padStart(7, '0'),
      lease_name: this.getStringValue(daroot.lease_name, dapermit.lease_name),
      operator_name: this.getStringValue(daroot.operator_name),
      operator_number: this.getStringValue(daroot.operator_number, dapermit.operator_number),
      county_code: countyCode,
      county_name: countyName,
      district: this.getStringValue(daroot.district, dapermit.district),
      issue_date: this.getDateValue(daroot.issue_date, dapermit.issued_date),
      received_date: this.getDateValue(daroot.received_date, dapermit.received_date),
      amended_date: this.getDateValue(dapermit.amended_date),
      extended_date: this.getDateValue(dapermit.extended_date),
      spud_date: this.getDateValue(dapermit.spud_date),
      well_number: this.getStringValue(dapermit.well_number),
      well_status: this.getStringValue(dapermit.well_status),
      total_depth: this.getFieldValue(dapermit.total_depth),
      application_type: appType,
      app_type_desc: appTypeCodes[appType] || '',
      horizontal_flag: this.getStringValue(dapermit.horizontal_flag),
      directional_flag: this.getStringValue(dapermit.directional_flag),
      sidetrack_flag: this.getStringValue(dapermit.sidetrack_flag),
      surface_section: this.getStringValue(dapermit.surface_section),
      surface_block: this.getStringValue(dapermit.surface_block),
      surface_survey: this.getStringValue(dapermit.surface_survey),
      surface_abstract: this.getStringValue(dapermit.surface_abstract),
      gis_surface_lat: this.getFieldValue(gisSurf.latitude),
      gis_surface_lon: this.getFieldValue(gisSurf.longitude),
      gis_bottomhole_lat: this.getFieldValue(gisBh.latitude),
      gis_bottomhole_lon: this.getFieldValue(gisBh.longitude),
      field_count: fields.length,
      field_numbers: this.extractFieldNumbers(fields),
      lease_count: (data.dalease || []).length,
      survey_count: (data.dasurvey || []).length,
      restriction_count: (data.dacanres || []).length,
      remark_count: (data.daremarks || []).length,
      address: this.extractAddress(addresses)
    };
  }
  
  /**
   * FIXED: Get county code from records with fallback and zero-padding
   * @param daroot - Root record
   * @param dapermit - Permit record
   * @returns County code string (zero-padded to 3 digits)
   */
  private getCountyCode(daroot: DaRootRecord, dapermit: DaPermitRecord): string {
    const code = daroot.county_code ?? dapermit.county_code;
    const codeStr = this.convertToString(code).trim();
    
    // Zero-pad to 3 digits for lookup consistency
    // Example: "47" becomes "047" to match lookup table keys
    // Only pad if we have a valid numeric code
    if (codeStr && /^\d+$/.test(codeStr)) {
      return codeStr.padStart(3, '0');
    }
    
    return codeStr;
  }
  
  /**
   * Get application type from permit record
   * @param dapermit - Permit record
   * @returns Application type string
   */
  private getApplicationType(dapermit: DaPermitRecord): string {
    return this.convertToString(dapermit.application_type);
  }
  
  /**
   * Get a string value with fallback support
   * @param primary - Primary value
   * @param fallback - Optional fallback value
   * @returns Trimmed string
   */
  private getStringValue(primary?: string | number | null, fallback?: string | number | null): string {
    const value = primary ?? fallback;
    return this.trimValue(value);
  }
  
  /**
   * Get a date value with fallback support
   * @param primary - Primary date value
   * @param fallback - Optional fallback date value
   * @returns Date string
   */
  private getDateValue(primary?: string | null, fallback?: string | null): string {
    const value = primary ?? fallback ?? '';
    return typeof value === 'string' ? value : '';
  }
  
  /**
   * Get a generic field value
   * @param value - Field value
   * @returns String representation of value
   */
  private getFieldValue(value?: string | number | null): string | number {
    if (value === null || value === undefined) {
      return '';
    }
    return value;
  }
  
  /**
   * Extract field numbers from field records
   * @param fields - Array of field records
   * @returns Semicolon-separated string of field numbers
   */
  private extractFieldNumbers(fields: DaFieldRecord[]): string {
    return fields
      .map(f => this.trimValue(f.field_number))
      .filter(n => n)
      .join('; ');
  }
  
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
  private extractAddress(addresses: DaAddressRecord[]): string {
    if (addresses.length === 0) {
      return '';
    }

    // Sort by address_key to preserve order (00 → 01 → 02 ...)
    const sortedAddresses = [...addresses].sort((a, b) => {
      const keyA = this.trimValue(a.address_key);
      const keyB = this.trimValue(b.address_key);
      return keyA.localeCompare(keyB);
    });

    // Use trimEnd() instead of trim() to keep leading digits like "00", "13", etc.
    const addressParts = sortedAddresses
      .map(addr => (addr.address_line || '').trimEnd())
      .filter(line => line.length > 0);

    // Join with a single space and collapse any accidental double-spaces
    return addressParts
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Lookup county name from county code with fallback for both padded and unpadded codes
   * @param countyCode - The county code (may or may not be padded)
   * @param countyCodes - The county code lookup table
   * @returns County name or empty string if not found
   */
  private lookupCountyName(countyCode: string, countyCodes: Record<string, string>): string {
    // First try direct lookup
    if (countyCodes[countyCode]) {
      return countyCodes[countyCode];
    }
    
    // If not found and it's a numeric code, try with different padding
    if (/^\d+$/.test(countyCode)) {
      // If already padded, try unpadded version
      const unpaddedCode = countyCode.replace(/^0+/, '');
      if (countyCodes[unpaddedCode]) {
        return countyCodes[unpaddedCode];
      }
      
      // If not padded, try padded version
      const paddedCode = countyCode.padStart(3, '0');
      if (countyCodes[paddedCode]) {
        return countyCodes[paddedCode];
      }
    }
    
    return '';
  }
  
  /**
   * Convert a value to string safely
   * @param value - Value to convert
   * @returns String representation
   */
  private convertToString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }
  
  /**
   * Trim a value if it's a string
   * @param value - The value to trim
   * @returns Trimmed string
   */
  private trimValue(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }
}