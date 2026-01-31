/**
 * Pipeline Logger
 * 
 * Specialized logger for ETL pipeline operations with domain-specific methods
 * for tracking parsing, QA, loading, and checkpoint operations.
 */

import { TestLogger } from './logger';

export class PipelineLogger {
  private logger: TestLogger;

  constructor() {
    this.logger = TestLogger.getInstance();
  }

  /**
   * Log parser start
   */
  logParseStart(filePath: string, fileSize: number): void {
    this.logger.logPhase('execute', 'parse_start', {
      filePath,
      fileSize,
      operation: 'parsing'
    });
  }

  /**
   * Log parser completion
   */
  logParseComplete(
    filePath: string, 
    recordsParsed: number, 
    durationMs: number,
    violations: number = 0
  ): void {
    this.logger.logPerformance('parse_complete', durationMs, {
      filePath,
      recordsParsed,
      violations,
      recordsPerSecond: Math.round(recordsParsed / (durationMs / 1000))
    });
  }

  /**
   * Log QA gate start
   */
  logQaGateStart(gateName: string): void {
    this.logger.logPhase('execute', 'qa_gate_start', {
      gateName,
      operation: 'qa_check'
    });
  }

  /**
   * Log QA gate completion
   */
  logQaGateComplete(
    gateName: string, 
    passed: boolean, 
    violations: number, 
    durationMs: number
  ): void {
    this.logger.logPerformance('qa_gate_complete', durationMs, {
      gateName,
      passed,
      violations
    });
  }

  /**
   * Log load start
   */
  logLoadStart(recordCount: number): void {
    this.logger.logPhase('execute', 'load_start', { recordCount });
  }

  /**
   * Log load completion
   */
  logLoadComplete(recordsLoaded: number, durationMs: number): void {
    this.logger.logPerformance('load_complete', durationMs, {
      recordsLoaded,
      insertsPerSecond: Math.round(recordsLoaded / (durationMs / 1000))
    });
  }

  /**
   * Log checkpoint
   */
  logCheckpoint(savedAt: number, filePath: string): void {
    this.logger.logPhase('execute', 'checkpoint_saved', {
      recordCount: savedAt,
      filePath
    });
  }

  /**
   * Log error with context
   */
  logError(phase: string, error: Error, context?: Record<string, unknown>): void {
    this.logger.logError(phase, error, context);
  }
}