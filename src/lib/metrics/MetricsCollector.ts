export interface MetricOptions {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface HistogramMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export interface CounterMetric {
  name: string;
  increment?: number;
  tags?: Record<string, string>;
}

export interface GaugeMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export interface MetricsSummary {
  counters: Map<string, number>;
  gauges: Map<string, number>;
  histograms: Map<string, number[]>;
  timestamp: Date;
}

export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  constructor(_service: string) {
  }

  incrementCounter(metric: CounterMetric): void {
    const key = this.buildKey(metric.name, metric.tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + (metric.increment || 1));
  }

  setGauge(metric: GaugeMetric): void {
    const key = this.buildKey(metric.name, metric.tags);
    this.gauges.set(key, metric.value);
  }

  recordHistogram(metric: HistogramMetric): void {
    const key = this.buildKey(metric.name, metric.tags);
    const values = this.histograms.get(key) || [];
    values.push(metric.value);
    this.histograms.set(key, values);
  }

  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.recordHistogram({ name: `${name}.duration_ms`, value: durationMs, tags });
  }

  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.timing(name, duration, tags);
      this.incrementCounter({ name: `${name}.success`, tags });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.timing(name, duration, tags);
      this.incrementCounter({ name: `${name}.error`, tags });
      throw error;
    }
  }

  getPercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    const safeIndex = Math.max(0, Math.min(index, sorted.length - 1));
    return sorted[safeIndex] ?? 0;
  }

  getSummary(): MetricsSummary {
    return {
      counters: new Map(this.counters),
      gauges: new Map(this.gauges),
      histograms: new Map(this.histograms),
      timestamp: new Date(),
    };
  }

  getHistogramStats(name: string, tags?: Record<string, string>): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.buildKey(name, tags);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = sum / values.length;

    return {
      count: values.length,
      min,
      max,
      avg,
      p50: this.getPercentile(values, 50),
      p95: this.getPercentile(values, 95),
      p99: this.getPercentile(values, 99),
    };
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    return `${name}[${tagString}]`;
  }

  exportPrometheus(): string {
    const lines: string[] = [];

    this.counters.forEach((value, key) => {
      const [name, tags] = this.parseKey(key);
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name}${tags} ${value}`);
    });

    this.gauges.forEach((value, key) => {
      const [name, tags] = this.parseKey(key);
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name}${tags} ${value}`);
    });

    this.histograms.forEach((_values, key) => {
      const [name, tags] = this.parseKey(key);
      const stats = this.getHistogramStats(name);
      if (stats) {
        lines.push(`# TYPE ${name} histogram`);
        lines.push(`${name}_count${tags} ${stats.count}`);
        lines.push(`${name}_sum${tags} ${stats.avg * stats.count}`);
        lines.push(`${name}_p50${tags} ${stats.p50}`);
        lines.push(`${name}_p95${tags} ${stats.p95}`);
        lines.push(`${name}_p99${tags} ${stats.p99}`);
      }
    });

    return lines.join('\n');
  }

  private parseKey(key: string): [string, string] {
    const match = key.match(/^([^\[]+)(?:\[(.+)\])?$/);
    if (!match) return [key, ''];

    const name = match[1];
    const tagString = match[2];
    
    if (!name) return [key, ''];
    if (!tagString) return [name, ''];

    const tags = tagString
      .split(',')
      .map((tag) => {
        const [k, v] = tag.split(':');
        return `${k}="${v}"`;
      })
      .join(',');

    return [name, `{${tags}}`];
  }
}

const defaultMetrics = new MetricsCollector('rrc-app');

export default defaultMetrics;
