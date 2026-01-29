-- ============================================================================
-- INITIAL SCHEMA MIGRATION
-- ============================================================================
-- Creates the foundational database schema with raw/clean separation
-- Apply in order: extensions -> core tables -> indexes -> RLS -> triggers

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
\echo 'Creating extensions...'
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CORE TABLES (in dependency order)
-- ============================================================================
\echo 'Creating core tables...'

-- Users (extends auth.users)
\i ../schema/users.sql

-- Workspaces
\i ../schema/workspaces.sql

-- Operators
\i ../schema/operators.sql

-- Raw permits (no FK dependencies)
\i ../schema/permits_raw.sql

-- Clean permits (depends on permits_raw, operators)
\i ../schema/permits_clean.sql

-- AOIs
\i ../schema/aois.sql

-- Saved searches
\i ../schema/saved_searches.sql

-- Alert rules (existing)
\i ../schema/alert_rules.sql

-- Alert events (existing)
\i ../schema/alert_events.sql

-- Notifications (existing)
\i ../schema/notifications.sql

-- Audit log
\i ../schema/audit_log.sql

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================
\echo 'Verifying schema...'

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'workspaces', 'workspace_members',
    'operators', 'operator_aliases',
    'permits_raw', 'permits_clean',
    'aois', 'saved_searches',
    'alert_rules', 'alert_events', 'notifications',
    'audit_log'
  );
  
  IF table_count < 14 THEN
    RAISE EXCEPTION 'Expected 14 tables, found %', table_count;
  END IF;
  
  RAISE NOTICE 'Schema verification passed: % tables created', table_count;
END;
$$;

\echo 'Migration complete!'
