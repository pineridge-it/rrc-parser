/**
 * ETL Pipeline Types
 */

export interface RrcSourceConfig {
  baseUrl: string;
  apiKey?: string;
  rateLimit: number; // requests per second
  retryAttempts: number;
  timeoutMs: number;
}

export interface FetchResult {
  data: Buffer | string;
  sourceId: string;
  fetchedAt: Date;
  rawHash: string;
}

export interface TransformResult {
  cleanData: any;
  validationErrors: string[];
  transformedAt: Date;
}

export interface LoadResult {
  success: boolean;
  insertedCount: number;
  updatedCount: number;
  error?: string;
  loadedAt: Date;
}

export interface EtlPipelineConfig {
  source: RrcSourceConfig;
  batchSize: number;
  enableCheckpoints: boolean;
  strictMode: boolean;
}

export interface EtlContext {
  batchId: string;
  startedAt: Date;
  checkpointEnabled: boolean;
}

export interface EtlCheckpoint {
  lastProcessedId: string;
  batchId: string;
  timestamp: Date;
}

// ============================================================================
// Extended Types for ETL Pipeline Core
// ============================================================================

/**
 * Represents a raw permit record as fetched from RRC
 */
export interface RawPermitRecord {
  /** Original line from the fixed-width file */
  rawLine: string;
  /** Source file name */
  sourceFile: string;
  /** Line number in source file */
  lineNumber: number;
  /** When this record was fetched */
  fetchedAt: Date;
  /** ETL run that fetched this record */
  etlRunId: string;
}

/**
 * Parsed permit data before transformation
 */
export interface ParsedPermit {
  /** Unique permit identifier (e.g., API number + permit number) */
  permitNumber: string;
  /** API number */
  apiNumber: string;
  /** Lease name */
  leaseName: string;
  /** Well number */
  wellNumber?: string;
  /** County name */
  county: string;
  /** Operator name (raw) */
  operatorName: string;
  /** Operator number */
  operatorNumber?: string;
  /** Field name */
  fieldName?: string;
  /** Filing date */
  filedDate?: Date;
  /** Approved date */
  approvedDate?: Date;
  /** Permit status */
  status: 'pending' | 'approved' | 'cancelled' | 'expired';
  /** Permit type */
  permitType: string;
  /** Wellbore profile (vertical, horizontal, directional) */
  wellboreProfile?: string;
  /** Total depth */
  totalDepth?: number;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
  /** Original parsed data for debugging */
  _raw: RawPermitRecord;
}

/**
 * Transformed permit ready for database insertion
 */
export interface TransformedPermit {
  /** UUID for the permit record */
  id: string;
  /** Canonical permit number */
  permitNumber: string;
  /** API number */
  apiNumber: string;
  /** Lease name (normalized) */
  leaseName: string;
  /** Well number */
  wellNumber?: string;
  /** County ID (foreign key) */
  countyId: string;
  /** County name */
  countyName: string;
  /** Operator ID (foreign key, normalized) */
  operatorId: string;
  /** Operator name (canonical) */
  operatorName: string;
  /** Field ID (foreign key) */
  fieldId?: string;
  /** Field name */
  fieldName?: string;
  /** Filing date */
  filedDate?: Date;
  /** Approved date */
  approvedDate?: Date;
  /** Permit status */
  status: 'pending' | 'approved' | 'cancelled' | 'expired';
  /** Permit type */
  permitType: string;
  /** Wellbore profile */
  wellboreProfile?: string;
  /** Total depth in feet */
  totalDepth?: number;
  /** Geographic location */
  location?: {
    latitude: number;
    longitude: number;
    /** GeoJSON Point geometry */
    geojson: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  /** Metadata for tracking */
  metadata: {
    etlRunId: string;
    parsedAt: Date;
    transformedAt: Date;
    sourceFile: string;
    lineNumber: number;
    version: number;
  };
}

/**
 * ETL Run metadata
 */
export interface ETLRun {
  /** Unique run identifier */
  id: string;
  /** Run status */
  status: 'running' | 'completed' | 'failed' | 'partial';
  /** When the run started */
  startedAt: Date;
  /** When the run completed (if applicable) */
  completedAt?: Date;
  /** Source configuration */
  source: {
    type: 'rrc_ftp' | 'file' | 'api';
    url?: string;
    filePath?: string;
  };
  /** Statistics for this run */
  stats: {
    recordsFetched: number;
    recordsParsed: number;
    recordsTransformed: number;
    recordsLoaded: number;
    recordsFailed: number;
    errors: ETLError[];
  };
  /** Configuration used */
  config: ETLConfig;
}

/**
 * ETL Error record
 */
export interface ETLError {
  /** Error timestamp */
  timestamp: Date;
  /** Error phase */
  phase: 'fetch' | 'parse' | 'transform' | 'load';
  /** Error message */
  message: string;
  /** Error details */
  details?: unknown;
  /** Source record (if applicable) */
  sourceRecord?: RawPermitRecord;
}

/**
 * ETL Configuration
 */
export interface ETLConfig {
  /** Batch size for processing */
  batchSize: number;
  /** Whether to enable dry-run mode */
  dryRun: boolean;
  /** Source configuration */
  source: {
    type: 'rrc_ftp' | 'file' | 'api';
    url?: string;
    filePath?: string;
  };
  /** Target database configuration */
  target: {
    connectionString: string;
    schema: string;
  };
  /** QA thresholds */
  qaThresholds: {
    minRecordsExpected: number;
    maxNullPercentage: number;
    maxErrorPercentage: number;
  };
}

/**
 * QA Check result
 */
export interface QACheckResult {
  /** Check name */
  name: string;
  /** Whether the check passed */
  passed: boolean;
  /** Check message */
  message: string;
  /** Check details */
  details?: Record<string, unknown>;
  /** Severity if failed */
  severity: 'warning' | 'error' | 'critical';
}

/**
 * ETL Pipeline result
 */
export interface ETLResult {
  /** The ETL run record */
  run: ETLRun;
  /** QA check results */
  qaResults: QACheckResult[];
  /** Whether the run passed all QA checks */
  qaPassed: boolean;
}
