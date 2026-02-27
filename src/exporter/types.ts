/**
 * Export Options and Types for Enhanced Export Experience
 * Location: src/exporter/types.ts
 */

export type ExportFormat = 'csv' | 'tsv' | 'json' | 'xlsx';

export type Delimiter = ',' | ';' | '\t';

export type Encoding = 'utf8' | 'utf8-bom' | 'latin1';

export type DateFormat = 'iso' | 'us' | 'eu';

export interface ExportOptions {
  format: ExportFormat;
  delimiter?: Delimiter;
  encoding?: Encoding;
  includeHeaders?: boolean;
  dateFormat?: DateFormat;
  previewRows?: number;
}

export interface ExportPreview {
  outputPath: string;
  format: ExportFormat;
  encoding: Encoding;
  estimatedSize: string;
  totalRows: number;
  sampleRows: Record<string, unknown>[];
  columns: string[];
  warnings: ExportWarning[];
  validation: ValidationResult;
}

export interface ExportWarning {
  type: 'missing_data' | 'invalid_format' | 'encoding_issue' | 'truncation';
  message: string;
  count?: number;
  field?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ExportWarning[];
}

export interface ValidationError {
  type: 'missing_field' | 'invalid_type' | 'constraint_violation';
  message: string;
  field?: string;
  row?: number;
}

export interface ExportProgress {
  totalRows: number;
  processedRows: number;
  currentRate: number;
  etaSeconds: number;
  percentComplete: number;
  startTime: Date;
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed';
  error?: string;
}

export interface ExportResult {
  success: boolean;
  outputPath: string;
  format: ExportFormat;
  totalRows: number;
  fileSize: string;
  duration: number;
  validation: ValidationResult;
  warnings: ExportWarning[];
}

export type ProgressCallback = (progress: ExportProgress) => void;

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'csv',
  delimiter: ',',
  encoding: 'utf8',
  includeHeaders: true,
  dateFormat: 'iso',
  previewRows: 3
};