/**
 * Raw Permit model for ETL pipeline
 * Location: src/models/PermitRaw.ts
 * 
 * Represents raw permit data as received from RRC sources.
 * This is the "raw" side of the raw/clean data separation pattern.
 * 
 * DESIGN DECISIONS:
 * - Uses UUID branded type for compile-time type safety
 * - Nullable fields match database schema (columns without NOT NULL)
 * - JSONB metadata typed as Record<string, unknown> for flexibility
 * - Processing status uses discriminated union for type safety
 */

import { UUID } from '../types';

/**
 * Processing status for raw permit records
 */
export type ProcessingStatus = 
  | 'pending'     // Awaiting processing
  | 'parsed'      // Successfully parsed to clean record
  | 'failed'      // Failed to parse
  | 'ignored';    // Intentionally skipped

/**
 * Source types for raw permit data
 */
export type SourceType = 
  | 'rrc_ftp'     // RRC FTP server
  | 'file'        // Local file upload
  | 'api'         // Direct API ingestion
  | string;       // Extensible for future sources

/**
 * Raw permit record interface
 * Maps 1:1 with permits_raw database table
 */
export interface PermitRaw {
  /** Unique identifier for the raw record */
  id: UUID;
  
  /** Type of source (rrc_ftp, file, api) */
  source_type: SourceType;
  
  /** URL or path to the source data */
  source_url: string | null;
  
  /** Specific file name from source */
  source_file: string | null;
  
  /** Exact raw data as received (e.g., fixed-width line) */
  raw_data: string;
  
  /** SHA-256 hash of raw_data for change detection and idempotency */
  raw_hash: string;
  
  /** Line number in source file (for fixed-width files) */
  line_number: number | null;
  
  /** Length of the raw record in bytes */
  record_length: number | null;
  
  /** Reference to the ETL run that fetched this record */
  etl_run_id: UUID;
  
  /** Batch identifier for rollback capability */
  ingestion_batch_id: UUID | null;
  
  /** When we first saw this data from the source */
  source_seen_at: Date;
  
  /** When RRC says this data is effective */
  source_effective_at: Date | null;
  
  /** When this record was fetched */
  fetched_at: Date;
  
  /** When this record was successfully parsed */
  parsed_at: Date | null;
  
  /** Current status: pending, parsed, failed, ignored */
  processing_status: ProcessingStatus;
  
  /** Error message if parsing failed */
  parse_error: string | null;
  
  /** Number of parse attempts */
  parse_attempts: number;
  
  /** Link to the cleaned/normalized record */
  clean_id: UUID | null;
  
  /** Additional source-specific metadata */
  metadata: Record<string, unknown>;
  
  /** When record was created */
  created_at: Date;
  
  /** When record was last updated */
  updated_at: Date;
}

/**
 * Input type for creating a new PermitRaw record
 * Omits auto-generated fields (id, timestamps, parse attempts, clean_id)
 */
export interface PermitRawInput {
  source_type?: SourceType;
  source_url?: string | null;
  source_file?: string | null;
  raw_data: string;
  raw_hash: string;
  line_number?: number | null;
  record_length?: number | null;
  etl_run_id: UUID;
  ingestion_batch_id?: UUID | null;
  source_effective_at?: Date | null;
  metadata?: Record<string, unknown>;
}

/**
 * Update type for modifying an existing PermitRaw record
 * All fields optional except id
 */
export interface PermitRawUpdate {
  id: UUID;
  processing_status?: ProcessingStatus;
  parse_error?: string | null;
  parse_attempts?: number;
  clean_id?: UUID | null;
  parsed_at?: Date | null;
  metadata?: Record<string, unknown>;
}

/**
 * Query filters for fetching PermitRaw records
 */
export interface PermitRawFilters {
  source_type?: SourceType;
  source_file?: string;
  etl_run_id?: UUID;
  ingestion_batch_id?: UUID;
  processing_status?: ProcessingStatus;
  clean_id?: UUID | null;
  fetched_after?: Date;
  fetched_before?: Date;
  limit?: number;
  offset?: number;
}

/**
 * PermitRaw class with helper methods for ETL operations
 */
export class PermitRawRecord implements PermitRaw {
  id: UUID;
  source_type: SourceType;
  source_url: string | null;
  source_file: string | null;
  raw_data: string;
  raw_hash: string;
  line_number: number | null;
  record_length: number | null;
  etl_run_id: UUID;
  ingestion_batch_id: UUID | null;
  source_seen_at: Date;
  source_effective_at: Date | null;
  fetched_at: Date;
  parsed_at: Date | null;
  processing_status: ProcessingStatus;
  parse_error: string | null;
  parse_attempts: number;
  clean_id: UUID | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;

  constructor(data: PermitRaw) {
    this.id = data.id;
    this.source_type = data.source_type;
    this.source_url = data.source_url;
    this.source_file = data.source_file;
    this.raw_data = data.raw_data;
    this.raw_hash = data.raw_hash;
    this.line_number = data.line_number;
    this.record_length = data.record_length;
    this.etl_run_id = data.etl_run_id;
    this.ingestion_batch_id = data.ingestion_batch_id;
    this.source_seen_at = data.source_seen_at;
    this.source_effective_at = data.source_effective_at;
    this.fetched_at = data.fetched_at;
    this.parsed_at = data.parsed_at;
    this.processing_status = data.processing_status;
    this.parse_error = data.parse_error;
    this.parse_attempts = data.parse_attempts;
    this.clean_id = data.clean_id;
    this.metadata = data.metadata;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Check if the record has been successfully parsed
   */
  isParsed(): boolean {
    return this.processing_status === 'parsed' && this.clean_id !== null;
  }

  /**
   * Check if the record has failed parsing
   */
  isFailed(): boolean {
    return this.processing_status === 'failed';
  }

  /**
   * Check if the record is pending processing
   */
  isPending(): boolean {
    return this.processing_status === 'pending';
  }

  /**
   * Get the age of this record since fetching
   */
  getAgeMs(): number {
    return Date.now() - this.fetched_at.getTime();
  }

  /**
   * Check if this record should be retried
   * (failed with fewer than max attempts)
   */
  shouldRetry(maxAttempts: number = 3): boolean {
    return this.processing_status === 'failed' && this.parse_attempts < maxAttempts;
  }

  /**
   * Convert to a plain object suitable for database insertion
   */
  toObject(): PermitRaw {
    return {
      id: this.id,
      source_type: this.source_type,
      source_url: this.source_url,
      source_file: this.source_file,
      raw_data: this.raw_data,
      raw_hash: this.raw_hash,
      line_number: this.line_number,
      record_length: this.record_length,
      etl_run_id: this.etl_run_id,
      ingestion_batch_id: this.ingestion_batch_id,
      source_seen_at: this.source_seen_at,
      source_effective_at: this.source_effective_at,
      fetched_at: this.fetched_at,
      parsed_at: this.parsed_at,
      processing_status: this.processing_status,
      parse_error: this.parse_error,
      parse_attempts: this.parse_attempts,
      clean_id: this.clean_id,
      metadata: this.metadata,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Create a new PermitRawRecord from input data
   * Generates id, timestamps, and sets defaults
   */
  static create(input: PermitRawInput): PermitRawRecord {
    const now = new Date();
    return new PermitRawRecord({
      id: crypto.randomUUID() as UUID,
      source_type: input.source_type ?? 'rrc_ftp',
      source_url: input.source_url ?? null,
      source_file: input.source_file ?? null,
      raw_data: input.raw_data,
      raw_hash: input.raw_hash,
      line_number: input.line_number ?? null,
      record_length: input.record_length ?? null,
      etl_run_id: input.etl_run_id,
      ingestion_batch_id: input.ingestion_batch_id ?? null,
      source_seen_at: now,
      source_effective_at: input.source_effective_at ?? null,
      fetched_at: now,
      parsed_at: null,
      processing_status: 'pending',
      parse_error: null,
      parse_attempts: 0,
      clean_id: null,
      metadata: input.metadata ?? {},
      created_at: now,
      updated_at: now
    });
  }
}

/**
 * Generate SHA-256 hash for raw data
 * Used for change detection and idempotency
 */
export async function generateRawHash(rawData: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
