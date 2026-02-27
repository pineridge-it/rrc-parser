-- ============================================================================
-- API KEYS AND USAGE LOG TABLES
-- ============================================================================
-- Stores API keys for authentication and tracks API usage for rate limiting

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE, -- SHA256 hash of the API key
    prefix TEXT NOT NULL, -- First 8 characters for identification (e.g., "rrc_a1b2")
    scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],
    rate_limit JSONB DEFAULT '{"requestsPerMinute": 100, "requestsPerDay": 10000}',
    monthly_quota INTEGER,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure only one active key per prefix
    UNIQUE(prefix, revoked_at)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace_id ON api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked_at ON api_keys(revoked_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace_active ON api_keys(workspace_id) WHERE revoked_at IS NULL;

-- API Usage Log Table (for rate limiting)
CREATE TABLE IF NOT EXISTS api_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_api_usage_log_workspace_id ON api_usage_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_api_key_id ON api_usage_log(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_timestamp ON api_usage_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_workspace_key_time ON api_usage_log(workspace_id, api_key_id, timestamp);

-- Enable Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage API keys
CREATE POLICY "Service role can manage api_keys"
    ON api_keys
    FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policy: Service role can manage API usage logs
CREATE POLICY "Service role can manage api_usage_log"
    ON api_usage_log
    FOR ALL
    USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old API usage logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_api_usage_log(p_retention_days INTEGER DEFAULT 90)
RETURNS VOID AS $$
BEGIN
    DELETE FROM api_usage_log
    WHERE timestamp < NOW() - (p_retention_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE api_keys IS 'API keys for workspace authentication';
COMMENT ON TABLE api_usage_log IS 'API request logs for rate limiting and analytics';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA256 hash of the API key for secure lookup';
COMMENT ON COLUMN api_keys.prefix IS 'First 8 characters of the key for user identification';
COMMENT ON COLUMN api_keys.scopes IS 'Array of permission scopes (read, write, admin)';