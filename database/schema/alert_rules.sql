-- Alert Rules Table Schema
-- Purpose: Store user-defined alert configurations for permit monitoring
-- Dependencies: workspaces(id), aois(id), operators(id)
-- Created: 2026-01-29
-- Task: ubuntu-08m.1.1

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  aoi_ids UUID[] DEFAULT '{}',
  
  filters JSONB NOT NULL DEFAULT '{}',
  
  operator_watchlist UUID[] DEFAULT '{}',
  
  notify_on_amendment BOOLEAN DEFAULT false,
  channels JSONB NOT NULL DEFAULT '["email"]',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  digest_frequency VARCHAR(20) CHECK (digest_frequency IN ('immediate', 'daily', 'weekly', NULL)),
  
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_workspace ON alert_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_rules_aois ON alert_rules USING GIN(aoi_ids);
CREATE INDEX IF NOT EXISTS idx_alert_rules_operators ON alert_rules USING GIN(operator_watchlist);
CREATE INDEX IF NOT EXISTS idx_alert_rules_filters ON alert_rules USING GIN(filters);

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS alert_rules_workspace_isolation ON alert_rules
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid())
  );

COMMENT ON TABLE alert_rules IS 'User-defined alert configurations for permit monitoring';
COMMENT ON COLUMN alert_rules.aoi_ids IS 'Array of Area of Interest UUIDs to monitor';
COMMENT ON COLUMN alert_rules.filters IS 'JSONB filter criteria: {"operators": ["uuid"], "counties": ["name"], "statuses": ["approved"], "permit_types": ["drilling"], "filed_after": "2024-01-01"}';
COMMENT ON COLUMN alert_rules.operator_watchlist IS 'Array of operator UUIDs to watch for activity';
COMMENT ON COLUMN alert_rules.channels IS 'Notification channels: ["email", "sms", "in_app"]';
COMMENT ON COLUMN alert_rules.quiet_hours_start IS 'Start of quiet hours (e.g., 22:00) - no notifications sent during this period';
COMMENT ON COLUMN alert_rules.quiet_hours_end IS 'End of quiet hours (e.g., 07:00)';
COMMENT ON COLUMN alert_rules.digest_frequency IS 'How often to send notifications: immediate, daily, or weekly';
