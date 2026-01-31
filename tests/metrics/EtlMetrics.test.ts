import { MetricsCollector } from '../../src/metrics/MetricsCollector';
import { EtlMetrics } from '../../src/metrics/EtlMetrics';

describe('EtlMetrics', () => {
  let collector: MetricsCollector;
  let etlMetrics: EtlMetrics;

  beforeEach(() => {
    collector = new MetricsCollector({
      serviceName: 'test-service',
      serviceVersion: '1.0.0'
    });
    etlMetrics = new EtlMetrics(collector);
  });

  afterEach(() => {
    collector.clear();
  });

  describe('Run metrics', () => {
    it('should record run start', () => {
      etlMetrics.recordRunStart();

      const metric = collector.getMetric('etl_runs_total') as any;
      expect(metric.values.length).toBe(1);
      expect(metric.values[0].value).toBe(1);
    });

    it('should record run failure', () => {
      etlMetrics.recordRunFailed();

      const metric = collector.getMetric('etl_runs_failed') as any;
      expect(metric.values.length).toBe(1);
      expect(metric.values[0].value).toBe(1);
    });

    it('should record complete run metrics', () => {
      etlMetrics.recordRunComplete({
        durationMs: 5000,
        recordsProcessed: 100,
        recordsFailed: 5,
        recordsSkipped: 2,
        lagMinutes: 30,
        success: true
      });

      const durationMetric = collector.getMetric('etl_duration_seconds') as any;
      expect(durationMetric.count).toBe(1);
      expect(durationMetric.sum).toBe(5);

      const processedMetric = collector.getMetric('etl_records_processed') as any;
      expect(processedMetric.values[0].value).toBe(100);

      const lagMetric = collector.getMetric('etl_lag_minutes') as any;
      expect(lagMetric.values[0].value).toBe(30);
    });

    it('should record failed run', () => {
      etlMetrics.recordRunComplete({
        durationMs: 1000,
        recordsProcessed: 10,
        recordsFailed: 10,
        recordsSkipped: 0,
        success: false
      });

      const failedMetric = collector.getMetric('etl_runs_failed') as any;
      expect(failedMetric.values.length).toBe(1);
    });
  });

  describe('Record metrics', () => {
    it('should record records processed', () => {
      etlMetrics.recordRecordsProcessed(50);

      const metric = collector.getMetric('etl_records_processed') as any;
      expect(metric.values[0].value).toBe(50);

      const perRunMetric = collector.getMetric('etl_records_per_run') as any;
      expect(perRunMetric.values[0].value).toBe(50);
    });

    it('should record records failed', () => {
      etlMetrics.recordRecordsFailed(3);

      const metric = collector.getMetric('etl_records_failed') as any;
      expect(metric.values[0].value).toBe(3);
    });

    it('should record records skipped', () => {
      etlMetrics.recordRecordsSkipped(10);

      const metric = collector.getMetric('etl_records_skipped') as any;
      expect(metric.values[0].value).toBe(10);
    });

    it('should record lag', () => {
      etlMetrics.recordLag(45);

      const metric = collector.getMetric('etl_lag_minutes') as any;
      expect(metric.values[0].value).toBe(45);
    });
  });

  describe('Timer', () => {
    it('should measure duration with timer', async () => {
      const stopTimer = etlMetrics.startDurationTimer();
      await new Promise(resolve => setTimeout(resolve, 50));
      stopTimer();

      const metric = collector.getMetric('etl_duration_seconds') as any;
      expect(metric.count).toBe(1);
      expect(metric.sum).toBeGreaterThan(0.04);
    });
  });
});
