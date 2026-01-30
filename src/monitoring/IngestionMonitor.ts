/**
 * IngestionMonitor - Tracks ETL pipeline metrics and SLO compliance
 */

import {
  IngestionMetrics,
  SLOConfig,
  SLOState,
  AlertRule,
  Alert,
  DashboardMetrics,
  HistoricalMetrics,
  MetricsQuery
} from './types';

export interface IngestionMonitorConfig {
  maxHistorySize?: number;
  defaultSLOs?: SLOConfig[];
  alertRules?: AlertRule[];
}

export const DEFAULT_SLO_CONFIGS: SLOConfig[] = [
  {
    name: 'freshness',
    description: 'Time since last successful ingestion',
    threshold: 120, // 2 hours
    warningThreshold: 60, // 1 hour
    unit: 'minutes',
    window: '1h'
  },
  {
    name: 'error_rate',
    description: 'Percentage of failed records',
    threshold: 10, // 10%
    warningThreshold: 5, // 5%
    unit: 'percent',
    window: '24h'
  },
  {
    name: 'success_rate',
    description: 'Pipeline run success rate',
    threshold: 95, // 95%
    warningThreshold: 90, // 90%
    unit: 'percent',
    window: '24h'
  }
];

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'no-ingestion-2h',
    name: 'No Ingestion for 2+ Hours',
    description: 'Critical alert when no successful ingestion for 2+ hours',
    severity: 'critical',
    condition: {
      metric: 'time_since_last_success',
      operator: 'gt',
      value: 120, // 2 hours
      windowMinutes: 5
    },
    enabled: true,
    cooldownMinutes: 30
  },
  {
    id: 'error-rate-high',
    name: 'High Error Rate',
    description: 'Error rate exceeds 10%',
    severity: 'critical',
    condition: {
      metric: 'error_rate',
      operator: 'gt',
      value: 10,
      windowMinutes: 15
    },
    enabled: true,
    cooldownMinutes: 60
  },
  {
    id: 'error-rate-warning',
    name: 'Elevated Error Rate',
    description: 'Error rate exceeds 5%',
    severity: 'warning',
    condition: {
      metric: 'error_rate',
      operator: 'gt',
      value: 5,
      windowMinutes: 15
    },
    enabled: true,
    cooldownMinutes: 30
  },
  {
    id: 'volume-anomaly',
    name: 'Volume Anomaly',
    description: 'Volume deviation >30% from recent average',
    severity: 'warning',
    condition: {
      metric: 'volume_deviation',
      operator: 'gt',
      value: 30,
      windowMinutes: 60
    },
    enabled: true,
    cooldownMinutes: 60
  }
];

export class IngestionMonitor {
  private runs: IngestionMetrics[] = [];
  private activeRun?: IngestionMetrics;
  private sloConfigs: SLOConfig[];
  private alertRules: AlertRule[];
  private alerts: Alert[] = [];
  private maxHistorySize: number;
  private alertCounter = 0;
  private runCounter = 0;

  constructor(config: IngestionMonitorConfig = {}) {
    this.maxHistorySize = config.maxHistorySize ?? 1000;
    this.sloConfigs = config.defaultSLOs ?? [...DEFAULT_SLO_CONFIGS];
    this.alertRules = config.alertRules ?? [...DEFAULT_ALERT_RULES];
  }

  /**
   * Record the start of an ingestion run
   */
  recordRunStart(sourceFile?: string): string {
    const runId = `run-${Date.now()}-${++this.runCounter}`;
    this.activeRun = {
      runId,
      startedAt: new Date(),
      recordsProcessed: 0,
      recordsFailed: 0,
      errorCount: 0,
      sourceFile
    };
    return runId;
  }

  /**
   * Record the completion of an ingestion run
   */
  recordRunComplete(runId: string, metrics: Partial<IngestionMetrics>): void {
    if (!this.activeRun || this.activeRun.runId !== runId) {
      throw new Error(`No active run found with ID: ${runId}`);
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - this.activeRun.startedAt.getTime();

    const completedRun: IngestionMetrics = {
      ...this.activeRun,
      ...metrics,
      completedAt,
      durationMs
    };

    this.runs.push(completedRun);
    this.activeRun = undefined;

    // Trim history if needed
    if (this.runs.length > this.maxHistorySize) {
      this.runs = this.runs.slice(-this.maxHistorySize);
    }

    // Check alerts after recording
    this.checkAlerts();
  }

  /**
   * Record an error during ingestion
   */
  recordError(runId: string, error: Error): void {
    if (this.activeRun && this.activeRun.runId === runId) {
      this.activeRun.errorCount++;
      // Store error message in active run for debugging
      if (!this.activeRun.errors) {
        this.activeRun.errors = [];
      }
      this.activeRun.errors.push(error.message);
    }
  }

  /**
   * Get the most recent run
   */
  getLastRun(): IngestionMetrics | undefined {
    return this.runs[this.runs.length - 1];
  }

  /**
   * Get the last successful run
   */
  getLastSuccessfulRun(): IngestionMetrics | undefined {
    return [...this.runs].reverse().find(r => r.errorCount === 0 && r.recordsFailed === 0);
  }

  /**
   * Calculate SLO compliance status
   */
  checkSLOs(): SLOState[] {
    const now = new Date();
    const lastSuccess = this.getLastSuccessfulRun();

    return this.sloConfigs.map(config => {
      let currentValue: number;
      let status: SLOState['status'];
      let message: string;

      switch (config.name) {
        case 'freshness':
          currentValue = lastSuccess
            ? (now.getTime() - lastSuccess.completedAt!.getTime()) / 60000
            : Infinity;
          if (currentValue >= config.threshold) {
            status = 'critical';
            message = lastSuccess
              ? `No successful ingestion for ${Math.round(currentValue)} minutes`
              : 'No successful ingestion recorded';
          } else if (currentValue >= config.warningThreshold) {
            status = 'warning';
            message = `Last successful ingestion ${Math.round(currentValue)} minutes ago`;
          } else {
            status = 'healthy';
            message = `Last successful ingestion ${Math.round(currentValue)} minutes ago`;
          }
          break;

        case 'error_rate':
          currentValue = this.calculateErrorRate('24h');
          if (currentValue >= config.threshold) {
            status = 'critical';
            message = `Error rate ${currentValue.toFixed(1)}% exceeds ${config.threshold}% threshold`;
          } else if (currentValue >= config.warningThreshold) {
            status = 'warning';
            message = `Error rate ${currentValue.toFixed(1)}% elevated`;
          } else {
            status = 'healthy';
            message = `Error rate ${currentValue.toFixed(1)}% within normal range`;
          }
          break;

        case 'success_rate':
          currentValue = this.calculateSuccessRate('24h');
          if (currentValue < config.threshold) {
            status = 'critical';
            message = `Success rate ${currentValue.toFixed(1)}% below ${config.threshold}% threshold`;
          } else if (currentValue < config.warningThreshold) {
            status = 'warning';
            message = `Success rate ${currentValue.toFixed(1)}% below target`;
          } else {
            status = 'healthy';
            message = `Success rate ${currentValue.toFixed(1)}% meets target`;
          }
          break;

        default:
          currentValue = 0;
          status = 'healthy';
          message = 'Unknown SLO';
      }

      return {
        config,
        currentValue,
        status,
        compliancePercent: this.calculateSLOCompliance(config),
        lastChecked: now,
        message
      };
    });
  }

  /**
   * Calculate error rate over a time window
   */
  private calculateErrorRate(window: '1h' | '24h' | '7d' | '30d'): number {
    const windowMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[window];

    const cutoff = new Date(Date.now() - windowMs);
    const recentRuns = this.runs.filter(r => r.completedAt && r.completedAt >= cutoff);

    if (recentRuns.length === 0) return 0;

    const totalRecords = recentRuns.reduce((sum, r) => sum + r.recordsProcessed, 0);
    const failedRecords = recentRuns.reduce((sum, r) => sum + r.recordsFailed, 0);

    return totalRecords > 0 ? (failedRecords / totalRecords) * 100 : 0;
  }

  /**
   * Calculate success rate over a time window
   */
  private calculateSuccessRate(window: '1h' | '24h' | '7d' | '30d'): number {
    const windowMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[window];

    const cutoff = new Date(Date.now() - windowMs);
    const recentRuns = this.runs.filter(r => r.completedAt && r.completedAt >= cutoff);

    if (recentRuns.length === 0) return 100;

    const successfulRuns = recentRuns.filter(r => r.errorCount === 0 && r.recordsFailed === 0).length;
    return (successfulRuns / recentRuns.length) * 100;
  }

  /**
   * Calculate SLO compliance percentage over the SLO window
   */
  private calculateSLOCompliance(slo: SLOConfig): number {
    const windowMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[slo.window];

    const cutoff = new Date(Date.now() - windowMs);
    const recentRuns = this.runs.filter(r => r.completedAt && r.completedAt >= cutoff);

    if (recentRuns.length === 0) return 100;

    let compliantCount = 0;

    for (const run of recentRuns) {
      let isCompliant = false;

      switch (slo.name) {
        case 'freshness':
          // Freshness is about time between runs, not individual run duration
          // Mark as compliant if the run itself was successful
          isCompliant = run.errorCount === 0 && run.recordsFailed === 0;
          break;
        case 'error_rate':
          // Check if error rate is below threshold
          const errorRate = run.recordsProcessed > 0
            ? (run.recordsFailed / run.recordsProcessed) * 100
            : 0;
          isCompliant = errorRate < slo.threshold;
          break;
        case 'success_rate':
          // Check if run was successful
          isCompliant = run.errorCount === 0 && run.recordsFailed === 0;
          break;
        default:
          isCompliant = true;
      }

      if (isCompliant) compliantCount++;
    }

    return (compliantCount / recentRuns.length) * 100;
  }

  /**
   * Check alert rules and trigger alerts
   */
  private checkAlerts(): void {
    const now = new Date();
    this.checkSLOs();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (now.getTime() - rule.lastTriggered.getTime() < cooldownMs) {
          continue;
        }
      }

      // Check condition
      const shouldTrigger = this.evaluateAlertCondition(rule);

      if (shouldTrigger) {
        const alert: Alert = {
          id: `alert-${Date.now()}-${++this.alertCounter}`,
          severity: rule.severity,
          metric: rule.condition.metric,
          currentValue: this.getMetricValue(rule.condition.metric),
          threshold: rule.condition.value,
          message: rule.description,
          triggeredAt: now
        };

        this.alerts.push(alert);
        rule.lastTriggered = now;
      }
    }
  }

  /**
   * Evaluate an alert condition
   */
  private evaluateAlertCondition(rule: AlertRule): boolean {
    const value = this.getMetricValue(rule.condition.metric);
    const threshold = rule.condition.value;

    switch (rule.condition.operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Get current value for a metric
   */
  private getMetricValue(metric: string): number {
    const lastSuccess = this.getLastSuccessfulRun();

    switch (metric) {
      case 'time_since_last_success':
        return lastSuccess && lastSuccess.completedAt
          ? (Date.now() - lastSuccess.completedAt.getTime()) / 60000
          : Infinity;
      case 'error_rate':
        return this.calculateErrorRate('24h');
      case 'volume_deviation':
        return this.calculateVolumeDeviation();
      default:
        return 0;
    }
  }

  /**
   * Calculate volume deviation from recent average
   */
  private calculateVolumeDeviation(): number {
    const windowMs = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = new Date(Date.now() - windowMs);
    const recentRuns = this.runs.filter(r => r.completedAt && r.completedAt >= cutoff);

    if (recentRuns.length < 2) return 0;

    const avgVolume = recentRuns.reduce((sum, r) => sum + r.recordsProcessed, 0) / recentRuns.length;
    const lastRun = this.getLastRun();
    const lastVolume = lastRun?.recordsProcessed ?? 0;

    return avgVolume > 0 ? Math.abs((lastVolume - avgVolume) / avgVolume) * 100 : 0;
  }

  /**
   * Get dashboard metrics
   */
  getDashboardMetrics(): DashboardMetrics {
    const now = new Date();
    const lastRun = this.getLastRun();
    const lastSuccess = this.getLastSuccessfulRun();

    // Calculate 24h stats
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const runsToday = this.runs.filter(r => r.completedAt && r.completedAt >= dayAgo);
    const successfulRunsToday = runsToday.filter(r => r.errorCount === 0 && r.recordsFailed === 0);
    const failedRunsToday = runsToday.filter(r => r.errorCount > 0 || r.recordsFailed > 0);

    const totalRecordsToday = runsToday.reduce((sum, r) => sum + r.recordsProcessed, 0);
    const errorRateToday = totalRecordsToday > 0
      ? (runsToday.reduce((sum, r) => sum + r.recordsFailed, 0) / totalRecordsToday) * 100
      : 0;

    // Get active alerts (not resolved, triggered in last 24h)
    const dayAgoAlerts = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeAlerts = this.alerts.filter(a => !a.resolvedAt && a.triggeredAt >= dayAgoAlerts);
    const recentAlerts = this.alerts
      .filter(a => a.triggeredAt >= dayAgoAlerts)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, 10);

    return {
      lastRun,
      lastSuccessfulRun: lastSuccess?.completedAt,
      timeSinceLastRun: lastRun?.completedAt
        ? (now.getTime() - lastRun.completedAt.getTime()) / 1000
        : Infinity,
      timeSinceLastSuccess: lastSuccess?.completedAt
        ? (now.getTime() - lastSuccess.completedAt.getTime()) / 1000
        : Infinity,
      runsToday: runsToday.length,
      successfulRunsToday: successfulRunsToday.length,
      failedRunsToday: failedRunsToday.length,
      totalRecordsToday,
      errorRateToday,
      sloStatus: this.checkSLOs(),
      activeAlerts,
      recentAlerts
    };
  }

  /**
   * Get historical metrics for a time range
   */
  getHistoricalMetrics(query: MetricsQuery): HistoricalMetrics {
    const filtered = this.runs.filter(
      r => r.completedAt && r.completedAt >= query.timeRange.start && r.completedAt <= query.timeRange.end
    );

    return {
      timestamps: filtered.map(r => r.completedAt!),
      recordsProcessed: filtered.map(r => r.recordsProcessed),
      errorCounts: filtered.map(r => r.errorCount),
      durations: filtered.map(r => r.durationMs ?? 0),
      lagMinutes: filtered.map(r => r.lagMinutes ?? 0)
    };
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get all runs
   */
  getRuns(): IngestionMetrics[] {
    return [...this.runs];
  }

  /**
   * Get all alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }
}
