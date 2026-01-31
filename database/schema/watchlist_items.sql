-- ============================================================================
-- WATCHLIST ITEMS TABLE
-- ============================================================================
-- User watchlist for permits and operators

CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Item being watched
  item_type VARCHAR(20) NOT NULL,  -- 'permit' or 'operator'
  permit_id UUID REFERENCES permits_clean(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
  
  -- User notes
  notes TEXT,
  
  -- System timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint to ensure valid item reference
  CONSTRAINT valid_item CHECK (
    (item_type = 'permit' AND permit_id IS NOT NULL AND operator_id IS NULL) OR
    (item_type = 'operator' AND operator_id IS NOT NULL AND permit_id IS NULL)
  ),
  
  -- Constraint to ensure unique items per user
  CONSTRAINT unique_user_item UNIQUE (user_id, item_type, permit_id, operator_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User queries
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist_items(user_id, created_at DESC);

-- Workspace queries
CREATE INDEX IF NOT EXISTS idx_watchlist_workspace ON watchlist_items(workspace_id, created_at DESC);

-- Item type queries
CREATE INDEX IF NOT EXISTS idx_watchlist_item_type ON watchlist_items(item_type, created_at DESC);

-- Permit queries
CREATE INDEX IF NOT EXISTS idx_watchlist_permit ON watchlist_items(permit_id) WHERE permit_id IS NOT NULL;

-- Operator queries
CREATE INDEX IF NOT EXISTS idx_watchlist_operator ON watchlist_items(operator_id) WHERE operator_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own watchlist items
CREATE POLICY watchlist_items_user_isolation ON watchlist_items
  FOR ALL
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_watchlist_items_updated_at ON watchlist_items;
CREATE TRIGGER update_watchlist_items_updated_at
  BEFORE UPDATE ON watchlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE watchlist_items IS 'User watchlist for permits and operators';
COMMENT ON COLUMN watchlist_items.item_type IS 'Type of item being watched (permit or operator)';
COMMENT ON COLUMN watchlist_items.notes IS 'User notes about the watched item';