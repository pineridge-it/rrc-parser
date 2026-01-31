import {
  UUID
} from '../../types/common';

export interface BackfillConfig {
  startDate: Date;
  endDate: Date;
  batchSize: number;
  delayBetweenBatches: number;  // ms
  dryRun: boolean;
  resume: boolean;  // Resume from last checkpoint
}

export interface BackfillProgress {
  totalDays: number;
  completedDays: number;
  totalRecords: number;
  processedRecords: number;
  errors: number;
  startedAt: Date;
  estimatedCompletion: Date;
}

export interface BackfillResult {
  id: UUID;
  config: BackfillConfig;
  progress: BackfillProgress;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export interface BackfillCheckpoint {
  id: UUID;
  backfillId: UUID;
  lastProcessedDate: Date;
  progress: BackfillProgress;
  createdAt: Date;
}

export interface BackfillServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Service for backfilling historical permit data
 */
export class BackfillService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: BackfillServiceConfig) {
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
   * Start a new backfill job
   */
  async startBackfill(config: BackfillConfig): Promise<BackfillResult> {
    const response = await this.fetchWithAuth('/backfill', {
      method: 'POST',
      body: JSON.stringify(config)
    });

    return response.json();
  }

  /**
   * Get progress of a backfill job
   */
  async getBackfillProgress(backfillId: UUID): Promise<BackfillResult> {
    const response = await this.fetchWithAuth(`/backfill/${backfillId}`);
    return response.json();
  }

  /**
   * Cancel a running backfill job
   */
  async cancelBackfill(backfillId: UUID): Promise<void> {
    const response = await this.fetchWithAuth(`/backfill/${backfillId}/cancel`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel backfill: ${response.status}`);
    }
  }

  /**
   * List all backfill jobs
   */
  async listBackfills(options?: {
    limit?: number;
    offset?: number;
    status?: 'running' | 'completed' | 'failed' | 'cancelled';
  }): Promise<BackfillResult[]> {
    const params = new URLSearchParams();
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.status) params.append('status', options.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetchWithAuth(`/backfill${queryString}`);
    return response.json();
  }

  /**
   * Get checkpoints for a backfill job
   */
  async getCheckpoints(backfillId: UUID): Promise<BackfillCheckpoint[]> {
    const response = await this.fetchWithAuth(`/backfill/${backfillId}/checkpoints`);
    return response.json();
  }

  /**
   * Retry a failed backfill job
   */
  async retryBackfill(backfillId: UUID): Promise<BackfillResult> {
    const response = await this.fetchWithAuth(`/backfill/${backfillId}/retry`, {
      method: 'POST'
    });

    return response.json();
  }

  /**
   * Get backfill configuration presets
   */
  async getConfigPresets(): Promise<{
    last30Days: BackfillConfig;
    last90Days: BackfillConfig;
    lastYear: BackfillConfig;
  }> {
    const response = await this.fetchWithAuth('/backfill/presets');
    return response.json();
  }

  /**
   * Validate backfill configuration
   */
  async validateConfig(config: BackfillConfig): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const response = await this.fetchWithAuth('/backfill/validate', {
      method: 'POST',
      body: JSON.stringify(config)
    });

    return response.json();
  }

  /**
   * Estimate backfill duration
   */
  async estimateDuration(config: BackfillConfig): Promise<{
    estimatedHours: number;
    estimatedRecords: number;
    recommendedBatchSize: number;
  }> {
    const response = await this.fetchWithAuth('/backfill/estimate', {
      method: 'POST',
      body: JSON.stringify(config)
    });

    return response.json();
  }
}