import { UUID } from './common';
import { Operator } from './operator';

// Re-export CleanPermit from loader to maintain single source of truth
export { CleanPermit } from './loader';

/**
 * Permit and record type definitions
 */

import { RecordData } from './common';

/**
 * DAROOT record structure
 */
export interface DaRootRecord extends RecordData {
  segment: string;
  status_number?: string;
  sequence_number?: string;
  county_code?: string;
  lease_name?: string;
  district?: string;
  operator_number?: string;
  received_date?: string | null;
  operator_name?: string;
  status_flag?: string;
  permit_number?: string;
  issue_date?: string | null;
}

/**
 * DAPERMIT record structure
 */
export interface DaPermitRecord extends RecordData {
  segment: string;
  permit_number?: string;
  sequence_number?: string;
  county_code?: string;
  lease_name?: string;
  district?: string;
  well_number?: string;
  total_depth?: number | null;
  operator_number?: string;
  application_type?: string;
  well_type?: string;
  horizontal_flag?: string;
  directional_flag?: string;
  sidetrack_flag?: string;
  issued_date?: string | null;
  received_date?: string | null;
  amended_date?: string | null;
  extended_date?: string | null;
  spud_date?: string | null;
  well_status?: string;
  surface_section?: string;
  surface_block?: string;
  surface_survey?: string;
  surface_abstract?: string;
}

/**
 * DAFIELD record structure
 */
export interface DaFieldRecord extends RecordData {
  segment: string;
  field_number?: string;
  field_name?: string;
}

/**
 * DALEASE record structure
 */
export interface DaLeaseRecord extends RecordData {
  segment: string;
  lease_number?: string;
  lease_name?: string;
}

/**
 * DASURVEY record structure
 */
export interface DaSurveyRecord extends RecordData {
  segment: string;
  survey_name?: string;
  abstract?: string;
  section?: string;
  block?: string;
}

/**
 * DACANRES record structure
 */
export interface DaCanResRecord extends RecordData {
  segment: string;
  restriction?: string;
}

/**
 * DAAREAS record structure
 */
export interface DaAreasRecord extends RecordData {
  segment: string;
  area?: string;
}

/**
 * DAREMARKS record structure
 */
export interface DaRemarksRecord extends RecordData {
  segment: string;
  remark?: string;
}

/**
 * DAAREARES record structure
 */
export interface DaAreaResRecord extends RecordData {
  segment: string;
  area_restriction?: string;
}

/**
 * DAADDRESS record structure
 */
export interface DaAddressRecord extends RecordData {
  segment: string;
  address_line?: string;
}

/**
 * GIS Surface record structure
 */
export interface GisSurfaceRecord {
  [key: string]: string | number | boolean | null | undefined;
  segment: string;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * GIS Bottomhole record structure
 */
export interface GisBottomholeRecord {
  [key: string]: string | number | boolean | null | undefined;
  segment: string;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Complete permit data structure
 */
export interface PermitData {
  daroot: DaRootRecord | null;
  dapermit: DaPermitRecord | null;
  dafield: DaFieldRecord[];
  dalease: DaLeaseRecord[];
  dasurvey: DaSurveyRecord[];
  dacanres: DaCanResRecord[];
  daareas: DaAreasRecord[];
  daremarks: DaRemarksRecord[];
  daareares: DaAreaResRecord[];
  daaddress: DaAddressRecord[];
  gis_surface: GisSurfaceRecord | null;
  gis_bottomhole: GisBottomholeRecord | null;
}

/**
 * Parsed record wrapper
 */
export interface ParsedRecord {
  segment: string;
  data: RecordData;
  lineNumber: number;
}

/**
 * Parse statistics
 */
export interface ParseStats {
  linesProcessed: number;
  recordsByType: Map<string, number>;
  recordLengths: Map<string, number[]>;
  validationErrors: number;
  validationWarnings: number;
  orphanedRecords: number;
  malformedRecords: number;
  successfulPermits: number;
  recoveredRecords: number;
  orphanDetails: string[];
  malformedDetails: string[];
}

/**
 * CSV export row structure
 */
export interface CSVRow {
  permit_number: string;
  lease_name: string;
  operator_name: string;
  operator_number: string;
  county_code: string;
  county_name: string;
  district: string;
  issue_date: string;
  received_date: string;
  amended_date: string;
  extended_date: string;
  spud_date: string;
  well_number: string;
  well_status: string;
  total_depth: string | number;
  application_type: string;
  app_type_desc: string;
  horizontal_flag: string;
  directional_flag: string;
  sidetrack_flag: string;
  surface_section: string;
  surface_block: string;
  surface_survey: string;
  surface_abstract: string;
  gis_surface_lat: string | number;
  gis_surface_lon: string | number;
  gis_bottomhole_lat: string | number;
  gis_bottomhole_lon: string | number;
  field_count: number;
  field_numbers: string;
  lease_count: number;
  survey_count: number;
  restriction_count: number;
  remark_count: number;
  address: string;
}

/**
 * Permit amendment structure
 */
export interface PermitAmendment {
  id: UUID;
  permitId: UUID;
  amendmentDate: string;
  amendmentType: string;
  description: string;
  createdAt: string;
}

/**
 * Well structure
 */
export interface Well {
  id: UUID;
  apiNumber: string;
  wellName: string;
  permitId: UUID;
  createdAt: string;
}

/**
 * Permit detail structure for the detail page
 */
export interface PermitDetail {
  id: UUID;
  permitNumber: string;
  status: string;
  operator: Operator;
  leaseName?: string;
  wellNumber?: string;
  district?: string;
  county?: string;
  countyCode?: string;
  issueDate?: string;
  receivedDate?: string;
  amendedDate?: string;
  extendedDate?: string;
  spudDate?: string;
  wellStatus?: string;
  totalDepth?: number;
  applicationType?: string;
  wellType?: string;
  horizontalFlag?: boolean;
  directionalFlag?: boolean;
  sidetrackFlag?: boolean;
  surfaceLocation?: {
    section?: string;
    block?: string;
    survey?: string;
    abstract?: string;
    latitude?: number;
    longitude?: number;
  };
  bottomholeLocation?: {
    latitude?: number;
    longitude?: number;
  };
  fields: {
    fieldNumber?: string;
    fieldName?: string;
  }[];
  restrictions: string[];
  remarks: string[];
  amendments: PermitAmendment[];
  relatedWells: Well[];
  nearbyPermits: UUID[]; // Just IDs for now, can be expanded to full permit objects
  createdAt: string;
  updatedAt: string;
}

/**
 * Permit detail props for components
 */
export interface PermitDetailProps {
  permitId: UUID;
}

/**
 * Request for permit detail
 */
export interface PermitDetailRequest {
  permitId: UUID;
}