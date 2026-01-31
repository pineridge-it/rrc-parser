import {
  MetricType,
  Metric,
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  HistogramBucket,
  MetricValue,
  MetricsSnapshot,
  MetricsCollectorConfig,
  DEFAULT_HISTOGRAM_BUCKETS,
  PrometheusMetricLine
} from './types';

/**
 * MetricsCollector provides a centralized service for collecting and exporting
 * application and business metrics in Prometheus-compatible format.
 */
export class MetricsCollector {
  private metrics: Map<string, Metric> = new Map();
  private config: MetricsCollectorConfig;
  private readonly histogramBuckets: number[];

  constructor(config: MetricsCollectorConfig) {
    this.config = {
      defaultLabels: {},
      histogramBuckets: DEFAULT_HISTOGRAM_BUCKETS,
      ...config
    };
    this.histogramBuckets = this.config.histogramBuckets || DEFAULT_HISTOGRAM_BUCKETS;
  }

  /**
   * Create or get a counter metric
   */
  counter(name: string, help: string): CounterMetric {
    if (!this.metrics.has(name)) {
      const metric: CounterMetric = {
        type: 'counter',
        name,
        help,
        values: []
      };
      this.metrics.set(name, metric);
    }
    return this.metrics.get(name) as CounterMetric;
  }

  /**
   * Create or get a gauge metric
   */
  gauge(name: string, help: string): GaugeMetric {
    if (!this.metrics.has(name)) {
      const metric: GaugeMetric = {
        type: 'gauge',
        name,
        help,
        values: []
      };
      this.metrics.set(name, metric);
    }
    return this.metrics.get(name) as GaugeMetric;
  }

  /**
   * Create or get a histogram metric
   */
  histogram(name: string, help: string, buckets?: number[]): HistogramMetric {
    if (!this.metrics.has(name)) {
      const metric: HistogramMetric = {
        type: 'histogram',
        name,
        help,
        buckets: (buckets || this.histogramBuckets).map(b => ({ upperBound: b, count: 0 })),
        sum: 0,
        count: 0,
        values: []
      };
      this.metrics.set(name, metric);
    }
    return this.metrics.get(name) as HistogramMetric;
  }

  /**
   * Increment a counter metric
   */
  inc(name: string, value: number = 1, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      throw new Error(`Metric ${name} not found. Create it first with counter().`);
    }
    if (metric.type !== 'counter') {
      throw new Error(`Metric ${name} is not a counter`);
    }

    const counter = metric as CounterMetric;
    counter.values.push({
      value,
      timestamp: new Date(),
      labels: { ...this.config.defaultLabels, ...labels }
    });
  }

  /**
   * Set a gauge metric value
   */
  set(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      throw new Error(`Metric ${name} not found. Create it first with gauge().`);
    }
    if (metric.type !== 'gauge') {
      throw new Error(`Metric ${name} is not a gauge`);
    }

    const gauge = metric as GaugeMetric;
    gauge.values.push({
      value,
      timestamp: new Date(),
      labels: { ...this.config.defaultLabels, ...labels }
    });
  }

  /**
   * Observe a value in a histogram
   */
  observe(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      throw new Error(`Metric ${name} not found. Create it first with histogram().`);
    }
    if (metric.type !== 'histogram') {
      throw new Error(`Metric ${name} is not a histogram`);
    }

    const histogram = metric as HistogramMetric;
    histogram.sum += value;
    histogram.count += 1;

    // Update buckets
    for (const bucket of histogram.buckets) {
      if (value <= bucket.upperBound) {
        bucket.count += 1;
      }
    }

    histogram.values.push({
      value,
      timestamp: new Date(),
      labels: { ...this.config.defaultLabels, ...labels }
    });
  }

  /**
   * Start a timer and return a function to stop it
   */
  startTimer(name: string, labels?: Record<string, string>): () => void {
    const startTime = process.hrtime.bigint();
    return () => {
      const endTime = process.hrtime.bigint();
      const durationSeconds = Number(endTime - startTime) / 1e9;
      this.observe(name, durationSeconds, labels);
    };
  }

  /**
   * Get a snapshot of all metrics
   */
  getSnapshot(): MetricsSnapshot {
    return {
      timestamp: new Date(),
      metrics: Array.from(this.metrics.values())
    };
  }

  /**
   * Get a specific metric by name
   */
  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Export metrics in Prometheus text format
   */
  toPrometheusFormat(): string {
    const lines: string[] = [];

    // Add header
    lines.push(`# HELP service_info Service information`);
    lines.push(`# TYPE service_info gauge`);
    lines.push(`service_info{service="${this.config.serviceName}",version="${this.config.serviceVersion}"} 1`);
    lines.push('');

    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      if (metric.type === 'histogram') {
        lines.push(...this.formatHistogram(metric as HistogramMetric));
      } else {
        lines.push(...this.formatSimpleMetric(metric));
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  private formatHistogram(histogram: HistogramMetric): string[] {
    const lines: string[] = [];

    // Format buckets
    for (const bucket of histogram.buckets) {
      const labelStr = this.formatLabels({ le: bucket.upperBound.toString() });
      lines.push(`${histogram.name}_bucket${labelStr} ${bucket.count}`);
    }

    // Add +Inf bucket
    const infLabelStr = this.formatLabels({ le: '+Inf' });
    lines.push(`${histogram.name}_bucket${infLabelStr} ${histogram.count}`);

    // Sum and count
    lines.push(`${histogram.name}_sum ${histogram.sum}`);
    lines.push(`${histogram.name}_count ${histogram.count}`);

    return lines;
  }

  private formatSimpleMetric(metric: CounterMetric | GaugeMetric): string[] {
    const lines: string[] = [];

    // Aggregate values by label combination
    const aggregated = this.aggregateByLabels(metric.values);

    for (const [labelKey, value] of aggregated.entries()) {
      const labels = labelKey ? JSON.parse(labelKey) : {};
      const labelStr = this.formatLabels(labels);
      lines.push(`${metric.name}${labelStr} ${value}`);
    }

    return lines;
  }

  private aggregateByLabels(values: MetricValue[]): Map<string, number> {
    const aggregated = new Map<string, number>();

    for (const value of values) {
      const labelKey = value.labels ? JSON.stringify(value.labels) : '';
      const current = aggregated.get(labelKey) || 0;
      aggregated.set(labelKey, current + value.value);
    }

    return aggregated;
  }

  private formatLabels(labels: Record<string, string>): string {
    const entries = Object.entries({ ...this.config.defaultLabels, ...labels });
    if (entries.length === 0) {
      return '';
    }

    const labelPairs = entries
      .map(([k, v]) => `${k}="${this.escapeLabel(v)}"`)
      .join(',');

    return `{${labelPairs}}`;
  }

  private escapeLabel(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
  }
}

/**
 * Singleton instance for application-wide metrics
 */
let globalCollector: MetricsCollector | null = null;

export function initializeMetricsCollector(config: MetricsCollectorConfig): MetricsCollector {
  globalCollector = new MetricsCollector(config);
  return globalCollector;
}

export function getMetricsCollector(): MetricsCollector {
  if (!globalCollector) {
    throw new Error('MetricsCollector not initialized. Call initializeMetricsCollector() first.');
  }
  return globalCollector;
}
