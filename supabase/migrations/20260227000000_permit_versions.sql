-- ============================================================================
-- PERMIT VERSIONS TABLE
-- ============================================================================
-- Tracks version history for permits to enable idempotent ETL operations
-- Each time a permit changes, a new version is created with a hash of the content

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Permit Versions Table
CREATE TABLE IF NOT EXISTS permit_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permit_id UUID NOT NULL REFERENCES permits(id) ON DELETE CASCADE,
    version_hash TEXT NOT NULL, -- SHA256 hash of normalized permit data
    source_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_at TIMESTAMPTZ, -- When this version became effective (issued_date)
    status TEXT, -- Permit status at this version
    permit_type TEXT, -- Type of permit
    county TEXT, -- County code
    filed_date TEXT, -- When the permit was filed
    attributes JSONB NOT NULL DEFAULT '{}', -- Normalized permit attributes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_permit_versions_permit ON permit_versions(permit_id);
CREATE INDEX IF NOT EXISTS idx_permit_versions_hash ON permit_versions(version_hash);
CREATE INDEX IF NOT EXISTS idx_permit_versions_permit_hash ON permit_versions(permit_id, version_hash);
CREATE INDEX IF NOT EXISTS idx_permit_versions_source_seen ON permit_versions(source_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_permit_versions_effective ON permit_versions(effective_at DESC);

-- Enable Row Level Security
ALTER TABLE permit_versions ENABLE ROW LEVEL SECURITY;

-- Read policy (permit versions are readable by all authenticated users)
CREATE POLICY permit_versions_read_access ON permit_versions
    FOR SELECT
    USING (true);

-- Comments
COMMENT ON TABLE permit_versions IS 'Tracks version history for permits to enable idempotent ETL operations';
COMMENT ON COLUMN permit_versions.version_hash IS 'SHA256 hash of normalized permit data for change detection';
COMMENT ON COLUMN permit_versions.source_seen_at IS 'When this version was first seen in the source data';
COMMENT ON COLUMN permit_versions.effective_at IS 'When this version became effective (typically issued_date)';
COMMENT ON COLUMN permit_versions.attributes IS 'Normalized permit attributes snapshot for this version';
