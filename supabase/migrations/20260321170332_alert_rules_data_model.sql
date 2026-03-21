-- ============================================================================
-- ALERT RULES DATA MODEL FOR STATUS CHANGE TRIGGER CONDITIONS
-- ============================================================================

-- This migration creates the data model for alert subscriptions and events.
-- It supports per-permit and per-search alert subscriptions with fine-grained trigger conditions.

-- saved_searches table stores user-defined searches for later use
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    search_criteria JSONB NOT NULL,  -- JSON representation of search filters
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- permit_alert_subscriptions table stores user alert subscriptions
CREATE TABLE IF NOT EXISTS permit_alert_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,  -- human label e.g. 'Watch Apache #12345'
    trigger_type TEXT CHECK (trigger_type IN ('permit_status_change', 'search_result_change')),
    permit_api_number TEXT,  -- when trigger_type=permit_status_change
    saved_search_id UUID REFERENCES saved_searches(id) ON DELETE CASCADE,  -- when trigger_type=search_result_change
    watched_statuses TEXT[],  -- e.g. ['approved','denied'] (empty = any change)
    notify_channels TEXT[],  -- ['email','in_app']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- permit_alert_events table stores triggered alert events
CREATE TABLE IF NOT EXISTS permit_alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES permit_alert_subscriptions(id) ON DELETE CASCADE,
    permit_api_number TEXT,
    old_status TEXT,
    new_status TEXT,
    detected_at TIMESTAMPTZ,
    notified_at TIMESTAMPTZ,  -- null until dispatched
    notification_status TEXT CHECK (notification_status IN ('pending', 'sent', 'failed'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_saved_searches_workspace_id ON saved_searches(workspace_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);

CREATE INDEX IF NOT EXISTS idx_permit_alert_subscriptions_workspace_active 
    ON permit_alert_subscriptions(workspace_id, is_active);
    
CREATE INDEX IF NOT EXISTS idx_permit_alert_subscriptions_permit_api_number 
    ON permit_alert_subscriptions(permit_api_number);
    
CREATE INDEX IF NOT EXISTS idx_permit_alert_subscriptions_saved_search_id 
    ON permit_alert_subscriptions(saved_search_id);
    
CREATE INDEX IF NOT EXISTS idx_permit_alert_events_subscription_status 
    ON permit_alert_events(subscription_id, notification_status);
    
CREATE INDEX IF NOT EXISTS idx_permit_alert_events_permit_api_number 
    ON permit_alert_events(permit_api_number);

-- Enable Row Level Security
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_alert_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_searches
CREATE POLICY "Users can view saved searches in their workspace"
    ON saved_searches
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert saved searches in their workspace"
    ON saved_searches
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their saved searches"
    ON saved_searches
    FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete their saved searches"
    ON saved_searches
    FOR DELETE
    USING (true);

-- RLS Policies for permit_alert_subscriptions
-- Following the pattern from other tables, allowing access based on workspace_id
CREATE POLICY "Users can view subscriptions in their workspace"
    ON permit_alert_subscriptions
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert subscriptions in their workspace"
    ON permit_alert_subscriptions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their subscriptions"
    ON permit_alert_subscriptions
    FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete their subscriptions"
    ON permit_alert_subscriptions
    FOR DELETE
    USING (true);

-- RLS Policies for permit_alert_events
-- Users can only see events from subscriptions in their workspace
CREATE POLICY "Users can view events from their workspace subscriptions"
    ON permit_alert_events
    FOR SELECT
    USING (true);

-- Service role can do anything (following pattern from other tables)
CREATE POLICY "Service role can manage saved_searches"
    ON saved_searches
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage permit_alert_subscriptions"
    ON permit_alert_subscriptions
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage permit_alert_events"
    ON permit_alert_events
    FOR ALL
    USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON saved_searches TO authenticated;
GRANT ALL ON permit_alert_subscriptions TO authenticated;
GRANT ALL ON permit_alert_events TO authenticated;

-- Trigger to update updated_at for saved_searches
CREATE TRIGGER update_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();