/**
 * Monitoring types for ingestion pipeline metrics and alerting
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type SLOStatus = 'healthy' | 'warning' | 'critical';

export interface IngestionMetrics {
  runId: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  recordsProcessed: number;
  recordsFailed: number;
  errorCount: number;
  errors?: string[];
  lagMinutes?: number;
  sourceFile?: string;
  qaPassed?: boolean;
  qaResults?: {
    warnings: number;
    errors: number;
    criticalErrors: number;
  };
}

export interface SLOConfig {
  name: string;
  description: string;
  threshold: number;
  warningThreshold: number;
  unit: 'minutes' | 'percent' | 'count';
  window: '1h' | '24h' | '7d' | '30d';
}

export interface SLOState {
  config: SLOConfig;
  currentValue: number;
  status: SLOStatus;
  compliancePercent: number;
  lastChecked: Date;
  message: string;
}

export interface AlertThreshold {
  metric: string;
  warning?: number;
  critical?: number;
  condition: 'gt' | 'lt' | 'eq';
  windowMinutes: number;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  triggeredAt: Date;
  acknowledged?: boolean;
  resolvedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
    windowMinutes: number;
  };
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export interface DashboardMetrics {
  // Real-time status
  lastRun?: IngestionMetrics;
  lastSuccessfulRun?: Date;
  timeSinceLastRun: number;
  timeSinceLastSuccess: number;
  
  // Current period (24h)
  runsToday: number;
  successfulRunsToday: number;
  failedRunsToday: number;
  totalRecordsToday: number;
  errorRateToday: number;
  
  // SLO compliance
  sloStatus: SLOState[];
  
  // Recent alerts
  activeAlerts: Alert[];
  recentAlerts: Alert[];
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface MetricsQuery {
  timeRange: TimeRange;
  granularity: 'minute' | 'hour' | 'day';
}

export interface HistoricalMetrics {
  timestamps: Date[];
  recordsProcessed: number[];
  errorCounts: number[];
  durations: number[];
  lagMinutes: number[];
}

// ============================================================================
// Data Freshness Types
// ============================================================================

export type FreshnessStatus = 'fresh' | 'stale' | 'critical' | 'unknown';

export interface DataFreshness {
  lastUpdated: Date | null;
  hoursAgo: number | null;
  permitsNew: number;
  permitsUpdated: number;
  permitsProcessed: number;
  status: FreshnessStatus;
  message: string;
}

export interface FreshnessIndicatorProps {
  freshness: DataFreshness;
  showDetails?: boolean;
  className?: string;
}

export interface ETLRunRecord {
  id: string;
  runType: 'incremental' | 'full' | 'backfill';
  status: 'running' | 'success' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  permitsProcessed: number;
  permitsNew: number;
  permitsUpdated: number;
  permitsFailed: number;
  sourceFiles?: string[];
  errorMessage?: string;
  durationMs?: number;
}
