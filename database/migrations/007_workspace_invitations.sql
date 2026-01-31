-- ============================================================================
-- WORKSPACE INVITATIONS AND USER ROLES MIGRATION
-- ============================================================================

\echo 'Creating workspace invitations table and adding role column to users...'

-- ============================================================================
-- WORKSPACE INVITATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT idx_workspace_invitations_token UNIQUE(token),
  CONSTRAINT idx_workspace_invitations_email_workspace UNIQUE(email, workspace_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token_lookup ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_expires ON workspace_invitations(expires_at);

-- ============================================================================
-- ADD ROLE COLUMN TO USERS TABLE
-- ============================================================================

-- Add role column to users table with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member';

-- Ensure existing users have a role value
UPDATE users 
SET role = 'member' 
WHERE role IS NULL;

-- Add check constraint for valid roles
ALTER TABLE users 
ADD CONSTRAINT valid_user_role 
CHECK (role IN ('admin', 'member', 'viewer'));

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- ROW LEVEL SECURITY FOR WORKSPACE INVITATIONS
-- ============================================================================

ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Users can only see invitations for their workspaces (if they're admins)
CREATE POLICY workspace_invitations_admin_access ON workspace_invitations
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    email = (SELECT email FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGERS FOR WORKSPACE INVITATIONS
-- ============================================================================

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_workspace_invitations_updated_at ON workspace_invitations;
CREATE TRIGGER update_workspace_invitations_updated_at
  BEFORE UPDATE ON workspace_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE workspace_invitations IS 'Invitations for users to join workspaces';
COMMENT ON COLUMN workspace_invitations.role IS 'Role user will have when they accept invitation';
COMMENT ON COLUMN workspace_invitations.token IS 'Unique token for accepting invitation';
COMMENT ON COLUMN workspace_invitations.expires_at IS 'When invitation expires';

\echo 'Workspace invitations table and user roles migration completed'