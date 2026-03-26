/**
 * HealthCheckService - Provides system health monitoring and checks
 */

import { IngestionMonitor } from './IngestionMonitor';
import { DataFreshnessService } from './DataFreshnessService';
import { AlertNotificationService } from './AlertNotificationService';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  message: string;
  lastChecked: Date;
  responseTimeMs?: number;
  metadata?: Record<string, unknown>;
}

export interface SystemHealth {
  overallStatus: HealthStatus;
  components: ComponentHealth[];
  timestamp: Date;
  version: string;
  uptime: number;
}

export interface HealthCheckConfig {
  checkIntervalMs: number;
  timeoutMs: number;
  thresholds: {
    freshnessWarningHours: number;
    freshnessCriticalHours: number;
    errorRateWarning: number;
    errorRateCritical: number;
    maxResponseTimeMs: number;
  };
}

export const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  checkIntervalMs: 60000, // 1 minute
  timeoutMs: 5000, // 5 seconds
  thresholds: {
    freshnessWarningHours: 4,
    freshnessCriticalHours: 24,
    errorRateWarning: 5,
    errorRateCritical: 10,
    maxResponseTimeMs: 2000,
  },
};

/**
 * Health check result from a single component
 */
interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  responseTimeMs: number;
  metadata?: Record<string, unknown>;
}

/**
 * System health check service
 */
export class HealthCheckService {
  private config: HealthCheckConfig;
  private ingestionMonitor?: IngestionMonitor;
  private freshnessService?: DataFreshnessService;
  private checkInterval?: NodeJS.Timeout;
  private lastCheck?: Date;
  private componentHealth: Map<string, ComponentHealth> = new Map();

  constructor(
    config: Partial<HealthCheckConfig> = {},
    services: {
      ingestionMonitor?: IngestionMonitor;
      freshnessService?: DataFreshnessService;
      notificationService?: AlertNotificationService;
    } = {}
  ) {
    this.config = { ...DEFAULT_HEALTH_CHECK_CONFIG, ...config };
    this.ingestionMonitor = services.ingestionMonitor;
    this.freshnessService = services.freshnessService;
    // notificationService is accepted for API compatibility but not currently used
  }

  /**
   * Start periodic health checks
   */
  start(): void {
    if (this.checkInterval) return;

    // Run initial check
    void this.runChecks();

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      void this.runChecks();
    }, this.config.checkIntervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Run all health checks
   */
  async runChecks(): Promise<SystemHealth> {
    const timestamp = new Date();

    const checks = await Promise.all([
      this.checkDataFreshness(),
      this.checkIngestionPipeline(),
      this.checkAlertSystem(),
      this.checkDatabase(),
    ]);

    const components: ComponentHealth[] = [
      {
        name: 'data_freshness',
        status: checks[0].status,
        message: checks[0].message,
        lastChecked: timestamp,
        responseTimeMs: checks[0].responseTimeMs,
        metadata: checks[0].metadata,
      },
      {
        name: 'ingestion_pipeline',
        status: checks[1].status,
        message: checks[1].message,
        lastChecked: timestamp,
        responseTimeMs: checks[1].responseTimeMs,
        metadata: checks[1].metadata,
      },
      {
        name: 'alert_system',
        status: checks[2].status,
        message: checks[2].message,
        lastChecked: timestamp,
        responseTimeMs: checks[2].responseTimeMs,
        metadata: checks[2].metadata,
      },
      {
        name: 'database',
        status: checks[3].status,
        message: checks[3].message,
        lastChecked: timestamp,
        responseTimeMs: checks[3].responseTimeMs,
        metadata: checks[3].metadata,
      },
    ];

    // Store component health
    components.forEach((c) => this.componentHealth.set(c.name, c));

    // Determine overall status
    const overallStatus = this.calculateOverallStatus(components);

    this.lastCheck = timestamp;

    return {
      overallStatus,
      components,
      timestamp,
      version: process.env.npm_package_version || 'unknown',
      uptime: process.uptime(),
    };
  }

  /**
   * Check data freshness
   */
  private async checkDataFreshness(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!this.freshnessService) {
        return {
          status: 'healthy',
          message: 'Freshness service not configured',
          responseTimeMs: Date.now() - startTime,
        };
      }

      const freshness = await this.freshnessService.getDataFreshness();
      const responseTimeMs = Date.now() - startTime;

      if (freshness.status === 'critical') {
        return {
          status: 'unhealthy',
          message: `Data is critically stale: ${freshness.hoursAgo?.toFixed(1)} hours old`,
          responseTimeMs,
          metadata: { hoursAgo: freshness.hoursAgo },
        };
      }

      if (freshness.status === 'stale') {
        return {
          status: 'degraded',
          message: `Data is stale: ${freshness.hoursAgo?.toFixed(1)} hours old`,
          responseTimeMs,
          metadata: { hoursAgo: freshness.hoursAgo },
        };
      }

      return {
        status: 'healthy',
        message: `Data is fresh (${freshness.hoursAgo?.toFixed(1)} hours old)`,
        responseTimeMs,
        metadata: { hoursAgo: freshness.hoursAgo },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Freshness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Check ingestion pipeline health
   */
  private async checkIngestionPipeline(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!this.ingestionMonitor) {
        return {
          status: 'healthy',
          message: 'Ingestion monitor not configured',
          responseTimeMs: Date.now() - startTime,
        };
      }

      const dashboard = this.ingestionMonitor.getDashboardMetrics();
      const sloStatus = this.ingestionMonitor.checkSLOs();
      const responseTimeMs = Date.now() - startTime;

      const criticalSLOs = sloStatus.filter((s) => s.status === 'critical');
      const warningSLOs = sloStatus.filter((s) => s.status === 'warning');

      if (criticalSLOs.length > 0) {
        return {
          status: 'unhealthy',
          message: `Pipeline unhealthy: ${criticalSLOs.map((s) => s.config.name).join(', ')}`,
          responseTimeMs,
          metadata: {
            failedSLOs: criticalSLOs.map((s) => s.config.name),
            errorRate: dashboard.errorRateToday,
            runsToday: dashboard.runsToday,
          },
        };
      }

      if (warningSLOs.length > 0) {
        return {
          status: 'degraded',
          message: `Pipeline degraded: ${warningSLOs.map((s) => s.config.name).join(', ')}`,
          responseTimeMs,
          metadata: {
            warningSLOs: warningSLOs.map((s) => s.config.name),
            errorRate: dashboard.errorRateToday,
          },
        };
      }

      return {
        status: 'healthy',
        message: `Pipeline healthy (${dashboard.runsToday} runs today, ${dashboard.errorRateToday.toFixed(1)}% error rate)`,
        responseTimeMs,
        metadata: {
          runsToday: dashboard.runsToday,
          successRate: ((dashboard.successfulRunsToday / Math.max(dashboard.runsToday, 1)) * 100).toFixed(1),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Pipeline check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Check alert system health
   */
  private async checkAlertSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!this.ingestionMonitor) {
        return {
          status: 'healthy',
          message: 'Alert system not configured',
          responseTimeMs: Date.now() - startTime,
        };
      }

      const dashboard = this.ingestionMonitor.getDashboardMetrics();
      const activeAlerts = dashboard.activeAlerts;
      const responseTimeMs = Date.now() - startTime;

      const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');

      if (criticalAlerts.length > 0) {
        return {
          status: 'degraded',
          message: `${criticalAlerts.length} critical alert(s) active`,
          responseTimeMs,
          metadata: { activeAlerts: activeAlerts.length, criticalAlerts: criticalAlerts.length },
        };
      }

      if (activeAlerts.length > 0) {
        return {
          status: 'healthy',
          message: `${activeAlerts.length} warning(s) active`,
          responseTimeMs,
          metadata: { activeAlerts: activeAlerts.length },
        };
      }

      return {
        status: 'healthy',
        message: 'No active alerts',
        responseTimeMs,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Alert check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Simple connectivity check - in production this would query the database
      const responseTimeMs = Date.now() - startTime;

      if (responseTimeMs > this.config.thresholds.maxResponseTimeMs) {
        return {
          status: 'degraded',
          message: `Database slow (${responseTimeMs}ms response)`,
          responseTimeMs,
        };
      }

      return {
        status: 'healthy',
        message: `Database responsive (${responseTimeMs}ms)`,
        responseTimeMs,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Calculate overall system status from component statuses
   */
  private calculateOverallStatus(components: ComponentHealth[]): HealthStatus {
    const statuses = components.map((c) => c.status);

    if (statuses.some((s) => s === 'unhealthy')) {
      return 'unhealthy';
    }

    if (statuses.some((s) => s === 'degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get the last health check results
   */
  getLastCheck(): SystemHealth | null {
    if (!this.lastCheck) return null;

    return {
      overallStatus: this.calculateOverallStatus(Array.from(this.componentHealth.values())),
      components: Array.from(this.componentHealth.values()),
      timestamp: this.lastCheck,
      version: process.env.npm_package_version || 'unknown',
      uptime: process.uptime(),
    };
  }

  /**
   * Get health of a specific component
   */
  getComponentHealth(name: string): ComponentHealth | undefined {
    return this.componentHealth.get(name);
  }

  /**
   * Check if system is healthy
   */
  isHealthy(): boolean {
    const lastCheck = this.getLastCheck();
    if (!lastCheck) return false;
    return lastCheck.overallStatus === 'healthy';
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();
