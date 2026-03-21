-- ============================================================================
-- OPERATOR STATS MATERIALIZED VIEWS
-- ============================================================================
-- Pre-aggregated operator statistics for dashboard performance
-- Created as part of ubuntu-5o79.3.1: Operator Intelligence Dashboard

-- ============================================================================
-- 1. OPERATOR STATS SUMMARY
-- ============================================================================
-- Aggregated permit statistics per operator for quick dashboard loads

CREATE MATERIALIZED VIEW IF NOT EXISTS operator_stats_summary AS
SELECT
  o.name AS operator_name,
  COUNT(pc.id) AS total_permits,
  COUNT(*) FILTER (WHERE pc.filed_date >= CURRENT_DATE - INTERVAL '30 days') AS permits_last_30d,
  COUNT(*) FILTER (WHERE pc.filed_date >= CURRENT_DATE - INTERVAL '90 days') AS permits_last_90d,
  COUNT(*) FILTER (WHERE pc.filed_date >= CURRENT_DATE - INTERVAL '365 days') AS permits_last_365d,
  COUNT(*) FILTER (WHERE LOWER(pc.status) = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE LOWER(pc.status) = 'denied') AS denied_count,
  COUNT(*) FILTER (WHERE LOWER(pc.status) = 'pending' OR LOWER(pc.status) LIKE '%pending%') AS pending_count,
  CASE
    WHEN COUNT(*) FILTER (WHERE LOWER(pc.status) IN ('approved', 'denied')) > 0
    THEN ROUND(
      (COUNT(*) FILTER (WHERE LOWER(pc.status) = 'approved')::numeric /
       NULLIF(COUNT(*) FILTER (WHERE LOWER(pc.status) IN ('approved', 'denied')), 0)) * 100,
      2
    )
    ELSE NULL
  END AS approval_rate_pct,
  (
    SELECT ARRAY_AGG(county ORDER BY cnt DESC)
    FROM (
      SELECT pc2.county, COUNT(*) AS cnt
      FROM permits_clean pc2
      WHERE pc2.operator_id = o.id
        AND pc2.county IS NOT NULL
      GROUP BY pc2.county
      ORDER BY cnt DESC
      LIMIT 5
    ) top_counties
  ) AS top_counties,
  (
    SELECT ARRAY_AGG(lease_name ORDER BY cnt DESC)
    FROM (
      SELECT pc3.lease_name, COUNT(*) AS cnt
      FROM permits_clean pc3
      WHERE pc3.operator_id = o.id
        AND pc3.lease_name IS NOT NULL
      GROUP BY pc3.lease_name
      ORDER BY cnt DESC
      LIMIT 5
    ) top_leases
  ) AS top_formations,
  MIN(pc.filed_date) AS active_since,
  MAX(pc.filed_date) AS last_filing_date
FROM operators o
LEFT JOIN permits_clean pc ON pc.operator_id = o.id
GROUP BY o.id, o.name;

-- Unique index for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_operator_stats_summary_operator_name
  ON operator_stats_summary(operator_name);

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_operator_stats_summary_total_permits
  ON operator_stats_summary(total_permits DESC);
CREATE INDEX IF NOT EXISTS idx_operator_stats_summary_last_filing
  ON operator_stats_summary(last_filing_date DESC);

COMMENT ON MATERIALIZED VIEW operator_stats_summary IS
  'Pre-aggregated permit statistics per operator for dashboard performance';

-- ============================================================================
-- 2. OPERATOR PERMITS BY MONTH
-- ============================================================================
-- Monthly permit counts per operator for trend analysis

CREATE MATERIALIZED VIEW IF NOT EXISTS operator_permits_by_month AS
SELECT
  o.name AS operator_name,
  DATE_TRUNC('month', pc.filed_date)::date AS month,
  COUNT(*) AS permit_count,
  COUNT(*) FILTER (WHERE LOWER(pc.status) = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE LOWER(pc.status) = 'denied') AS denied_count
FROM operators o
JOIN permits_clean pc ON pc.operator_id = o.id
WHERE pc.filed_date IS NOT NULL
GROUP BY o.id, o.name, DATE_TRUNC('month', pc.filed_date);

-- Unique index for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_operator_permits_by_month_unique
  ON operator_permits_by_month(operator_name, month);

-- Index for time-range queries
CREATE INDEX IF NOT EXISTS idx_operator_permits_by_month_month
  ON operator_permits_by_month(month DESC);

COMMENT ON MATERIALIZED VIEW operator_permits_by_month IS
  'Monthly permit counts per operator for trend analysis';

-- ============================================================================
-- 3. OPERATOR COUNTY HEATMAP
-- ============================================================================
-- Geographic distribution of permits by operator and county

CREATE MATERIALIZED VIEW IF NOT EXISTS operator_county_heatmap AS
SELECT
  o.name AS operator_name,
  pc.county,
  COUNT(*) AS permit_count,
  AVG(pc.surface_lat) AS lat,
  AVG(pc.surface_lon) AS lng
FROM operators o
JOIN permits_clean pc ON pc.operator_id = o.id
WHERE pc.county IS NOT NULL
GROUP BY o.id, o.name, pc.county;

-- Unique index for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_operator_county_heatmap_unique
  ON operator_county_heatmap(operator_name, county);

-- Index for operator lookups
CREATE INDEX IF NOT EXISTS idx_operator_county_heatmap_operator
  ON operator_county_heatmap(operator_name);

COMMENT ON MATERIALIZED VIEW operator_county_heatmap IS
  'Geographic distribution of permits by operator and county for map visualization';

-- ============================================================================
-- CONVENIENCE FUNCTIONS
-- ============================================================================

-- Function to refresh all operator stats views
CREATE OR REPLACE FUNCTION refresh_operator_stats_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY operator_stats_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY operator_permits_by_month;
  REFRESH MATERIALIZED VIEW CONCURRENTLY operator_county_heatmap;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_operator_stats_views() IS
  'Refresh all operator statistics materialized views';

-- ============================================================================
-- OPERATOR SEARCH FUNCTION
-- ============================================================================
-- Autocomplete search for operator names

CREATE OR REPLACE FUNCTION search_operators(search_term TEXT, result_limit INT DEFAULT 20)
RETURNS TABLE (
  operator_name TEXT,
  total_permits BIGINT,
  active_since DATE,
  last_filing_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oss.operator_name::TEXT,
    oss.total_permits,
    oss.active_since,
    oss.last_filing_date
  FROM operator_stats_summary oss
  WHERE oss.operator_name ILIKE '%' || search_term || '%'
  ORDER BY oss.total_permits DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_operators(TEXT, INT) IS
  'Search operators by name for autocomplete, returns top matches by permit count';
