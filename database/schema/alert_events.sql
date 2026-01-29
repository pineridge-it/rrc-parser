CREATE TABLE IF NOT EXISTS alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  permit_id UUID NOT NULL REFERENCES permits_clean(id) ON DELETE CASCADE,
  
  match_reason JSONB NOT NULL,
  permit_snapshot JSONB NOT NULL,
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'failed')),
  processed_at TIMESTAMPTZ,
  
  dedup_key VARCHAR(255) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_alert_events_workspace ON alert_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_rule ON alert_events(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_permit ON alert_events(permit_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_status ON alert_events(status) WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_alert_events_created ON alert_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_dedup ON alert_events(dedup_key);

ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY alert_events_workspace_isolation ON alert_events
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE id = current_setting('app.current_workspace_id', true)::UUID
  ));

COMMENT ON TABLE alert_events IS 'Immutable record of triggered alerts using outbox pattern for durability';
COMMENT ON COLUMN alert_events.id IS 'Unique identifier for the alert event';
COMMENT ON COLUMN alert_events.workspace_id IS 'Workspace this alert belongs to';
COMMENT ON COLUMN alert_events.alert_rule_id IS 'Alert rule that triggered this event';
COMMENT ON COLUMN alert_events.permit_id IS 'Permit that matched the alert rule';
COMMENT ON COLUMN alert_events.match_reason IS 'JSON explaining why this permit matched the rule';
COMMENT ON COLUMN alert_events.permit_snapshot IS 'Complete permit data at time of match for audit trail';
COMMENT ON COLUMN alert_events.status IS 'Processing status: pending, processing, delivered, failed';
COMMENT ON COLUMN alert_events.processed_at IS 'When the event was processed by delivery worker';
COMMENT ON COLUMN alert_events.dedup_key IS 'Deduplication key: {rule_id}:{permit_id}:{version} to prevent duplicate alerts';
COMMENT ON COLUMN alert_events.created_at IS 'When the alert event was created';
