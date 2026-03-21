-- ============================================================================
-- DIGEST DATA CACHE TABLE
-- ============================================================================
-- Stores cached digest data to avoid re-querying during email rendering

CREATE TABLE IF NOT EXISTS digest_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  digest_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_digest_data_cache_user 
  ON digest_data_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_digest_data_cache_period 
  ON digest_data_cache(period_start, period_end);

-- ============================================================================
-- FUNCTION: aggregate_digest_data
-- ============================================================================
-- Collects all data needed for a single user's digest in one efficient pass

CREATE OR REPLACE FUNCTION aggregate_digest_data(
  p_user_id UUID,
  p_workspace_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_saved_searches JSONB;
  v_status_changes JSONB;
  v_top_movers JSONB;
  v_new_operators JSONB;
  v_summary_stats JSONB;
  v_preferences RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences
  FROM user_digest_preferences
  WHERE user_id = p_user_id AND workspace_id = p_workspace_id;
  
  IF NOT FOUND THEN
    RETURN '{"error": "No preferences found"}'::JSONB;
  END IF;

  -- 1. Saved Search Activity
  IF v_preferences.include_saved_searches THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'search_name', ss.name,
        'search_id', ss.id,
        'new_count', COALESCE(new_permits.count, 0),
        'sample_permits', COALESCE(new_permits.sample, '[]'::JSONB)
      )
    ) INTO v_saved_searches
    FROM saved_searches ss
    LEFT JOIN LATERAL (
      SELECT 
        COUNT(*) as count,
        jsonb_agg(
          jsonb_build_object(
            'permit_api_number', p.api_number,
            'operator_name', p.operator_name,
            'filed_date', p.received_date,
            'county', p.county_code
          )
          ORDER BY p.received_date DESC
          LIMIT 3
        ) as sample
      FROM permits p
      WHERE p.received_date >= p_period_start
        AND p.received_date < p_period_end
        -- Apply search criteria from ss.search_criteria JSONB
        AND (
          (ss.search_criteria->>'county' IS NULL OR p.county_code = (ss.search_criteria->>'county'))
          AND (ss.search_criteria->>'operator' IS NULL OR p.operator_name ILIKE '%' || (ss.search_criteria->>'operator') || '%')
        )
    ) new_permits ON true
    WHERE ss.user_id = p_user_id
      AND ss.workspace_id = p_workspace_id;
  ELSE
    v_saved_searches := '[]'::JSONB;
  END IF;

  -- 2. Status Changes from Watched Permits
  IF v_preferences.include_status_changes THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'permit_api_number', e.permit_api_number,
        'old_status', e.old_status,
        'new_status', e.new_status,
        'detected_at', e.detected_at,
        'subscription_name', s.name
      )
      ORDER BY e.detected_at DESC
    ) INTO v_status_changes
    FROM permit_alert_events e
    JOIN permit_alert_subscriptions s ON s.id = e.subscription_id
    WHERE s.user_id = p_user_id
      AND s.workspace_id = p_workspace_id
      AND e.detected_at >= p_period_start
      AND e.detected_at < p_period_end
      AND s.trigger_type = 'permit_status_change'
    LIMIT 20;
  ELSE
    v_status_changes := '[]'::JSONB;
  END IF;

  -- 3. Top Movers in User's Monitored Areas
  -- Permits that changed to Approved or Denied in counties user monitors
  SELECT jsonb_agg(
    jsonb_build_object(
      'permit_api_number', pm.api_number,
      'operator_name', pm.operator_name,
      'county', pm.county_code,
      'status', pm.well_status,
      'filed_date', pm.received_date
    )
    ORDER BY pm.received_date DESC
    LIMIT 5
  ) INTO v_top_movers
  FROM (
    SELECT DISTINCT ON (p.api_number)
      p.api_number,
      p.operator_name,
      p.county_code,
      p.well_status,
      p.received_date
    FROM permits p
    WHERE p.well_status IN ('APPROVED', 'DENIED')
      AND p.received_date >= p_period_start
      AND p.received_date < p_period_end
      AND p.county_code IN (
        -- Get counties from user's saved searches
        SELECT DISTINCT ss.search_criteria->>'county'
        FROM saved_searches ss
        WHERE ss.user_id = p_user_id
          AND ss.workspace_id = p_workspace_id
          AND ss.search_criteria->>'county' IS NOT NULL
      )
  ) pm;

  -- 4. New Operator Entrants
  IF v_preferences.include_new_operators THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'operator_name', new_ops.operator_name,
        'county', new_ops.county_code,
        'permit_count', new_ops.permit_count
      )
      ORDER BY new_ops.permit_count DESC
      LIMIT 10
    ) INTO v_new_operators
    FROM (
      SELECT 
        p.operator_name,
        p.county_code,
        COUNT(*) as permit_count
      FROM permits p
      WHERE p.received_date >= p_period_start
        AND p.received_date < p_period_end
        AND p.county_code IN (
          SELECT DISTINCT ss.search_criteria->>'county'
          FROM saved_searches ss
          WHERE ss.user_id = p_user_id
            AND ss.workspace_id = p_workspace_id
            AND ss.search_criteria->>'county' IS NOT NULL
        )
        AND p.operator_name NOT IN (
          -- Operators who had permits before this period
          SELECT DISTINCT p2.operator_name
          FROM permits p2
          WHERE p2.received_date < p_period_start
            AND p2.county_code = p.county_code
        )
      GROUP BY p.operator_name, p.county_code
    ) new_ops;
  ELSE
    v_new_operators := '[]'::JSONB;
  END IF;

  -- 5. Summary Stats
  SELECT jsonb_build_object(
    'total_new_permits', COALESCE(SUM((elem->>'new_count')::INT), 0),
    'total_status_changes', jsonb_array_length(v_status_changes),
    'total_saved_searches', jsonb_array_length(v_saved_searches),
    'period_start', p_period_start,
    'period_end', p_period_end
  ) INTO v_summary_stats
  FROM jsonb_array_elements(v_saved_searches) elem;

  -- Combine all results
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'workspace_id', p_workspace_id,
    'generated_at', NOW(),
    'period_start', p_period_start,
    'period_end', p_period_end,
    'saved_searches', COALESCE(v_saved_searches, '[]'::JSONB),
    'status_changes', COALESCE(v_status_changes, '[]'::JSONB),
    'top_movers', COALESCE(v_top_movers, '[]'::JSONB),
    'new_operators', COALESCE(v_new_operators, '[]'::JSONB),
    'summary', v_summary_stats
  );

  -- Cache the result
  INSERT INTO digest_data_cache (user_id, workspace_id, period_start, period_end, digest_data)
  VALUES (p_user_id, p_workspace_id, p_period_start, p_period_end, v_result)
  ON CONFLICT (user_id, period_start) 
  DO UPDATE SET digest_data = EXCLUDED.digest_data, created_at = NOW();

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Set statement timeout for the function
COMMENT ON FUNCTION aggregate_digest_data(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Aggregates digest data for a user - saved searches, status changes, top movers, new operators';

-- ============================================================================
-- FUNCTION: get_cached_digest_data
-- ============================================================================
-- Retrieves cached digest data if available

CREATE OR REPLACE FUNCTION get_cached_digest_data(
  p_user_id UUID,
  p_period_start TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT digest_data INTO v_result
  FROM digest_data_cache
  WHERE user_id = p_user_id
    AND period_start = p_period_start;
  
  RETURN COALESCE(v_result, '{"cached": false}'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE;
