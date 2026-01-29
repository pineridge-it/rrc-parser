-- ============================================================================
-- SAVED SEARCHES TABLE
-- ============================================================================
-- User-saved filter configurations for quick access

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  
  -- Search information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Filter configuration
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Example filter structure:
  -- {
  --   "operators": ["uuid1", "uuid2"],
  --   "counties": ["Midland", "Martin"],
  --   "statuses": ["approved", "pending"],
  --   "permit_types": ["drilling"],
  --   "filed_after": "2024-01-01",
  --   "filed_before": "2024-12-31",
  --   "aois": ["uuid1"],
  --   "has_location": true
  -- }
  
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

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_saved_searches_workspace ON saved_searches(workspace_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_by ON saved_searches(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_default ON saved_searches(is_default) WHERE is_default = true;

-- GIN index for filter queries
CREATE INDEX IF NOT EXISTS idx_saved_searches_filters ON saved_searches USING GIN(filters);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE saved_searches IS 'User-saved filter configurations for quick access';
COMMENT ON COLUMN saved_searches.filters IS 'JSON filter configuration';
COMMENT ON COLUMN saved_searches.sort_by IS 'Default sort column';
COMMENT ON COLUMN saved_searches.columns IS 'Array of columns to display';
COMMENT ON COLUMN saved_searches.notify_on_new_matches IS 'Whether to notify when new permits match this search';
