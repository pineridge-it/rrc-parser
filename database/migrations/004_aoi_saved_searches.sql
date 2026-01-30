-- ============================================================================
-- AOI AND SAVED SEARCHES TABLES
-- ============================================================================
-- Migration: Creates Areas of Interest and Saved Searches tables with RLS

-- ============================================================================
-- 1. AREAS OF INTEREST (AOI) TABLE
-- ============================================================================

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
  aoi_type VARCHAR(50) NOT NULL DEFAULT 'custom',
  
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aois_geometry ON aois USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_aois_workspace ON aois(workspace_id);
CREATE INDEX IF NOT EXISTS idx_aois_type ON aois(aoi_type);
CREATE INDEX IF NOT EXISTS idx_aois_active ON aois(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_aois_bbox ON aois(bbox_west, bbox_south, bbox_east, bbox_north);

-- RLS
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

-- Trigger for updated_at
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
-- 2. SAVED SEARCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  
  -- Search information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Filter configuration
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Sort preferences
  sort_by VARCHAR(50) DEFAULT 'filed_date',
  sort_order VARCHAR(10) DEFAULT 'desc',
  
  -- Display preferences
  columns JSONB DEFAULT '["permit_number", "operator_name", "county", "filed_date", "status"]'::jsonb,
  
  -- Notification settings
  notify_on_new_matches BOOLEAN NOT NULL DEFAULT false,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  use_count INTEGER NOT NULL DEFAULT 0,
  
  -- System timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_workspace ON saved_searches(workspace_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_by ON saved_searches(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_default ON saved_searches(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_filters ON saved_searches USING GIN(filters);

-- RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_searches_workspace_isolation ON saved_searches
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

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('aois', 'saved_searches');
  
  IF table_count < 2 THEN
    RAISE EXCEPTION 'Expected 2 tables, found %', table_count;
  END IF;
  
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('aois', 'saved_searches');
  
  IF policy_count < 2 THEN
    RAISE EXCEPTION 'Expected at least 2 RLS policies, found %', policy_count;
  END IF;
  
  RAISE NOTICE 'Migration verification passed: % tables, % RLS policies', table_count, policy_count;
END;
$$;

\echo 'AOI and Saved Searches tables with RLS created successfully!'
