
/**
 * CSV export engine
 */

import { createObjectCsvWriter } from 'csv-writer';
import { Config } from '../config';
import { PermitData, CSVRow } from '../types';

export class CSVExporter {
  constructor(private config: Config) {}
  
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
    const daroot = data.daroot || {} as any;
    const dapermit = data.dapermit || {} as any;
    const gisSurf = data.gis_surface || {} as any;
    const gisBh = data.gis_bottomhole || {} as any;
    
    const fields = data.dafield || [];
    const addresses = data.daaddress || [];
    
    // Get county code from either DAROOT or DAPERMIT
    const countyCode = String(daroot.county_code || dapermit.county_code || '');
    const appType = String(dapermit.application_type || '');
    
    // Lookup tables
    const countyCodes = this.config.getLookup('county_codes');
    const appTypeCodes = this.config.getLookup('app_type_codes');
    
    return {
      permit_number: permitNum.padStart(7, '0'),
      lease_name: this.trim(daroot.lease_name || dapermit.lease_name || ''),
      operator_name: this.trim(daroot.operator_name || ''),
      operator_number: this.trim(daroot.operator_number || dapermit.operator_number || ''),
      county_code: countyCode,
      county_name: countyCodes[countyCode] || '',
      district: this.trim(daroot.district || dapermit.district || ''),
      issue_date: (daroot.issue_date || dapermit.issued_date || '') as string,
      received_date: (daroot.received_date || dapermit.received_date || '') as string,
      amended_date: (dapermit.amended_date || '') as string,
      extended_date: (dapermit.extended_date || '') as string,
      spud_date: (dapermit.spud_date || '') as string,
      well_number: this.trim(dapermit.well_number || ''),
      well_status: this.trim(dapermit.well_status || ''),
      total_depth: dapermit.total_depth || '',
      application_type: appType,
      app_type_desc: appTypeCodes[appType] || '',
      horizontal_flag: this.trim(dapermit.horizontal_flag || ''),
      directional_flag: this.trim(dapermit.directional_flag || ''),
      sidetrack_flag: this.trim(dapermit.sidetrack_flag || ''),
      surface_section: this.trim(dapermit.surface_section || ''),
      surface_block: this.trim(dapermit.surface_block || ''),
      surface_survey: this.trim(dapermit.surface_survey || ''),
      surface_abstract: this.trim(dapermit.surface_abstract || ''),
      gis_surface_lat: gisSurf.latitude || '',
      gis_surface_lon: gisSurf.longitude || '',
      gis_bottomhole_lat: gisBh.latitude || '',
      gis_bottomhole_lon: gisBh.longitude || '',
      field_count: fields.length,
      field_numbers: fields
        .map(f => this.trim((f as any).field_number || ''))
        .filter(n => n)
        .join('; '),
      lease_count: (data.dalease || []).length,
      survey_count: (data.dasurvey || []).length,
      restriction_count: (data.dacanres || []).length,
      remark_count: (data.daremarks || []).length,
      address: addresses.length > 0 ? this.trim((addresses[0] as any).address_line || '') : ''
    };
  }
  
  /**
   * Trim a value if it's a string
   * @param value - The value to trim
   * @returns Trimmed string
   */
  private trim(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    return String(value || '');
  }
}
