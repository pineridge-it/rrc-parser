-- ============================================================================
-- USER DIGEST PREFERENCES DATA MODEL
-- ============================================================================
-- Stores per-user digest schedule preferences for rich weekly digest emails

CREATE TABLE IF NOT EXISTS user_digest_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Digest settings
  digest_enabled BOOLEAN NOT NULL DEFAULT true,
  digest_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (digest_frequency IN ('daily', 'weekly', 'off')),
  digest_day_of_week INT NOT NULL DEFAULT 1 CHECK (digest_day_of_week >= 0 AND digest_day_of_week <= 6),
  digest_hour_utc INT NOT NULL DEFAULT 8 CHECK (digest_hour_utc >= 0 AND digest_hour_utc <= 23),
  
  -- Content inclusion settings
  include_saved_searches BOOLEAN NOT NULL DEFAULT true,
  include_status_changes BOOLEAN NOT NULL DEFAULT true,
  include_new_operators BOOLEAN NOT NULL DEFAULT true,
  
  -- Tracking
  last_digest_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One preference row per user per workspace
  UNIQUE(workspace_id, user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_digest_preferences_workspace 
  ON user_digest_preferences(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_digest_preferences_frequency 
  ON user_digest_preferences(digest_enabled, digest_frequency);
CREATE INDEX IF NOT EXISTS idx_user_digest_preferences_scheduled 
  ON user_digest_preferences(digest_enabled, digest_frequency, last_digest_sent_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_digest_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_digest_preferences_isolation ON user_digest_preferences
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_superadmin = true
    )
  );

CREATE POLICY user_digest_preferences_insert ON user_digest_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_digest_preferences_update ON user_digest_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_digest_preferences_updated_at ON user_digest_preferences;
CREATE TRIGGER update_user_digest_preferences_updated_at
  BEFORE UPDATE ON user_digest_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: get_users_due_for_digest
-- ============================================================================
-- Returns users who are due for a digest based on their schedule

CREATE OR REPLACE FUNCTION get_users_due_for_digest()
RETURNS TABLE (
  user_id UUID,
  workspace_id UUID,
  digest_frequency TEXT,
  digest_day_of_week INT,
  digest_hour_utc INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    udp.user_id,
    udp.workspace_id,
    udp.digest_frequency,
    udp.digest_day_of_week,
    udp.digest_hour_utc
  FROM user_digest_preferences udp
  WHERE udp.digest_enabled = true
    AND udp.digest_frequency != 'off'
    AND (
      udp.last_digest_sent_at IS NULL
      OR (
        udp.digest_frequency = 'daily' 
        AND udp.last_digest_sent_at < NOW() - INTERVAL '1 day'
      )
      OR (
        udp.digest_frequency = 'weekly'
        AND udp.last_digest_sent_at < NOW() - INTERVAL '7 days'
      )
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: mark_digest_sent
-- ============================================================================
-- Updates last_digest_sent_at after successful digest delivery

CREATE OR REPLACE FUNCTION mark_digest_sent(p_user_id UUID, p_workspace_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_digest_preferences
  SET last_digest_sent_at = NOW()
  WHERE user_id = p_user_id
    AND workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_digest_preferences IS 'Per-user digest schedule preferences';
COMMENT ON COLUMN user_digest_preferences.digest_day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN user_digest_preferences.digest_hour_utc IS 'Hour in UTC (0-23)';

COMMENT ON FUNCTION get_users_due_for_digest() IS 'Returns users who are due for a digest based on their schedule';
COMMENT ON FUNCTION mark_digest_sent(UUID, UUID) IS 'Updates last_digest_sent_at after successful digest delivery';
