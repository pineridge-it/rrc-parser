-- ============================================================================
-- OPERATOR NORMALIZATION SYSTEM
-- ============================================================================
-- Creates tables for operator name normalization during ETL
-- Uses pg_trgm for fuzzy matching

\echo 'Creating operator normalization tables...'

-- Enable pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- OPERATORS TABLE (Canonical names)
-- ============================================================================
CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Canonical operator name
    canonical_name VARCHAR(255) NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'merged', 'needs_review', 'deprecated')),
    
    -- Confidence metrics
    confidence_score NUMERIC(3,2) DEFAULT 1.0 
        CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Merge tracking (if this operator was merged into another)
    merged_into_id UUID REFERENCES operators(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamps for data quality tracking
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Usage count for prioritization
    usage_count INTEGER DEFAULT 1,
    
    -- Unique constraint on canonical name
    UNIQUE(canonical_name)
);

-- Index for canonical name lookups
CREATE INDEX IF NOT EXISTS idx_operators_canonical_name ON operators(canonical_name);

-- Index for status-based queries
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status) WHERE status != 'active';

-- Index for merged operators
CREATE INDEX IF NOT EXISTS idx_operators_merged_into ON operators(merged_into_id) WHERE merged_into_id IS NOT NULL;

-- GIN index for trigram similarity searches on canonical names
CREATE INDEX IF NOT EXISTS idx_operators_name_trgm ON operators USING gin(canonical_name gin_trgm_ops);

-- ============================================================================
-- OPERATOR ALIASES TABLE (Raw name variations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS operator_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to canonical operator
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Raw/alias name as it appears in source data
    alias_name VARCHAR(255) NOT NULL,
    
    -- Source system (e.g., 'rrc', 'manual', 'import')
    source VARCHAR(50) DEFAULT 'rrc',
    
    -- Confidence of this mapping
    confidence_score NUMERIC(3,2) DEFAULT 1.0
        CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Whether this alias was auto-matched or manually verified
    auto_matched BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one alias can only map to one operator
    UNIQUE(alias_name)
);

-- Index for alias lookups
CREATE INDEX IF NOT EXISTS idx_operator_aliases_name ON operator_aliases(alias_name);

-- Index for operator lookups
CREATE INDEX IF NOT EXISTS idx_operator_aliases_operator ON operator_aliases(operator_id);

-- GIN index for fuzzy matching on aliases
CREATE INDEX IF NOT EXISTS idx_operator_aliases_trgm ON operator_aliases USING gin(alias_name gin_trgm_ops);

-- ============================================================================
-- OPERATOR REVIEW QUEUE (Uncertain matches)
-- ============================================================================
CREATE TABLE IF NOT EXISTS operator_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The raw name that needs review
    raw_name VARCHAR(255) NOT NULL,
    
    -- Proposed operator match (if any)
    proposed_operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
    
    -- Similarity score for the proposed match
    similarity_score NUMERIC(3,2),
    
    -- Status of review
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'auto_resolved')),
    
    -- Review metadata
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Source context
    source_permit_id VARCHAR(100),
    source_file VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Priority (higher = more urgent)
    priority INTEGER DEFAULT 0
);

-- Index for pending reviews
CREATE INDEX IF NOT EXISTS idx_operator_review_pending ON operator_review_queue(status, priority DESC, created_at)
    WHERE status = 'pending';

-- Index for raw name searches
CREATE INDEX IF NOT EXISTS idx_operator_review_raw_name ON operator_review_queue(raw_name);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on operators
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Operators are readable by all authenticated users
CREATE POLICY operators_read_all ON operators
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can modify operators
CREATE POLICY operators_admin_modify ON operators
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            JOIN workspaces w ON wm.workspace_id = w.id
            WHERE wm.user_id = auth.uid()
            AND wm.role = 'admin'
            LIMIT 1
        )
    );

-- Enable RLS on operator_aliases
ALTER TABLE operator_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY operator_aliases_read_all ON operator_aliases
    FOR SELECT
    TO authenticated
    USING (true);

-- Enable RLS on operator_review_queue
ALTER TABLE operator_review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY operator_review_admin_access ON operator_review_queue
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            JOIN workspaces w ON wm.workspace_id = w.id
            WHERE wm.user_id = auth.uid()
            AND wm.role IN ('admin', 'operator_manager')
            LIMIT 1
        )
    );

-- ============================================================================
-- FUNCTIONS FOR OPERATOR NORMALIZATION
-- ============================================================================

-- Function to clean/normalize operator name input
CREATE OR REPLACE FUNCTION clean_operator_name(input_name TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned TEXT;
BEGIN
    -- Convert to uppercase
    cleaned := UPPER(TRIM(input_name));
    
    -- Remove common punctuation
    cleaned := REGEXP_REPLACE(cleaned, '[.,;:!?&]', '', 'g');
    
    -- Standardize common suffixes
    cleaned := REGEXP_REPLACE(cleaned, '\s+LLC$', ' LLC', 'i');
    cleaned := REGEXP_REPLACE(cleaned, '\s+INC$', ' INC', 'i');
    cleaned := REGEXP_REPLACE(cleaned, '\s+CORP$', ' CORP', 'i');
    cleaned := REGEXP_REPLACE(cleaned, '\s+LTD$', ' LTD', 'i');
    cleaned := REGEXP_REPLACE(cleaned, '\s+LP$', ' LP', 'i');
    cleaned := REGEXP_REPLACE(cleaned, '\s+CO$', ' CO', 'i');
    
    -- Normalize whitespace
    cleaned := REGEXP_REPLACE(cleaned, '\s+', ' ', 'g');
    
    RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find similar operators using trigram similarity
CREATE OR REPLACE FUNCTION find_similar_operators(
    p_name TEXT,
    p_threshold NUMERIC DEFAULT 0.7
)
RETURNS TABLE (
    operator_id UUID,
    canonical_name TEXT,
    similarity NUMERIC,
    confidence_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.canonical_name::TEXT,
        similarity(o.canonical_name, p_name)::NUMERIC,
        o.confidence_score
    FROM operators o
    WHERE o.status = 'active'
      AND similarity(o.canonical_name, p_name) >= p_threshold
    ORDER BY similarity(o.canonical_name, p_name) DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to normalize operator name (main entry point)
CREATE OR REPLACE FUNCTION normalize_operator_name(
    p_raw_name TEXT,
    p_source_permit_id VARCHAR(100) DEFAULT NULL,
    p_source_file VARCHAR(255) DEFAULT NULL,
    p_auto_create BOOLEAN DEFAULT true
)
RETURNS TABLE (
    operator_id UUID,
    canonical_name TEXT,
    confidence NUMERIC,
    is_new_operator BOOLEAN,
    needs_review BOOLEAN
) AS $$
DECLARE
    v_cleaned_name TEXT;
    v_exact_match RECORD;
    v_similar_match RECORD;
    v_new_operator_id UUID;
    v_confidence NUMERIC;
    v_is_new BOOLEAN := false;
    v_needs_review BOOLEAN := false;
BEGIN
    -- Clean the input name
    v_cleaned_name := clean_operator_name(p_raw_name);
    
    -- Check for exact match in aliases
    SELECT oa.operator_id, o.canonical_name, oa.confidence_score
    INTO v_exact_match
    FROM operator_aliases oa
    JOIN operators o ON oa.operator_id = o.id
    WHERE oa.alias_name = v_cleaned_name
      AND o.status = 'active'
    LIMIT 1;
    
    IF FOUND THEN
        -- Update usage count
        UPDATE operator_aliases 
        SET usage_count = usage_count + 1, last_used_at = NOW()
        WHERE alias_name = v_cleaned_name;
        
        RETURN QUERY SELECT 
            v_exact_match.operator_id, 
            v_exact_match.canonical_name, 
            v_exact_match.confidence_score,
            false,
            false;
        RETURN;
    END IF;
    
    -- Check for similar operators using fuzzy matching
    SELECT * INTO v_similar_match
    FROM find_similar_operators(v_cleaned_name, 0.7)
    LIMIT 1;
    
    IF FOUND AND v_similar_match.similarity >= 0.9 THEN
        -- High confidence match - auto-assign
        v_confidence := v_similar_match.similarity;
        
        -- Create alias mapping
        INSERT INTO operator_aliases (operator_id, alias_name, confidence_score, auto_matched)
        VALUES (v_similar_match.operator_id, v_cleaned_name, v_confidence, true);
        
        RETURN QUERY SELECT 
            v_similar_match.operator_id,
            v_similar_match.canonical_name,
            v_confidence,
            false,
            false;
        RETURN;
    ELSIF FOUND AND v_similar_match.similarity >= 0.7 THEN
        -- Medium confidence - needs review
        v_needs_review := true;
        v_confidence := v_similar_match.similarity;
        
        -- Add to review queue
        INSERT INTO operator_review_queue (
            raw_name, proposed_operator_id, similarity_score, 
            source_permit_id, source_file
        ) VALUES (
            p_raw_name, v_similar_match.operator_id, v_confidence,
            p_source_permit_id, p_source_file
        );
        
        IF p_auto_create THEN
            -- Create new operator but flag for review
            INSERT INTO operators (canonical_name, status, confidence_score)
            VALUES (v_cleaned_name, 'needs_review', v_confidence)
            RETURNING id INTO v_new_operator_id;
            
            -- Create alias
            INSERT INTO operator_aliases (operator_id, alias_name, confidence_score, auto_matched)
            VALUES (v_new_operator_id, v_cleaned_name, v_confidence, true);
            
            v_is_new := true;
            
            RETURN QUERY SELECT 
                v_new_operator_id,
                v_cleaned_name,
                v_confidence,
                true,
                true;
        ELSE
            -- Return proposed match but flag for review
            RETURN QUERY SELECT 
                v_similar_match.operator_id,
                v_similar_match.canonical_name,
                v_confidence,
                false,
                true;
        END IF;
        RETURN;
    END IF;
    
    -- No match found - create new operator
    IF p_auto_create THEN
        INSERT INTO operators (canonical_name, status, confidence_score)
        VALUES (v_cleaned_name, 'active', 1.0)
        RETURNING id INTO v_new_operator_id;
        
        INSERT INTO operator_aliases (operator_id, alias_name, confidence_score, auto_matched)
        VALUES (v_new_operator_id, v_cleaned_name, 1.0, true);
        
        v_is_new := true;
        v_confidence := 1.0;
        
        RETURN QUERY SELECT 
            v_new_operator_id,
            v_cleaned_name,
            v_confidence,
            true,
            false;
    ELSE
        -- Add to review queue as new operator
        INSERT INTO operator_review_queue (
            raw_name, source_permit_id, source_file
        ) VALUES (
            p_raw_name, p_source_permit_id, p_source_file
        );
        
        RETURN QUERY SELECT 
            NULL::UUID,
            v_cleaned_name,
            0.0::NUMERIC,
            false,
            true;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to merge two operators
CREATE OR REPLACE FUNCTION merge_operators(
    p_source_operator_id UUID,
    p_target_operator_id UUID,
    p_reviewed_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update source operator
    UPDATE operators
    SET status = 'merged',
        merged_into_id = p_target_operator_id,
        updated_at = NOW()
    WHERE id = p_source_operator_id;
    
    -- Move all aliases to target
    UPDATE operator_aliases
    SET operator_id = p_target_operator_id,
        updated_at = NOW()
    WHERE operator_id = p_source_operator_id;
    
    -- Update review queue entries
    UPDATE operator_review_queue
    SET proposed_operator_id = p_target_operator_id,
        status = 'auto_resolved',
        reviewed_by = p_reviewed_by,
        reviewed_at = NOW(),
        review_notes = 'Auto-resolved by operator merge'
    WHERE proposed_operator_id = p_source_operator_id
      AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to operators
DROP TRIGGER IF EXISTS update_operators_updated_at ON operators;
CREATE TRIGGER update_operators_updated_at
    BEFORE UPDATE ON operators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to operator_aliases
DROP TRIGGER IF EXISTS update_operator_aliases_updated_at ON operator_aliases;
CREATE TRIGGER update_operator_aliases_updated_at
    BEFORE UPDATE ON operator_aliases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to operator_review_queue
DROP TRIGGER IF EXISTS update_operator_review_updated_at ON operator_review_queue;
CREATE TRIGGER update_operator_review_updated_at
    BEFORE UPDATE ON operator_review_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo 'Operator normalization tables and functions created successfully'
