/**
 * Type definitions for QA Gates
 */

export type CheckSeverity = 'info' | 'warning' | 'error' | 'critical';
export type CheckStage = 'pre-ingestion' | 'post-transform' | 'post-load';

export interface QACheck {
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  severity: CheckSeverity;
  message: string;
  timestamp: Date;
}

export interface QAMetrics {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  nullRates: Record<string, number>;
  duplicateCount: number;
  schemaDriftDetected: boolean;
  newFields: string[];
  missingFields: string[];
  processingTimeMs: number;
}

export interface QAResult {
  stage: CheckStage;
  passed: boolean;
  checks: QACheck[];
  warnings: string[];
  errors: string[];
  criticalErrors: string[];
  metrics: QAMetrics;
  timestamp: Date;
  durationMs: number;
}

export interface VolumeThresholds {
  maxDeltaPercent: number;
  minRecords: number;
  maxRecords?: number;
  alertOnZero: boolean;
}

export interface SchemaThresholds {
  requiredFields: string[];
  allowNewFields: boolean;
  allowMissingFields: boolean;
}

export interface ValueThresholds {
  maxNullRate: number;
  maxFutureDays: number;
  maxPastDays: number;
}

export interface QAGateConfig {
  enabled: boolean;
  failOnError: boolean;
  failOnCritical: boolean;
  volume: VolumeThresholds;
  schema: SchemaThresholds;
  values: ValueThresholds;
  customChecks?: Array<(data: unknown[]) => QACheck>;
}

export const DEFAULT_QA_CONFIG: QAGateConfig = {
  enabled: true,
  failOnError: true,
  failOnCritical: true,
  volume: {
    maxDeltaPercent: 20,
    minRecords: 1,
    alertOnZero: true
  },
  schema: {
    requiredFields: ['permit_number', 'operator_name', 'county'],
    allowNewFields: true,
    allowMissingFields: false
  },
  values: {
    maxNullRate: 0.05,
    maxFutureDays: 1,
    maxPastDays: 18250  // 50 years
  }
};
