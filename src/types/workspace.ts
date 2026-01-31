import { UUID } from './common';

export interface WorkspaceMember {
  id: UUID;
  workspaceId: UUID;
  userId: UUID;
  role: 'admin' | 'member' | 'viewer';
  isActive: boolean;
  invitedBy?: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceInvitation {
  id: UUID;
  workspaceId: UUID;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: UUID;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface WorkspaceSettings {
  id: UUID;
  name: string;
  billingContact?: string;
  logoUrl?: string;
  updatedAt: string;
}

export interface WorkspaceInvitationCreateRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface WorkspaceMemberRoleUpdateRequest {
  role: 'admin' | 'member' | 'viewer';
}

export interface WorkspaceSettingsUpdateRequest {
  name?: string;
  billingContact?: string;
  logoUrl?: string;
}

export interface AcceptInvitationRequest {
  token: string;
}