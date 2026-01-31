import {
  CleanPermit
} from '../../types/permit';
import { UUID } from '../../types/common';

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface TransformResult {
  success: boolean;
  cleanPermit?: CleanPermit;
  validationErrors: ValidationError[];
  warnings: string[];
}

export interface PermitTransformerServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Service for transforming raw permit data to clean, normalized records with validation
 */
export class PermitTransformerService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: PermitTransformerServiceConfig) {
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
   * Transform raw permit data into clean, normalized format
   */
  async transform(rawPermitId: UUID): Promise<TransformResult> {
    const response = await this.fetchWithAuth(`/transformer/permits/${rawPermitId}`);
    return response.json();
  }

  /**
   * Transform multiple raw permits
   */
  async transformBatch(rawPermitIds: UUID[]): Promise<TransformResult[]> {
    const response = await this.fetchWithAuth('/transformer/permits/batch', {
      method: 'POST',
      body: JSON.stringify({ rawPermitIds })
    });

    return response.json();
  }

  /**
   * Validate a permit record against all validation rules
   */
  async validate(permit: any): Promise<ValidationError[]> {
    const response = await this.fetchWithAuth('/transformer/validate', {
      method: 'POST',
      body: JSON.stringify({ permit })
    });

    return response.json();
  }

  /**
   * Normalize a permit record
   */
  async normalize(permit: any): Promise<any> {
    const response = await this.fetchWithAuth('/transformer/normalize', {
      method: 'POST',
      body: JSON.stringify({ permit })
    });

    return response.json();
  }

  /**
   * Create PostGIS geometry from lat/lon coordinates
   */
  async createGeometry(lat: number, lon: number): Promise<string> {
    const response = await this.fetchWithAuth('/transformer/geometry', {
      method: 'POST',
      body: JSON.stringify({ lat, lon })
    });

    const result = await response.json();
    return result.geometry;
  }

  /**
   * Link an operator name to an operator ID
   */
  async linkOperator(operatorName: string): Promise<UUID> {
    const response = await this.fetchWithAuth('/transformer/operators/link', {
      method: 'POST',
      body: JSON.stringify({ operatorName })
    });

    const result = await response.json();
    return result.operatorId;
  }

  /**
   * Get transformation statistics
   */
  async getStats(): Promise<{
    totalTransformed: number;
    successful: number;
    failed: number;
    averageProcessingTime: number;
  }> {
    const response = await this.fetchWithAuth('/transformer/stats');
    return response.json();
  }

  /**
   * Get recent transformation errors
   */
  async getRecentErrors(limit: number = 50): Promise<Array<{
    permitId: UUID;
    errors: ValidationError[];
    timestamp: Date;
  }>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await this.fetchWithAuth(`/transformer/errors?${params.toString()}`);
    return response.json();
  }

  /**
   * Retry transformation for a failed permit
   */
  async retryTransformation(rawPermitId: UUID): Promise<TransformResult> {
    const response = await this.fetchWithAuth(`/transformer/permits/${rawPermitId}/retry`, {
      method: 'POST'
    });

    return response.json();
  }

  /**
   * Preview transformation for a raw permit without saving
   */
  async previewTransformation(rawPermitId: UUID): Promise<TransformResult> {
    const response = await this.fetchWithAuth(`/transformer/permits/${rawPermitId}/preview`);
    return response.json();
  }

  /**
   * Configure transformer settings
   */
  async configure(settings: {
    strictMode?: boolean;
    maxRetries?: number;
    validationLevel?: 'strict' | 'relaxed';
  }): Promise<void> {
    const response = await this.fetchWithAuth('/transformer/config', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error(`Failed to configure transformer: ${response.status}`);
    }
  }

  /**
   * Get current transformer configuration
   */
  async getConfig(): Promise<{
    strictMode: boolean;
    maxRetries: number;
    validationLevel: 'strict' | 'relaxed';
  }> {
    const response = await this.fetchWithAuth('/transformer/config');
    return response.json();
  }
}