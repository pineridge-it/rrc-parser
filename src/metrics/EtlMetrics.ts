import { MetricsCollector, getMetricsCollector } from './MetricsCollector';

/**
 * ETL Metrics instrumentation for tracking pipeline performance
 */
export class EtlMetrics {
  private collector: MetricsCollector;

  constructor(collector?: MetricsCollector) {
    this.collector = collector || getMetricsCollector();
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Counters
    this.collector.counter('etl_runs_total', 'Total number of ETL runs');
    this.collector.counter('etl_runs_failed', 'Total number of failed ETL runs');
    this.collector.counter('etl_records_processed', 'Total number of records processed');
    this.collector.counter('etl_records_failed', 'Total number of records that failed processing');
    this.collector.counter('etl_records_skipped', 'Total number of records skipped');

    // Gauges
    this.collector.gauge('etl_lag_minutes', 'ETL pipeline lag in minutes');
    this.collector.gauge('etl_records_per_run', 'Number of records processed in the last run');

    // Histograms
    this.collector.histogram('etl_duration_seconds', 'ETL pipeline duration in seconds');
    this.collector.histogram('etl_stage_duration_seconds', 'Duration of individual ETL stages');
  }

  /**
   * Record the start of an ETL run
   */
  recordRunStart(): void {
    this.collector.inc('etl_runs_total');
  }

  /**
   * Record a failed ETL run
   */
  recordRunFailed(): void {
    this.collector.inc('etl_runs_failed');
  }

  /**
   * Record records processed
   */
  recordRecordsProcessed(count: number): void {
    this.collector.inc('etl_records_processed', count);
    this.collector.set('etl_records_per_run', count);
  }

  /**
   * Record failed records
   */
  recordRecordsFailed(count: number): void {
    this.collector.inc('etl_records_failed', count);
  }

  /**
   * Record skipped records
   */
  recordRecordsSkipped(count: number): void {
    this.collector.inc('etl_records_skipped', count);
  }

  /**
   * Record ETL lag in minutes
   */
  recordLag(minutes: number): void {
    this.collector.set('etl_lag_minutes', minutes);
  }

  /**
   * Start a timer for ETL duration
   * @returns Function to stop the timer
   */
  startDurationTimer(): () => void {
    return this.collector.startTimer('etl_duration_seconds');
  }

  /**
   * Start a timer for a specific ETL stage
   * @param stageName Name of the stage (fetch, parse, transform, load)
   * @returns Function to stop the timer
   */
  startStageTimer(stageName: string): () => void {
    const stopTimer = this.collector.startTimer('etl_stage_duration_seconds');
    return () => {
      // Record with stage label
      const duration = process.hrtime.bigint();
      // The timer will record the duration, but we need to add the stage label
      // This is a simplified version - in production, you'd want label support in the timer
      stopTimer();
    };
  }

  /**
   * Record complete ETL run metrics
   */
  recordRunComplete(metrics: {
    durationMs: number;
    recordsProcessed: number;
    recordsFailed: number;
    recordsSkipped: number;
    lagMinutes?: number;
    success: boolean;
  }): void {
    const durationSeconds = metrics.durationMs / 1000;
    this.collector.observe('etl_duration_seconds', durationSeconds);
    this.recordRecordsProcessed(metrics.recordsProcessed);
    this.recordRecordsFailed(metrics.recordsFailed);
    this.recordRecordsSkipped(metrics.recordsSkipped);

    if (metrics.lagMinutes !== undefined) {
      this.recordLag(metrics.lagMinutes);
    }

    if (!metrics.success) {
      this.recordRunFailed();
    }
  }
}

/**
 * Singleton instance
 */
let etlMetrics: EtlMetrics | null = null;

export function initializeEtlMetrics(collector?: MetricsCollector): EtlMetrics {
  etlMetrics = new EtlMetrics(collector);
  return etlMetrics;
}

export function getEtlMetrics(): EtlMetrics {
  if (!etlMetrics) {
    etlMetrics = new EtlMetrics();
  }
  return etlMetrics;
}
