-- ============================================================================
-- PERMIT ANNOTATIONS DATA MODEL
-- ============================================================================
-- CRM layer for permit annotations with workspace isolation
-- Created as part of ubuntu-5o79.5.1: Permit Annotation Data Model

-- ============================================================================
-- 1. PERMIT ANNOTATIONS TABLE
-- ============================================================================
-- Main annotation records for permits with full workspace isolation

CREATE TABLE IF NOT EXISTS permit_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Workspace isolation
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Permit reference (using api_number for stable link)
  permit_api_number TEXT NOT NULL,
  
  -- Annotation fields
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_status TEXT,
  assignee_user_id UUID,
  created_by UUID NOT NULL,
  
  -- System timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One annotation record per permit per workspace
  UNIQUE(workspace_id, permit_api_number)
);

-- ============================================================================
-- 2. PERMIT ANNOTATION HISTORY TABLE
-- ============================================================================
-- Audit trail for all annotation changes

CREATE TABLE IF NOT EXISTS permit_annotation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to annotation
  annotation_id UUID NOT NULL REFERENCES permit_annotations(id) ON DELETE CASCADE,
  
  -- Change tracking
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT
);

-- ============================================================================
-- 3. WORKSPACE TAG DEFINITIONS TABLE
-- ============================================================================
-- User-defined tag labels with colors per workspace

CREATE TABLE IF NOT EXISTS workspace_tag_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Workspace isolation
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Tag definition
  tag_name TEXT NOT NULL,
  color_hex TEXT DEFAULT '#6B7280',
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique tag name per workspace
  UNIQUE(workspace_id, tag_name)
);

-- ============================================================================
-- 4. WORKSPACE CUSTOM STATUSES TABLE
-- ============================================================================
-- User-defined workflow statuses per workspace

CREATE TABLE IF NOT EXISTS workspace_custom_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Workspace isolation
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Status definition
  status_name TEXT NOT NULL,
  color_hex TEXT DEFAULT '#6B7280',
  sort_order INT DEFAULT 0,
  
  -- Unique status name per workspace
  UNIQUE(workspace_id, status_name)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- permit_annotations indexes
CREATE INDEX IF NOT EXISTS idx_permit_annotations_workspace 
  ON permit_annotations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_permit_annotations_permit 
  ON permit_annotations(workspace_id, permit_api_number);
CREATE INDEX IF NOT EXISTS idx_permit_annotations_assignee 
  ON permit_annotations(workspace_id, assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_permit_annotations_tags 
  ON permit_annotations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_permit_annotations_custom_status 
  ON permit_annotations(workspace_id, custom_status);
CREATE INDEX IF NOT EXISTS idx_permit_annotations_created_by 
  ON permit_annotations(created_by);

-- permit_annotation_history indexes
CREATE INDEX IF NOT EXISTS idx_permit_annotation_history_annotation 
  ON permit_annotation_history(annotation_id);
CREATE INDEX IF NOT EXISTS idx_permit_annotation_history_changed_at 
  ON permit_annotation_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_permit_annotation_history_changed_by 
  ON permit_annotation_history(changed_by);

-- workspace_tag_definitions indexes
CREATE INDEX IF NOT EXISTS idx_workspace_tag_definitions_workspace 
  ON workspace_tag_definitions(workspace_id);

-- workspace_custom_statuses indexes
CREATE INDEX IF NOT EXISTS idx_workspace_custom_statuses_workspace 
  ON workspace_custom_statuses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_custom_statuses_sort 
  ON workspace_custom_statuses(workspace_id, sort_order);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- permit_annotations RLS
ALTER TABLE permit_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY permit_annotations_isolation ON permit_annotations
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_superadmin = true
    )
  );

CREATE POLICY permit_annotations_insert ON permit_annotations
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY permit_annotations_update ON permit_annotations
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY permit_annotations_delete ON permit_annotations
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- permit_annotation_history RLS
ALTER TABLE permit_annotation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY permit_annotation_history_isolation ON permit_annotation_history
  USING (
    EXISTS (
      SELECT 1 FROM permit_annotations
      WHERE permit_annotations.id = permit_annotation_history.annotation_id
      AND permit_annotations.workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_superadmin = true
    )
  );

-- workspace_tag_definitions RLS
ALTER TABLE workspace_tag_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_tag_definitions_isolation ON workspace_tag_definitions
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_superadmin = true
    )
  );

CREATE POLICY workspace_tag_definitions_insert ON workspace_tag_definitions
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY workspace_tag_definitions_update ON workspace_tag_definitions
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY workspace_tag_definitions_delete ON workspace_tag_definitions
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- workspace_custom_statuses RLS
ALTER TABLE workspace_custom_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_custom_statuses_isolation ON workspace_custom_statuses
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_superadmin = true
    )
  );

CREATE POLICY workspace_custom_statuses_insert ON workspace_custom_statuses
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY workspace_custom_statuses_update ON workspace_custom_statuses
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY workspace_custom_statuses_delete ON workspace_custom_statuses
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update permit_annotations.updated_at
DROP TRIGGER IF EXISTS update_permit_annotations_updated_at ON permit_annotations;
CREATE TRIGGER update_permit_annotations_updated_at
  BEFORE UPDATE ON permit_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to record annotation history
CREATE OR REPLACE FUNCTION record_annotation_history()
RETURNS TRIGGER AS $$
DECLARE
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Only track changes to specific fields
  IF TG_OP = 'UPDATE' THEN
    -- Check each trackable field
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      old_val := OLD.notes;
      new_val := NEW.notes;
      INSERT INTO permit_annotation_history (annotation_id, changed_by, field_name, old_value, new_value)
      VALUES (NEW.id, NEW.created_by, 'notes', old_val, new_val);
    END IF;
    
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN
      old_val := array_to_string(OLD.tags, ',');
      new_val := array_to_string(NEW.tags, ',');
      INSERT INTO permit_annotation_history (annotation_id, changed_by, field_name, old_value, new_value)
      VALUES (NEW.id, NEW.created_by, 'tags', old_val, new_val);
    END IF;
    
    IF OLD.custom_status IS DISTINCT FROM NEW.custom_status THEN
      old_val := OLD.custom_status;
      new_val := NEW.custom_status;
      INSERT INTO permit_annotation_history (annotation_id, changed_by, field_name, old_value, new_value)
      VALUES (NEW.id, NEW.created_by, 'custom_status', old_val, new_val);
    END IF;
    
    IF OLD.assignee_user_id IS DISTINCT FROM NEW.assignee_user_id THEN
      old_val := OLD.assignee_user_id::TEXT;
      new_val := NEW.assignee_user_id::TEXT;
      INSERT INTO permit_annotation_history (annotation_id, changed_by, field_name, old_value, new_value)
      VALUES (NEW.id, NEW.created_by, 'assignee', old_val, new_val);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_annotation_changes ON permit_annotations;
CREATE TRIGGER track_annotation_changes
  AFTER UPDATE ON permit_annotations
  FOR EACH ROW
  EXECUTE FUNCTION record_annotation_history();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE permit_annotations IS 'User annotations on permits with workspace isolation';
COMMENT ON COLUMN permit_annotations.permit_api_number IS 'API well number for stable permit reference';
COMMENT ON COLUMN permit_annotations.notes IS 'Markdown-formatted private notes';
COMMENT ON COLUMN permit_annotations.tags IS 'User-defined labels';
COMMENT ON COLUMN permit_annotations.custom_status IS 'User-defined workflow status';

COMMENT ON TABLE permit_annotation_history IS 'Audit trail for annotation changes';
COMMENT ON COLUMN permit_annotation_history.field_name IS 'Which field changed: notes, tags, custom_status, or assignee';

COMMENT ON TABLE workspace_tag_definitions IS 'User-defined tag labels with colors per workspace';
COMMENT ON TABLE workspace_custom_statuses IS 'User-defined workflow statuses per workspace';
