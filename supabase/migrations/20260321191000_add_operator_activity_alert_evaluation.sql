-- ============================================================================
-- FUNCTION: evaluate_operator_activity_alerts
-- ============================================================================
-- Evaluates operator activity alerts by finding new permits that match
-- operator subscriptions with optional filtering.
-- 
-- Algorithm:
-- 1. Find new permits filed today (detected_at = today)
-- 2. Join with operator activity subscriptions
-- 3. Apply optional filters (county, formation, min_depth)
-- 4. Insert deduplicated alert events
-- 
-- Performance: Single bulk query + batch insert, no N+1 queries.
-- Idempotency: ON CONFLICT prevents duplicate events for same subscription/permit/day.
-- ============================================================================
CREATE OR REPLACE FUNCTION evaluate_operator_activity_alerts()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    events_inserted integer;
BEGIN
    -- Insert alert events for new operator permits
    -- Uses ON CONFLICT DO NOTHING to prevent duplicates from re-runs
    INSERT INTO permit_alert_events (
        subscription_id,
        permit_api_number,
        old_status,
        new_status,
        detected_at,
        notification_status
    )
    SELECT 
        s.id AS subscription_id,
        p.permit_number AS permit_api_number,
        NULL AS old_status,
        p.status AS new_status,
        p.filed_date AS detected_at,
        'pending'::text AS notification_status
    FROM permit_alert_subscriptions s
    INNER JOIN permits p ON (
        -- Match operator name
        s.operator_name = p.operator_name
        -- Only for operator activity subscriptions
        AND s.trigger_type = 'operator_activity'
        -- Only active subscriptions
        AND s.is_active = true
    )
    WHERE 
        -- New permits filed today
        p.filed_date::date = CURRENT_DATE
        -- Apply optional county filter
        AND (s.county_filter IS NULL OR s.county_filter = p.county)
        -- Apply optional formation filter
        AND (s.formation_filter IS NULL OR s.formation_filter = p.formation)
        -- Apply optional min depth filter
        AND (s.min_depth_filter IS NULL OR p.total_depth >= s.min_depth_filter)
    ON CONFLICT 
        -- Prevent duplicate events: same subscription, permit, and day
        ON CONSTRAINT permit_alert_events_dedup_key
        DO NOTHING;
    
    GET DIAGNOSTICS events_inserted = ROW_COUNT;
    
    RETURN events_inserted;
END;
$$;

-- Update the main evaluate_alerts function to include operator activity evaluation
CREATE OR REPLACE FUNCTION evaluate_alerts()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    total_events integer := 0;
    status_events integer;
    operator_events integer;
BEGIN
    -- First, update the status snapshots with current permit states
    PERFORM update_permit_status_snapshots();
    
    -- Evaluate permit status change alerts
    SELECT evaluate_permit_status_alerts() INTO status_events;
    total_events := total_events + COALESCE(status_events, 0);
    
    -- Evaluate operator activity alerts
    SELECT evaluate_operator_activity_alerts() INTO operator_events;
    total_events := total_events + COALESCE(operator_events, 0);
    
    -- Future: Evaluate search_result_change alerts here
    -- SELECT evaluate_search_result_alerts() INTO search_events;
    -- total_events := total_events + COALESCE(search_events, 0);
    
    RETURN total_events;
END;
$$;

-- Grant execute permissions to service role (for ETL)
GRANT EXECUTE ON FUNCTION evaluate_operator_activity_alerts() TO service_role;