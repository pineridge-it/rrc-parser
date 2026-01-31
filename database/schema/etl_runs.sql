-- ============================================================================
-- ETL RUNS TABLE
-- ============================================================================
-- Tracks ETL pipeline execution for monitoring, debugging, and data freshness

CREATE TABLE IF NOT EXISTS etl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Run identification
  run_type VARCHAR(50) NOT NULL DEFAULT 'incremental',
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Processing metrics
  permits_processed INTEGER DEFAULT 0,
  permits_new INTEGER DEFAULT 0,
  permits_updated INTEGER DEFAULT 0,
  permits_failed INTEGER DEFAULT 0,
  
  -- Source information
  source_files TEXT[],
  
  -- Error tracking
  error_message TEXT,
  error_stack TEXT,
  
  -- Performance metrics
  duration_ms INTEGER,
  
  -- System timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- For freshness queries (most recent successful run)
CREATE INDEX IF NOT EXISTS idx_etl_runs_status_completed 
  ON etl_runs(status, completed_at DESC) 
  WHERE status = 'success';

-- For run history queries
CREATE INDEX IF NOT EXISTS idx_etl_runs_started_at 
  ON etl_runs(started_at DESC);

-- For monitoring active runs
CREATE INDEX IF NOT EXISTS idx_etl_runs_status_running 
  ON etl_runs(status, started_at DESC) 
  WHERE status = 'running';

-- ============================================================================
-- VIEW: Latest Data Update
-- ============================================================================
-- Provides easy access to the last successful ETL run timestamp

CREATE OR REPLACE VIEW latest_data_update AS
SELECT 
  completed_at as last_updated,
  permits_new,
  permits_updated,
  permits_processed,
  EXTRACT(EPOCH FROM (NOW() - completed_at)) / 3600 as hours_ago
FROM etl_runs
WHERE status = 'success'
ORDER BY completed_at DESC
LIMIT 1;

-- ============================================================================
-- VIEW: Data Freshness Status
-- ============================================================================
-- Provides freshness status with warning levels

CREATE OR REPLACE VIEW data_freshness_status AS
SELECT 
  completed_at as last_updated,
  permits_new,
  permits_updated,
  permits_processed,
  EXTRACT(EPOCH FROM (NOW() - completed_at)) / 3600 as hours_ago,
  CASE 
    WHEN completed_at > NOW() - INTERVAL '4 hours' THEN 'fresh'
    WHEN completed_at > NOW() - INTERVAL '24 hours' THEN 'stale'
    ELSE 'critical'
  END as freshness_status
FROM etl_runs
WHERE status = 'success'
ORDER BY completed_at DESC
LIMIT 1;

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_etl_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_etl_runs_updated_at ON etl_runs;
CREATE TRIGGER trigger_etl_runs_updated_at
  BEFORE UPDATE ON etl_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_etl_runs_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE etl_runs IS 'Tracks ETL pipeline execution for monitoring and data freshness indicators';
COMMENT ON COLUMN etl_runs.status IS 'Current status: running, success, failed, cancelled';
COMMENT ON COLUMN etl_runs.run_type IS 'Type of run: incremental, full, backfill';
COMMENT ON COLUMN etl_runs.permits_processed IS 'Total permits processed in this run';
COMMENT ON COLUMN etl_runs.permits_new IS 'New permits added';
COMMENT ON COLUMN etl_runs.permits_updated IS 'Existing permits updated';
COMMENT ON COLUMN etl_runs.permits_failed IS 'Permits that failed processing';
