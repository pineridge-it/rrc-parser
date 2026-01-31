import {
  UUID
} from '../../types/common';

export interface LoaderConfig {
  batchSize: number;
  onConflict: 'skip' | 'update' | 'error';
}

export interface LoadResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: LoadError[];
  duration: number;
}

export interface LoadError {
  recordId?: string;
  error: string;
  timestamp: Date;
}

export interface RawPermit {
  id?: UUID;
  source_type: string;
  source_url?: string;
  source_file?: string;
  raw_data: string;
  raw_hash: string;
  line_number?: number;
  record_length?: number;
  etl_run_id: UUID;
  ingestion_batch_id?: UUID;
  source_seen_at: Date;
  source_effective_at?: Date;
  fetched_at?: Date;
  parsed_at?: Date;
  processing_status?: string;
  parse_error?: string;
  parse_attempts?: number;
  clean_id?: UUID;
  metadata?: Record<string, any>;
}

export interface CleanPermit {
  id?: UUID;
  raw_id?: UUID;
  permit_number: string;
  permit_type?: string;
  status?: string;
  operator_name_raw?: string;
  operator_id?: UUID;
  county?: string;
  district?: string;
  lease_name?: string;
  well_number?: string;
  api_number?: string;
  location?: any; // PostGIS geometry
  surface_lat?: number;
  surface_lon?: number;
  filed_date?: Date;
  approved_date?: Date;
  effective_at?: Date;
  source_seen_at: Date;
  metadata?: Record<string, any>;
  version?: number;
}

export interface PermitLoaderServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Service for batch loading permits with UPSERT and conflict handling
 */
export class PermitLoaderService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: PermitLoaderServiceConfig) {
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
   * Load raw permits with UPSERT semantics
   */
  async loadRaw(permits: RawPermit[], batchId?: UUID): Promise<LoadResult> {
    const response = await this.fetchWithAuth('/permits/load/raw', {
      method: 'POST',
      body: JSON.stringify({ permits, batchId })
    });

    return response.json();
  }

  /**
   * Load clean permits with UPSERT semantics
   */
  async loadClean(permits: CleanPermit[]): Promise<LoadResult> {
    const response = await this.fetchWithAuth('/permits/load/clean', {
      method: 'POST',
      body: JSON.stringify({ permits })
    });

    return response.json();
  }

  /**
   * Rollback a batch by ID
   */
  async rollbackBatch(batchId: UUID): Promise<void> {
    const response = await this.fetchWithAuth(`/permits/load/rollback/${batchId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to rollback batch: ${response.status}`);
    }
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: UUID): Promise<{
    id: UUID;
    status: 'loading' | 'completed' | 'failed' | 'rolled_back';
    progress: {
      total: number;
      processed: number;
      inserted: number;
      updated: number;
      skipped: number;
      errors: number;
    };
    startedAt: Date;
    completedAt?: Date;
    errors: LoadError[];
  }> {
    const response = await this.fetchWithAuth(`/permits/load/batch/${batchId}`);
    return response.json();
  }

  /**
   * List batches
   */
  async listBatches(options?: {
    limit?: number;
    offset?: number;
    status?: 'loading' | 'completed' | 'failed' | 'rolled_back';
  }): Promise<Array<{
    id: UUID;
    status: 'loading' | 'completed' | 'failed' | 'rolled_back';
    progress: {
      total: number;
      processed: number;
    };
    startedAt: Date;
    completedAt?: Date;
  }>> {
    const params = new URLSearchParams();
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.status) params.append('status', options.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetchWithAuth(`/permits/load/batches${queryString}`);
    return response.json();
  }

  /**
   * Configure loader settings
   */
  async configure(config: Partial<LoaderConfig>): Promise<LoaderConfig> {
    const response = await this.fetchWithAuth('/permits/load/config', {
      method: 'PATCH',
      body: JSON.stringify(config)
    });

    return response.json();
  }

  /**
   * Get current loader configuration
   */
  async getConfig(): Promise<LoaderConfig> {
    const response = await this.fetchWithAuth('/permits/load/config');
    return response.json();
  }

  /**
   * Validate permits before loading
   */
  async validatePermits(
    permits: RawPermit[] | CleanPermit[],
    type: 'raw' | 'clean'
  ): Promise<{
    valid: boolean;
    errors: LoadError[];
    warnings: string[];
  }> {
    const response = await this.fetchWithAuth('/permits/load/validate', {
      method: 'POST',
      body: JSON.stringify({ permits, type })
    });

    return response.json();
  }

  /**
   * Estimate loading time for a batch
   */
  async estimateLoadingTime(
    permits: RawPermit[] | CleanPermit[],
    type: 'raw' | 'clean'
  ): Promise<{
    estimatedSeconds: number;
    estimatedThroughput: number; // records per second
    recommendedBatchSize: number;
  }> {
    const response = await this.fetchWithAuth('/permits/load/estimate', {
      method: 'POST',
      body: JSON.stringify({ permits, type })
    });

    return response.json();
  }
}