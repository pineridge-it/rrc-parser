import { UUID } from './common';

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

export interface FetchPermitsRequest {
  dateRange: DateRange;
}

export interface FetchPermitDetailRequest {
  permitId: string;
}

export interface FetchPermitBatchRequest {
  permitIds: string[];
}

export interface ConfigureFetcherRequest {
  config: Partial<FetcherConfig>;
}

export interface AdjustRateLimitRequest {
  newLimit: number;
}

export interface ValidateResponseRequest {
  content: string;
}

export interface FetcherStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  currentRate: number;
}

export interface FetchError {
  url: string;
  error: string;
  timestamp: Date;
  retryCount: number;
}

export interface RateLimitStatus {
  isLimited: boolean;
  retryAfter?: number;
}

export interface ResponseValidationResult {
  isValid: boolean;
  issues: string[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastSuccessfulFetch: Date;
}