-- ============================================================================
-- OPERATORS AND OPERATOR ALIASES TABLES
-- ============================================================================
-- Migration: Creates normalized operator entities and name variant mappings

-- ============================================================================
-- 1. OPERATORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Canonical operator information
  name VARCHAR(255) NOT NULL,
  operator_number VARCHAR(50),
  
  -- Additional metadata
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  phone VARCHAR(50),
  
  -- RRC-specific
  rrc_operator_number VARCHAR(50),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- System timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_operators_name ON operators(name);
CREATE INDEX IF NOT EXISTS idx_operators_operator_number ON operators(operator_number);
CREATE INDEX IF NOT EXISTS idx_operators_rrc_number ON operators(rrc_operator_number);
CREATE INDEX IF NOT EXISTS idx_operators_active ON operators(is_active) WHERE is_active = true;

-- RLS - Operators are readable by all, writable by system only
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY operators_read_access ON operators
  FOR SELECT
  USING (true);

-- ============================================================================
-- 2. OPERATOR ALIASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS operator_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to canonical operator
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  
  -- Variant name as it appears in source data
  alias VARCHAR(255) NOT NULL,
  
  -- Source tracking
  source_type VARCHAR(50) NOT NULL DEFAULT 'rrc',
  source_count INTEGER NOT NULL DEFAULT 1,
  
  -- Confidence score for auto-matching (0-1)
  confidence DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  
  -- Whether this alias was manually verified
  is_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- System timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint on alias - each variant maps to exactly one operator
  UNIQUE(alias)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_operator_aliases_operator ON operator_aliases(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_aliases_alias ON operator_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_operator_aliases_confidence ON operator_aliases(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_operator_aliases_verified ON operator_aliases(is_verified) WHERE is_verified = true;

-- RLS
ALTER TABLE operator_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY operator_aliases_read_access ON operator_aliases
  FOR SELECT
  USING (true);

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Update timestamp for operators
DROP TRIGGER IF EXISTS update_operators_updated_at ON operators;
CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp for operator_aliases
DROP TRIGGER IF EXISTS update_operator_aliases_updated_at ON operator_aliases;
CREATE TRIGGER update_operator_aliases_updated_at
  BEFORE UPDATE ON operator_aliases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('operators', 'operator_aliases');
  
  IF table_count < 2 THEN
    RAISE EXCEPTION 'Expected 2 tables, found %', table_count;
  END IF;
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename IN ('operators', 'operator_aliases');
  
  IF index_count < 6 THEN
    RAISE EXCEPTION 'Expected at least 6 indexes, found %', index_count;
  END IF;
  
  RAISE NOTICE 'Migration verification passed: % tables, % indexes', table_count, index_count;
END;
$$;

\echo 'Operators and Operator Aliases tables created successfully!'
