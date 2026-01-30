import {
  Operator,
  OperatorAlias,
  OperatorActivitySummary,
  OperatorPermitTimelineEntry,
  OperatorComparison,
  OperatorGeographicFootprint,
  OperatorSearchResult,
  OperatorFilterOptions,
  OperatorListResponse,
  UUID
} from '../../types/operator';

export interface OperatorServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Service for managing operator data and intelligence
 */
export class OperatorService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: OperatorServiceConfig) {
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
   * Get a list of operators with filtering and pagination
   */
  async listOperators(options: OperatorFilterOptions): Promise<OperatorListResponse> {
    const params = new URLSearchParams();
    
    if (options.query) params.append('query', options.query);
    if (options.counties?.length) params.append('counties', options.counties.join(','));
    if (options.minPermits !== undefined) params.append('minPermits', options.minPermits.toString());
    if (options.maxPermits !== undefined) params.append('maxPermits', options.maxPermits.toString());
    if (options.activeOnly) params.append('activeOnly', 'true');
    params.append('sortBy', options.sortBy);
    params.append('sortOrder', options.sortOrder);
    params.append('limit', options.limit.toString());
    params.append('offset', options.offset.toString());

    const response = await this.fetchWithAuth(`/operators?${params.toString()}`);
    return response.json();
  }

  /**
   * Get a single operator by ID
   */
  async getOperator(id: UUID): Promise<Operator> {
    const response = await this.fetchWithAuth(`/operators/${id}`);
    return response.json();
  }

  /**
   * Search for operators by name or alias
   */
  async searchOperators(query: string, limit: number = 10): Promise<OperatorSearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });

    const response = await this.fetchWithAuth(`/operators/search?${params.toString()}`);
    return response.json();
  }

  /**
   * Get activity summary for an operator
   */
  async getActivitySummary(operatorId: UUID): Promise<OperatorActivitySummary> {
    const response = await this.fetchWithAuth(`/operators/${operatorId}/activity`);
    return response.json();
  }

  /**
   * Get permit timeline for an operator
   */
  async getPermitTimeline(
    operatorId: UUID,
    options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ entries: OperatorPermitTimelineEntry[]; total: number }> {
    const params = new URLSearchParams();
    
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetchWithAuth(`/operators/${operatorId}/timeline${queryString}`);
    return response.json();
  }

  /**
   * Get geographic footprint for an operator
   */
  async getGeographicFootprint(operatorId: UUID): Promise<OperatorGeographicFootprint> {
    const response = await this.fetchWithAuth(`/operators/${operatorId}/footprint`);
    return response.json();
  }

  /**
   * Compare multiple operators
   */
  async compareOperators(operatorIds: UUID[]): Promise<OperatorComparison[]> {
    const response = await this.fetchWithAuth('/operators/compare', {
      method: 'POST',
      body: JSON.stringify({ operatorIds })
    });
    return response.json();
  }

  /**
   * Get aliases for an operator
   */
  async getOperatorAliases(operatorId: UUID): Promise<OperatorAlias[]> {
    const response = await this.fetchWithAuth(`/operators/${operatorId}/aliases`);
    return response.json();
  }

  /**
   * Get related operators (subsidiaries, partners, etc.)
   */
  async getRelatedOperators(operatorId: UUID): Promise<Operator[]> {
    const response = await this.fetchWithAuth(`/operators/${operatorId}/related`);
    return response.json();
  }

  /**
   * Get top operators by permit count
   */
  async getTopOperators(limit: number = 10): Promise<Operator[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await this.fetchWithAuth(`/operators/top?${params.toString()}`);
    return response.json();
  }

  /**
   * Get operators active in a specific county
   */
  async getOperatorsByCounty(county: string, limit: number = 50): Promise<Operator[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await this.fetchWithAuth(`/operators/by-county/${encodeURIComponent(county)}?${params.toString()}`);
    return response.json();
  }
}
