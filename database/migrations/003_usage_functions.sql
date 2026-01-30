-- ============================================================================
-- USAGE TRACKING FUNCTIONS AND TRIGGERS
-- ============================================================================

\echo 'Creating usage tracking functions...'

-- ============================================================================
-- FUNCTIONS FOR USAGE TRACKING
-- ============================================================================

-- Function to get or create current usage period
CREATE OR REPLACE FUNCTION get_or_create_usage_period(p_workspace_id UUID)
RETURNS TABLE (
    id UUID,
    workspace_id UUID,
    period_start DATE,
    period_end DATE,
    alerts_sent INTEGER,
    exports_count INTEGER,
    api_calls INTEGER
) AS $$
DECLARE
    v_period_start DATE := DATE_TRUNC('month', CURRENT_DATE);
    v_period_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    v_record usage_tracking%ROWTYPE;
BEGIN
    -- Try to get existing period
    SELECT * INTO v_record
    FROM usage_tracking
    WHERE usage_tracking.workspace_id = p_workspace_id
      AND usage_tracking.period_start = v_period_start;
    
    -- If not found, create new period
    IF NOT FOUND THEN
        INSERT INTO usage_tracking (workspace_id, period_start, period_end)
        VALUES (p_workspace_id, v_period_start, v_period_end)
        RETURNING * INTO v_record;
    END IF;
    
    RETURN QUERY SELECT 
        v_record.id,
        v_record.workspace_id,
        v_record.period_start,
        v_record.period_end,
        v_record.alerts_sent,
        v_record.exports_count,
        v_record.api_calls;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
    p_workspace_id UUID,
    p_resource TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    v_period usage_tracking%ROWTYPE;
BEGIN
    -- Get or create current period
    SELECT * INTO v_period
    FROM get_or_create_usage_period(p_workspace_id);
    
    -- Update appropriate counter
    CASE p_resource
        WHEN 'alerts' THEN
            UPDATE usage_tracking
            SET alerts_sent = alerts_sent + p_amount,
                updated_at = NOW()
            WHERE id = v_period.id;
        WHEN 'exports' THEN
            UPDATE usage_tracking
            SET exports_count = exports_count + p_amount,
                updated_at = NOW()
            WHERE id = v_period.id;
        WHEN 'api_calls' THEN
            UPDATE usage_tracking
            SET api_calls = api_calls + p_amount,
                updated_at = NOW()
            WHERE id = v_period.id;
        ELSE
            RAISE EXCEPTION 'Unknown resource type: %', p_resource;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workspace usage summary
CREATE OR REPLACE FUNCTION get_workspace_usage(p_workspace_id UUID)
RETURNS TABLE (
    aois_current BIGINT,
    aois_limit INTEGER,
    alerts_current INTEGER,
    alerts_limit INTEGER,
    exports_current INTEGER,
    exports_limit INTEGER,
    api_calls_current INTEGER,
    api_calls_limit INTEGER
) AS $$
DECLARE
    v_plan_type TEXT;
    v_period usage_tracking%ROWTYPE;
    v_aoi_count BIGINT;
BEGIN
    -- Get workspace plan
    SELECT plan_type INTO v_plan_type
    FROM workspaces
    WHERE id = p_workspace_id;
    
    -- Get current period
    SELECT * INTO v_period
    FROM get_or_create_usage_period(p_workspace_id);
    
    -- Count AOIs
    SELECT COUNT(*) INTO v_aoi_count
    FROM areas_of_interest
    WHERE workspace_id = p_workspace_id AND deleted_at IS NULL;
    
    RETURN QUERY SELECT
        v_aoi_count,
        CASE v_plan_type
            WHEN 'free' THEN 3
            WHEN 'pro' THEN 25
            WHEN 'team' THEN 100
            WHEN 'enterprise' THEN 1000
            ELSE 3
        END,
        v_period.alerts_sent,
        CASE v_plan_type
            WHEN 'free' THEN 50
            WHEN 'pro' THEN 500
            WHEN 'team' THEN 5000
            WHEN 'enterprise' THEN 50000
            ELSE 50
        END,
        v_period.exports_count,
        CASE v_plan_type
            WHEN 'free' THEN 10
            WHEN 'pro' THEN 100
            WHEN 'team' THEN 1000
            WHEN 'enterprise' THEN 10000
            ELSE 10
        END,
        v_period.api_calls,
        CASE v_plan_type
            WHEN 'free' THEN 0
            WHEN 'pro' THEN 0
            WHEN 'team' THEN 10000
            WHEN 'enterprise' THEN 100000
            ELSE 0
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if action would exceed limit
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_workspace_id UUID,
    p_resource TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS TABLE (
    allowed BOOLEAN,
    current_val BIGINT,
    limit_val INTEGER,
    percentage NUMERIC,
    would_exceed BOOLEAN
) AS $$
DECLARE
    v_usage RECORD;
    v_current BIGINT;
    v_limit INTEGER;
    v_new_total BIGINT;
    v_percentage NUMERIC;
    v_would_exceed BOOLEAN;
    v_allowed BOOLEAN;
BEGIN
    -- Get usage summary
    SELECT * INTO v_usage
    FROM get_workspace_usage(p_workspace_id);
    
    -- Get current and limit based on resource
    CASE p_resource
        WHEN 'aois' THEN
            v_current := v_usage.aois_current;
            v_limit := v_usage.aois_limit;
        WHEN 'alerts' THEN
            v_current := v_usage.alerts_current;
            v_limit := v_usage.alerts_limit;
        WHEN 'exports' THEN
            v_current := v_usage.exports_current;
            v_limit := v_usage.exports_limit;
        WHEN 'api_calls' THEN
            v_current := v_usage.api_calls_current;
            v_limit := v_usage.api_calls_limit;
        ELSE
            RAISE EXCEPTION 'Unknown resource type: %', p_resource;
    END CASE;
    
    v_new_total := v_current + p_amount;
    v_would_exceed := v_new_total > v_limit;
    v_allowed := NOT v_would_exceed;
    v_percentage := CASE WHEN v_limit > 0 THEN (v_new_total::NUMERIC / v_limit::NUMERIC) ELSE 0 END;
    
    RETURN QUERY SELECT v_allowed, v_current, v_limit, v_percentage, v_would_exceed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER FUNCTION FOR EXPORT USAGE TRACKING
-- ============================================================================

CREATE OR REPLACE FUNCTION track_export_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM increment_usage(NEW.workspace_id, 'exports', 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to track exports on completion
DROP TRIGGER IF EXISTS track_export_usage_trigger ON export_jobs;
CREATE TRIGGER track_export_usage_trigger
    AFTER UPDATE ON export_jobs
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION track_export_usage();

\echo 'Usage tracking functions created successfully'
