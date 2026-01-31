import {
  Operator,
  OperatorAlias,
  OperatorReviewItem,
  UUID
} from '../../types/operator';

export interface OperatorAdminServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Service for managing operator entity resolution and admin functions
 */
export class OperatorAdminService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: OperatorAdminServiceConfig) {
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
   * Get the review queue of low-confidence operator matches
   */
  async getReviewQueue(limit: number = 50, offset: number = 0): Promise<{
    items: OperatorReviewItem[];
    total: number;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await this.fetchWithAuth(`/operators/admin/review-queue?${params.toString()}`);
    return response.json();
  }

  /**
   * Approve a suggested operator match
   */
  async approveMatch(aliasId: UUID, notes?: string): Promise<void> {
    const response = await this.fetchWithAuth(`/operators/admin/aliases/${aliasId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to approve match: ${response.status}`);
    }
  }

  /**
   * Reject a suggested operator match
   */
  async rejectMatch(aliasId: UUID, createNewOperator: boolean = false, notes?: string): Promise<void> {
    const response = await this.fetchWithAuth(`/operators/admin/aliases/${aliasId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ createNewOperator, notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to reject match: ${response.status}`);
    }
  }

  /**
   * Merge two operators together
   */
  async mergeOperators(sourceId: UUID, targetId: UUID, notes?: string): Promise<void> {
    const response = await this.fetchWithAuth(`/operators/admin/merge`, {
      method: 'POST',
      body: JSON.stringify({ sourceId, targetId, notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to merge operators: ${response.status}`);
    }
  }

  /**
   * Split an operator by moving aliases to a new operator
   */
  async splitOperator(operatorId: UUID, aliasIds: UUID[], newName: string, notes?: string): Promise<Operator> {
    const response = await this.fetchWithAuth(`/operators/admin/split`, {
      method: 'POST',
      body: JSON.stringify({ operatorId, aliasIds, newName, notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to split operator: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Add a new alias to an operator
   */
  async addAlias(operatorId: UUID, alias: string, notes?: string): Promise<OperatorAlias> {
    const response = await this.fetchWithAuth(`/operators/admin/aliases`, {
      method: 'POST',
      body: JSON.stringify({ operatorId, alias, notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to add alias: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Remove an alias from an operator
   */
  async removeAlias(aliasId: UUID, notes?: string): Promise<void> {
    const response = await this.fetchWithAuth(`/operators/admin/aliases/${aliasId}`, {
      method: 'DELETE',
      body: JSON.stringify({ notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to remove alias: ${response.status}`);
    }
  }

  /**
   * Get detailed information about an operator for admin purposes
   */
  async getOperatorDetails(id: UUID): Promise<{
    operator: Operator;
    aliases: OperatorAlias[];
    activitySummary: any; // Would be more specific in real implementation
    relatedOperators: Operator[];
  }> {
    const response = await this.fetchWithAuth(`/operators/admin/${id}`);
    return response.json();
  }

  /**
   * Update operator metadata
   */
  async updateOperator(id: UUID, updates: Partial<Operator>, notes?: string): Promise<Operator> {
    const response = await this.fetchWithAuth(`/operators/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ updates, notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to update operator: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Mark an operator as active/inactive
   */
  async setOperatorStatus(id: UUID, isActive: boolean, notes?: string): Promise<Operator> {
    const response = await this.fetchWithAuth(`/operators/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive, notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to update operator status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Bulk approve matches
   */
  async bulkApprove(aliasIds: UUID[], notes?: string): Promise<{
    success: number;
    failed: number;
    errors: { id: UUID; error: string }[];
  }> {
    const response = await this.fetchWithAuth(`/operators/admin/bulk/approve`, {
      method: 'POST',
      body: JSON.stringify({ aliasIds, notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk approve: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Bulk reject matches
   */
  async bulkReject(aliasIds: UUID[], createNewOperators: boolean = false, notes?: string): Promise<{
    success: number;
    failed: number;
    errors: { id: UUID; error: string }[];
  }> {
    const response = await this.fetchWithAuth(`/operators/admin/bulk/reject`, {
      method: 'POST',
      body: JSON.stringify({ aliasIds, createNewOperators, notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk reject: ${response.status}`);
    }

    return response.json();
  }
}