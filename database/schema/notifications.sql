CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_event_id UUID NOT NULL REFERENCES alert_events(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app', 'webhook')),
  recipient VARCHAR(255) NOT NULL,
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  attempts INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  
  subject VARCHAR(255),
  body TEXT NOT NULL,
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications(alert_event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status) WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_retry ON notifications(status, last_attempt_at) WHERE status = 'failed';

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_workspace_isolation ON notifications
  USING (alert_event_id IN (
    SELECT id FROM alert_events WHERE workspace_id = current_setting('app.current_workspace_id', true)::UUID
  ));

COMMENT ON TABLE notifications IS 'Delivery attempts per channel for alert events';
COMMENT ON COLUMN notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN notifications.alert_event_id IS 'Alert event this notification belongs to';
COMMENT ON COLUMN notifications.channel IS 'Delivery channel: email, sms, in_app, webhook';
COMMENT ON COLUMN notifications.recipient IS 'Recipient identifier (email address, phone number, user_id, webhook URL)';
COMMENT ON COLUMN notifications.status IS 'Delivery status: pending, sent, failed, bounced';
COMMENT ON COLUMN notifications.attempts IS 'Number of delivery attempts made';
COMMENT ON COLUMN notifications.last_attempt_at IS 'Timestamp of last delivery attempt';
COMMENT ON COLUMN notifications.delivered_at IS 'When the notification was successfully delivered';
COMMENT ON COLUMN notifications.error_message IS 'Error message from last failed attempt';
COMMENT ON COLUMN notifications.subject IS 'Subject line for email notifications';
COMMENT ON COLUMN notifications.body IS 'Notification body content';
COMMENT ON COLUMN notifications.metadata IS 'Additional channel-specific metadata (e.g., message IDs, tracking info)';
COMMENT ON COLUMN notifications.created_at IS 'When the notification was created';
COMMENT ON COLUMN notifications.updated_at IS 'When the notification was last updated';
