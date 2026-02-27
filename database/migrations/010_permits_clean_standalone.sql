-- ============================================================================
-- PERMITS_CLEAN TABLE
-- ============================================================================
-- Stores normalized, validated permit data with PostGIS geometry support
-- This is the "clean" side of the raw/clean data separation pattern

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- MAIN TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS permits_clean (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to raw source data (maintains lineage)
  raw_id UUID REFERENCES permits_raw(id) ON DELETE SET NULL,
  
  -- Core permit identification
  permit_number VARCHAR(50) NOT NULL,
  permit_type VARCHAR(50),           -- drilling, amendment, etc.
  status VARCHAR(50),                -- approved, pending, cancelled, etc.
  
  -- Operator information
  operator_name_raw VARCHAR(255),    -- Original operator name from source
  operator_id UUID,                  -- References operators(id) - Phase 4
  
  -- Location information
  county VARCHAR(100),
  district VARCHAR(50),
  lease_name VARCHAR(255),
  well_number VARCHAR(50),
  api_number VARCHAR(20),
  
  -- PostGIS geometry (WGS84 coordinate system)
  location GEOMETRY(Point, 4326),
  
  -- Decimal coordinates for easy querying
  surface_lat DECIMAL(10, 7),
  surface_lon DECIMAL(10, 7),
  
  -- Dates
  filed_date DATE,
  approved_date DATE,
  effective_at TIMESTAMPTZ,          -- When RRC says it's effective
  source_seen_at TIMESTAMPTZ,        -- When we first saw it from source
  
  -- Additional fields
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Version tracking for amendments
  version INT NOT NULL DEFAULT 1,
  
  -- System timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: permit_number + version
  UNIQUE(permit_number, version)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Spatial index for map queries (GIST is optimal for geometry)
CREATE INDEX IF NOT EXISTS idx_permits_clean_location 
  ON permits_clean USING GIST(location);

-- Raw ID index for lineage queries
CREATE INDEX IF NOT EXISTS idx_permits_clean_raw_id 
  ON permits_clean(raw_id) 
  WHERE raw_id IS NOT NULL;

-- Operator index for operator-based queries
CREATE INDEX IF NOT EXISTS idx_permits_clean_operator 
  ON permits_clean(operator_id) 
  WHERE operator_id IS NOT NULL;

-- County index for county-based filtering
CREATE INDEX IF NOT EXISTS idx_permits_clean_county 
  ON permits_clean(county);

-- Filed date index for chronological queries
CREATE INDEX IF NOT EXISTS idx_permits_clean_filed_date 
  ON permits_clean(filed_date DESC);

-- Status index for status filtering
CREATE INDEX IF NOT EXISTS idx_permits_clean_status 
  ON permits_clean(status);

-- API number index for API lookups
CREATE INDEX IF NOT EXISTS idx_permits_clean_api_number 
  ON permits_clean(api_number) 
  WHERE api_number IS NOT NULL;

-- Composite index for typical dashboard queries (county + date)
CREATE INDEX IF NOT EXISTS idx_permits_clean_county_filed 
  ON permits_clean(county, filed_date DESC) 
  WHERE county IS NOT NULL;

-- Composite index for operator + date queries
CREATE INDEX IF NOT EXISTS idx_permits_clean_operator_filed 
  ON permits_clean(operator_id, filed_date DESC) 
  WHERE operator_id IS NOT NULL;

-- Version index for amendment tracking
CREATE INDEX IF NOT EXISTS idx_permits_clean_version 
  ON permits_clean(permit_number, version DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE permits_clean ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read clean permits
CREATE POLICY permits_clean_read_access ON permits_clean
  FOR SELECT
  USING (true);

-- Policy: Only service role can write clean permits
CREATE POLICY permits_clean_write_access ON permits_clean
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_permits_clean_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_permits_clean_updated_at ON permits_clean;
CREATE TRIGGER update_permits_clean_updated_at
  BEFORE UPDATE ON permits_clean
  FOR EACH ROW
  EXECUTE FUNCTION update_permits_clean_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE permits_clean IS 'Normalized, validated permit data with PostGIS geometry support';
COMMENT ON COLUMN permits_clean.id IS 'Unique identifier for the clean permit record';
COMMENT ON COLUMN permits_clean.raw_id IS 'Foreign key to permits_raw - maintains lineage to source data';
COMMENT ON COLUMN permits_clean.permit_number IS 'Official RRC permit number';
COMMENT ON COLUMN permits_clean.permit_type IS 'Type of permit (drilling, amendment, etc.)';
COMMENT ON COLUMN permits_clean.status IS 'Current status (approved, pending, cancelled, etc.)';
COMMENT ON COLUMN permits_clean.operator_name_raw IS 'Original operator name from source before normalization';
COMMENT ON COLUMN permits_clean.operator_id IS 'Foreign key to normalized operators table (Phase 4)';
COMMENT ON COLUMN permits_clean.county IS 'Texas county name';
COMMENT ON COLUMN permits_clean.district IS 'RRC district number/identifier';
COMMENT ON COLUMN permits_clean.lease_name IS 'Oil/gas lease name';
COMMENT ON COLUMN permits_clean.well_number IS 'Well number within lease';
COMMENT ON COLUMN permits_clean.api_number IS 'API well number';
COMMENT ON COLUMN permits_clean.location IS 'PostGIS Point geometry (WGS84 / EPSG:4326)';
COMMENT ON COLUMN permits_clean.surface_lat IS 'Surface latitude in decimal degrees';
COMMENT ON COLUMN permits_clean.surface_lon IS 'Surface longitude in decimal degrees';
COMMENT ON COLUMN permits_clean.filed_date IS 'Date permit was filed with RRC';
COMMENT ON COLUMN permits_clean.approved_date IS 'Date permit was approved by RRC';
COMMENT ON COLUMN permits_clean.effective_at IS 'Timestamp when RRC says permit is effective';
COMMENT ON COLUMN permits_clean.source_seen_at IS 'Timestamp when we first saw this permit from source';
COMMENT ON COLUMN permits_clean.metadata IS 'Additional permit fields as JSONB';
COMMENT ON COLUMN permits_clean.version IS 'Version number for tracking amendments to same permit';
COMMENT ON COLUMN permits_clean.created_at IS 'When this clean record was created';
COMMENT ON COLUMN permits_clean.updated_at IS 'When this clean record was last updated';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  index_count INTEGER;
  rls_enabled BOOLEAN;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'permits_clean'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'permits_clean table was not created';
  END IF;
  
  -- Check indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'permits_clean';
  
  IF index_count < 5 THEN
    RAISE WARNING 'Expected at least 5 indexes on permits_clean, found %', index_count;
  END IF;
  
  -- Check RLS
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'permits_clean';
  
  IF NOT rls_enabled THEN
    RAISE WARNING 'Row Level Security is not enabled on permits_clean';
  END IF;
  
  RAISE NOTICE 'permits_clean migration completed successfully. Indexes: %', index_count;
END $$;
