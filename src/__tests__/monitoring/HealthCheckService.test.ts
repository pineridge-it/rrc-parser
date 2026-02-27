/**
 * Tests for HealthCheckService
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  HealthCheckService,
  DEFAULT_HEALTH_CHECK_CONFIG
} from '../../monitoring/HealthCheckService';
import { IngestionMonitor } from '../../monitoring/IngestionMonitor';
import { DataFreshnessService } from '../../monitoring/DataFreshnessService';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let mockIngestionMonitor: jest.Mocked<IngestionMonitor>;
  let mockFreshnessService: jest.Mocked<DataFreshnessService>;

  beforeEach(() => {
    mockIngestionMonitor = {
      getDashboardMetrics: jest.fn(),
      checkSLOs: jest.fn(),
    } as unknown as jest.Mocked<IngestionMonitor>;

    mockFreshnessService = {
      getDataFreshness: jest.fn(),
    } as unknown as jest.Mocked<DataFreshnessService>;

    service = new HealthCheckService(DEFAULT_HEALTH_CHECK_CONFIG, {
      ingestionMonitor: mockIngestionMonitor,
      freshnessService: mockFreshnessService,
    });
  });

  afterEach(() => {
    service.stop();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultService = new HealthCheckService();
      expect(defaultService).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const customService = new HealthCheckService({
        checkIntervalMs: 30000,
        timeoutMs: 10000,
      });
      expect(customService).toBeDefined();
    });
  });

  describe('runChecks', () => {
    it('should return system health with all components', async () => {
      mockFreshnessService.getDataFreshness.mockResolvedValue({
        lastUpdated: new Date(),
        hoursAgo: 1,
        permitsNew: 10,
        permitsUpdated: 5,
        permitsProcessed: 15,
        status: 'fresh',
        message: 'Data is fresh',
      });

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 5,
        successfulRunsToday: 5,
        failedRunsToday: 0,
        totalRecordsToday: 100,
        errorRateToday: 0,
        sloStatus: [],
        activeAlerts: [],
        recentAlerts: [],
        timeSinceLastRun: 3600,
        timeSinceLastSuccess: 3600,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([
        {
          config: {
            name: 'freshness',
            description: 'Time since last successful ingestion',
            threshold: 120,
            warningThreshold: 60,
            unit: 'minutes',
            window: '1h',
          },
          currentValue: 60,
          status: 'healthy',
          compliancePercent: 100,
          lastChecked: new Date(),
          message: 'Last successful ingestion 60 minutes ago',
        },
      ]);

      const health = await service.runChecks();

      expect(health.overallStatus).toBe('healthy');
      expect(health.components).toHaveLength(4);
      expect(health.timestamp).toBeInstanceOf(Date);
      expect(health.version).toBeDefined();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should mark system unhealthy when freshness is critical', async () => {
      mockFreshnessService.getDataFreshness.mockResolvedValue({
        lastUpdated: new Date(Date.now() - 48 * 60 * 60 * 1000),
        hoursAgo: 48,
        permitsNew: 0,
        permitsUpdated: 0,
        permitsProcessed: 0,
        status: 'critical',
        message: 'Data is critically stale',
      });

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 0,
        successfulRunsToday: 0,
        failedRunsToday: 0,
        totalRecordsToday: 0,
        errorRateToday: 0,
        sloStatus: [],
        activeAlerts: [],
        recentAlerts: [],
        timeSinceLastRun: Infinity,
        timeSinceLastSuccess: Infinity,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([]);

      const health = await service.runChecks();

      const freshnessComponent = health.components.find(
        (c) => c.name === 'data_freshness'
      );
      expect(freshnessComponent?.status).toBe('unhealthy');
      expect(health.overallStatus).toBe('unhealthy');
    });

    it('should mark system degraded when freshness is stale', async () => {
      mockFreshnessService.getDataFreshness.mockResolvedValue({
        lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000),
        hoursAgo: 6,
        permitsNew: 10,
        permitsUpdated: 5,
        permitsProcessed: 15,
        status: 'stale',
        message: 'Data is stale',
      });

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 3,
        successfulRunsToday: 3,
        failedRunsToday: 0,
        totalRecordsToday: 50,
        errorRateToday: 0,
        sloStatus: [],
        activeAlerts: [],
        recentAlerts: [],
        timeSinceLastRun: 6 * 3600,
        timeSinceLastSuccess: 6 * 3600,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([
        {
          config: {
            name: 'freshness',
            description: 'Time since last successful ingestion',
            threshold: 120,
            warningThreshold: 60,
            unit: 'minutes',
            window: '1h',
          },
          currentValue: 360,
          status: 'warning',
          compliancePercent: 50,
          lastChecked: new Date(),
          message: 'Last successful ingestion 360 minutes ago',
        },
      ]);

      const health = await service.runChecks();

      const freshnessComponent = health.components.find(
        (c) => c.name === 'data_freshness'
      );
      expect(freshnessComponent?.status).toBe('degraded');
      expect(health.overallStatus).toBe('degraded');
    });

    it('should mark pipeline unhealthy when error rate is high', async () => {
      mockFreshnessService.getDataFreshness.mockResolvedValue({
        lastUpdated: new Date(),
        hoursAgo: 1,
        permitsNew: 10,
        permitsUpdated: 5,
        permitsProcessed: 15,
        status: 'fresh',
        message: 'Data is fresh',
      });

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 10,
        successfulRunsToday: 5,
        failedRunsToday: 5,
        totalRecordsToday: 100,
        errorRateToday: 15,
        sloStatus: [],
        activeAlerts: [],
        recentAlerts: [],
        timeSinceLastRun: 3600,
        timeSinceLastSuccess: 3600,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([
        {
          config: {
            name: 'error_rate',
            description: 'Percentage of failed records',
            threshold: 10,
            warningThreshold: 5,
            unit: 'percent',
            window: '24h',
          },
          currentValue: 15,
          status: 'critical',
          compliancePercent: 0,
          lastChecked: new Date(),
          message: 'Error rate 15.0% exceeds 10% threshold',
        },
      ]);

      const health = await service.runChecks();

      const pipelineComponent = health.components.find(
        (c) => c.name === 'ingestion_pipeline'
      );
      expect(pipelineComponent?.status).toBe('unhealthy');
    });

    it('should mark alerts degraded when critical alerts are active', async () => {
      mockFreshnessService.getDataFreshness.mockResolvedValue({
        lastUpdated: new Date(),
        hoursAgo: 1,
        permitsNew: 10,
        permitsUpdated: 5,
        permitsProcessed: 15,
        status: 'fresh',
        message: 'Data is fresh',
      });

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 5,
        successfulRunsToday: 5,
        failedRunsToday: 0,
        totalRecordsToday: 100,
        errorRateToday: 0,
        sloStatus: [],
        activeAlerts: [
          {
            id: 'alert-1',
            severity: 'critical',
            metric: 'error_rate',
            currentValue: 15,
            threshold: 10,
            message: 'High error rate',
            triggeredAt: new Date(),
          },
        ],
        recentAlerts: [],
        timeSinceLastRun: 3600,
        timeSinceLastSuccess: 3600,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([]);

      const health = await service.runChecks();

      const alertComponent = health.components.find(
        (c) => c.name === 'alert_system'
      );
      expect(alertComponent?.status).toBe('degraded');
    });

    it('should handle errors gracefully', async () => {
      mockFreshnessService.getDataFreshness.mockRejectedValue(
        new Error('Database connection failed')
      );

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 0,
        successfulRunsToday: 0,
        failedRunsToday: 0,
        totalRecordsToday: 0,
        errorRateToday: 0,
        sloStatus: [],
        activeAlerts: [],
        recentAlerts: [],
        timeSinceLastRun: Infinity,
        timeSinceLastSuccess: Infinity,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([]);

      const health = await service.runChecks();

      const freshnessComponent = health.components.find(
        (c) => c.name === 'data_freshness'
      );
      expect(freshnessComponent?.status).toBe('unhealthy');
      expect(freshnessComponent?.message).toContain('Database connection failed');
    });
  });

  describe('getLastCheck', () => {
    it('should return null when no checks have run', () => {
      const lastCheck = service.getLastCheck();
      expect(lastCheck).toBeNull();
    });

    it('should return last check results', async () => {
      mockFreshnessService.getDataFreshness.mockResolvedValue({
        lastUpdated: new Date(),
        hoursAgo: 1,
        permitsNew: 10,
        permitsUpdated: 5,
        permitsProcessed: 15,
        status: 'fresh',
        message: 'Data is fresh',
      });

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 5,
        successfulRunsToday: 5,
        failedRunsToday: 0,
        totalRecordsToday: 100,
        errorRateToday: 0,
        sloStatus: [],
        activeAlerts: [],
        recentAlerts: [],
        timeSinceLastRun: 3600,
        timeSinceLastSuccess: 3600,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([]);

      await service.runChecks();
      const lastCheck = service.getLastCheck();

      expect(lastCheck).not.toBeNull();
      expect(lastCheck?.overallStatus).toBeDefined();
      expect(lastCheck?.components).toHaveLength(4);
    });
  });

  describe('getComponentHealth', () => {
    it('should return undefined for unchecked component', () => {
      const component = service.getComponentHealth('database');
      expect(component).toBeUndefined();
    });

    it('should return component health after check', async () => {
      mockFreshnessService.getDataFreshness.mockResolvedValue({
        lastUpdated: new Date(),
        hoursAgo: 1,
        permitsNew: 10,
        permitsUpdated: 5,
        permitsProcessed: 15,
        status: 'fresh',
        message: 'Data is fresh',
      });

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 5,
        successfulRunsToday: 5,
        failedRunsToday: 0,
        totalRecordsToday: 100,
        errorRateToday: 0,
        sloStatus: [],
        activeAlerts: [],
        recentAlerts: [],
        timeSinceLastRun: 3600,
        timeSinceLastSuccess: 3600,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([]);

      await service.runChecks();
      const component = service.getComponentHealth('data_freshness');

      expect(component).toBeDefined();
      expect(component?.name).toBe('data_freshness');
      expect(component?.status).toBe('healthy');
    });
  });

  describe('isHealthy', () => {
    it('should return false when no checks have run', () => {
      expect(service.isHealthy()).toBe(false);
    });

    it('should return true when system is healthy', async () => {
      mockFreshnessService.getDataFreshness.mockResolvedValue({
        lastUpdated: new Date(),
        hoursAgo: 1,
        permitsNew: 10,
        permitsUpdated: 5,
        permitsProcessed: 15,
        status: 'fresh',
        message: 'Data is fresh',
      });

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 5,
        successfulRunsToday: 5,
        failedRunsToday: 0,
        totalRecordsToday: 100,
        errorRateToday: 0,
        sloStatus: [],
        activeAlerts: [],
        recentAlerts: [],
        timeSinceLastRun: 3600,
        timeSinceLastSuccess: 3600,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([]);

      await service.runChecks();
      expect(service.isHealthy()).toBe(true);
    });

    it('should return false when system is unhealthy', async () => {
      mockFreshnessService.getDataFreshness.mockResolvedValue({
        lastUpdated: new Date(Date.now() - 48 * 60 * 60 * 1000),
        hoursAgo: 48,
        permitsNew: 0,
        permitsUpdated: 0,
        permitsProcessed: 0,
        status: 'critical',
        message: 'Data is critically stale',
      });

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 0,
        successfulRunsToday: 0,
        failedRunsToday: 0,
        totalRecordsToday: 0,
        errorRateToday: 0,
        sloStatus: [],
        activeAlerts: [],
        recentAlerts: [],
        timeSinceLastRun: Infinity,
        timeSinceLastSuccess: Infinity,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([]);

      await service.runChecks();
      expect(service.isHealthy()).toBe(false);
    });
  });

  describe('start/stop', () => {
    it('should start periodic checks', () => {
      jest.useFakeTimers();
      
      service.start();
      
      // Should have scheduled interval
      expect(jest.getTimerCount()).toBeGreaterThan(0);
      
      service.stop();
      jest.useRealTimers();
    });

    it('should not start multiple intervals', () => {
      jest.useFakeTimers();
      
      service.start();
      const timerCount = jest.getTimerCount();
      
      service.start(); // Try to start again
      expect(jest.getTimerCount()).toBe(timerCount);
      
      service.stop();
      jest.useRealTimers();
    });

    it('should stop periodic checks', () => {
      jest.useFakeTimers();
      
      service.start();
      expect(jest.getTimerCount()).toBeGreaterThan(0);
      
      service.stop();
      expect(jest.getTimerCount()).toBe(0);
      
      jest.useRealTimers();
    });

    it('should run checks periodically', async () => {
      jest.useFakeTimers();

      mockFreshnessService.getDataFreshness.mockResolvedValue({
        lastUpdated: new Date(),
        hoursAgo: 1,
        permitsNew: 10,
        permitsUpdated: 5,
        permitsProcessed: 15,
        status: 'fresh',
        message: 'Data is fresh',
      });

      mockIngestionMonitor.getDashboardMetrics.mockReturnValue({
        runsToday: 5,
        successfulRunsToday: 5,
        failedRunsToday: 0,
        totalRecordsToday: 100,
        errorRateToday: 0,
        sloStatus: [],
        activeAlerts: [],
        recentAlerts: [],
        timeSinceLastRun: 3600,
        timeSinceLastSuccess: 3600,
      });

      mockIngestionMonitor.checkSLOs.mockReturnValue([]);

      service.start();

      // Fast-forward past the interval
      await jest.advanceTimersByTimeAsync(DEFAULT_HEALTH_CHECK_CONFIG.checkIntervalMs + 100);

      // Should have run at least twice (initial + periodic)
      expect(mockFreshnessService.getDataFreshness).toHaveBeenCalledTimes(2);

      service.stop();
      jest.useRealTimers();
    });
  });
});
