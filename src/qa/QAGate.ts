/**
 * Main QA Gate implementation
 * Orchestrates all quality checks at different pipeline stages
 */

import {
  QACheck,
  QAResult,
  QAMetrics,
  QAGateConfig,
  CheckStage,
  DEFAULT_QA_CONFIG
} from './types';
import { VolumeChecks, VolumeCheckContext } from './checks/VolumeChecks';
import { SchemaChecks, SchemaCheckContext } from './checks/SchemaChecks';
import { ValueChecks, ValueCheckContext } from './checks/ValueChecks';

export interface QAGateContext {
  stage: CheckStage;
  records: Array<Record<string, unknown>>;
  previousCount?: number;
  expectedSchema?: Record<string, string>;
}

export class QAGate {
  private config: QAGateConfig;
  private volumeChecks: VolumeChecks;
  private schemaChecks: SchemaChecks;
  private valueChecks: ValueChecks;

  constructor(config: Partial<QAGateConfig> = {}) {
    this.config = { ...DEFAULT_QA_CONFIG, ...config };
    this.volumeChecks = new VolumeChecks(this.config.volume);
    this.schemaChecks = new SchemaChecks(this.config.schema);
    this.valueChecks = new ValueChecks(this.config.values);
  }

  /**
   * Run all QA checks for a given stage
   */
  async run(context: QAGateContext): Promise<QAResult> {
    const startTime = Date.now();
    const checks: QACheck[] = [];

    // Run checks based on stage
    switch (context.stage) {
      case 'pre-ingestion':
        checks.push(...this.runPreIngestionChecks(context));
        break;
      case 'post-transform':
        checks.push(...this.runPostTransformChecks(context));
        break;
      case 'post-load':
        checks.push(...this.runPostLoadChecks(context));
        break;
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(context.records, checks);

    // Categorize issues
    const warnings = checks.filter(c => c.severity === 'warning' && !c.passed).map(c => c.message);
    const errors = checks.filter(c => c.severity === 'error' && !c.passed).map(c => c.message);
    const criticalErrors = checks.filter(c => c.severity === 'critical' && !c.passed).map(c => c.message);

    // Determine overall pass/fail
    const hasCritical = criticalErrors.length > 0;
    const hasErrors = errors.length > 0;
    let passed = true;

    if (hasCritical && this.config.failOnCritical) {
      passed = false;
    } else if (hasErrors && this.config.failOnError) {
      passed = false;
    }

    return {
      stage: context.stage,
      passed,
      checks,
      warnings,
      errors,
      criticalErrors,
      metrics,
      timestamp: new Date(),
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Pre-ingestion checks (raw data validation)
   */
  private runPreIngestionChecks(context: QAGateContext): QACheck[] {
    const checks: QACheck[] = [];

    // Volume checks
    const volumeContext: VolumeCheckContext = {
      currentCount: context.records.length,
      previousCount: context.previousCount,
      records: context.records
    };
    checks.push(...this.volumeChecks.runAll(volumeContext));

    return checks;
  }

  /**
   * Post-transform checks (after data cleaning/normalization)
   */
  private runPostTransformChecks(context: QAGateContext): QACheck[] {
    const checks: QACheck[] = [];

    // Schema checks
    const schemaContext: SchemaCheckContext = {
      records: context.records,
      expectedSchema: context.expectedSchema
    };
    checks.push(...this.schemaChecks.runAll(schemaContext));

    // Value checks
    const valueContext: ValueCheckContext = {
      records: context.records
    };
    checks.push(...this.valueChecks.runAll(valueContext));

    return checks;
  }

  /**
   * Post-load checks (after database insertion)
   */
  private runPostLoadChecks(context: QAGateContext): QACheck[] {
    // Similar to post-transform but could include DB-specific checks
    return this.runPostTransformChecks(context);
  }

  /**
   * Calculate quality metrics from checks
   */
  private calculateMetrics(records: Array<Record<string, unknown>>, checks: QACheck[]): QAMetrics {
    const nullRates: Record<string, number> = {};
    const nullCheck = checks.find(c => c.name === 'values.null_rates');
    if (nullCheck && typeof nullCheck.actual === 'object') {
      Object.assign(nullRates, nullCheck.actual);
    }

    const duplicateCheck = checks.find(c => c.name === 'volume.duplicates');
    const duplicateCount = duplicateCheck && typeof duplicateCheck.actual === 'number' 
      ? duplicateCheck.actual 
      : 0;

    const driftCheck = checks.find(c => c.name === 'schema.drift');
    const schemaDriftDetected = driftCheck ? !driftCheck.passed : false;
    const newFields = driftCheck && Array.isArray((driftCheck.actual as { newFields?: string[] })?.newFields)
      ? (driftCheck.actual as { newFields: string[] }).newFields
      : [];
    const missingFields = driftCheck && Array.isArray((driftCheck.actual as { missingFields?: string[] })?.missingFields)
      ? (driftCheck.actual as { missingFields: string[] }).missingFields
      : [];

    return {
      totalRecords: records.length,
      validRecords: records.length, // Could be refined based on validation
      invalidRecords: 0,
      nullRates,
      duplicateCount,
      schemaDriftDetected,
      newFields,
      missingFields,
      processingTimeMs: 0
    };
  }
}

/**
 * Runner class for executing QA gates across multiple stages
 */
export class QAGateRunner {
  private gate: QAGate;
  private results: QAResult[] = [];
  private maxHistorySize: number;

  constructor(config?: Partial<QAGateConfig> & { maxHistorySize?: number }) {
    this.gate = new QAGate(config);
    this.maxHistorySize = config?.maxHistorySize ?? 1000;
  }

  /**
   * Run a specific stage
   */
  async runStage(context: QAGateContext): Promise<QAResult> {
    const result = await this.gate.run(context);
    this.results.push(result);

    // Trim history if needed to prevent memory leaks
    if (this.results.length > this.maxHistorySize) {
      this.results = this.results.slice(-this.maxHistorySize);
    }

    return result;
  }

  /**
   * Get all results
   */
  getResults(): QAResult[] {
    return [...this.results];
  }

  /**
   * Get summary of all runs
   */
  getSummary(): {
    totalRuns: number;
    passed: number;
    failed: number;
    totalErrors: number;
    totalWarnings: number;
    totalCritical: number;
  } {
    return {
      totalRuns: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      totalErrors: this.results.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: this.results.reduce((sum, r) => sum + r.warnings.length, 0),
      totalCritical: this.results.reduce((sum, r) => sum + r.criticalErrors.length, 0)
    };
  }

  /**
   * Clear all results
   */
  clear(): void {
    this.results = [];
  }
}
