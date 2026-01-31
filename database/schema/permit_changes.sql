CREATE TABLE IF NOT EXISTS permit_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID NOT NULL REFERENCES permits_clean(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL,
  previous_value JSONB,
  new_value JSONB NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  etl_run_id UUID,
  processed_for_alerts BOOLEAN DEFAULT false,
  alert_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permit_changes_permit ON permit_changes(permit_id);
CREATE INDEX IF NOT EXISTS idx_permit_changes_type ON permit_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_permit_changes_detected_at ON permit_changes(detected_at);
CREATE INDEX IF NOT EXISTS idx_permit_changes_etl_run ON permit_changes(etl_run_id);

CREATE INDEX IF NOT EXISTS idx_permit_changes_unprocessed 
  ON permit_changes(detected_at) 
  WHERE processed_for_alerts = false;

CREATE INDEX IF NOT EXISTS idx_permit_changes_type_detected 
  ON permit_changes(change_type, detected_at DESC);

ALTER TABLE permit_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY permit_changes_read_access ON permit_changes
  FOR SELECT
  USING (true);

COMMENT ON TABLE permit_changes IS 'Tracks changes to permits detected during ETL runs';
