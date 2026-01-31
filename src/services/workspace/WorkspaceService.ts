import {
  UUID
} from '../../types/common';

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

export interface WorkspaceServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Service for managing workspaces, team members, and invitations
 */
export class WorkspaceService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: WorkspaceServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Invite a user to join the workspace
   */
  async inviteMember(email: string, role: 'admin' | 'member' | 'viewer' = 'member'): Promise<WorkspaceInvitation> {
    const response = await this.fetchWithAuth('/workspace/invitations', {
      method: 'POST',
      body: JSON.stringify({ email, role })
    });

    return response.json();
  }

  /**
   * Get all pending invitations for the workspace
   */
  async getPendingInvitations(): Promise<WorkspaceInvitation[]> {
    const response = await this.fetchWithAuth('/workspace/invitations');
    return response.json();
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: UUID): Promise<WorkspaceInvitation> {
    const response = await this.fetchWithAuth(`/workspace/invitations/${invitationId}/resend`, {
      method: 'POST'
    });

    return response.json();
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId: UUID): Promise<void> {
    await this.fetchWithAuth(`/workspace/invitations/${invitationId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get all members of the workspace
   */
  async getMembers(): Promise<WorkspaceMember[]> {
    const response = await this.fetchWithAuth('/workspace/members');
    return response.json();
  }

  /**
   * Change a member's role
   */
  async changeMemberRole(memberId: UUID, role: 'admin' | 'member' | 'viewer'): Promise<WorkspaceMember> {
    const response = await this.fetchWithAuth(`/workspace/members/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });

    return response.json();
  }

  /**
   * Remove a member from the workspace
   */
  async removeMember(memberId: UUID): Promise<void> {
    await this.fetchWithAuth(`/workspace/members/${memberId}`, {
      method: 'DELETE'
    });
    // fetchWithAuth already throws on non-ok responses
  }

  /**
   * Get current workspace settings
   */
  async getWorkspaceSettings(): Promise<WorkspaceSettings> {
    const response = await this.fetchWithAuth('/workspace/settings');
    return response.json();
  }

  /**
   * Update workspace settings
   */
  async updateWorkspaceSettings(updates: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    const response = await this.fetchWithAuth('/workspace/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });

    return response.json();
  }

  /**
   * Accept an invitation to join a workspace
   */
  async acceptInvitation(token: string): Promise<{ success: boolean; message: string }> {
    const response = await this.fetchWithAuth('/workspace/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token })
    });

    return response.json();
  }

  /**
   * Get invitation details by token (for invited users)
   */
  async getInvitationByToken(token: string): Promise<WorkspaceInvitation> {
    const response = await this.fetchWithAuth(`/workspace/invitations/token/${token}`);
    return response.json();
  }
}