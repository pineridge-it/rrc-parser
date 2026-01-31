import {
  UUID
} from '../../types/common';
import {
  PermitDetail,
  PermitDetailRequest
} from '../../types/permit';

export interface PermitServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Service for retrieving permit details and related information
 */
export class PermitService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: PermitServiceConfig) {
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
   * Get detailed information for a specific permit
   */
  async getPermitDetail(permitId: UUID): Promise<PermitDetail> {
    const response = await this.fetchWithAuth(`/permits/${permitId}`);
    return response.json();
  }

  /**
   * Get permit detail by permit number
   */
  async getPermitDetailByNumber(permitNumber: string): Promise<PermitDetail> {
    const response = await this.fetchWithAuth(`/permits/number/${permitNumber}`);
    return response.json();
  }

  /**
   * Get amendments for a permit
   */
  async getPermitAmendments(permitId: UUID): Promise<any[]> {
    const response = await this.fetchWithAuth(`/permits/${permitId}/amendments`);
    return response.json();
  }

  /**
   * Get related wells for a permit
   */
  async getRelatedWells(permitId: UUID): Promise<any[]> {
    const response = await this.fetchWithAuth(`/permits/${permitId}/wells`);
    return response.json();
  }

  /**
   * Get nearby permits based on location
   */
  async getNearbyPermits(permitId: UUID, radiusMiles: number = 5): Promise<PermitDetail[]> {
    const params = new URLSearchParams({
      radius: radiusMiles.toString()
    });

    const response = await this.fetchWithAuth(`/permits/${permitId}/nearby?${params.toString()}`);
    return response.json();
  }

  /**
   * Export permit data as PDF
   */
  async exportPermitAsPdf(permitId: UUID): Promise<Blob> {
    const response = await this.fetchWithAuth(`/permits/${permitId}/export/pdf`, {
      headers: {
        'Accept': 'application/pdf'
      }
    });

    return response.blob();
  }

  /**
   * Export permit data as CSV
   */
  async exportPermitAsCsv(permitId: UUID): Promise<Blob> {
    const response = await this.fetchWithAuth(`/permits/${permitId}/export/csv`, {
      headers: {
        'Accept': 'text/csv'
      }
    });

    return response.blob();
  }

  /**
   * Get permit share link
   */
  async getPermitShareLink(permitId: UUID): Promise<string> {
    const response = await this.fetchWithAuth(`/permits/${permitId}/share-link`);
    const result = await response.json();
    return result.link;
  }

  /**
   * Add permit to user's watchlist
   */
  async addToWatchlist(permitId: UUID, notes?: string): Promise<any> {
    const response = await this.fetchWithAuth(`/permits/${permitId}/watchlist`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });

    return response.json();
  }

  /**
   * Create alert for this permit
   */
  async createAlertForPermit(permitId: UUID, alertConfig: any): Promise<any> {
    const response = await this.fetchWithAuth(`/permits/${permitId}/alerts`, {
      method: 'POST',
      body: JSON.stringify(alertConfig)
    });

    return response.json();
  }
}