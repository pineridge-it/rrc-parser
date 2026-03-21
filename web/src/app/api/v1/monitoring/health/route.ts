import { NextRequest } from 'next/server';
import {
  createApiResponse,
  createApiErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../src/lib/database';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  components: {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    responseTimeMs?: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const db = createDatabaseClient();
    const startTime = Date.now();

    // Check database connectivity
    const dbCheckStart = Date.now();
    let dbStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let dbMessage = 'Database connected';
    let dbResponseTime = 0;

    try {
      const { error } = await db.from('etl_runs').select('id').limit(1);
      dbResponseTime = Date.now() - dbCheckStart;

      if (error) {
        dbStatus = 'unhealthy';
        dbMessage = `Database error: ${error.message}`;
      } else if (dbResponseTime > 2000) {
        dbStatus = 'degraded';
        dbMessage = `Database slow (${dbResponseTime}ms)`;
      }
    } catch (error) {
      dbStatus = 'unhealthy';
      dbMessage = `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      dbResponseTime = Date.now() - dbCheckStart;
    }

    // Check data freshness
    const freshnessCheckStart = Date.now();
    let freshnessStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let freshnessMessage = 'Data freshness unknown';
    let freshnessResponseTime = 0;
    let hoursAgo: number | null = null;

    try {
      const { data: latestRun, error: freshnessError } = await db
        .from('etl_runs')
        .select('completed_at')
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      freshnessResponseTime = Date.now() - freshnessCheckStart;

      if (freshnessError) {
        freshnessStatus = 'unhealthy';
        freshnessMessage = `Failed to check freshness: ${freshnessError.message}`;
      } else if (!latestRun) {
        freshnessStatus = 'unhealthy';
        freshnessMessage = 'No successful runs recorded';
      } else {
        const lastUpdate = new Date(latestRun.completed_at);
        hoursAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);

        if (hoursAgo > 24) {
          freshnessStatus = 'unhealthy';
          freshnessMessage = `Data critically stale (${hoursAgo.toFixed(1)} hours old)`;
        } else if (hoursAgo > 4) {
          freshnessStatus = 'degraded';
          freshnessMessage = `Data stale (${hoursAgo.toFixed(1)} hours old)`;
        } else {
          freshnessStatus = 'healthy';
          freshnessMessage = `Data fresh (${hoursAgo.toFixed(1)} hours old)`;
        }
      }
    } catch (error) {
      freshnessStatus = 'unhealthy';
      freshnessMessage = `Freshness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      freshnessResponseTime = Date.now() - freshnessCheckStart;
    }

    // Check pipeline health
    const pipelineCheckStart = Date.now();
    let pipelineStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let pipelineMessage = 'Pipeline healthy';
    let pipelineResponseTime = 0;

    try {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: runsToday, error: runsError } = await db
        .from('etl_runs')
        .select('status, permits_processed, permits_failed')
        .gte('started_at', dayAgo);

      pipelineResponseTime = Date.now() - pipelineCheckStart;

      if (runsError) {
        pipelineStatus = 'unhealthy';
        pipelineMessage = `Failed to check pipeline: ${runsError.message}`;
      } else if (!runsToday || runsToday.length === 0) {
        pipelineStatus = 'degraded';
        pipelineMessage = 'No runs in last 24 hours';
      } else {
        const totalRuns = runsToday.length;
        const successfulRuns = runsToday.filter((r) => r.status === 'success').length;
        const totalRecords = runsToday.reduce((sum, r) => sum + (r.permits_processed || 0), 0);
        const failedRecords = runsToday.reduce((sum, r) => sum + (r.permits_failed || 0), 0);
        const errorRate = totalRecords > 0 ? (failedRecords / totalRecords) * 100 : 0;
        const successRate = (successfulRuns / totalRuns) * 100;

        if (errorRate > 10 || successRate < 80) {
          pipelineStatus = 'unhealthy';
          pipelineMessage = `Pipeline unhealthy (${errorRate.toFixed(1)}% error rate, ${successRate.toFixed(1)}% success)`;
        } else if (errorRate > 5 || successRate < 95) {
          pipelineStatus = 'degraded';
          pipelineMessage = `Pipeline degraded (${errorRate.toFixed(1)}% error rate, ${successRate.toFixed(1)}% success)`;
        } else {
          pipelineMessage = `Pipeline healthy (${totalRuns} runs, ${errorRate.toFixed(1)}% error rate)`;
        }
      }
    } catch (error) {
      pipelineStatus = 'unhealthy';
      pipelineMessage = `Pipeline check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      pipelineResponseTime = Date.now() - pipelineCheckStart;
    }

    // Check alert system
    const alertCheckStart = Date.now();
    let alertStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let alertMessage = 'No active alerts';
    let alertResponseTime = 0;

    try {
      const { data: activeAlerts, error: alertsError } = await db
        .from('alert_events')
        .select('severity')
        .in('status', ['pending', 'processing']);

      alertResponseTime = Date.now() - alertCheckStart;

      if (alertsError) {
        alertStatus = 'unhealthy';
        alertMessage = `Failed to check alerts: ${alertsError.message}`;
      } else if (activeAlerts && activeAlerts.length > 0) {
        const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
        const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length;

        if (criticalCount > 0) {
          alertStatus = 'degraded';
          alertMessage = `${criticalCount} critical alert(s) active`;
        } else if (warningCount > 0) {
          alertMessage = `${warningCount} warning(s) active`;
        }
      }
    } catch (error) {
      alertStatus = 'unhealthy';
      alertMessage = `Alert check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      alertResponseTime = Date.now() - alertCheckStart;
    }

    // Calculate overall status
    const componentStatuses = [dbStatus, freshnessStatus, pipelineStatus, alertStatus];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (componentStatuses.some((s) => s === 'unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (componentStatuses.some((s) => s === 'degraded')) {
      overallStatus = 'degraded';
    }

    const health: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      components: [
        {
          name: 'database',
          status: dbStatus,
          message: dbMessage,
          responseTimeMs: dbResponseTime,
        },
        {
          name: 'data_freshness',
          status: freshnessStatus,
          message: freshnessMessage,
          responseTimeMs: freshnessResponseTime,
        },
        {
          name: 'pipeline',
          status: pipelineStatus,
          message: pipelineMessage,
          responseTimeMs: pipelineResponseTime,
        },
        {
          name: 'alerts',
          status: alertStatus,
          message: alertMessage,
          responseTimeMs: alertResponseTime,
        },
      ],
    };

    // Return 503 if unhealthy, 200 otherwise
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

    return createApiResponse(health, statusCode, rateLimit);
  } catch (error) {
    return createApiErrorResponse(
      error instanceof Error ? error : new Error('Internal server error'),
      500
    );
  }
}
