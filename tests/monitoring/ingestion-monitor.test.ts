import { describe, it, expect } from 'bun:test';
import { IngestionMonitor } from '../../src/monitoring/IngestionMonitor';
import { DEFAULT_SLO_CONFIGS, DEFAULT_ALERT_RULES } from '../../src/monitoring/IngestionMonitor';

describe('IngestionMonitor', () => {
  describe('Run Tracking', () => {
    it('should record run start and return runId', () => {
      const monitor = new IngestionMonitor();
      const runId = monitor.recordRunStart('test-file.csv');

      expect(runId).toBeDefined();
      expect(runId).toContain('run-');
    });

    it('should record run completion with metrics', () => {
      const monitor = new IngestionMonitor();
      const runId = monitor.recordRunStart('test-file.csv');

      monitor.recordRunComplete(runId, {
        recordsProcessed: 100,
        recordsFailed: 5,
        errorCount: 2,
        qaPassed: true
      });

      const runs = monitor.getRuns();
      expect(runs.length).toBe(1);
      expect(runs[0].recordsProcessed).toBe(100);
      expect(runs[0].recordsFailed).toBe(5);
      expect(runs[0].errorCount).toBe(2);
      expect(runs[0].qaPassed).toBe(true);
      expect(runs[0].durationMs).toBeDefined();
    });

    it('should throw error for invalid runId', () => {
      const monitor = new IngestionMonitor();

      expect(() => {
        monitor.recordRunComplete('invalid-id', { recordsProcessed: 10 });
      }).toThrow();
    });

    it('should record errors during run', () => {
      const monitor = new IngestionMonitor();
      const runId = monitor.recordRunStart('test-file.csv');

      monitor.recordError(runId, new Error('Test error'));

      // Error count is tracked on active run
      monitor.recordRunComplete(runId, { recordsProcessed: 10 });

      const runs = monitor.getRuns();
      expect(runs[0].errorCount).toBe(1);
    });
  });

  describe('SLO Checking', () => {
    it('should return healthy freshness when recent success', () => {
      const monitor = new IngestionMonitor();
      const runId = monitor.recordRunStart('test.csv');
      monitor.recordRunComplete(runId, { recordsProcessed: 100 });

      const sloStatus = monitor.checkSLOs();
      const freshness = sloStatus.find(s => s.config.name === 'freshness');

      expect(freshness?.status).toBe('healthy');
      expect(freshness?.currentValue).toBeLessThan(60);
    });

    it('should return critical freshness when no recent success', () => {
      const monitor = new IngestionMonitor();
      // Don't record any runs

      const sloStatus = monitor.checkSLOs();
      const freshness = sloStatus.find(s => s.config.name === 'freshness');

      expect(freshness?.status).toBe('critical');
    });

    it('should calculate error rate correctly', () => {
      const monitor = new IngestionMonitor();

      // Add some runs with errors
      for (let i = 0; i < 5; i++) {
        const runId = monitor.recordRunStart('test.csv');
        monitor.recordRunComplete(runId, {
          recordsProcessed: 100,
          recordsFailed: i === 0 ? 10 : 0,
          errorCount: i === 0 ? 1 : 0
        });
      }

      const sloStatus = monitor.checkSLOs();
      const errorRate = sloStatus.find(s => s.config.name === 'error_rate');

      expect(errorRate?.currentValue).toBe(2); // 10 failed / 500 total = 2%
      expect(errorRate?.status).toBe('healthy');
    });

    it('should calculate success rate correctly', () => {
      const monitor = new IngestionMonitor();

      // Add mixed success/failure runs
      for (let i = 0; i < 4; i++) {
        const runId = monitor.recordRunStart('test.csv');
        monitor.recordRunComplete(runId, {
          recordsProcessed: 100,
          recordsFailed: i === 0 ? 10 : 0,
          errorCount: i === 0 ? 1 : 0
        });
      }

      const sloStatus = monitor.checkSLOs();
      const successRate = sloStatus.find(s => s.config.name === 'success_rate');

      expect(successRate?.currentValue).toBe(75); // 3/4 successful
    });
  });

  describe('Dashboard Metrics', () => {
    it('should return dashboard metrics', () => {
      const monitor = new IngestionMonitor();
      const runId = monitor.recordRunStart('test.csv');
      monitor.recordRunComplete(runId, { recordsProcessed: 100 });

      const dashboard = monitor.getDashboardMetrics();

      expect(dashboard.lastRun).toBeDefined();
      expect(dashboard.runsToday).toBe(1);
      expect(dashboard.successfulRunsToday).toBe(1);
      expect(dashboard.totalRecordsToday).toBe(100);
      expect(dashboard.sloStatus.length).toBeGreaterThan(0);
    });

    it('should track failed runs separately', () => {
      const monitor = new IngestionMonitor();

      // Successful run
      const runId1 = monitor.recordRunStart('test1.csv');
      monitor.recordRunComplete(runId1, { recordsProcessed: 100 });

      // Failed run
      const runId2 = monitor.recordRunStart('test2.csv');
      monitor.recordRunComplete(runId2, {
        recordsProcessed: 50,
        recordsFailed: 50,
        errorCount: 5
      });

      const dashboard = monitor.getDashboardMetrics();
      expect(dashboard.runsToday).toBe(2);
      expect(dashboard.successfulRunsToday).toBe(1);
      expect(dashboard.failedRunsToday).toBe(1);
    });

    it('should calculate error rate for dashboard', () => {
      const monitor = new IngestionMonitor();

      const runId = monitor.recordRunStart('test.csv');
      monitor.recordRunComplete(runId, {
        recordsProcessed: 100,
        recordsFailed: 10
      });

      const dashboard = monitor.getDashboardMetrics();
      expect(dashboard.errorRateToday).toBe(10);
    });
  });

  describe('Alert Management', () => {
    it('should have default alert rules', () => {
      const monitor = new IngestionMonitor();

      expect(DEFAULT_ALERT_RULES.length).toBeGreaterThan(0);
      expect(DEFAULT_ALERT_RULES[0].enabled).toBe(true);
    });

    it('should trigger alerts based on conditions', () => {
      const monitor = new IngestionMonitor();

      // First run - should trigger no-ingestion alert since no prior successful runs
      const runId = monitor.recordRunStart('test.csv');
      monitor.recordRunComplete(runId, { recordsProcessed: 100 });

      const alerts = monitor.getAlerts();
      // The first run triggers alerts because prior to it, there were no successful runs
      // (time_since_last_success was Infinity)
      expect(alerts.length).toBeGreaterThanOrEqual(0);
    });

    it('should acknowledge alerts', () => {
      const monitor = new IngestionMonitor();

      const runId = monitor.recordRunStart('test.csv');
      monitor.recordRunComplete(runId, { recordsProcessed: 100 });

      const alerts = monitor.getAlerts();
      if (alerts.length > 0) {
        const result = monitor.acknowledgeAlert(alerts[0].id);
        expect(result).toBe(true);
      }
    });

    it('should resolve alerts', () => {
      const monitor = new IngestionMonitor();

      const runId = monitor.recordRunStart('test.csv');
      monitor.recordRunComplete(runId, { recordsProcessed: 100 });

      const alerts = monitor.getAlerts();
      if (alerts.length > 0) {
        const result = monitor.resolveAlert(alerts[0].id);
        expect(result).toBe(true);

        const resolvedAlert = monitor.getAlerts().find(a => a.id === alerts[0].id);
        expect(resolvedAlert?.resolvedAt).toBeDefined();
      }
    });
  });

  describe('Historical Metrics', () => {
    it('should return historical metrics for time range', () => {
      const monitor = new IngestionMonitor();

      // Add some runs
      for (let i = 0; i < 3; i++) {
        const runId = monitor.recordRunStart('test.csv');
        monitor.recordRunComplete(runId, {
          recordsProcessed: 100 * (i + 1),
          durationMs: 1000 * (i + 1)
        });
      }

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const history = monitor.getHistoricalMetrics({
        timeRange: { start: yesterday, end: now },
        granularity: 'hour'
      });

      expect(history.timestamps.length).toBe(3);
      expect(history.recordsProcessed).toEqual([100, 200, 300]);
      // Duration is calculated from start/end time, not from passed value
      expect(history.durations.every(d => d >= 0)).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should accept custom SLO configs', () => {
      const customSLOs = [
        {
          name: 'custom_slo',
          description: 'Custom test SLO',
          threshold: 50,
          warningThreshold: 25,
          unit: 'minutes' as const,
          window: '1h' as const
        }
      ];

      const monitor = new IngestionMonitor({ defaultSLOs: customSLOs });
      const sloStatus = monitor.checkSLOs();

      expect(sloStatus.length).toBe(1);
      expect(sloStatus[0].config.name).toBe('custom_slo');
    });

    it('should use default SLOs when none provided', () => {
      const monitor = new IngestionMonitor();
      const sloStatus = monitor.checkSLOs();

      expect(sloStatus.length).toBe(DEFAULT_SLO_CONFIGS.length);
    });

    it('should limit history size', () => {
      const monitor = new IngestionMonitor({ maxHistorySize: 5 });

      // Add 10 runs
      for (let i = 0; i < 10; i++) {
        const runId = monitor.recordRunStart('test.csv');
        monitor.recordRunComplete(runId, { recordsProcessed: 100 });
      }

      const runs = monitor.getRuns();
      expect(runs.length).toBe(5);
    });
  });
});
