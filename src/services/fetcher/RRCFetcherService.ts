import { UUID } from '../../types/common';

export interface FetcherConfig {
  baseUrl: string;
  rateLimit: number;  // requests per second
  timeout: number;    // ms
  maxRetries: number;
  userAgent: string;
}

export interface FetchResult {
  success: boolean;
  data?: string;
  statusCode: number;
  duration: number;
  retryCount: number;
  error?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface RRCFetcherServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Service for fetching permit data from RRC with proper error handling, retries, and rate limiting
 */
export class RRCFetcherService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: RRCFetcherServiceConfig) {
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
   * Fetch permits for a date range with retry and rate limiting
   */
  async fetchPermits(dateRange: DateRange): Promise<FetchResult> {
    const response = await this.fetchWithAuth('/fetcher/permits', {
      method: 'POST',
      body: JSON.stringify(dateRange)
    });

    return response.json();
  }

  /**
   * Fetch permit detail by permit ID with retry and rate limiting
   */
  async fetchPermitDetail(permitId: string): Promise<FetchResult> {
    const response = await this.fetchWithAuth(`/fetcher/permits/${permitId}`);
    return response.json();
  }

  /**
   * Fetch multiple permits with batch processing
   */
  async fetchPermitBatch(permitIds: string[]): Promise<FetchResult[]> {
    const response = await this.fetchWithAuth('/fetcher/permits/batch', {
      method: 'POST',
      body: JSON.stringify({ permitIds })
    });

    return response.json();
  }

  /**
   * Configure fetcher settings
   */
  async configure(config: Partial<FetcherConfig>): Promise<FetcherConfig> {
    const response = await this.fetchWithAuth('/fetcher/config', {
      method: 'PATCH',
      body: JSON.stringify(config)
    });

    return response.json();
  }

  /**
   * Get current fetcher configuration
   */
  async getConfig(): Promise<FetcherConfig> {
    const response = await this.fetchWithAuth('/fetcher/config');
    return response.json();
  }

  /**
   * Get fetcher statistics
   */
  async getStats(): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    currentRate: number;
  }> {
    const response = await this.fetchWithAuth('/fetcher/stats');
    return response.json();
  }

  /**
   * Get recent fetch errors
   */
  async getRecentErrors(limit: number = 50): Promise<Array<{
    url: string;
    error: string;
    timestamp: Date;
    retryCount: number;
  }>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await this.fetchWithAuth(`/fetcher/errors?${params.toString()}`);
    return response.json();
  }

  /**
   * Reset fetcher statistics
   */
  async resetStats(): Promise<void> {
    const response = await this.fetchWithAuth('/fetcher/stats/reset', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to reset stats: ${response.status}`);
    }
  }

  /**
   * Check if fetcher is currently rate limited
   */
  async isRateLimited(): Promise<{
    isLimited: boolean;
    retryAfter?: number;
  }> {
    const response = await this.fetchWithAuth('/fetcher/rate-limit/status');
    return response.json();
  }

  /**
   * Adjust rate limit dynamically
   */
  async adjustRateLimit(newLimit: number): Promise<void> {
    const response = await this.fetchWithAuth('/fetcher/rate-limit/adjust', {
      method: 'POST',
      body: JSON.stringify({ newLimit })
    });

    if (!response.ok) {
      throw new Error(`Failed to adjust rate limit: ${response.status}`);
    }
  }

  /**
   * Validate response content for errors or captchas
   */
  async validateResponse(content: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const response = await this.fetchWithAuth('/fetcher/validate', {
      method: 'POST',
      body: JSON.stringify({ content })
    });

    return response.json();
  }

  /**
   * Get fetcher health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    lastSuccessfulFetch: Date;
  }> {
    const response = await this.fetchWithAuth('/fetcher/health');
    return response.json();
  }
}