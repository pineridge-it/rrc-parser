-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Raw Data Store
-- Stores the original JSON blob exactly as received/parsed, before normalization.
-- This allows for re-processing if the schema evolves.
CREATE TABLE IF NOT EXISTS permits_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data JSONB NOT NULL,
    raw_hash TEXT NOT NULL UNIQUE, -- SHA256 of the raw content to prevent duplicates
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processed, error
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_permits_raw_status ON permits_raw(status);
CREATE INDEX IF NOT EXISTS idx_permits_raw_created_at ON permits_raw(created_at);

-- 2. Clean/Normalized Data
-- Structured data for application use and analytics.
CREATE TABLE IF NOT EXISTS permits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_id UUID REFERENCES permits_raw(id) ON DELETE SET NULL,
    
    -- Core Identities
    permit_number TEXT NOT NULL UNIQUE,
    sequence_number TEXT,
    
    -- Location / Geography
    county_code TEXT,
    district TEXT,
    lease_name TEXT,
    well_number TEXT,
    
    -- Operator Info
    operator_name TEXT,
    operator_number TEXT,
    
    -- Dates (Stored as DATE provided strings are YYYY-MM-DD compatible or parsed)
    received_date DATE,
    issued_date DATE,
    amended_date DATE,
    extended_date DATE,
    spud_date DATE,
    
    -- Technical Details
    total_depth INTEGER,
    well_status TEXT,
    well_type TEXT,
    application_type TEXT,
    
    -- Flags
    horizontal_flag BOOLEAN DEFAULT FALSE,
    directional_flag BOOLEAN DEFAULT FALSE,
    sidetrack_flag BOOLEAN DEFAULT FALSE,
    
    -- Geospatial (from GisSurfaceRecord)
    -- We store both raw columns and a PostGIS geometry column
    surface_latitude DOUBLE PRECISION,
    surface_longitude DOUBLE PRECISION,
    surface_location GEOMETRY(POINT, 4326), -- WGS84
    
    -- Bottomhole
    bottomhole_latitude DOUBLE PRECISION,
    bottomhole_longitude DOUBLE PRECISION,
    bottomhole_location GEOMETRY(POINT, 4326),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permits_permit_number ON permits(permit_number);
CREATE INDEX IF NOT EXISTS idx_permits_operator_name ON permits(operator_name);
CREATE INDEX IF NOT EXISTS idx_permits_issued_date ON permits(issued_date);
CREATE INDEX IF NOT EXISTS idx_permits_surface_location ON permits USING GIST(surface_location);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_permits_updated_at
    BEFORE UPDATE ON permits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
