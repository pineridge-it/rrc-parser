/**
 * Monitoring module for ingestion pipeline
 */

export {
  IngestionMonitor,
  IngestionMonitorConfig,
  DEFAULT_SLO_CONFIGS,
  DEFAULT_ALERT_RULES
} from './IngestionMonitor';

export {
  AlertSeverity,
  SLOStatus,
  IngestionMetrics,
  SLOConfig,
  SLOState,
  AlertThreshold,
  Alert,
  AlertRule,
  DashboardMetrics,
  TimeRange,
  MetricsQuery,
  HistoricalMetrics,
  // Data Freshness types
  FreshnessStatus,
  DataFreshness,
  FreshnessIndicatorProps,
  ETLRunRecord,
  DataFreshnessServiceConfig
} from './types';

export {
  DataFreshnessService,
  dataFreshnessService,
  DEFAULT_FRESHNESS_CONFIG
} from './DataFreshnessService';

// Logging exports
export {
  createLogger,
  getRequestContext,
  runWithContext,
  runWithContextAsync,
  generateCorrelationId,
  asyncLocalStorage,
} from '../services/logger';

export type {
  LogLevel,
  LogEntry,
  LoggerConfig,
  RequestContext,
  LogFormatter,
  Logger,
} from '../types/logging';
