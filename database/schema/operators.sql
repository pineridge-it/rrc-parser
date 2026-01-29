-- ============================================================================
-- OPERATORS TABLE
-- ============================================================================
-- Normalized operator entities with canonical names

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

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_operators_name ON operators(name);
CREATE INDEX IF NOT EXISTS idx_operators_operator_number ON operators(operator_number);
CREATE INDEX IF NOT EXISTS idx_operators_rrc_number ON operators(rrc_operator_number);
CREATE INDEX IF NOT EXISTS idx_operators_active ON operators(is_active) WHERE is_active = true;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY operators_read_access ON operators
  FOR SELECT
  USING (true);

CREATE POLICY operators_write_access ON operators
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_operators_updated_at ON operators;
CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- OPERATOR ALIASES TABLE
-- ============================================================================
-- Maps variant operator names to canonical operators

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
  
  -- Unique constraint on alias
  UNIQUE(alias)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_operator_aliases_operator ON operator_aliases(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_aliases_alias ON operator_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_operator_aliases_confidence ON operator_aliases(confidence);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE operator_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY operator_aliases_read_access ON operator_aliases
  FOR SELECT
  USING (true);

CREATE POLICY operator_aliases_write_access ON operator_aliases
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_operator_aliases_updated_at ON operator_aliases;
CREATE TRIGGER update_operator_aliases_updated_at
  BEFORE UPDATE ON operator_aliases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE operators IS 'Canonical operator entities with normalized names';
COMMENT ON COLUMN operators.name IS 'Canonical operator name';
COMMENT ON COLUMN operators.operator_number IS 'Internal operator number';
COMMENT ON COLUMN operators.rrc_operator_number IS 'RRC-assigned operator number';

COMMENT ON TABLE operator_aliases IS 'Maps variant operator names to canonical operators for entity resolution';
COMMENT ON COLUMN operator_aliases.operator_id IS 'Reference to canonical operator';
COMMENT ON COLUMN operator_aliases.alias IS 'Variant name as it appears in source data';
COMMENT ON COLUMN operator_aliases.confidence IS 'Confidence score for auto-matching (0-1)';
COMMENT ON COLUMN operator_aliases.is_verified IS 'Whether this mapping was manually verified';
