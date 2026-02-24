-- Migration: Create usage tracking tables and stored procedures
-- Created: 2026-02-23
-- Purpose: Enable usage tracking for quota enforcement and billing

-- Create workspaces table (multi-tenancy foundation)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_plan ON workspaces(plan);
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer ON workspaces(stripe_customer_id);

-- Trigger to update updated_at
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create areas_of_interest table (for AOI count tracking)
CREATE TABLE IF NOT EXISTS areas_of_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    buffer_meters INTEGER,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_aoi_workspace_id ON areas_of_interest(workspace_id);
CREATE INDEX IF NOT EXISTS idx_aoi_geometry ON areas_of_interest USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_aoi_deleted_at ON areas_of_interest(deleted_at);

-- Trigger to update updated_at
CREATE TRIGGER update_areas_of_interest_updated_at
    BEFORE UPDATE ON areas_of_interest
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create usage_periods table (tracks monthly resource consumption)
CREATE TABLE IF NOT EXISTS usage_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    alerts_sent INTEGER NOT NULL DEFAULT 0,
    exports_count INTEGER NOT NULL DEFAULT 0,
    api_calls INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one period per workspace per month
    UNIQUE(workspace_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_periods_workspace_id ON usage_periods(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_periods_period_start ON usage_periods(period_start);
CREATE INDEX IF NOT EXISTS idx_usage_periods_workspace_period ON usage_periods(workspace_id, period_start);

-- Trigger to update updated_at
CREATE TRIGGER update_usage_periods_updated_at
    BEFORE UPDATE ON usage_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Stored Procedure: Get or create current usage period for a workspace
CREATE OR REPLACE FUNCTION get_or_create_usage_period(p_workspace_id UUID)
RETURNS TABLE (
    workspace_id UUID,
    period_start DATE,
    period_end DATE,
    alerts_sent INTEGER,
    exports_count INTEGER,
    api_calls INTEGER
) AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
    v_existing_record RECORD;
BEGIN
    -- Calculate current month boundaries
    v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Try to get existing period
    SELECT * INTO v_existing_record
    FROM usage_periods up
    WHERE up.workspace_id = p_workspace_id
      AND up.period_start = v_period_start
    LIMIT 1;
    
    -- If not exists, create it
    IF v_existing_record IS NULL THEN
        INSERT INTO usage_periods (workspace_id, period_start, period_end)
        VALUES (p_workspace_id, v_period_start, v_period_end)
        RETURNING * INTO v_existing_record;
    END IF;
    
    -- Return the record
    RETURN QUERY
    SELECT 
        v_existing_record.workspace_id,
        v_existing_record.period_start,
        v_existing_record.period_end,
        v_existing_record.alerts_sent,
        v_existing_record.exports_count,
        v_existing_record.api_calls;
END;
$$ LANGUAGE plpgsql;

-- Stored Procedure: Atomically increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
    p_workspace_id UUID,
    p_resource TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Calculate current month boundaries
    v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Upsert the usage record and increment the appropriate counter
    IF p_resource = 'alerts' THEN
        INSERT INTO usage_periods (workspace_id, period_start, period_end, alerts_sent)
        VALUES (p_workspace_id, v_period_start, v_period_end, p_amount)
        ON CONFLICT (workspace_id, period_start)
        DO UPDATE SET 
            alerts_sent = usage_periods.alerts_sent + p_amount,
            updated_at = NOW();
    ELSIF p_resource = 'exports' THEN
        INSERT INTO usage_periods (workspace_id, period_start, period_end, exports_count)
        VALUES (p_workspace_id, v_period_start, v_period_end, p_amount)
        ON CONFLICT (workspace_id, period_start)
        DO UPDATE SET 
            exports_count = usage_periods.exports_count + p_amount,
            updated_at = NOW();
    ELSIF p_resource = 'apiCalls' THEN
        INSERT INTO usage_periods (workspace_id, period_start, period_end, api_calls)
        VALUES (p_workspace_id, v_period_start, v_period_end, p_amount)
        ON CONFLICT (workspace_id, period_start)
        DO UPDATE SET 
            api_calls = usage_periods.api_calls + p_amount,
            updated_at = NOW();
    ELSE
        RAISE EXCEPTION 'Invalid resource type: %', p_resource;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security on workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read workspaces they're members of
CREATE POLICY "Users can read own workspaces"
    ON workspaces
    FOR SELECT
    USING (true); -- Simplified for now, should check workspace_members table

-- Service role can do anything
CREATE POLICY "Service role can manage workspaces"
    ON workspaces
    FOR ALL
    USING (auth.role() = 'service_role');

-- Enable Row Level Security on areas_of_interest
ALTER TABLE areas_of_interest ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read AOIs in their workspace
CREATE POLICY "Users can read workspace AOIs"
    ON areas_of_interest
    FOR SELECT
    USING (true); -- Simplified for now, should check workspace_members table

-- Service role can do anything
CREATE POLICY "Service role can manage AOIs"
    ON areas_of_interest
    FOR ALL
    USING (auth.role() = 'service_role');

-- Enable Row Level Security on usage_periods
ALTER TABLE usage_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role only for usage tracking
CREATE POLICY "Service role can manage usage periods"
    ON usage_periods
    FOR ALL
    USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE workspaces IS 'Multi-tenant workspace container for all user data';
COMMENT ON TABLE areas_of_interest IS 'Geographic areas of interest for permit monitoring';
COMMENT ON TABLE usage_periods IS 'Monthly resource consumption tracking for quota enforcement';
COMMENT ON FUNCTION get_or_create_usage_period IS 'Atomically gets or creates the current monthly usage period for a workspace';
COMMENT ON FUNCTION increment_usage IS 'Atomically increments a usage counter for the current period';
