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
  ETLRunRecord
} from './types';

export {
  DataFreshnessService,
  dataFreshnessService,
  DEFAULT_FRESHNESS_CONFIG
} from './DataFreshnessService';

// Alert Notification exports
export {
  AlertNotificationService,
  AlertNotificationConfig,
  DEFAULT_NOTIFICATION_CONFIG,
  EmailChannel,
  SlackChannel,
  PagerDutyChannel,
  ConsoleChannel,
  NotificationChannel,
  alertNotificationService
} from './AlertNotificationService';

// Health Check exports
export {
  HealthCheckService,
  HealthCheckConfig,
  DEFAULT_HEALTH_CHECK_CONFIG,
  healthCheckService,
  HealthStatus,
  ComponentHealth,
  SystemHealth
} from './HealthCheckService';

// ETL Database exports
export {
  EtlDatabaseService,
  EtlDatabaseConfig
} from './EtlDatabaseService';

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
