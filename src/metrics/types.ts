/**
 * Metrics types for application and business metrics collection
 */

export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface MetricLabel {
  name: string;
  value: string;
}

export interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface CounterMetric {
  type: 'counter';
  name: string;
  help: string;
  values: MetricValue[];
}

export interface GaugeMetric {
  type: 'gauge';
  name: string;
  help: string;
  values: MetricValue[];
}

export interface HistogramBucket {
  upperBound: number;
  count: number;
}

export interface HistogramMetric {
  type: 'histogram';
  name: string;
  help: string;
  buckets: HistogramBucket[];
  sum: number;
  count: number;
  values: MetricValue[];
}

export type Metric = CounterMetric | GaugeMetric | HistogramMetric;

export interface MetricsSnapshot {
  timestamp: Date;
  metrics: Metric[];
}

// Application Metrics
export interface ApplicationMetrics {
  // ETL Pipeline metrics
  etlRunsTotal: CounterMetric;
  etlRunsFailed: CounterMetric;
  etlDurationSeconds: HistogramMetric;
  etlRecordsProcessed: CounterMetric;
  etlLagMinutes: GaugeMetric;

  // API metrics
  apiRequestsTotal: CounterMetric;
  apiErrorsTotal: CounterMetric;
  apiLatencySeconds: HistogramMetric;

  // Database metrics
  dbConnectionsActive: GaugeMetric;
  dbConnectionPoolUtilization: GaugeMetric;
  dbQueryDurationSeconds: HistogramMetric;
}

// Business Metrics
export interface BusinessMetrics {
  // Permit metrics
  permitsIngestedTotal: CounterMetric;
  permitsByStatus: CounterMetric;
  permitsByOperator: CounterMetric;
  permitsByCounty: CounterMetric;

  // Alert metrics
  alertsTriggeredTotal: CounterMetric;
  alertsDeliveredTotal: CounterMetric;
  alertsFailedTotal: CounterMetric;

  // User metrics
  activeUsers: GaugeMetric;
  activeWorkspaces: GaugeMetric;
  searchesPerformed: CounterMetric;
}

// Prometheus export format
export interface PrometheusMetricLine {
  line: string;
}

export interface MetricsCollectorConfig {
  serviceName: string;
  serviceVersion: string;
  defaultLabels?: Record<string, string>;
  histogramBuckets?: number[];
}

export const DEFAULT_HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
