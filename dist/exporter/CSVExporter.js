"use strict";
/**
 * CSV export engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVExporter = void 0;
const csv_writer_1 = require("csv-writer");
class CSVExporter {
    constructor(config) {
        this.config = config;
    }
    /**
     * Export permits to CSV file
     * @param permits - Map of permit number to permit data
     * @param outputPath - Output CSV file path
     */
    async export(permits, outputPath) {
        const fieldnames = [
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
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: outputPath,
            header: fieldnames.map(name => ({ id: name, title: name }))
        });
        const rows = [];
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
    buildRow(permitNum, data) {
        const daroot = data.daroot || {};
        const dapermit = data.dapermit || {};
        const gisSurf = data.gis_surface || {};
        const gisBh = data.gis_bottomhole || {};
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
            issue_date: (daroot.issue_date || dapermit.issued_date || ''),
            received_date: (daroot.received_date || dapermit.received_date || ''),
            amended_date: (dapermit.amended_date || ''),
            extended_date: (dapermit.extended_date || ''),
            spud_date: (dapermit.spud_date || ''),
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
                .map(f => this.trim(f.field_number || ''))
                .filter(n => n)
                .join('; '),
            lease_count: (data.dalease || []).length,
            survey_count: (data.dasurvey || []).length,
            restriction_count: (data.dacanres || []).length,
            remark_count: (data.daremarks || []).length,
            address: addresses.length > 0 ? this.trim(addresses[0].address_line || '') : ''
        };
    }
    /**
     * Trim a value if it's a string
     * @param value - The value to trim
     * @returns Trimmed string
     */
    trim(value) {
        if (typeof value === 'string') {
            return value.trim();
        }
        return String(value || '');
    }
}
exports.CSVExporter = CSVExporter;
//# sourceMappingURL=CSVExporter.js.map