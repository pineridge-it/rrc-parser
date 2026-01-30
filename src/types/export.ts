/**
 * Export type definitions for Data Export System
 */

import { PermitFilters } from '../../web/src/types/permit';

/**
 * Supported export formats
 */
export type ExportFormat = 'csv' | 'xlsx' | 'geojson' | 'shapefile' | 'kml';

/**
 * Export status
 */
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Export request from client
 */
export interface ExportRequest {
  format: ExportFormat;
  filters: PermitFilters;
  fields?: string[];
  includeGeometry: boolean;
  workspaceId: string;
}

/**
 * Export job tracking
 */
export interface ExportJob {
  id: string;
  workspaceId: string;
  status: ExportStatus;
  format: ExportFormat;
  filters: PermitFilters;
  fields?: string[];
  includeGeometry: boolean;
  downloadUrl?: string;
  expiresAt?: Date;
  recordCount?: number;
  fileSize?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Export configuration for each format
 */
export interface ExportFormatConfig {
  format: ExportFormat;
  mimeType: string;
  extension: string;
  supportsGeometry: boolean;
  maxRecords: number;
  description: string;
}

/**
 * Export format configurations
 */
export const EXPORT_FORMATS: ExportFormatConfig[] = [
  {
    format: 'csv',
    mimeType: 'text/csv',
    extension: '.csv',
    supportsGeometry: false,
    maxRecords: 50000,
    description: 'Comma-separated values (spreadsheet)'
  },
  {
    format: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    supportsGeometry: false,
    maxRecords: 50000,
    description: 'Excel spreadsheet with formatting'
  },
  {
    format: 'geojson',
    mimeType: 'application/geo+json',
    extension: '.geojson',
    supportsGeometry: true,
    maxRecords: 10000,
    description: 'GeoJSON for GIS applications'
  },
  {
    format: 'shapefile',
    mimeType: 'application/octet-stream',
    extension: '.zip',
    supportsGeometry: true,
    maxRecords: 10000,
    description: 'ESRI Shapefile (zipped)'
  },
  {
    format: 'kml',
    mimeType: 'application/vnd.google-earth.kml+xml',
    extension: '.kml',
    supportsGeometry: true,
    maxRecords: 10000,
    description: 'KML for Google Earth'
  }
];

/**
 * Available export fields
 */
export const EXPORT_FIELDS = [
  { key: 'permit_number', label: 'Permit Number', category: 'basic' },
  { key: 'operator_name', label: 'Operator Name', category: 'basic' },
  { key: 'operator_number', label: 'Operator Number', category: 'basic' },
  { key: 'lease_name', label: 'Lease Name', category: 'basic' },
  { key: 'well_number', label: 'Well Number', category: 'basic' },
  { key: 'county', label: 'County', category: 'location' },
  { key: 'district', label: 'District', category: 'location' },
  { key: 'field_name', label: 'Field Name', category: 'location' },
  { key: 'surface_section', label: 'Surface Section', category: 'location' },
  { key: 'surface_block', label: 'Surface Block', category: 'location' },
  { key: 'surface_survey', label: 'Surface Survey', category: 'location' },
  { key: 'surface_abstract', label: 'Surface Abstract', category: 'location' },
  { key: 'well_type', label: 'Well Type', category: 'technical' },
  { key: 'total_depth', label: 'Total Depth', category: 'technical' },
  { key: 'horizontal_flag', label: 'Horizontal', category: 'technical' },
  { key: 'directional_flag', label: 'Directional', category: 'technical' },
  { key: 'sidetrack_flag', label: 'Sidetrack', category: 'technical' },
  { key: 'filed_date', label: 'Filed Date', category: 'dates' },
  { key: 'issued_date', label: 'Issued Date', category: 'dates' },
  { key: 'spud_date', label: 'Spud Date', category: 'dates' },
  { key: 'amended_date', label: 'Amended Date', category: 'dates' },
  { key: 'extended_date', label: 'Extended Date', category: 'dates' },
  { key: 'well_status', label: 'Well Status', category: 'status' },
  { key: 'application_type', label: 'Application Type', category: 'status' }
];

/**
 * Get export format config
 */
export function getExportFormatConfig(format: ExportFormat): ExportFormatConfig {
  const config = EXPORT_FORMATS.find(f => f.format === format);
  if (!config) {
    throw new Error(`Unknown export format: ${format}`);
  }
  return config;
}

/**
 * Check if format supports geometry
 */
export function supportsGeometry(format: ExportFormat): boolean {
  return getExportFormatConfig(format).supportsGeometry;
}
