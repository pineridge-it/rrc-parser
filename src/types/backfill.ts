import { UUID } from './common';

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

export interface StartBackfillRequest {
  config: BackfillConfig;
}

export interface ListBackfillsRequest {
  limit?: number;
  offset?: number;
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface ValidateConfigRequest {
  config: BackfillConfig;
}

export interface EstimateDurationRequest {
  config: BackfillConfig;
}

export interface BackfillConfigPresets {
  last30Days: BackfillConfig;
  last90Days: BackfillConfig;
  lastYear: BackfillConfig;
}

export interface BackfillValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DurationEstimateResponse {
  estimatedHours: number;
  estimatedRecords: number;
  recommendedBatchSize: number;
}