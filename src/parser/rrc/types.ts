import { PermitData, DaRootRecord, DaPermitRecord, DaFieldRecord, DaLeaseRecord, DaSurveyRecord, DaCanResRecord, DaAreasRecord, DaRemarksRecord, DaAreaResRecord, DaAddressRecord, GisSurfaceRecord, GisBottomholeRecord } from '../../types/permit';

/**
 * RRC Record Type Identifiers (2-digit codes)
 */
export type RrcRecordType = 
  | '01'  // DAROOT - Root record
  | '02'  // DAPERMIT - Permit details
  | '03'  // DAFIELD - Field information
  | '04'  // DALEASE - Lease information
  | '05'  // DASURVEY - Survey information
  | '06'  // DACANRES - Cancellation restrictions
  | '07'  // DAAREAS - Areas
  | '08'  // DAREMARKS - Remarks
  | '09'  // DAAREARES - Area restrictions
  | '10'  // DAADDRESS - Address
  | '14'  // GIS Surface location
  | '15'; // GIS Bottomhole location

/**
 * Field specification for fixed-width parsing
 */
export interface FieldSpec {
  name: string;
  start: number;
  length: number;
  type: 'string' | 'int' | 'float' | 'date' | 'boolean';
  required?: boolean;
  validator?: string;
  trim?: boolean;
  defaultValue?: string | number | boolean | null;
}

/**
 * Record schema definition
 */
export interface RecordSchema {
  recordType: RrcRecordType;
  name: string;
  description: string;
  expectedMinLength: number;
  expectedMaxLength: number;
  fields: FieldSpec[];
  storageKey?: string;
  parseRecord: (record: string) => Record<string, unknown>;
}

/**
 * Parse error with context
 */
export interface ParseErrorContext {
  lineNumber: number;
  recordType: string;
  rawRecord: string;
  fieldName?: string;
  error: string;
  recoverable: boolean;
}

/**
 * Parser statistics
 */
export interface RrcParserStats {
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
  
  // Methods
  incrementRecordType(type: string): void;
  addRecordLength(type: string, length: number): void;
  logOrphan(lineNumber: number, detail: string): void;
  logMalformed(lineNumber: number, detail: string): void;
  reset(): void;
}

/**
 * Parser options
 */
export interface RrcParserOptions {
  strictMode?: boolean;
  verbose?: boolean;
  encoding?: BufferEncoding;
  enablePerformanceMonitoring?: boolean;
  maxMalformedTolerance?: number;  // Max malformed records before failing
  onParseError?: (error: ParseErrorContext) => 'skip' | 'abort' | 'recover';
  onProgress?: (lineNumber: number, stats: RrcParserStats) => void;
}

/**
 * Parse result
 */
export interface RrcParseResult {
  permits: Record<string, PermitData>;
  stats: RrcParserStats;
  errors: ParseErrorContext[];
  warnings: string[];
  performance?: Record<string, unknown>;
}

/**
 * Record parsers mapping
 */
export type RecordParserMap = Map<RrcRecordType, RecordSchema>;

/**
 * Malformed record handler result
 */
export type MalformedHandlerResult = 
  | { action: 'skip' }
  | { action: 'recover'; recoveredData: Record<string, unknown> }
  | { action: 'abort'; reason: string };

/**
 * RRC Permit with metadata
 */
export interface RrcPermit extends PermitData {
  _metadata?: {
    parsedAt: string;
    parserVersion: string;
    sourceFile?: string;
    lineNumberStart?: number;
    lineNumberEnd?: number;
  };
}
