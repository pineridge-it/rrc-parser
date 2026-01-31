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
