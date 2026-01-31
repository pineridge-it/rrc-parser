-- ============================================================================
-- PERMIT CHANGES TABLE
-- ============================================================================
-- Tracks changes between ETL runs to power the alerting system
-- This is the bridge between data ingestion and user notifications

\echo 'Creating permit_changes table...'

CREATE TABLE IF NOT EXISTS permit_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID NOT NULL REFERENCES permits_clean(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL,  -- 'new', 'status_change', 'amendment', 'operator_change', 'location_update'
  previous_value JSONB,              -- Previous state (null for 'new')
  new_value JSONB NOT NULL,          -- New state
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  etl_run_id UUID,                   -- Which ETL run detected this change
  processed_for_alerts BOOLEAN DEFAULT false,
  alert_event_id UUID,               -- Link to created alert_event (when processed)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_permit_changes_permit ON permit_changes(permit_id);
CREATE INDEX IF NOT EXISTS idx_permit_changes_type ON permit_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_permit_changes_detected_at ON permit_changes(detected_at);
CREATE INDEX IF NOT EXISTS idx_permit_changes_etl_run ON permit_changes(etl_run_id);

-- Critical index: unprocessed changes for alert system
CREATE INDEX IF NOT EXISTS idx_permit_changes_unprocessed 
  ON permit_changes(detected_at) 
  WHERE processed_for_alerts = false;

-- Index for change type + date queries
CREATE INDEX IF NOT EXISTS idx_permit_changes_type_detected 
  ON permit_changes(change_type, detected_at DESC);

-- Enable RLS
ALTER TABLE permit_changes ENABLE ROW LEVEL SECURITY;

-- Read policy (permit changes are system-level, readable by all authenticated users)
CREATE POLICY permit_changes_read_access ON permit_changes
  FOR SELECT
  USING (true);

-- Comments
COMMENT ON TABLE permit_changes IS 'Tracks changes to permits detected during ETL runs';
COMMENT ON COLUMN permit_changes.change_type IS 'Type of change: new, status_change, amendment, operator_change, location_update';
COMMENT ON COLUMN permit_changes.previous_value IS 'Previous permit state (JSON snapshot)';
COMMENT ON COLUMN permit_changes.new_value IS 'New permit state (JSON snapshot)';
COMMENT ON COLUMN permit_changes.etl_run_id IS 'Reference to the ETL run that detected this change';
COMMENT ON COLUMN permit_changes.processed_for_alerts IS 'Whether this change has been processed for alert generation';
COMMENT ON COLUMN permit_changes.alert_event_id IS 'Link to the generated alert_event (when processed)';

\echo 'permit_changes table created successfully'
