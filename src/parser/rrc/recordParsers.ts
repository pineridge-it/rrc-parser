import { FieldSpec, RecordSchema, RrcRecordType } from './types';
import { parseDate, parseIntValue, parseFloatValue } from '../../utils';

/**
 * Parse a fixed-width field from a record
 */
function parseField(record: string, spec: FieldSpec): unknown {
  const rawValue = record.substring(spec.start, spec.start + spec.length);
  
  if (spec.trim !== false) {
    const trimmed = rawValue.trim();
    if (trimmed === '' && spec.defaultValue !== undefined) {
      return spec.defaultValue;
    }
  }

  try {
    switch (spec.type) {
      case 'int':
        return parseIntValue(rawValue);
      case 'float':
        return parseFloatValue(rawValue);
      case 'date':
        return parseDate(rawValue);
      case 'boolean':
        return rawValue.trim() === 'Y' || rawValue.trim() === 'true';
      case 'string':
      default:
        return spec.trim !== false ? rawValue.trim() : rawValue;
    }
  } catch (error) {
    // Return raw value on parse error, let validation handle it
    return spec.trim !== false ? rawValue.trim() : rawValue;
  }
}

/**
 * Create a record parser from field specifications
 */
function createRecordParser(fields: FieldSpec[]) {
  return (record: string): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const field of fields) {
      result[field.name] = parseField(record, field);
    }
    return result;
  };
}

// ============================================================================
// DAROOT Record (Type 01) - Root record
// ============================================================================
const daRootFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'status_number', start: 2, length: 2, type: 'string' },
  { name: 'sequence_number', start: 4, length: 3, type: 'string' },
  { name: 'county_code', start: 7, length: 3, type: 'string' },
  { name: 'lease_name', start: 10, length: 32, type: 'string', trim: true },
  { name: 'district', start: 42, length: 2, type: 'string' },
  { name: 'operator_number', start: 44, length: 6, type: 'string' },
  { name: 'received_date', start: 50, length: 8, type: 'date', defaultValue: null },
  { name: 'operator_name', start: 62, length: 32, type: 'string', trim: true },
  { name: 'status_flag', start: 94, length: 2, type: 'string' },
  { name: 'permit_number', start: 96, length: 7, type: 'string' },
  { name: 'issue_date', start: 103, length: 8, type: 'date', defaultValue: null },
];

export const daRootSchema: RecordSchema = {
  recordType: '01',
  name: 'DAROOT',
  description: 'Root record containing permit identification',
  expectedMinLength: 111,
  expectedMaxLength: 200,
  fields: daRootFields,
  storageKey: 'daroot',
  parseRecord: createRecordParser(daRootFields)
};

// ============================================================================
// DAPERMIT Record (Type 02) - Permit details
// ============================================================================
const daPermitFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'permit_number', start: 2, length: 7, type: 'string' },
  { name: 'sequence_number', start: 9, length: 3, type: 'string' },
  { name: 'county_code', start: 12, length: 3, type: 'string' },
  { name: 'lease_name', start: 15, length: 32, type: 'string', trim: true },
  { name: 'district', start: 47, length: 2, type: 'string' },
  { name: 'well_number', start: 49, length: 4, type: 'string', trim: true },
  { name: 'total_depth', start: 53, length: 5, type: 'int', defaultValue: null },
  { name: 'operator_number', start: 58, length: 6, type: 'string' },
  { name: 'application_type', start: 64, length: 2, type: 'string' },
  { name: 'well_type', start: 66, length: 4, type: 'string' },
  { name: 'horizontal_flag', start: 70, length: 1, type: 'string' },
  { name: 'directional_flag', start: 71, length: 1, type: 'string' },
  { name: 'sidetrack_flag', start: 72, length: 1, type: 'string' },
  { name: 'issued_date', start: 73, length: 8, type: 'date', defaultValue: null },
  { name: 'received_date', start: 81, length: 8, type: 'date', defaultValue: null },
  { name: 'amended_date', start: 89, length: 8, type: 'date', defaultValue: null },
  { name: 'extended_date', start: 97, length: 8, type: 'date', defaultValue: null },
  { name: 'spud_date', start: 105, length: 8, type: 'date', defaultValue: null },
  { name: 'well_status', start: 113, length: 1, type: 'string' },
  { name: 'surface_section', start: 114, length: 8, type: 'string', trim: true },
  { name: 'surface_block', start: 122, length: 10, type: 'string', trim: true },
  { name: 'surface_survey', start: 132, length: 50, type: 'string', trim: true },
  { name: 'surface_abstract', start: 182, length: 8, type: 'string', trim: true },
];

export const daPermitSchema: RecordSchema = {
  recordType: '02',
  name: 'DAPERMIT',
  description: 'Permit details record',
  expectedMinLength: 190,
  expectedMaxLength: 400,
  fields: daPermitFields,
  storageKey: 'dapermit',
  parseRecord: createRecordParser(daPermitFields)
};

// ============================================================================
// DAFIELD Record (Type 03) - Field information
// ============================================================================
const daFieldFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'field_number', start: 2, length: 8, type: 'string', trim: true },
  { name: 'field_name', start: 10, length: 32, type: 'string', trim: true },
];

export const daFieldSchema: RecordSchema = {
  recordType: '03',
  name: 'DAFIELD',
  description: 'Field information record',
  expectedMinLength: 42,
  expectedMaxLength: 100,
  fields: daFieldFields,
  storageKey: 'dafield',
  parseRecord: createRecordParser(daFieldFields)
};

// ============================================================================
// DALEASE Record (Type 04) - Lease information
// ============================================================================
const daLeaseFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'lease_number', start: 2, length: 8, type: 'string', trim: true },
  { name: 'lease_name', start: 10, length: 32, type: 'string', trim: true },
];

export const daLeaseSchema: RecordSchema = {
  recordType: '04',
  name: 'DALEASE',
  description: 'Lease information record',
  expectedMinLength: 42,
  expectedMaxLength: 100,
  fields: daLeaseFields,
  storageKey: 'dalease',
  parseRecord: createRecordParser(daLeaseFields)
};

// ============================================================================
// DASURVEY Record (Type 05) - Survey information
// ============================================================================
const daSurveyFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'survey_name', start: 2, length: 50, type: 'string', trim: true },
  { name: 'abstract', start: 52, length: 8, type: 'string', trim: true },
  { name: 'section', start: 60, length: 8, type: 'string', trim: true },
  { name: 'block', start: 68, length: 10, type: 'string', trim: true },
];

export const daSurveySchema: RecordSchema = {
  recordType: '05',
  name: 'DASURVEY',
  description: 'Survey information record',
  expectedMinLength: 78,
  expectedMaxLength: 150,
  fields: daSurveyFields,
  storageKey: 'dasurvey',
  parseRecord: createRecordParser(daSurveyFields)
};

// ============================================================================
// DACANRES Record (Type 06) - Cancellation restrictions
// ============================================================================
const daCanResFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'restriction', start: 2, length: 70, type: 'string', trim: true },
];

export const daCanResSchema: RecordSchema = {
  recordType: '06',
  name: 'DACANRES',
  description: 'Cancellation restriction record',
  expectedMinLength: 72,
  expectedMaxLength: 200,
  fields: daCanResFields,
  storageKey: 'dacanres',
  parseRecord: createRecordParser(daCanResFields)
};

// ============================================================================
// DAAREAS Record (Type 07) - Areas
// ============================================================================
const daAreasFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'area', start: 2, length: 50, type: 'string', trim: true },
];

export const daAreasSchema: RecordSchema = {
  recordType: '07',
  name: 'DAAREAS',
  description: 'Areas record',
  expectedMinLength: 52,
  expectedMaxLength: 100,
  fields: daAreasFields,
  storageKey: 'daareas',
  parseRecord: createRecordParser(daAreasFields)
};

// ============================================================================
// DAREMARKS Record (Type 08) - Remarks
// ============================================================================
const daRemarksFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'remark_sequence', start: 2, length: 2, type: 'string' },
  { name: 'remark', start: 4, length: 70, type: 'string', trim: true },
];

export const daRemarksSchema: RecordSchema = {
  recordType: '08',
  name: 'DAREMARKS',
  description: 'Remarks record',
  expectedMinLength: 74,
  expectedMaxLength: 200,
  fields: daRemarksFields,
  storageKey: 'daremarks',
  parseRecord: createRecordParser(daRemarksFields)
};

// ============================================================================
// DAAREARES Record (Type 09) - Area restrictions
// ============================================================================
const daAreaResFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'area_restriction', start: 2, length: 70, type: 'string', trim: true },
];

export const daAreaResSchema: RecordSchema = {
  recordType: '09',
  name: 'DAAREARES',
  description: 'Area restriction record',
  expectedMinLength: 72,
  expectedMaxLength: 200,
  fields: daAreaResFields,
  storageKey: 'daareares',
  parseRecord: createRecordParser(daAreaResFields)
};

// ============================================================================
// DAADDRESS Record (Type 10) - Address
// ============================================================================
const daAddressFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'address_line', start: 2, length: 70, type: 'string', trim: true },
];

export const daAddressSchema: RecordSchema = {
  recordType: '10',
  name: 'DAADDRESS',
  description: 'Address record',
  expectedMinLength: 72,
  expectedMaxLength: 200,
  fields: daAddressFields,
  storageKey: 'daaddress',
  parseRecord: createRecordParser(daAddressFields)
};

// ============================================================================
// GIS Surface Record (Type 14) - Surface location coordinates
// ============================================================================
const gisSurfaceFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'longitude', start: 3, length: 12, type: 'float', defaultValue: null },
  { name: 'latitude', start: 16, length: 11, type: 'float', defaultValue: null },
];

export const gisSurfaceSchema: RecordSchema = {
  recordType: '14',
  name: 'GIS_SURFACE',
  description: 'GIS surface location coordinates',
  expectedMinLength: 27,
  expectedMaxLength: 50,
  fields: gisSurfaceFields,
  storageKey: 'gis_surface',
  parseRecord: createRecordParser(gisSurfaceFields)
};

// ============================================================================
// GIS Bottomhole Record (Type 15) - Bottomhole location coordinates
// ============================================================================
const gisBottomholeFields: FieldSpec[] = [
  { name: 'segment', start: 0, length: 2, type: 'string' },
  { name: 'longitude', start: 3, length: 12, type: 'float', defaultValue: null },
  { name: 'latitude', start: 16, length: 11, type: 'float', defaultValue: null },
];

export const gisBottomholeSchema: RecordSchema = {
  recordType: '15',
  name: 'GIS_BOTTOMHOLE',
  description: 'GIS bottomhole location coordinates',
  expectedMinLength: 27,
  expectedMaxLength: 50,
  fields: gisBottomholeFields,
  storageKey: 'gis_bottomhole',
  parseRecord: createRecordParser(gisBottomholeFields)
};

// ============================================================================
// Schema Registry
// ============================================================================
export const recordSchemas: Map<RrcRecordType, RecordSchema> = new Map([
  ['01', daRootSchema],
  ['02', daPermitSchema],
  ['03', daFieldSchema],
  ['04', daLeaseSchema],
  ['05', daSurveySchema],
  ['06', daCanResSchema],
  ['07', daAreasSchema],
  ['08', daRemarksSchema],
  ['09', daAreaResSchema],
  ['10', daAddressSchema],
  ['14', gisSurfaceSchema],
  ['15', gisBottomholeSchema],
]);

/**
 * Get schema for a record type
 */
export function getSchema(recordType: string): RecordSchema | undefined {
  return recordSchemas.get(recordType as RrcRecordType);
}

/**
 * Check if a record type is supported
 */
export function isSupportedRecordType(recordType: string): boolean {
  return recordSchemas.has(recordType as RrcRecordType);
}

/**
 * Get all supported record types
 */
export function getSupportedRecordTypes(): RrcRecordType[] {
  return Array.from(recordSchemas.keys());
}
