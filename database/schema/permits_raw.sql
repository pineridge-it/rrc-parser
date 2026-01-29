-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- RAW PERMITS TABLE
-- ============================================================================
-- Stores exact data as received from RRC sources for auditability and reprocessing

CREATE TABLE IF NOT EXISTS permits_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source identification
  source_type VARCHAR(50) NOT NULL DEFAULT 'rrc_ftp',
  source_url TEXT,
  source_file VARCHAR(255),
  
  -- Raw data storage
  raw_data TEXT NOT NULL,
  raw_hash VARCHAR(64) NOT NULL,
  
  -- Line-level metadata for fixed-width files
  line_number INTEGER,
  record_length INTEGER,
  
  -- Processing metadata
  etl_run_id UUID NOT NULL,
  ingestion_batch_id UUID,
  
  -- Timestamps
  source_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_effective_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parsed_at TIMESTAMPTZ,
  
  -- Processing status
  processing_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Error tracking
  parse_error TEXT,
  parse_attempts INTEGER NOT NULL DEFAULT 0,
  
  -- Link to clean record (set when successfully processed)
  clean_id UUID,
  
  -- Raw metadata from source
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- System timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Hash index for change detection (idempotency)
CREATE INDEX IF NOT EXISTS idx_permits_raw_hash ON permits_raw(raw_hash);

-- Source file tracking
CREATE INDEX IF NOT EXISTS idx_permits_raw_source_file ON permits_raw(source_file);
CREATE INDEX IF NOT EXISTS idx_permits_raw_source_type ON permits_raw(source_type);

-- ETL run tracking
CREATE INDEX IF NOT EXISTS idx_permits_raw_etl_run ON permits_raw(etl_run_id);
CREATE INDEX IF NOT EXISTS idx_permits_raw_batch ON permits_raw(ingestion_batch_id);

-- Processing status for queue management
CREATE INDEX IF NOT EXISTS idx_permits_raw_status ON permits_raw(processing_status) 
  WHERE processing_status IN ('pending', 'failed');

-- Timestamps for backfill and auditing
CREATE INDEX IF NOT EXISTS idx_permits_raw_fetched_at ON permits_raw(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_permits_raw_source_seen_at ON permits_raw(source_seen_at DESC);

-- Link to clean record
CREATE INDEX IF NOT EXISTS idx_permits_raw_clean_id ON permits_raw(clean_id) 
  WHERE clean_id IS NOT NULL;

-- Composite index for duplicate detection
CREATE UNIQUE INDEX IF NOT EXISTS idx_permits_raw_unique_source 
  ON permits_raw(source_file, line_number, raw_hash) 
  WHERE source_file IS NOT NULL AND line_number IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE permits_raw ENABLE ROW LEVEL SECURITY;

-- Raw data is system-level, accessible to authenticated users
CREATE POLICY permits_raw_read_access ON permits_raw
  FOR SELECT
  USING (true);

CREATE POLICY permits_raw_write_access ON permits_raw
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_permits_raw_updated_at ON permits_raw;
CREATE TRIGGER update_permits_raw_updated_at
  BEFORE UPDATE ON permits_raw
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE permits_raw IS 'Exact data as received from RRC sources for auditability and reprocessing';
COMMENT ON COLUMN permits_raw.id IS 'Unique identifier for the raw record';
COMMENT ON COLUMN permits_raw.source_type IS 'Type of source (rrc_ftp, file, api)';
COMMENT ON COLUMN permits_raw.source_url IS 'URL or path to the source data';
COMMENT ON COLUMN permits_raw.source_file IS 'Specific file name from source';
COMMENT ON COLUMN permits_raw.raw_data IS 'Exact raw data as received (e.g., fixed-width line)';
COMMENT ON COLUMN permits_raw.raw_hash IS 'SHA-256 hash of raw_data for change detection';
COMMENT ON COLUMN permits_raw.line_number IS 'Line number in source file (for fixed-width files)';
COMMENT ON COLUMN permits_raw.record_length IS 'Length of the raw record in bytes';
COMMENT ON COLUMN permits_raw.etl_run_id IS 'Reference to the ETL run that fetched this record';
COMMENT ON COLUMN permits_raw.ingestion_batch_id IS 'Batch identifier for rollback capability';
COMMENT ON COLUMN permits_raw.source_seen_at IS 'When we first saw this data from the source';
COMMENT ON COLUMN permits_raw.source_effective_at IS 'When RRC says this data is effective';
COMMENT ON COLUMN permits_raw.fetched_at IS 'When this record was fetched';
COMMENT ON COLUMN permits_raw.parsed_at IS 'When this record was successfully parsed';
COMMENT ON COLUMN permits_raw.processing_status IS 'Current status: pending, parsed, failed, ignored';
COMMENT ON COLUMN permits_raw.parse_error IS 'Error message if parsing failed';
COMMENT ON COLUMN permits_raw.parse_attempts IS 'Number of parse attempts';
COMMENT ON COLUMN permits_raw.clean_id IS 'Link to the cleaned/normalized record';
COMMENT ON COLUMN permits_raw.metadata IS 'Additional source-specific metadata';
