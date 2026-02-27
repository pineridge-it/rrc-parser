import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../src/lib/database';
import type { DashboardMetrics, SLOState, Alert } from '../../../../../../src/monitoring/types';

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    // Get latest successful run
    const { data: latestRun, error: latestRunError } = await db
      .from('etl_runs')
      .select('*')
      .eq('status', 'success')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (latestRunError && latestRunError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch latest run: ${latestRunError.message}`);
    }

    // Get runs from last 24 hours
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: runsToday, error: runsError } = await db
      .from('etl_runs')
      .select('*')
      .gte('started_at', dayAgo);

    if (runsError) {
      throw new Error(`Failed to fetch runs: ${runsError.message}`);
    }

    // Calculate 24h stats
    const successfulRunsToday = (runsToday || []).filter(
      (r) => r.status === 'success'
    );
    const failedRunsToday = (runsToday || []).filter(
      (r) => r.status === 'failed'
    );
    const totalRecordsToday = (runsToday || []).reduce(
      (sum, r) => sum + (r.permits_processed || 0),
      0
    );
    const totalFailedToday = (runsToday || []).reduce(
      (sum, r) => sum + (r.permits_failed || 0),
      0
    );
    const errorRateToday =
      totalRecordsToday > 0 ? (totalFailedToday / totalRecordsToday) * 100 : 0;

    // Calculate SLO status
    const sloStatus: SLOState[] = calculateSLOStatus(latestRun, errorRateToday, successfulRunsToday.length, (runsToday || []).length);

    // Get active alerts
    const { data: alertsData, error: alertsError } = await db
      .from('alert_events')
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertsError) {
      throw new Error(`Failed to fetch alerts: ${alertsError.message}`);
    }

    const activeAlerts: Alert[] = (alertsData || []).map((alert) => ({
      id: alert.id,
      severity: alert.severity || 'info',
      metric: alert.event_type || 'unknown',
      currentValue: alert.event_data?.current_value || 0,
      threshold: alert.event_data?.threshold || 0,
      message: alert.message || 'Alert triggered',
      triggeredAt: new Date(alert.created_at),
      acknowledged: alert.status === 'acknowledged',
    }));

    const dashboardMetrics: DashboardMetrics = {
      lastRun: latestRun
        ? {
            runId: latestRun.id,
            startedAt: new Date(latestRun.started_at),
            completedAt: latestRun.completed_at ? new Date(latestRun.completed_at) : undefined,
            durationMs: latestRun.duration_ms,
            recordsProcessed: latestRun.permits_processed || 0,
            recordsFailed: latestRun.permits_failed || 0,
            errorCount: latestRun.permits_failed || 0,
          }
        : undefined,
      lastSuccessfulRun: latestRun?.completed_at
        ? new Date(latestRun.completed_at)
        : undefined,
      timeSinceLastRun: latestRun?.completed_at
        ? (Date.now() - new Date(latestRun.completed_at).getTime()) / 1000
        : Infinity,
      timeSinceLastSuccess: latestRun?.completed_at
        ? (Date.now() - new Date(latestRun.completed_at).getTime()) / 1000
        : Infinity,
      runsToday: (runsToday || []).length,
      successfulRunsToday: successfulRunsToday.length,
      failedRunsToday: failedRunsToday.length,
      totalRecordsToday,
      errorRateToday,
      sloStatus,
      activeAlerts,
      recentAlerts: activeAlerts,
    };

    return createApiResponse(dashboardMetrics, rateLimit);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return createApiErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

function calculateSLOStatus(
  latestRun: { completed_at?: string } | null,
  errorRate: number,
  successfulRuns: number,
  totalRuns: number
): SLOState[] {
  const now = new Date();

  // Freshness SLO
  const minutesSinceLastSuccess = latestRun?.completed_at
    ? (now.getTime() - new Date(latestRun.completed_at).getTime()) / 60000
    : Infinity;

  const freshnessStatus: SLOState = {
    config: {
      name: 'freshness',
      description: 'Time since last successful ingestion',
      threshold: 120,
      warningThreshold: 60,
      unit: 'minutes',
      window: '1h',
    },
    currentValue: minutesSinceLastSuccess,
    status:
      minutesSinceLastSuccess >= 120
        ? 'critical'
        : minutesSinceLastSuccess >= 60
        ? 'warning'
        : 'healthy',
    compliancePercent: minutesSinceLastSuccess < 120 ? 100 : 0,
    lastChecked: now,
    message:
      minutesSinceLastSuccess === Infinity
        ? 'No successful ingestion recorded'
        : `Last successful ingestion ${Math.round(minutesSinceLastSuccess)} minutes ago`,
  };

  // Error rate SLO
  const errorRateStatus: SLOState = {
    config: {
      name: 'error_rate',
      description: 'Percentage of failed records',
      threshold: 10,
      warningThreshold: 5,
      unit: 'percent',
      window: '24h',
    },
    currentValue: errorRate,
    status:
      errorRate >= 10 ? 'critical' : errorRate >= 5 ? 'warning' : 'healthy',
    compliancePercent: errorRate < 10 ? 100 : 0,
    lastChecked: now,
    message: `Error rate ${errorRate.toFixed(1)}%`,
  };

  // Success rate SLO
  const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;
  const successRateStatus: SLOState = {
    config: {
      name: 'success_rate',
      description: 'Pipeline run success rate',
      threshold: 95,
      warningThreshold: 90,
      unit: 'percent',
      window: '24h',
    },
    currentValue: successRate,
    status:
      successRate < 95 ? 'critical' : successRate < 90 ? 'warning' : 'healthy',
    compliancePercent: successRate,
    lastChecked: now,
    message: `Success rate ${successRate.toFixed(1)}%`,
  };

  return [freshnessStatus, errorRateStatus, successRateStatus];
}