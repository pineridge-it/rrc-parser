-- Enable pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create operators table for canonical operator records
CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_number TEXT UNIQUE, -- RRC operator number if available
    canonical_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL, -- lowercase, cleaned version for matching
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive, merged
    merged_into_id UUID REFERENCES operators(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on normalized name for exact matching
CREATE INDEX IF NOT EXISTS idx_operators_normalized_name ON operators(normalized_name);

-- Create GIN index for trigram similarity searches
CREATE INDEX IF NOT EXISTS idx_operators_canonical_name_trgm ON operators USING gin(canonical_name gin_trgm_ops);

-- Create operator_aliases table for name variations
CREATE TABLE IF NOT EXISTS operator_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    normalized_alias TEXT NOT NULL, -- lowercase, cleaned version
    source TEXT, -- e.g., 'rrc_data', 'user_input', 'manual_correction'
    confidence_score DOUBLE PRECISION DEFAULT 1.0, -- how confident we are in this alias mapping
    usage_count INTEGER DEFAULT 0, -- how many times this alias has been seen
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(alias, operator_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_operator_aliases_operator_id ON operator_aliases(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_aliases_normalized_alias ON operator_aliases(normalized_alias);

-- Create GIN index for trigram similarity searches on aliases
CREATE INDEX IF NOT EXISTS idx_operator_aliases_trgm ON operator_aliases USING gin(alias gin_trgm_ops);

-- Create operator_review_queue table for uncertain matches
CREATE TABLE IF NOT EXISTS operator_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_operator_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    suggested_operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
    suggested_confidence DOUBLE PRECISION,
    similar_operators JSONB, -- array of {operator_id, name, similarity}
    permit_id TEXT, -- optional reference to permit that triggered this
    source_file TEXT, -- optional reference to source file
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, auto_resolved
    reviewed_by UUID, -- user who reviewed
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for review queue
CREATE INDEX IF NOT EXISTS idx_operator_review_queue_status ON operator_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_operator_review_queue_created_at ON operator_review_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_operator_review_queue_normalized_name ON operator_review_queue(normalized_name);

-- Create function to find similar operators using trigram similarity
CREATE OR REPLACE FUNCTION find_similar_operators(
    search_name TEXT,
    similarity_threshold DOUBLE PRECISION DEFAULT 0.3
)
RETURNS TABLE (
    operator_id UUID,
    canonical_name TEXT,
    similarity DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as operator_id,
        o.canonical_name,
        similarity(o.canonical_name, search_name) as similarity
    FROM operators o
    WHERE o.canonical_name % search_name  -- trigram similarity operator
      AND similarity(o.canonical_name, search_name) >= similarity_threshold
    ORDER BY similarity DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Create function to find similar aliases using trigram similarity
CREATE OR REPLACE FUNCTION find_similar_aliases(
    search_name TEXT,
    similarity_threshold DOUBLE PRECISION DEFAULT 0.3
)
RETURNS TABLE (
    operator_id UUID,
    alias TEXT,
    similarity DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oa.operator_id,
        oa.alias,
        similarity(oa.alias, search_name) as similarity
    FROM operator_aliases oa
    WHERE oa.alias % search_name  -- trigram similarity operator
      AND similarity(oa.alias, search_name) >= similarity_threshold
    ORDER BY similarity DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_operators_updated_at
    BEFORE UPDATE ON operators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operator_aliases_updated_at
    BEFORE UPDATE ON operator_aliases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operator_review_queue_updated_at
    BEFORE UPDATE ON operator_review_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update last_seen_at on alias usage
CREATE OR REPLACE FUNCTION update_alias_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen_at = NOW();
    NEW.usage_count = OLD.usage_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alias_usage
    BEFORE UPDATE ON operator_aliases
    FOR EACH ROW
    WHEN (OLD.last_seen_at IS DISTINCT FROM NEW.last_seen_at)
    EXECUTE FUNCTION update_alias_last_seen();
