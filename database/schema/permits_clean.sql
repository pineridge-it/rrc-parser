CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS permits_clean (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_id UUID REFERENCES permits_raw(id) ON DELETE SET NULL,
  permit_number VARCHAR(50) NOT NULL,
  permit_type VARCHAR(50),
  status VARCHAR(50),
  operator_name_raw VARCHAR(255),
  operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
  county VARCHAR(100),
  district VARCHAR(50),
  lease_name VARCHAR(255),
  well_number VARCHAR(50),
  api_number VARCHAR(20),
  location GEOMETRY(Point, 4326),
  surface_lat DECIMAL(10, 7),
  surface_lon DECIMAL(10, 7),
  filed_date DATE,
  approved_date DATE,
  effective_at TIMESTAMPTZ,
  source_seen_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  UNIQUE(permit_number, version)
);

CREATE INDEX IF NOT EXISTS idx_permits_clean_location ON permits_clean USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_permits_clean_raw ON permits_clean(raw_id);
CREATE INDEX IF NOT EXISTS idx_permits_clean_operator ON permits_clean(operator_id);
CREATE INDEX IF NOT EXISTS idx_permits_clean_county ON permits_clean(county);
CREATE INDEX IF NOT EXISTS idx_permits_clean_filed_date ON permits_clean(filed_date DESC);
CREATE INDEX IF NOT EXISTS idx_permits_clean_status ON permits_clean(status);
CREATE INDEX IF NOT EXISTS idx_permits_clean_permit_number ON permits_clean(permit_number);
CREATE INDEX IF NOT EXISTS idx_permits_clean_api_number ON permits_clean(api_number);

CREATE INDEX IF NOT EXISTS idx_permits_clean_county_filed ON permits_clean(county, filed_date DESC);
CREATE INDEX IF NOT EXISTS idx_permits_clean_operator_filed ON permits_clean(operator_id, filed_date DESC);

CREATE INDEX IF NOT EXISTS idx_permits_clean_created_at ON permits_clean(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permits_clean_updated_at ON permits_clean(updated_at DESC);

ALTER TABLE permits_clean ENABLE ROW LEVEL SECURITY;

CREATE POLICY permits_clean_read_access ON permits_clean
  FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
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
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE permits_clean IS 'Normalized, validated permit data with PostGIS geometry for spatial queries';
COMMENT ON COLUMN permits_clean.id IS 'Unique identifier for the permit record';
COMMENT ON COLUMN permits_clean.raw_id IS 'Link to source data in permits_raw table';
COMMENT ON COLUMN permits_clean.permit_number IS 'RRC permit number (unique per version)';
COMMENT ON COLUMN permits_clean.permit_type IS 'Type of permit (drilling, amendment, etc.)';
COMMENT ON COLUMN permits_clean.status IS 'Permit status (approved, pending, etc.)';
COMMENT ON COLUMN permits_clean.operator_name_raw IS 'Original operator name from source';
COMMENT ON COLUMN permits_clean.operator_id IS 'Reference to normalized operator record';
COMMENT ON COLUMN permits_clean.county IS 'County where permit is located';
COMMENT ON COLUMN permits_clean.district IS 'RRC district';
COMMENT ON COLUMN permits_clean.lease_name IS 'Lease name';
COMMENT ON COLUMN permits_clean.well_number IS 'Well number';
COMMENT ON COLUMN permits_clean.api_number IS 'API well number';
COMMENT ON COLUMN permits_clean.location IS 'PostGIS point geometry (WGS84) for spatial queries';
COMMENT ON COLUMN permits_clean.surface_lat IS 'Surface latitude';
COMMENT ON COLUMN permits_clean.surface_lon IS 'Surface longitude';
COMMENT ON COLUMN permits_clean.filed_date IS 'Date permit was filed';
COMMENT ON COLUMN permits_clean.approved_date IS 'Date permit was approved';
COMMENT ON COLUMN permits_clean.effective_at IS 'When RRC says the permit is effective';
COMMENT ON COLUMN permits_clean.source_seen_at IS 'When we first saw this permit in the source';
COMMENT ON COLUMN permits_clean.metadata IS 'Additional fields and source-specific data';
COMMENT ON COLUMN permits_clean.created_at IS 'When this record was created';
COMMENT ON COLUMN permits_clean.updated_at IS 'When this record was last updated';
COMMENT ON COLUMN permits_clean.version IS 'Version number for tracking amendments (1 = original, 2+ = amendments)';
