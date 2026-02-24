/**
 * Workspace Authorization Middleware
 * 
 * Provides role-based access control (RBAC) for workspace operations.
 * Ensures users can only access workspaces they are members of and
 * can only perform actions allowed by their role.
 */

import { UUID } from '../types/common';
import { createDatabaseClient } from '../lib/database';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspaceMembership {
  workspaceId: UUID;
  userId: UUID;
  role: WorkspaceRole;
  isActive: boolean;
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly requiredRole?: WorkspaceRole | WorkspaceRole[],
    public readonly workspaceId?: UUID
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Role hierarchy for permission checking
 * Higher index = more permissions
 */
const ROLE_HIERARCHY: WorkspaceRole[] = ['viewer', 'member', 'admin', 'owner'];

/**
 * Check if a role has sufficient permissions for a required role
 */
export function hasRequiredRole(
  userRole: WorkspaceRole,
  requiredRole: WorkspaceRole | WorkspaceRole[]
): boolean {
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
  
  if (userRoleIndex === -1) {
    return false;
  }

  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  return requiredRoles.some(reqRole => {
    const reqRoleIndex = ROLE_HIERARCHY.indexOf(reqRole);
    return userRoleIndex >= reqRoleIndex;
  });
}

/**
 * Get workspace membership for a user
 */
export async function getWorkspaceMembership(
  workspaceId: UUID,
  userId: UUID
): Promise<WorkspaceMembership | null> {
  const db = createDatabaseClient();

  const { data, error } = await db
    .from('workspace_members')
    .select('workspace_id, user_id, role, is_active')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    workspaceId: data.workspace_id,
    userId: data.user_id,
    role: data.role,
    isActive: data.is_active,
  };
}

/**
 * Verify user has required role for workspace operation
 * Throws AuthorizationError if not authorized
 */
export async function requireWorkspaceRole(
  workspaceId: UUID,
  userId: UUID,
  requiredRole: WorkspaceRole | WorkspaceRole[]
): Promise<WorkspaceMembership> {
  const membership = await getWorkspaceMembership(workspaceId, userId);

  if (!membership) {
    throw new AuthorizationError(
      'User is not a member of this workspace',
      requiredRole,
      workspaceId
    );
  }

  if (!membership.isActive) {
    throw new AuthorizationError(
      'User membership is not active',
      requiredRole,
      workspaceId
    );
  }

  if (!hasRequiredRole(membership.role, requiredRole)) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
    throw new AuthorizationError(
      `Insufficient permissions. Required role: ${requiredRoles}`,
      requiredRole,
      workspaceId
    );
  }

  return membership;
}

/**
 * Verify user is a member of the workspace (any role)
 */
export async function requireWorkspaceMembership(
  workspaceId: UUID,
  userId: UUID
): Promise<WorkspaceMembership> {
  return requireWorkspaceRole(workspaceId, userId, 'viewer');
}

/**
 * Role-based action permissions
 */
export const WORKSPACE_PERMISSIONS = {
  // Workspace management
  DELETE_WORKSPACE: ['owner'] as WorkspaceRole[],
  UPDATE_WORKSPACE_SETTINGS: ['owner', 'admin'] as WorkspaceRole[],
  VIEW_WORKSPACE_SETTINGS: ['owner', 'admin', 'member', 'viewer'] as WorkspaceRole[],
  
  // Member management
  INVITE_MEMBERS: ['owner', 'admin'] as WorkspaceRole[],
  REMOVE_MEMBERS: ['owner', 'admin'] as WorkspaceRole[],
  CHANGE_MEMBER_ROLES: ['owner', 'admin'] as WorkspaceRole[],
  VIEW_MEMBERS: ['owner', 'admin', 'member', 'viewer'] as WorkspaceRole[],
  
  // AOI management
  CREATE_AOI: ['owner', 'admin', 'member'] as WorkspaceRole[],
  UPDATE_AOI: ['owner', 'admin', 'member'] as WorkspaceRole[],
  DELETE_AOI: ['owner', 'admin', 'member'] as WorkspaceRole[],
  VIEW_AOIS: ['owner', 'admin', 'member', 'viewer'] as WorkspaceRole[],
  
  // Alert management
  CREATE_ALERT: ['owner', 'admin', 'member'] as WorkspaceRole[],
  UPDATE_ALERT: ['owner', 'admin', 'member'] as WorkspaceRole[],
  DELETE_ALERT: ['owner', 'admin', 'member'] as WorkspaceRole[],
  VIEW_ALERTS: ['owner', 'admin', 'member', 'viewer'] as WorkspaceRole[],
  
  // Export management
  CREATE_EXPORT: ['owner', 'admin', 'member'] as WorkspaceRole[],
  VIEW_EXPORTS: ['owner', 'admin', 'member', 'viewer'] as WorkspaceRole[],
  
  // API key management
  MANAGE_API_KEYS: ['owner', 'admin'] as WorkspaceRole[],
  
  // Billing
  MANAGE_BILLING: ['owner'] as WorkspaceRole[],
  VIEW_BILLING: ['owner', 'admin'] as WorkspaceRole[],
} as const;

/**
 * Check if user has permission for a specific action
 */
export async function hasPermission(
  workspaceId: UUID,
  userId: UUID,
  permission: keyof typeof WORKSPACE_PERMISSIONS
): Promise<boolean> {
  try {
    const membership = await getWorkspaceMembership(workspaceId, userId);
    
    if (!membership || !membership.isActive) {
      return false;
    }

    const requiredRoles = WORKSPACE_PERMISSIONS[permission];
    return hasRequiredRole(membership.role, requiredRoles);
  } catch {
    return false;
  }
}

/**
 * Require permission for a specific action
 * Throws AuthorizationError if not permitted
 */
export async function requirePermission(
  workspaceId: UUID,
  userId: UUID,
  permission: keyof typeof WORKSPACE_PERMISSIONS
): Promise<WorkspaceMembership> {
  const membership = await getWorkspaceMembership(workspaceId, userId);

  if (!membership) {
    throw new AuthorizationError(
      'User is not a member of this workspace',
      WORKSPACE_PERMISSIONS[permission],
      workspaceId
    );
  }

  if (!membership.isActive) {
    throw new AuthorizationError(
      'User membership is not active',
      WORKSPACE_PERMISSIONS[permission],
      workspaceId
    );
  }

  const requiredRoles = WORKSPACE_PERMISSIONS[permission];
  
  if (!hasRequiredRole(membership.role, requiredRoles)) {
    throw new AuthorizationError(
      `Insufficient permissions for ${permission}. Required role: ${requiredRoles.join(' or ')}`,
      requiredRoles,
      workspaceId
    );
  }

  return membership;
}