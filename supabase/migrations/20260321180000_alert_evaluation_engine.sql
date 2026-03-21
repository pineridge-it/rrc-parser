-- ============================================================================
-- ALERT EVALUATION ENGINE - STATUS SNAPSHOT AND EVALUATION FUNCTIONS
-- ============================================================================

-- This migration creates the status snapshot table and evaluation functions
-- for the alert evaluation engine. It hooks into ETL post-processing to detect
-- permit status changes and fire alert events.

-- Status snapshot table for change detection
-- Stores the last known state of each permit to enable diff comparisons
CREATE TABLE IF NOT EXISTS permit_status_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permit_api_number TEXT NOT NULL,
    well_status TEXT,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(permit_api_number)
);

CREATE INDEX IF NOT EXISTS idx_permit_status_snapshots_permit_api_number 
    ON permit_status_snapshots(permit_api_number);
CREATE INDEX IF NOT EXISTS idx_permit_status_snapshots_last_seen 
    ON permit_status_snapshots(last_seen);

-- Enable RLS
ALTER TABLE permit_status_snapshots ENABLE ROW LEVEL SECURITY;

-- Service role can manage snapshots (ETL operations)
CREATE POLICY "Service role can manage permit_status_snapshots"
    ON permit_status_snapshots
    FOR ALL
    USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_permit_status_snapshots_updated_at
    BEFORE UPDATE ON permit_status_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: update_permit_status_snapshots
-- ============================================================================
-- Updates the status snapshot table with current permit states.
-- Should be called after ETL upserts permit rows.
-- Uses UPSERT to handle both new and existing permits.
-- ============================================================================
CREATE OR REPLACE FUNCTION update_permit_status_snapshots()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO permit_status_snapshots (permit_api_number, well_status, last_seen)
    SELECT permit_number, well_status, NOW()
    FROM permits
    WHERE permit_number IS NOT NULL
    ON CONFLICT (permit_api_number) 
    DO UPDATE SET 
        well_status = EXCLUDED.well_status,
        last_seen = NOW(),
        updated_at = NOW();
END;
$$;

-- ============================================================================
-- FUNCTION: evaluate_permit_status_alerts
-- ============================================================================
-- Evaluates permit status change alerts by comparing current permit states
-- against stored snapshots and firing events for matching subscriptions.
-- 
-- Algorithm:
-- 1. Join subscriptions with current permit data (for permit_status_change type)
-- 2. Join with snapshots to get prior state
-- 3. Filter for actual status changes
-- 4. Filter by watched_statuses (empty array matches any change)
-- 5. Insert deduplicated alert events
-- 
-- Performance: Single bulk query + batch insert, no N+1 queries.
-- Idempotency: ON CONFLICT prevents duplicate events for same subscription/permit/status/day.
-- ============================================================================
CREATE OR REPLACE FUNCTION evaluate_permit_status_alerts()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    events_inserted integer;
BEGIN
    -- Insert alert events for detected status changes
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
        snap.well_status AS old_status,
        p.well_status AS new_status,
        NOW() AS detected_at,
        'pending'::text AS notification_status
    FROM permit_alert_subscriptions s
    INNER JOIN permits p ON p.permit_number = s.permit_api_number
    INNER JOIN permit_status_snapshots snap ON snap.permit_api_number = s.permit_api_number
    WHERE 
        s.is_active = true
        AND s.trigger_type = 'permit_status_change'
        AND snap.well_status IS DISTINCT FROM p.well_status
        AND (
            -- Empty watched_statuses matches any change
            array_length(s.watched_statuses, 1) IS NULL
            OR s.watched_statuses = '{}'
            -- Match if new status is in watched_statuses
            OR p.well_status = ANY(s.watched_statuses)
        )
    ON CONFLICT 
        -- Prevent duplicate events: same subscription, permit, statuses, and day
        ON CONSTRAINT permit_alert_events_dedup_key
        DO NOTHING;
    
    GET DIAGNOSTICS events_inserted = ROW_COUNT;
    
    RETURN events_inserted;
END;
$$;

-- Add unique constraint for deduplication
-- Note: This constraint allows only one event per subscription+permit+statuses+day
CREATE UNIQUE INDEX IF NOT EXISTS permit_alert_events_dedup_key
    ON permit_alert_events (
        subscription_id, 
        permit_api_number, 
        COALESCE(old_status, ''), 
        COALESCE(new_status, ''), 
        date_trunc('day', detected_at)
    );

-- ============================================================================
-- FUNCTION: evaluate_alerts (main entry point)
-- ============================================================================
-- Main entry point for alert evaluation. Called by ETL post-processing.
-- Coordinates snapshot update and all alert type evaluations.
-- Returns the total number of alert events generated.
-- ============================================================================
CREATE OR REPLACE FUNCTION evaluate_alerts()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    total_events integer := 0;
    status_events integer;
BEGIN
    -- First, update the status snapshots with current permit states
    PERFORM update_permit_status_snapshots();
    
    -- Evaluate permit status change alerts
    SELECT evaluate_permit_status_alerts() INTO status_events;
    total_events := total_events + COALESCE(status_events, 0);
    
    -- Future: Evaluate search_result_change alerts here
    -- SELECT evaluate_search_result_alerts() INTO search_events;
    -- total_events := total_events + COALESCE(search_events, 0);
    
    RETURN total_events;
END;
$$;

-- Grant execute permissions to service role (for ETL)
GRANT EXECUTE ON FUNCTION update_permit_status_snapshots() TO service_role;
GRANT EXECUTE ON FUNCTION evaluate_permit_status_alerts() TO service_role;
GRANT EXECUTE ON FUNCTION evaluate_alerts() TO service_role;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To rollback this migration:
-- DROP FUNCTION IF EXISTS evaluate_alerts();
-- DROP FUNCTION IF EXISTS evaluate_permit_status_alerts();
-- DROP FUNCTION IF EXISTS update_permit_status_snapshots();
-- DROP INDEX IF EXISTS permit_alert_events_dedup_key;
-- DROP TABLE IF EXISTS permit_status_snapshots;
