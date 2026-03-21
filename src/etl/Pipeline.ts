import { PermitParser, ParserOptions } from '../parser/PermitParser';
import { Config } from '../config';
import { ParseResult } from '../parser/PermitParser';
import { QAGateRunner, QAGateConfig } from '../qa';
import { PermitData } from '../types/permit';
import { IngestionMonitor, IngestionMonitorConfig } from '../monitoring';
import { EtlMetrics } from '../metrics';
import { PermitLoader, PermitLoaderConfig } from './loader/PermitLoader';
import { SupabaseClient } from '@supabase/supabase-js';
import { createDatabaseClient } from '../lib/database';
import { createLogger } from '../services/logger';

export interface EtlPipelineOptions {
  config?: Config;
  parserOptions?: ParserOptions;
  enableCheckpoints?: boolean;
  checkpointPath?: string;
  qaConfig?: Partial<QAGateConfig>;
  enableQAGates?: boolean;
  enableMonitoring?: boolean;
  monitorConfig?: IngestionMonitorConfig;
  enableMetrics?: boolean;
  metrics?: EtlMetrics;
  enableLoader?: boolean;
  loaderConfig?: PermitLoaderConfig;
  supabase?: SupabaseClient;
}

export interface EtlResult {
  permitsProcessed: number;
  permitsUpserted: number;
  permitsSkipped: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
  durationMs: number;
  qaPassed: boolean;
  qaResults?: Array<{
    stage: string;
    passed: boolean;
    errors: string[];
    warnings: string[];
    criticalErrors: string[];
  }>;
  monitoring?: {
    runId: string;
    sloStatus: Array<{
      name: string;
      status: 'healthy' | 'warning' | 'critical';
      currentValue: number;
    }>;
    activeAlerts: number;
  };
}

export class EtlPipeline {
  private readonly config: Config;
  private readonly parserOptions: ParserOptions;
  private readonly qaRunner: QAGateRunner | null;
  private readonly enableQAGates: boolean;
  private readonly monitor: IngestionMonitor | null;
  private readonly enableMonitoring: boolean;
  private readonly metrics: EtlMetrics | null;
  private readonly enableMetrics: boolean;
  private readonly loader: PermitLoader | null;
  private readonly enableLoader: boolean;
  private readonly supabase: SupabaseClient | null;
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(options: EtlPipelineOptions = {}) {
    this.config = options.config || new Config();
    this.logger = createLogger({ service: 'etl-pipeline' });
    this.parserOptions = {
      enableCheckpoints: options.enableCheckpoints ?? true,
      checkpointPath: options.checkpointPath || './.checkpoints/etl-checkpoint.json',
      resumeFromCheckpoint: true,
      strictMode: false,
      verbose: true,
      ...options.parserOptions
    };
    this.enableQAGates = options.enableQAGates ?? true;
    this.qaRunner = this.enableQAGates ? new QAGateRunner(options.qaConfig) : null;
    this.enableMonitoring = options.enableMonitoring ?? true;
    this.monitor = this.enableMonitoring ? new IngestionMonitor(options.monitorConfig) : null;
    this.enableMetrics = options.enableMetrics ?? true;
    this.metrics = this.enableMetrics ? (options.metrics || new EtlMetrics()) : null;
    this.enableLoader = options.enableLoader ?? true;
    this.supabase = options.supabase ?? null;

    if (this.enableLoader) {
      const supabaseClient = this.supabase || createDatabaseClient();
      const loaderLogger = createLogger({ service: 'etl-loader' });
      this.loader = new PermitLoader(supabaseClient, loaderLogger, options.loaderConfig);
    } else {
      this.loader = null;
    }
  }

  /**
   * Get the monitor instance (for testing/inspection)
   */
  getMonitor(): IngestionMonitor | null {
    return this.monitor;
  }

  /**
   * Get the metrics instance (for testing/inspection)
   */
  getMetrics(): EtlMetrics | null {
    return this.metrics;
  }

  /**
   * Execute the complete ETL pipeline
   * @param inputPath Path to the RRC permit data file
   * @returns EtlResult with processing statistics
   */
  async execute(inputPath: string): Promise<EtlResult> {
    const startTime = new Date();
    const errors: string[] = [];
    let permitsProcessed = 0;
    let permitsUpserted = 0;
    let permitsSkipped = 0;
    let qaPassed = true;
    let monitorRunId: string | undefined;

    // Record run start if monitoring is enabled
    if (this.monitor) {
      monitorRunId = this.monitor.recordRunStart(inputPath);
    }

    // Record metrics run start
    if (this.metrics) {
      this.metrics.recordRunStart();
    }

    // Start duration timer for metrics
    const stopDurationTimer = this.metrics?.startDurationTimer();

    try {
      this.logger.info(`Starting ETL pipeline for ${inputPath}`);

      // Step 1: Fetch (already done - we're reading from file)
      this.logger.info('Step 1: Fetch - Reading permit data from file');

      // Step 2: Parse the data
      this.logger.info('Step 2: Parse - Processing permit data');
      const parser = new PermitParser(this.config, this.parserOptions);
      const parseResult: ParseResult = await parser.parseFile(inputPath);

      permitsProcessed = Object.keys(parseResult.permits).length;
      this.logger.info(`Parsed ${permitsProcessed} permits`);

      // Step 3: Run QA Gates on parsed data
      if (this.qaRunner) {
        this.logger.info('Step 3: QA Gates - Running quality checks');

        // Convert permits to records for QA checks
        const records = Object.values(parseResult.permits).map((permit: PermitData) => {
          const root = permit.daroot;
          const dapermit = permit.dapermit;
          const gis = permit.gis_surface;

          return {
            permitNumber: root?.permit_number || '',
            apiNumber: dapermit?.api_number || dapermit?.permit_number || '',
            operator: root?.operator_name || '',
            wellName: root?.lease_name || '',
            county: root?.county_code || '',
            district: root?.district || '',
            fields: permit.dafield?.map(f => f.field_name).filter(Boolean) || [],
            wellType: dapermit?.well_type || '',
            status: root?.status_flag || '',
            approvalDate: dapermit?.issued_date || null,
            expirationDate: dapermit?.extended_date || null,
            latitude: gis?.latitude || null,
            longitude: gis?.longitude || null,
            ...permit
          };
        });

        const qaResult = await this.qaRunner.runStage({
          stage: 'post-transform',
          records,
          expectedSchema: {
            permitNumber: 'string',
            apiNumber: 'string',
            operator: 'string',
            wellName: 'string',
            county: 'string',
            district: 'string',
            fields: 'object',
            wellType: 'string',
            status: 'string',
            approvalDate: 'string',
            expirationDate: 'string',
            latitude: 'number',
            longitude: 'number'
          }
        });

        qaPassed = qaResult.passed;

        // Log QA results
        this.logger.info(`QA Gate ${qaResult.passed ? 'PASSED' : 'FAILED'} (${qaResult.stage})`);
        if (qaResult.warnings.length > 0) {
          this.logger.warn(`QA warnings (${qaResult.warnings.length}): ${qaResult.warnings.join('; ')}`);
        }
        if (qaResult.errors.length > 0) {
          this.logger.error(`QA errors (${qaResult.errors.length}): ${qaResult.errors.join('; ')}`);
        }
        if (qaResult.criticalErrors.length > 0) {
          this.logger.error(`QA critical errors (${qaResult.criticalErrors.length}): ${qaResult.criticalErrors.join('; ')}`);
        }

        // Add QA errors to pipeline errors if gate failed
        if (!qaResult.passed) {
          errors.push(...qaResult.errors, ...qaResult.criticalErrors);
        }
      }

      // Step 4: Load permits to database
      if (this.loader && qaPassed) {
        this.logger.info('Step 4: Load - Upserting permits to database');
        try {
          const permits = Object.values(parseResult.permits);
          const loadResult = await this.loader.loadPermits(permits);

          permitsUpserted = loadResult.inserted + loadResult.updated;
          permitsSkipped = loadResult.skipped;

          if (loadResult.errors > 0) {
            errors.push(...loadResult.errorDetails);
          }

          this.logger.info(`Load complete - Inserted: ${loadResult.inserted}, Updated: ${loadResult.updated}, Skipped: ${loadResult.skipped}, Errors: ${loadResult.errors}`);
        } catch (loadError) {
          const errorMsg = `Database load failed: ${loadError instanceof Error ? loadError.message : String(loadError)}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      } else if (!qaPassed) {
        this.logger.info('Step 4: Load - SKIPPED (QA gates failed)');
      } else {
        this.logger.info('Step 4: Load - SKIPPED (loader disabled)');
      }

      // Step 5: Refresh operator stats materialized views
      if (this.supabase && qaPassed && permitsUpserted > 0) {
        this.logger.info('Step 5: Refresh - Updating operator stats materialized views');
        try {
          const { error: rpcError } = await this.supabase.rpc('refresh_operator_stats_views');
          if (rpcError) {
            this.logger.warn(`Operator stats refresh failed (non-critical): ${rpcError.message}`);
          } else {
            this.logger.info('Operator stats materialized views refreshed successfully');
          }
        } catch (refreshError) {
          this.logger.warn(`Operator stats refresh error (non-critical): ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`);
        }
      } else if (!qaPassed) {
        this.logger.info('Step 5: Refresh - SKIPPED (QA gates failed)');
      } else if (permitsUpserted === 0) {
        this.logger.info('Step 5: Refresh - SKIPPED (no permits upserted)');
      } else {
        this.logger.info('Step 5: Refresh - SKIPPED (supabase client not available)');
      }

    } catch (error) {
      const errorMsg = `ETL pipeline failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);

      if (error instanceof Error && error.stack) {
        this.logger.error(error.stack);
      }

      // Record error in monitor with error handling
      if (this.monitor && monitorRunId) {
        try {
          this.monitor.recordError(monitorRunId, error instanceof Error ? error : new Error(String(error)));
        } catch (monitorError) {
          // Log but don't throw - original error is more important
          this.logger.error(`Failed to record error in monitor: ${monitorError instanceof Error ? monitorError.message : String(monitorError)}`);
        }
      }
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    // Stop duration timer
    if (stopDurationTimer) {
      stopDurationTimer();
    }

    // Build QA results summary
    const qaResults = this.qaRunner?.getResults().map(r => ({
      stage: r.stage,
      passed: r.passed,
      errors: r.errors,
      warnings: r.warnings,
      criticalErrors: r.criticalErrors
    }));

    // Record run completion in metrics
    if (this.metrics) {
      this.metrics.recordRunComplete({
        durationMs,
        recordsProcessed: permitsProcessed,
        recordsFailed: errors.length,
        recordsSkipped: permitsSkipped,
        success: errors.length === 0 && qaPassed
      });
    }

    // Record run completion in monitor
    if (this.monitor && monitorRunId) {
      try {
        this.monitor.recordRunComplete(monitorRunId, {
          recordsProcessed: permitsProcessed,
          recordsFailed: errors.length,
          errorCount: errors.length,
          qaPassed,
          qaResults: qaResults ? {
            warnings: qaResults.reduce((sum, r) => sum + r.warnings.length, 0),
            errors: qaResults.reduce((sum, r) => sum + r.errors.length, 0),
            criticalErrors: qaResults.reduce((sum, r) => sum + r.criticalErrors.length, 0)
          } : undefined
        });
      } catch (monitorError) {
        this.logger.error(`Failed to record run completion in monitor: ${monitorError instanceof Error ? monitorError.message : String(monitorError)}`);
      }
    }

    // Build monitoring summary for result
    const monitoring = (this.monitor && monitorRunId) ? {
      runId: monitorRunId,
      sloStatus: this.monitor.checkSLOs().map(s => ({
        name: s.config.name,
        status: s.status,
        currentValue: s.currentValue
      })),
      activeAlerts: this.monitor.getDashboardMetrics().activeAlerts.length
    } : undefined;

    return {
      permitsProcessed,
      permitsUpserted,
      permitsSkipped,
      errors,
      startTime,
      endTime,
      durationMs,
      qaPassed,
      qaResults,
      monitoring
    };
  }
}
