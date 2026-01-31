import { UUID } from './common';

export interface LoaderConfig {
  batchSize: number;
  onConflict: 'skip' | 'update' | 'error';
}

export interface LoadResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: LoadError[];
  duration: number;
}

export interface LoadError {
  recordId?: string;
  error: string;
  timestamp: Date;
}

export interface RawPermit {
  id?: UUID;
  source_type: string;
  source_url?: string;
  source_file?: string;
  raw_data: string;
  raw_hash: string;
  line_number?: number;
  record_length?: number;
  etl_run_id: UUID;
  ingestion_batch_id?: UUID;
  source_seen_at: Date;
  source_effective_at?: Date;
  fetched_at?: Date;
  parsed_at?: Date;
  processing_status?: string;
  parse_error?: string;
  parse_attempts?: number;
  clean_id?: UUID;
  metadata?: Record<string, any>;
}

export interface CleanPermit {
  id?: UUID;
  raw_id?: UUID;
  permit_number: string;
  permit_type?: string;
  status?: string;
  operator_name_raw?: string;
  operator_id?: UUID;
  county?: string;
  district?: string;
  lease_name?: string;
  well_number?: string;
  api_number?: string;
  location?: any; // PostGIS geometry
  surface_lat?: number;
  surface_lon?: number;
  filed_date?: Date;
  approved_date?: Date;
  effective_at?: Date;
  source_seen_at: Date;
  metadata?: Record<string, any>;
  version?: number;
}

export interface PermitLoaderServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface LoadRawRequest {
  permits: RawPermit[];
  batchId?: UUID;
}

export interface LoadCleanRequest {
  permits: CleanPermit[];
}

export interface ConfigureLoaderRequest {
  config: Partial<LoaderConfig>;
}

export interface ValidatePermitsRequest {
  permits: RawPermit[] | CleanPermit[];
  type: 'raw' | 'clean';
}

export interface EstimateLoadingTimeRequest {
  permits: RawPermit[] | CleanPermit[];
  type: 'raw' | 'clean';
}

export interface ValidationResponse {
  valid: boolean;
  errors: LoadError[];
  warnings: string[];
}

export interface LoadingTimeEstimateResponse {
  estimatedSeconds: number;
  estimatedThroughput: number; // records per second
  recommendedBatchSize: number;
}

export interface BatchStatusResponse {
  id: UUID;
  status: 'loading' | 'completed' | 'failed' | 'rolled_back';
  progress: {
    total: number;
    processed: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  startedAt: Date;
  completedAt?: Date;
  errors: LoadError[];
}

export interface ListBatchesResponse {
  batches: Array<{
    id: UUID;
    status: 'loading' | 'completed' | 'failed' | 'rolled_back';
    progress: {
      total: number;
      processed: number;
    };
    startedAt: Date;
    completedAt?: Date;
  }>;
  total: number;
}