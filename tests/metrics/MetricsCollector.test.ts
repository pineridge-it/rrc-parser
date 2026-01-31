import { MetricsCollector } from '../../src/metrics/MetricsCollector';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector({
      serviceName: 'test-service',
      serviceVersion: '1.0.0',
      defaultLabels: { env: 'test' }
    });
  });

  afterEach(() => {
    collector.clear();
  });

  describe('Counter', () => {
    it('should create a counter metric', () => {
      const counter = collector.counter('test_counter', 'A test counter');
      expect(counter.type).toBe('counter');
      expect(counter.name).toBe('test_counter');
      expect(counter.help).toBe('A test counter');
    });

    it('should increment a counter', () => {
      collector.counter('requests_total', 'Total requests');
      collector.inc('requests_total');
      collector.inc('requests_total', 5);

      const metric = collector.getMetric('requests_total') as any;
      expect(metric.values.length).toBe(2);
      expect(metric.values[0].value).toBe(1);
      expect(metric.values[1].value).toBe(5);
    });

    it('should increment with labels', () => {
      collector.counter('requests_total', 'Total requests');
      collector.inc('requests_total', 1, { method: 'GET', status: '200' });

      const metric = collector.getMetric('requests_total') as any;
      expect(metric.values[0].labels).toEqual({ env: 'test', method: 'GET', status: '200' });
    });

    it('should throw on non-existent counter', () => {
      expect(() => collector.inc('non_existent')).toThrow('Metric non_existent not found');
    });

    it('should throw when using wrong metric type', () => {
      collector.gauge('temperature', 'Current temperature');
      expect(() => collector.inc('temperature')).toThrow('not a counter');
    });
  });

  describe('Gauge', () => {
    it('should create a gauge metric', () => {
      const gauge = collector.gauge('temperature', 'Current temperature');
      expect(gauge.type).toBe('gauge');
      expect(gauge.name).toBe('temperature');
    });

    it('should set gauge values', () => {
      collector.gauge('active_connections', 'Active connections');
      collector.set('active_connections', 10);
      collector.set('active_connections', 5);

      const metric = collector.getMetric('active_connections') as any;
      expect(metric.values.length).toBe(2);
      expect(metric.values[0].value).toBe(10);
      expect(metric.values[1].value).toBe(5);
    });

    it('should set with labels', () => {
      collector.gauge('memory_usage', 'Memory usage');
      collector.set('memory_usage', 1024, { instance: 'server1' });

      const metric = collector.getMetric('memory_usage') as any;
      expect(metric.values[0].labels).toEqual({ env: 'test', instance: 'server1' });
    });
  });

  describe('Histogram', () => {
    it('should create a histogram metric', () => {
      const histogram = collector.histogram('request_duration', 'Request duration');
      expect(histogram.type).toBe('histogram');
      expect(histogram.name).toBe('request_duration');
      expect(histogram.buckets.length).toBeGreaterThan(0);
    });

    it('should observe values', () => {
      collector.histogram('request_duration', 'Request duration');
      collector.observe('request_duration', 0.05);
      collector.observe('request_duration', 0.1);
      collector.observe('request_duration', 0.5);

      const metric = collector.getMetric('request_duration') as any;
      expect(metric.count).toBe(3);
      expect(metric.sum).toBe(0.65);
    });

    it('should update buckets correctly', () => {
      collector.histogram('request_duration', 'Request duration', [0.1, 0.5, 1.0]);
      collector.observe('request_duration', 0.05);
      collector.observe('request_duration', 0.3);
      collector.observe('request_duration', 0.8);

      const metric = collector.getMetric('request_duration') as any;
      // 0.05 and 0.3 are <= 0.5
      expect(metric.buckets[1].count).toBe(2);
      // All 3 are <= 1.0
      expect(metric.buckets[2].count).toBe(3);
    });

    it('should use timer for duration', async () => {
      collector.histogram('operation_duration', 'Operation duration');
      const stopTimer = collector.startTimer('operation_duration');

      await new Promise(resolve => setTimeout(resolve, 10));
      stopTimer();

      const metric = collector.getMetric('operation_duration') as any;
      expect(metric.count).toBe(1);
      expect(metric.sum).toBeGreaterThan(0.001);
    });
  });

  describe('Prometheus Export', () => {
    it('should export service info', () => {
      const output = collector.toPrometheusFormat();
      expect(output).toContain('# HELP service_info Service information');
      expect(output).toContain('service_info{service="test-service",version="1.0.0"} 1');
    });

    it('should export counter metrics', () => {
      collector.counter('requests_total', 'Total requests');
      collector.inc('requests_total', 10);

      const output = collector.toPrometheusFormat();
      expect(output).toContain('# HELP requests_total Total requests');
      expect(output).toContain('# TYPE requests_total counter');
      expect(output).toContain('requests_total{env="test"} 10');
    });

    it('should export gauge metrics', () => {
      collector.gauge('temperature', 'Current temperature');
      collector.set('temperature', 25.5);

      const output = collector.toPrometheusFormat();
      expect(output).toContain('# HELP temperature Current temperature');
      expect(output).toContain('# TYPE temperature gauge');
      expect(output).toContain('temperature{env="test"} 25.5');
    });

    it('should export histogram metrics', () => {
      collector.histogram('request_duration', 'Request duration', [0.1, 0.5, 1.0]);
      collector.observe('request_duration', 0.3);

      const output = collector.toPrometheusFormat();
      expect(output).toContain('# HELP request_duration Request duration');
      expect(output).toContain('# TYPE request_duration histogram');
      expect(output).toContain('request_duration_bucket{env="test",le="0.1"} 0');
      expect(output).toContain('request_duration_bucket{env="test",le="0.5"} 1');
      expect(output).toContain('request_duration_sum 0.3');
      expect(output).toContain('request_duration_count 1');
    });

    it('should escape special characters in labels', () => {
      collector.counter('requests_total', 'Total requests');
      collector.inc('requests_total', 1, { path: '/path"with"quotes' });

      const output = collector.toPrometheusFormat();
      expect(output).toContain('path="/path\\"with\\"quotes"');
    });
  });

  describe('Snapshot', () => {
    it('should return snapshot of all metrics', () => {
      collector.counter('counter1', 'Counter 1');
      collector.gauge('gauge1', 'Gauge 1');

      const snapshot = collector.getSnapshot();
      expect(snapshot.metrics.length).toBe(2);
      expect(snapshot.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Clear', () => {
    it('should clear all metrics', () => {
      collector.counter('test', 'Test');
      collector.inc('test');

      collector.clear();

      expect(collector.getMetric('test')).toBeUndefined();
    });
  });
});
