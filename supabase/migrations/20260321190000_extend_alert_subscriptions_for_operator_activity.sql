-- ============================================================================
-- EXTEND ALERT SUBSCRIPTIONS FOR OPERATOR ACTIVITY TRIGGERS
-- ============================================================================

-- This migration extends the permit_alert_subscriptions table to support 
-- operator-level alert triggers, allowing users to watch specific operators
-- for new permit filings.

-- Add new trigger type to the CHECK constraint
ALTER TABLE permit_alert_subscriptions 
DROP CONSTRAINT IF EXISTS permit_alert_subscriptions_trigger_type_check;

ALTER TABLE permit_alert_subscriptions 
ADD CONSTRAINT permit_alert_subscriptions_trigger_type_check 
CHECK (trigger_type IN ('permit_status_change', 'search_result_change', 'operator_activity'));

-- Add new columns for operator activity filtering (used only when trigger_type=operator_activity)
ALTER TABLE permit_alert_subscriptions 
ADD COLUMN IF NOT EXISTS operator_name TEXT;

ALTER TABLE permit_alert_subscriptions 
ADD COLUMN IF NOT EXISTS county_filter TEXT;

ALTER TABLE permit_alert_subscriptions 
ADD COLUMN IF NOT EXISTS formation_filter TEXT;

ALTER TABLE permit_alert_subscriptions 
ADD COLUMN IF NOT EXISTS min_depth_filter INTEGER;

-- Add indexes for efficient querying of operator activity subscriptions
CREATE INDEX IF NOT EXISTS idx_permit_alert_subscriptions_operator_name 
ON permit_alert_subscriptions(operator_name) 
WHERE trigger_type = 'operator_activity';

CREATE INDEX IF NOT EXISTS idx_permit_alert_subscriptions_operator_filters 
ON permit_alert_subscriptions(operator_name, county_filter, formation_filter) 
WHERE trigger_type = 'operator_activity';

-- Add comments for documentation
COMMENT ON COLUMN permit_alert_subscriptions.operator_name IS 
'Operator to watch for new permit filings (used only when trigger_type=operator_activity)';

COMMENT ON COLUMN permit_alert_subscriptions.county_filter IS 
'Optional county filter for operator activity alerts';

COMMENT ON COLUMN permit_alert_subscriptions.formation_filter IS 
'Optional formation filter for operator activity alerts';

COMMENT ON COLUMN permit_alert_subscriptions.min_depth_filter IS 
'Optional minimum depth filter for operator activity alerts';