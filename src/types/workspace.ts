/**
 * Workspace types for multi-tenant support
 */

export type PlanType = 'free' | 'pro' | 'enterprise';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  settings: WorkspaceSettings;
  plan: PlanType;
  billing_email?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface WorkspaceSettings {
  default_map_center?: [number, number];
  default_map_zoom?: number;
  email_notifications_enabled?: boolean;
  data_retention_days?: number;
  custom_fields?: Record<string, unknown>;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  is_active: boolean;
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
}

export interface WorkspaceCreateInput {
  name: string;
  slug: string;
  description?: string;
  billing_email?: string;
}

export interface WorkspaceUpdateInput {
  name?: string;
  description?: string;
  settings?: Partial<WorkspaceSettings>;
  billing_email?: string;
}

export interface WorkspaceMemberInviteInput {
  email: string;
  role: WorkspaceRole;
}

export interface WorkspaceMemberUpdateInput {
  role?: WorkspaceRole;
  is_active?: boolean;
}
