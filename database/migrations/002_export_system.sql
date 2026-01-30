-- ============================================================================
-- EXPORT SYSTEM MIGRATION
-- ============================================================================
-- Creates tables for the Data Export System
-- Includes export jobs and usage tracking

\echo 'Creating export system tables...'

-- ============================================================================
-- EXPORT JOBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Export configuration
    format VARCHAR(20) NOT NULL CHECK (format IN ('csv', 'xlsx', 'geojson', 'shapefile', 'kml')),
    filters JSONB NOT NULL DEFAULT '{}',
    fields JSONB,
    include_geometry BOOLEAN DEFAULT false,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Results
    download_url TEXT,
    expires_at TIMESTAMPTZ,
    record_count INTEGER,
    file_size BIGINT,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Indexes
    CONSTRAINT valid_expires CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Index for workspace queries
CREATE INDEX IF NOT EXISTS idx_export_jobs_workspace_id ON export_jobs(workspace_id);

-- Index for status-based queries
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status) WHERE status IN ('pending', 'processing');

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_export_jobs_expires_at ON export_jobs(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- USAGE TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Period tracking (monthly)
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Usage counters
    alerts_sent INTEGER DEFAULT 0,
    exports_count INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint for workspace + period
    UNIQUE(workspace_id, period_start)
);

-- Index for workspace + period queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_workspace_period ON usage_tracking(workspace_id, period_start);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on export_jobs
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see exports from their workspaces
CREATE POLICY export_jobs_workspace_isolation ON export_jobs
    FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Enable RLS on usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see usage from their workspaces
CREATE POLICY usage_tracking_workspace_isolation ON usage_tracking
    FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for export_jobs
CREATE OR REPLACE FUNCTION update_export_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_export_jobs_updated_at
    BEFORE UPDATE ON export_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_export_jobs_updated_at();

-- Update timestamp trigger for usage_tracking
CREATE OR REPLACE FUNCTION update_usage_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usage_tracking_updated_at
    BEFORE UPDATE ON usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_usage_tracking_updated_at();

\echo 'Export system tables created successfully'
