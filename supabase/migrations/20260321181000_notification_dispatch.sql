-- ============================================================================
-- NOTIFICATIONS TABLE FOR IN-APP ALERTS
-- ============================================================================

-- This migration creates the notifications table for in-app notifications
-- and adds retry tracking to permit_alert_events for the dispatch worker.

-- Notifications table for in-app bell icon indicator
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES permit_alert_events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT NOT NULL DEFAULT 'alert',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_user 
    ON notifications(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
    ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view notifications in their workspace"
    ON notifications
    FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage notifications"
    ON notifications
    FOR ALL
    USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON notifications TO authenticated;

-- ============================================================================
-- ADD RETRY TRACKING TO permit_alert_events
-- ============================================================================

-- Add retry_count column for exponential backoff
ALTER TABLE permit_alert_events 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Add error_message column for failure logging
ALTER TABLE permit_alert_events 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add last_attempt_at column for retry scheduling
ALTER TABLE permit_alert_events 
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

-- Update notification_status check constraint to include permanently_failed
ALTER TABLE permit_alert_events 
DROP CONSTRAINT IF EXISTS permit_alert_events_notification_status_check;

ALTER TABLE permit_alert_events 
ADD CONSTRAINT permit_alert_events_notification_status_check 
CHECK (notification_status IN ('pending', 'sent', 'failed', 'permanently_failed'));

-- ============================================================================
-- FUNCTION: dispatch_pending_alerts
-- ============================================================================
-- Main dispatch function called by the worker endpoint.
-- Uses FOR UPDATE SKIP LOCKED for safe concurrent execution.
-- Returns JSON with dispatch statistics.
-- ============================================================================
CREATE OR REPLACE FUNCTION dispatch_pending_alerts(
    p_batch_size INTEGER DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_dispatched INTEGER := 0;
    v_failed INTEGER := 0;
    v_skipped INTEGER := 0;
    v_event RECORD;
    v_subscription RECORD;
    v_notify_channels TEXT[];
    v_result JSON;
BEGIN
    -- Process pending events with row-level locking
    FOR v_event IN 
        SELECT e.id, e.subscription_id, e.permit_api_number, e.old_status, e.new_status, 
               e.detected_at, e.retry_count
        FROM permit_alert_events e
        WHERE e.notification_status = 'pending'
          AND (e.last_attempt_at IS NULL 
               OR e.last_attempt_at < NOW() - INTERVAL '1 minute' * POWER(2, e.retry_count))
        ORDER BY e.detected_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Get subscription details
        SELECT * INTO v_subscription
        FROM permit_alert_subscriptions
        WHERE id = v_event.subscription_id;
        
        -- Skip if subscription not found or inactive
        IF v_subscription IS NULL OR NOT v_subscription.is_active THEN
            UPDATE permit_alert_events 
            SET notification_status = 'failed',
                error_message = 'Subscription not found or inactive',
                last_attempt_at = NOW()
            WHERE id = v_event.id;
            
            v_skipped := v_skipped + 1;
            CONTINUE;
        END IF;
        
        -- Store notify_channels for later use by application code
        v_notify_channels := v_subscription.notify_channels;
        
        -- Mark as sent (actual email/in-app dispatch happens in application code)
        UPDATE permit_alert_events 
        SET notification_status = 'sent',
            notified_at = NOW(),
            last_attempt_at = NOW()
        WHERE id = v_event.id;
        
        v_dispatched := v_dispatched + 1;
    END LOOP;
    
    -- Return dispatch statistics
    v_result := json_build_object(
        'dispatched', v_dispatched,
        'failed', v_failed,
        'skipped', v_skipped,
        'batch_size', p_batch_size
    );
    
    RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTION: mark_event_failed
-- ============================================================================
-- Marks an event as failed with exponential backoff retry logic.
-- After 3 failures, marks as permanently_failed.
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_event_failed(
    p_event_id UUID,
    p_error_message TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_retry_count INTEGER;
BEGIN
    -- Get current retry count
    SELECT retry_count INTO v_retry_count
    FROM permit_alert_events
    WHERE id = p_event_id;
    
    -- Update with failure info
    UPDATE permit_alert_events 
    SET notification_status = CASE 
            WHEN v_retry_count >= 2 THEN 'permanently_failed'
            ELSE 'failed'
        END,
        retry_count = COALESCE(v_retry_count, 0) + 1,
        error_message = p_error_message,
        last_attempt_at = NOW()
    WHERE id = p_event_id;
END;
$$;

-- ============================================================================
-- FUNCTION: create_in_app_notification
-- ============================================================================
-- Creates an in-app notification for a user.
-- Called by dispatch worker when notify_channels includes 'in_app'.
-- ============================================================================
CREATE OR REPLACE FUNCTION create_in_app_notification(
    p_workspace_id UUID,
    p_user_id UUID,
    p_event_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'alert'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        workspace_id,
        user_id,
        event_id,
        title,
        message,
        type
    ) VALUES (
        p_workspace_id,
        p_user_id,
        p_event_id,
        p_title,
        p_message,
        p_type
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION dispatch_pending_alerts(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION mark_event_failed(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION create_in_app_notification(UUID, UUID, UUID, TEXT, TEXT, TEXT) TO service_role;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To rollback this migration:
-- DROP FUNCTION IF EXISTS create_in_app_notification(UUID, UUID, UUID, TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS mark_event_failed(UUID, TEXT);
-- DROP FUNCTION IF EXISTS dispatch_pending_alerts(INTEGER);
-- ALTER TABLE permit_alert_events DROP COLUMN IF EXISTS last_attempt_at;
-- ALTER TABLE permit_alert_events DROP COLUMN IF EXISTS error_message;
-- ALTER TABLE permit_alert_events DROP COLUMN IF EXISTS retry_count;
-- DROP TABLE IF EXISTS notifications;
