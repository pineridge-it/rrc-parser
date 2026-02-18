-- Migration: Create notification_preferences table
-- Created: 2026-02-18
-- Purpose: Store user notification preferences including quiet hours and digest settings

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL,
    
    -- Quiet Hours Settings
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start_time TIME NOT NULL DEFAULT '22:00',
    quiet_hours_end_time TIME NOT NULL DEFAULT '08:00',
    quiet_hours_timezone TEXT NOT NULL DEFAULT 'America/New_York',
    
    -- Digest Settings
    digest_frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (digest_frequency IN ('immediate', 'daily', 'weekly')),
    digest_daily_time TIME DEFAULT '09:00',
    digest_weekly_day INTEGER DEFAULT 1 CHECK (digest_weekly_day BETWEEN 0 AND 6), -- 0 = Sunday
    digest_weekly_time TIME DEFAULT '09:00',
    digest_timezone TEXT NOT NULL DEFAULT 'America/New_York',
    
    -- Channel Settings
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one preference record per user per workspace
    UNIQUE(user_id, workspace_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_workspace_id ON notification_preferences(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_workspace ON notification_preferences(user_id, workspace_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own preferences
CREATE POLICY "Users can read own notification preferences"
    ON notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
    ON notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own preferences
CREATE POLICY "Users can update own notification preferences"
    ON notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own preferences
CREATE POLICY "Users can delete own notification preferences"
    ON notification_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can read all (for notification workers)
CREATE POLICY "Service role can read all notification preferences"
    ON notification_preferences
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences including quiet hours, digest settings, and channel preferences per workspace';
