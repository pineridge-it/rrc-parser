-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
-- Immutable audit trail for compliance and debugging

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID,
  
  -- Event classification
  event_type VARCHAR(100) NOT NULL,
  -- Types: permit_viewed, permit_exported, alert_rule_created, alert_rule_updated,
  --        alert_rule_deleted, api_key_created, api_key_revoked, user_invited,
  --        workspace_updated, billing_changed, data_exported
  
  -- Resource being acted upon
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  
  -- Event details
  action VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Change tracking (for updates)
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Request metadata
  request_id UUID,
  
  -- System timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Time-series queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Workspace queries
CREATE INDEX IF NOT EXISTS idx_audit_log_workspace ON audit_log(workspace_id, created_at DESC);

-- User queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);

-- Event type queries
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type, created_at DESC);

-- Resource queries
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id, created_at DESC);

-- Request tracking
CREATE INDEX IF NOT EXISTS idx_audit_log_request ON audit_log(request_id);

-- ============================================================================
-- PARTITIONING (for scale)
-- ============================================================================
-- Uncomment when data volume requires partitioning:
-- CREATE TABLE audit_log_y2024m01 PARTITION OF audit_log
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see audit logs for their workspaces
CREATE POLICY audit_log_workspace_isolation ON audit_log
  FOR SELECT
  USING (
    workspace_id IS NULL
    OR
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

-- Only system can insert audit logs
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- No updates allowed (immutable)
CREATE POLICY audit_log_no_update ON audit_log
  FOR UPDATE
  USING (false);

-- No deletes allowed (immutable)
CREATE POLICY audit_log_no_delete ON audit_log
  FOR DELETE
  USING (false);

-- ============================================================================
-- AUDIT LOG HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_workspace_id UUID,
  p_user_id UUID,
  p_event_type VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_action VARCHAR,
  p_description TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_log (
    workspace_id,
    user_id,
    event_type,
    resource_type,
    resource_id,
    action,
    description,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_event_type,
    p_resource_type,
    p_resource_id,
    p_action,
    p_description,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE audit_log IS 'Immutable audit trail for compliance and debugging';
COMMENT ON COLUMN audit_log.event_type IS 'Category of event (permit_viewed, alert_rule_created, etc.)';
COMMENT ON COLUMN audit_log.resource_type IS 'Type of resource being acted upon';
COMMENT ON COLUMN audit_log.old_values IS 'Previous values (for update events)';
COMMENT ON COLUMN audit_log.new_values IS 'New values (for update events)';
