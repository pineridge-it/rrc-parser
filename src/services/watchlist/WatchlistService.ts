import {
  UUID
} from '../../types/common';

export interface WatchlistItem {
  id: UUID;
  userId: UUID;
  workspaceId: UUID;
  itemType: 'permit' | 'operator';
  permitId?: UUID;
  operatorId?: UUID;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Service for managing user watchlist items
 */
export class WatchlistService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: WatchlistServiceConfig) {
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
   * Add a permit to the user's watchlist
   */
  async addPermitToWatchlist(permitId: UUID, notes?: string): Promise<WatchlistItem> {
    const response = await this.fetchWithAuth('/watchlist', {
      method: 'POST',
      body: JSON.stringify({
        itemType: 'permit',
        permitId,
        notes
      })
    });

    return response.json();
  }

  /**
   * Add an operator to the user's watchlist
   */
  async addOperatorToWatchlist(operatorId: UUID, notes?: string): Promise<WatchlistItem> {
    const response = await this.fetchWithAuth('/watchlist', {
      method: 'POST',
      body: JSON.stringify({
        itemType: 'operator',
        operatorId,
        notes
      })
    });

    return response.json();
  }

  /**
   * Get all items in the user's watchlist
   */
  async getWatchlist(options?: {
    limit?: number;
    offset?: number;
    itemType?: 'permit' | 'operator';
  }): Promise<{
    items: WatchlistItem[];
    total: number;
  }> {
    const params = new URLSearchParams();
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.itemType) params.append('itemType', options.itemType);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetchWithAuth(`/watchlist${queryString}`);
    return response.json();
  }

  /**
   * Remove an item from the user's watchlist
   */
  async removeFromWatchlist(id: UUID): Promise<void> {
    await this.fetchWithAuth(`/watchlist/${id}`, {
      method: 'DELETE'
    });
    // fetchWithAuth already throws on non-ok responses
  }

  /**
   * Update notes for a watchlist item
   */
  async updateWatchlistItem(id: UUID, notes: string): Promise<WatchlistItem> {
    const response = await this.fetchWithAuth(`/watchlist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    });
    return response.json();
  }

  /**
   * Check if a permit is in the user's watchlist
   */
  async isPermitWatched(permitId: UUID): Promise<boolean> {
    const response = await this.fetchWithAuth(`/watchlist/permit/${permitId}`);
    const result = await response.json();
    return result.watched;
  }

  /**
   * Check if an operator is in the user's watchlist
   */
  async isOperatorWatched(operatorId: UUID): Promise<boolean> {
    const response = await this.fetchWithAuth(`/watchlist/operator/${operatorId}`);
    const result = await response.json();
    return result.watched;
  }
}