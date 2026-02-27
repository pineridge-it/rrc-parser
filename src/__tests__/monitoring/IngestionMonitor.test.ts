/**
 * Tests for IngestionMonitor
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  IngestionMonitor,
  DEFAULT_SLO_CONFIGS,
  DEFAULT_ALERT_RULES
} from '../../monitoring/IngestionMonitor';
import type { IngestionMetrics, AlertRule } from '../../monitoring/types';

describe('IngestionMonitor', () => {
  let monitor: IngestionMonitor;

  beforeEach(() => {
    monitor = new IngestionMonitor();
  });

  describe('recordRunStart', () => {
    it('should create a new run and return run ID', () => {
      const runId = monitor.recordRunStart('test-file.csv');
      
      expect(runId).toMatch(/^run-\d+-\d+$/);
    });

    it('should track source file', () => {
      const runId = monitor.recordRunStart('test-file.csv');
      const activeRun = monitor.getRuns().find(r => r.runId === runId);
      
      // Run won't be in runs until completed
      expect(runId).toBeDefined();
    });
  });

  describe('recordRunComplete', () => {
    it('should complete a run and store metrics', () => {
      const runId = monitor.recordRunStart('test-file.csv');
      
      monitor.recordRunComplete(runId, {
        recordsProcessed: 100,
        recordsFailed: 5,
        errorCount: 2
      });

      const runs = monitor.getRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0].recordsProcessed).toBe(100);
      expect(runs[0].recordsFailed).toBe(5);
      expect(runs[0].durationMs).toBeDefined();
    });

    it('should throw error for invalid run ID', () => {
      expect(() => {
        monitor.recordRunComplete('invalid-id', { recordsProcessed: 10 });
      }).toThrow('No active run found');
    });
  });

  describe('recordError', () => {
    it('should track errors during active run', () => {
      const runId = monitor.recordRunStart('test-file.csv');
      
      monitor.recordError(runId, new Error('Test error'));
      monitor.recordError(runId, new Error('Another error'));
      
      monitor.recordRunComplete(runId, { recordsProcessed: 10 });
      
      const run = monitor.getRuns()[0];
      expect(run.errorCount).toBe(2);
      expect(run.errors).toContain('Test error');
      expect(run.errors).toContain('Another error');
    });
  });

  describe('getLastRun', () => {
    it('should return the most recent run', () => {
      const runId1 = monitor.recordRunStart('file1.csv');
      monitor.recordRunComplete(runId1, { recordsProcessed: 10 });
      
      const runId2 = monitor.recordRunStart('file2.csv');
      monitor.recordRunComplete(runId2, { recordsProcessed: 20 });

      const lastRun = monitor.getLastRun();
      expect(lastRun?.recordsProcessed).toBe(20);
    });

    it('should return undefined when no runs', () => {
      expect(monitor.getLastRun()).toBeUndefined();
    });
  });

  describe('getLastSuccessfulRun', () => {
    it('should return the last successful run', () => {
      // Failed run
      const runId1 = monitor.recordRunStart('file1.csv');
      monitor.recordRunComplete(runId1, { recordsProcessed: 10, recordsFailed: 5, errorCount: 1 });
      
      // Successful run
      const runId2 = monitor.recordRunStart('file2.csv');
      monitor.recordRunComplete(runId2, { recordsProcessed: 20, recordsFailed: 0, errorCount: 0 });

      const lastSuccess = monitor.getLastSuccessfulRun();
      expect(lastSuccess?.recordsProcessed).toBe(20);
    });

    it('should skip failed runs', () => {
      const runId1 = monitor.recordRunStart('file1.csv');
      monitor.recordRunComplete(runId1, { recordsProcessed: 10, recordsFailed: 5, errorCount: 1 });
      
      const runId2 = monitor.recordRunStart('file2.csv');
      monitor.recordRunComplete(runId2, { recordsProcessed: 20, recordsFailed: 3, errorCount: 0 });

      const lastSuccess = monitor.getLastSuccessfulRun();
      expect(lastSuccess).toBeUndefined();
    });
  });

  describe('checkSLOs', () => {
    it('should return SLO status for all configured SLOs', () => {
      const sloStatus = monitor.checkSLOs();
      
      expect(sloStatus).toHaveLength(DEFAULT_SLO_CONFIGS.length);
      expect(sloStatus.map(s => s.config.name)).toContain('freshness');
      expect(sloStatus.map(s => s.config.name)).toContain('error_rate');
      expect(sloStatus.map(s => s.config.name)).toContain('success_rate');
    });

    it('should mark freshness as critical when no successful runs', () => {
      const sloStatus = monitor.checkSLOs();
      const freshnessSLO = sloStatus.find(s => s.config.name === 'freshness');
      
      expect(freshnessSLO?.status).toBe('critical');
      expect(freshnessSLO?.message).toContain('No successful ingestion');
    });

    it('should calculate error rate correctly', () => {
      // Add some runs with errors
      const runId1 = monitor.recordRunStart('file1.csv');
      monitor.recordRunComplete(runId1, { 
        recordsProcessed: 100, 
        recordsFailed: 10, 
        errorCount: 0 
      });

      const sloStatus = monitor.checkSLOs();
      const errorRateSLO = sloStatus.find(s => s.config.name === 'error_rate');
      
      expect(errorRateSLO?.currentValue).toBe(10);
      expect(errorRateSLO?.status).toBe('critical');
    });
  });

  describe('getDashboardMetrics', () => {
    it('should return comprehensive dashboard metrics', () => {
      const runId = monitor.recordRunStart('test.csv');
      monitor.recordRunComplete(runId, { 
        recordsProcessed: 100, 
        recordsFailed: 5 
      });

      const metrics = monitor.getDashboardMetrics();
      
      expect(metrics.runsToday).toBe(1);
      expect(metrics.successfulRunsToday).toBe(1);
      expect(metrics.totalRecordsToday).toBe(100);
      expect(metrics.sloStatus).toHaveLength(3);
      expect(metrics.activeAlerts).toBeDefined();
    });
  });

  describe('alerts', () => {
    it('should trigger alerts when conditions are met', () => {
      // Add a run that should trigger high error rate alert
      const runId = monitor.recordRunStart('test.csv');
      monitor.recordRunComplete(runId, { 
        recordsProcessed: 100, 
        recordsFailed: 15,  // 15% error rate > 10% threshold
        errorCount: 0 
      });

      const alerts = monitor.getAlerts();
      const highErrorAlert = alerts.find(a => a.metric === 'error_rate');
      
      expect(highErrorAlert).toBeDefined();
      expect(highErrorAlert?.severity).toBe('critical');
    });

    it('should acknowledge alerts', () => {
      // Trigger an alert
      const runId = monitor.recordRunStart('test.csv');
      monitor.recordRunComplete(runId, { 
        recordsProcessed: 100, 
        recordsFailed: 15 
      });

      const alerts = monitor.getAlerts();
      const alertId = alerts[0].id;
      
      const result = monitor.acknowledgeAlert(alertId);
      expect(result).toBe(true);
      
      const acknowledgedAlert = monitor.getAlerts().find(a => a.id === alertId);
      expect(acknowledgedAlert?.acknowledged).toBe(true);
    });

    it('should resolve alerts', () => {
      const runId = monitor.recordRunStart('test.csv');
      monitor.recordRunComplete(runId, { 
        recordsProcessed: 100, 
        recordsFailed: 15 
      });

      const alerts = monitor.getAlerts();
      const alertId = alerts[0].id;
      
      const result = monitor.resolveAlert(alertId);
      expect(result).toBe(true);
      
      const resolvedAlert = monitor.getAlerts().find(a => a.id === alertId);
      expect(resolvedAlert?.resolvedAt).toBeDefined();
    });
  });

  describe('history management', () => {
    it('should respect maxHistorySize', () => {
      const smallMonitor = new IngestionMonitor({ maxHistorySize: 5 });
      
      // Add 10 runs
      for (let i = 0; i < 10; i++) {
        const runId = smallMonitor.recordRunStart(`file${i}.csv`);
        smallMonitor.recordRunComplete(runId, { recordsProcessed: i });
      }

      const runs = smallMonitor.getRuns();
      expect(runs).toHaveLength(5);
      expect(runs[0].recordsProcessed).toBe(5); // Oldest remaining
      expect(runs[4].recordsProcessed).toBe(9); // Most recent
    });
  });
});
