-- ============================================================================
-- AREAS OF INTEREST (AOI) TABLE
-- ============================================================================
-- User-defined geographic areas for monitoring

CREATE TABLE IF NOT EXISTS aois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- AOI information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Geometry (can be Point, Polygon, or MultiPolygon)
  geometry GEOMETRY(Geometry, 4326) NOT NULL,
  
  -- Bounding box for quick filtering
  bbox_north DECIMAL(10, 7),
  bbox_south DECIMAL(10, 7),
  bbox_east DECIMAL(10, 7),
  bbox_west DECIMAL(10, 7),
  
  -- AOI type
  aoi_type VARCHAR(50) NOT NULL DEFAULT 'custom', -- custom, county, state, lease
  
  -- Metadata
  color VARCHAR(7) DEFAULT '#3B82F6',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- System timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Spatial index
CREATE INDEX IF NOT EXISTS idx_aois_geometry ON aois USING GIST(geometry);

-- Workspace isolation
CREATE INDEX IF NOT EXISTS idx_aois_workspace ON aois(workspace_id);

-- Type and status
CREATE INDEX IF NOT EXISTS idx_aois_type ON aois(aoi_type);
CREATE INDEX IF NOT EXISTS idx_aois_active ON aois(is_active) WHERE is_active = true;

-- Bounding box for quick filtering
CREATE INDEX IF NOT EXISTS idx_aois_bbox ON aois(bbox_west, bbox_south, bbox_east, bbox_north);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE aois ENABLE ROW LEVEL SECURITY;

CREATE POLICY aois_workspace_isolation ON aois
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_superadmin = true
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_aois_updated_at ON aois;
CREATE TRIGGER update_aois_updated_at
  BEFORE UPDATE ON aois
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate bounding box
CREATE OR REPLACE FUNCTION calculate_aoi_bbox()
RETURNS TRIGGER AS $$
BEGIN
  SELECT 
    ST_YMax(NEW.geometry),
    ST_YMin(NEW.geometry),
    ST_XMax(NEW.geometry),
    ST_XMin(NEW.geometry)
  INTO NEW.bbox_north, NEW.bbox_south, NEW.bbox_east, NEW.bbox_west;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_aoi_bbox ON aois;
CREATE TRIGGER trigger_calculate_aoi_bbox
  BEFORE INSERT OR UPDATE ON aois
  FOR EACH ROW
  EXECUTE FUNCTION calculate_aoi_bbox();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE aois IS 'User-defined geographic areas for monitoring';
COMMENT ON COLUMN aois.geometry IS 'PostGIS geometry (Point, Polygon, or MultiPolygon)';
COMMENT ON COLUMN aois.aoi_type IS 'Type: custom, county, state, lease';
