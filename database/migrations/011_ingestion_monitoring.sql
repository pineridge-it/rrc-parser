-- ============================================================================
-- INGESTION MONITORING AND ALERTING SYSTEM
-- ============================================================================
-- Tracks ETL pipeline metrics, freshness, and triggers alerts for SLO compliance

-- ============================================================================
-- ETL RUNS TABLE
-- ============================================================================
-- Tracks each ETL pipeline execution

CREATE TABLE IF NOT EXISTS etl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Run identification
  run_type VARCHAR(50) NOT NULL DEFAULT 'incremental', -- 'incremental', 'backfill', 'manual'
  status VARCHAR(50) NOT NULL DEFAULT 'running',       -- 'running', 'completed', 'failed', 'cancelled'
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,                                 -- Calculated on completion
  
  -- Source information
  source_type VARCHAR(50) DEFAULT 'rrc_ftp',
  source_date DATE,                                    -- Date of data being processed
  
  -- Record counts
  raw_records_fetched INTEGER DEFAULT 0,
  raw_records_inserted INTEGER DEFAULT 0,
  raw_records_deduplicated INTEGER DEFAULT 0,
  clean_records_created INTEGER DEFAULT 0,
  clean_records_updated INTEGER DEFAULT 0,
  clean_records_failed INTEGER DEFAULT 0,
  
  -- Error tracking
  error_count INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Metadata
  triggered_by VARCHAR(100) DEFAULT 'scheduler',       -- 'scheduler', 'manual', 'api'
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ETL runs
CREATE INDEX IF NOT EXISTS idx_etl_runs_status ON etl_runs(status);
CREATE INDEX IF NOT EXISTS idx_etl_runs_started_at ON etl_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_etl_runs_source_date ON etl_runs(source_date DESC);
CREATE INDEX IF NOT EXISTS idx_etl_runs_type_status ON etl_runs(run_type, status);

-- ============================================================================
-- INGESTION METRICS TABLE
-- ============================================================================
-- Time-series metrics for dashboard and alerting

CREATE TABLE IF NOT EXISTS ingestion_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric identification
  metric_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- 'counter', 'gauge', 'histogram'
  
  -- Metric value
  metric_value DECIMAL(18, 6) NOT NULL,
  
  -- Dimensions for filtering
  source_type VARCHAR(50) DEFAULT 'rrc_ftp',
  status VARCHAR(50),                -- For success/failure rates
  
  -- Timestamp for time-series
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Additional dimensions as JSONB
  dimensions JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for metrics
CREATE INDEX IF NOT EXISTS idx_ingestion_metrics_name ON ingestion_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_ingestion_metrics_recorded ON ingestion_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_metrics_name_time ON ingestion_metrics(metric_name, recorded_at DESC);

-- ============================================================================
-- ALERTS TABLE
-- ============================================================================
-- Stores triggered alerts for tracking and notification

CREATE TABLE IF NOT EXISTS ingestion_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alert identification
  alert_type VARCHAR(100) NOT NULL,  -- 'freshness', 'error_rate', 'volume', 'duration'
  severity VARCHAR(20) NOT NULL,     -- 'critical', 'warning', 'info'
  
  -- Alert status
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'suppressed'
  
  -- Alert content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Metric context
  metric_name VARCHAR(100),
  metric_value DECIMAL(18, 6),
  threshold_value DECIMAL(18, 6),
  
  -- Related ETL run
  etl_run_id UUID REFERENCES etl_runs(id) ON DELETE SET NULL,
  
  -- Timing
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by VARCHAR(100),
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(100),
  
  -- Resolution notes
  resolution_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_ingestion_alerts_status ON ingestion_alerts(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_alerts_severity ON ingestion_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_ingestion_alerts_triggered ON ingestion_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_alerts_type_status ON ingestion_alerts(alert_type, status);
CREATE INDEX IF NOT EXISTS idx_ingestion_alerts_etl_run ON ingestion_alerts(etl_run_id) WHERE etl_run_id IS NOT NULL;

-- ============================================================================
-- ALERT RULES TABLE
-- ============================================================================
-- Configurable alert thresholds

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rule identification
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Rule configuration
  alert_type VARCHAR(100) NOT NULL,  -- 'freshness', 'error_rate', 'volume', 'duration'
  severity VARCHAR(20) NOT NULL,     -- 'critical', 'warning', 'info'
  
  -- Threshold configuration
  metric_name VARCHAR(100) NOT NULL,
  operator VARCHAR(10) NOT NULL,     -- '>', '<', '>=', '<=', '==', '!='
  threshold_value DECIMAL(18, 6) NOT NULL,
  
  -- Evaluation window (for time-based metrics)
  evaluation_window_minutes INTEGER DEFAULT 5,
  
  -- Cooldown to prevent alert spam
  cooldown_minutes INTEGER DEFAULT 60,
  
  -- Rule status
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Last triggered (for cooldown)
  last_triggered_at TIMESTAMPTZ,
  
  -- Notification channels
  notify_slack BOOLEAN DEFAULT false,
  notify_email BOOLEAN DEFAULT false,
  notify_pagerduty BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for alert rules
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON alert_rules(alert_type);

-- ============================================================================
-- DEFAULT ALERT RULES
-- ============================================================================

-- Critical: No ingestion for >2 hours
INSERT INTO alert_rules (name, description, alert_type, severity, metric_name, operator, threshold_value, evaluation_window_minutes, cooldown_minutes, notify_slack, notify_email)
VALUES (
  'freshness_critical',
  'No successful ingestion for more than 2 hours',
  'freshness',
  'critical',
  'minutes_since_last_ingestion',
  '>',
  120,
  5,
  30,
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Warning: Ingestion lag >1 hour
INSERT INTO alert_rules (name, description, alert_type, severity, metric_name, operator, threshold_value, evaluation_window_minutes, cooldown_minutes, notify_slack)
VALUES (
  'freshness_warning',
  'Ingestion lag greater than 1 hour',
  'freshness',
  'warning',
  'minutes_since_last_ingestion',
  '>',
  60,
  5,
  60,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Critical: Error rate >10%
INSERT INTO alert_rules (name, description, alert_type, severity, metric_name, operator, threshold_value, evaluation_window_minutes, cooldown_minutes, notify_slack, notify_email)
VALUES (
  'error_rate_critical',
  'Error rate exceeds 10%',
  'error_rate',
  'critical',
  'error_rate_percent',
  '>',
  10,
  5,
  15,
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Warning: Error rate >5%
INSERT INTO alert_rules (name, description, alert_type, severity, metric_name, operator, threshold_value, evaluation_window_minutes, cooldown_minutes, notify_slack)
VALUES (
  'error_rate_warning',
  'Error rate exceeds 5%',
  'error_rate',
  'warning',
  'error_rate_percent',
  '>',
  5,
  5,
  30,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Warning: Volume anomaly (>30% deviation)
INSERT INTO alert_rules (name, description, alert_type, severity, metric_name, operator, threshold_value, evaluation_window_minutes, cooldown_minutes, notify_slack)
VALUES (
  'volume_anomaly_high',
  'Permit volume 30% higher than average',
  'volume',
  'warning',
  'volume_deviation_percent',
  '>',
  30,
  15,
  120,
  true
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO alert_rules (name, description, alert_type, severity, metric_name, operator, threshold_value, evaluation_window_minutes, cooldown_minutes, notify_slack)
VALUES (
  'volume_anomaly_low',
  'Permit volume 30% lower than average',
  'volume',
  'warning',
  'volume_deviation_percent',
  '<',
  -30,
  15,
  120,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Warning: Pipeline duration >30 minutes
INSERT INTO alert_rules (name, description, alert_type, severity, metric_name, operator, threshold_value, evaluation_window_minutes, cooldown_minutes, notify_slack)
VALUES (
  'duration_warning',
  'Pipeline run duration exceeds 30 minutes',
  'duration',
  'warning',
  'pipeline_duration_minutes',
  '>',
  30,
  5,
  60,
  true
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE etl_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY etl_runs_read_access ON etl_runs FOR SELECT USING (true);
CREATE POLICY ingestion_metrics_read_access ON ingestion_metrics FOR SELECT USING (true);
CREATE POLICY ingestion_alerts_read_access ON ingestion_alerts FOR SELECT USING (true);
CREATE POLICY alert_rules_read_access ON alert_rules FOR SELECT USING (true);

-- Write access (service role only)
CREATE POLICY etl_runs_write_access ON etl_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY ingestion_metrics_write_access ON ingestion_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY ingestion_alerts_write_access ON ingestion_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY alert_rules_write_access ON alert_rules FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_etl_runs_updated_at ON etl_runs;
CREATE TRIGGER update_etl_runs_updated_at
  BEFORE UPDATE ON etl_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ingestion_alerts_updated_at ON ingestion_alerts;
CREATE TRIGGER update_ingestion_alerts_updated_at
  BEFORE UPDATE ON ingestion_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alert_rules_updated_at ON alert_rules;
CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE etl_runs IS 'Tracks each ETL pipeline execution with timing and record counts';
COMMENT ON TABLE ingestion_metrics IS 'Time-series metrics for dashboard and alerting';
COMMENT ON TABLE ingestion_alerts IS 'Triggered alerts for SLO violations and anomalies';
COMMENT ON TABLE alert_rules IS 'Configurable alert thresholds and notification settings';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  rule_count INTEGER;
BEGIN
  -- Check tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('etl_runs', 'ingestion_metrics', 'ingestion_alerts', 'alert_rules');
  
  IF table_count < 4 THEN
    RAISE EXCEPTION 'Expected 4 monitoring tables, found %', table_count;
  END IF;
  
  -- Check default rules created
  SELECT COUNT(*) INTO rule_count FROM alert_rules;
  
  IF rule_count < 6 THEN
    RAISE WARNING 'Expected at least 6 default alert rules, found %', rule_count;
  END IF;
  
  RAISE NOTICE 'Ingestion monitoring schema created successfully. Tables: %, Rules: %', table_count, rule_count;
END $$;
