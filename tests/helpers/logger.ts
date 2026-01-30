/**
 * Test Logger
 * 
 * Provides structured logging for test execution with timing and memory tracking.
 * All logs are output in JSON format for easy parsing and analysis.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogPhase = 'setup' | 'execute' | 'verify' | 'cleanup';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  phase: LogPhase;
  testName: string;
  operation: string;
  duration?: number;  // milliseconds
  memory?: number;    // bytes used
  data?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

export interface LogOptions {
  verbose?: boolean;
  outputPath?: string;
  includeMemory?: boolean;
  includeTiming?: boolean;
}

/**
 * Singleton test logger for tracking test execution
 */
export class TestLogger {
  private static instance: TestLogger;
  private logs: LogEntry[] = [];
  private startTime: number = 0;
  private options: LogOptions;

  private constructor(options: LogOptions = {}) {
    this.options = {
      verbose: process.env.TEST_VERBOSE === 'true',
      outputPath: 'tests/logs',
      includeMemory: true,
      includeTiming: true,
      ...options,
    };
  }

  /**
   * Get the singleton logger instance
   */
  static getInstance(options?: LogOptions): TestLogger {
    if (!TestLogger.instance) {
      TestLogger.instance = new TestLogger(options);
    }
    return TestLogger.instance;
  }

  /**
   * Reset the logger instance (useful for testing)
   */
  static reset(): void {
    TestLogger.instance = new TestLogger();
  }

  /**
   * Start logging for a test
   */
  startTest(testName: string): void {
    this.startTime = Date.now();
    this.log({
      level: 'info',
      phase: 'setup',
      testName,
      operation: 'test_start',
      data: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  }

  /**
   * Log a phase transition
   */
  logPhase(phase: LogPhase, operation: string, data?: Record<string, unknown>): void {
    this.log({
      level: 'info',
      phase,
      testName: this.getCurrentTestName(),
      operation,
      duration: this.options.includeTiming ? Date.now() - this.startTime : undefined,
      data,
    });
  }

  /**
   * Log an error
   */
  logError(operation: string, error: Error, context?: Record<string, unknown>): void {
    this.log({
      level: 'error',
      phase: 'execute',
      testName: this.getCurrentTestName(),
      operation,
      duration: this.options.includeTiming ? Date.now() - this.startTime : undefined,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      data: context,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, durationMs: number, data?: Record<string, unknown>): void {
    const memUsage = this.options.includeMemory ? process.memoryUsage() : null;
    
    this.log({
      level: 'info',
      phase: 'execute',
      testName: this.getCurrentTestName(),
      operation,
      duration: durationMs,
      memory: memUsage?.heapUsed,
      data: {
        ...data,
        rss: memUsage?.rss,
        external: memUsage?.external,
        heapTotal: memUsage?.heapTotal,
      },
    });
  }

  /**
   * Log a debug message
   */
  debug(operation: string, data?: Record<string, unknown>): void {
    this.log({
      level: 'debug',
      phase: 'execute',
      testName: this.getCurrentTestName(),
      operation,
      data,
    });
  }

  /**
   * Log a warning
   */
  warn(operation: string, message: string, data?: Record<string, unknown>): void {
    this.log({
      level: 'warn',
      phase: 'execute',
      testName: this.getCurrentTestName(),
      operation,
      data: { message, ...data },
    });
  }

  /**
   * Get all logged entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by phase
   */
  getLogsByPhase(phase: LogPhase): LogEntry[] {
    return this.logs.filter(log => log.phase === phase);
  }

  /**
   * Get the last log entry
   */
  getLastLog(): LogEntry | undefined {
    return this.logs[this.logs.length - 1];
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Write logs to file
   */
  writeToFile(filename?: string): string {
    const fs = require('fs');
    const path = require('path');
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.options.outputPath)) {
      fs.mkdirSync(this.options.outputPath, { recursive: true });
    }
    
    const testName = this.sanitizeFilename(this.getCurrentTestName() || 'unknown');
    const filePath = path.join(
      this.options.outputPath!,
      filename || `${testName}_${Date.now()}.json`
    );
    
    fs.writeFileSync(filePath, JSON.stringify(this.logs, null, 2));
    return filePath;
  }

  /**
   * Generate a summary of the logs
   */
  generateSummary(): {
    totalLogs: number;
    errors: number;
    warnings: number;
    totalDuration: number;
    peakMemory: number;
    slowOperations: Array<{ operation: string; duration: number }>;
  } {
    const errors = this.logs.filter(l => l.level === 'error').length;
    const warnings = this.logs.filter(l => l.level === 'warn').length;
    
    const durations = this.logs
      .filter(l => l.duration !== undefined)
      .map(l => l.duration!);
    
    const memories = this.logs
      .filter(l => l.memory !== undefined)
      .map(l => l.memory!);
    
    const slowOperations = this.logs
      .filter(l => l.duration && l.duration > 1000)
      .map(l => ({ operation: l.operation, duration: l.duration! }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    return {
      totalLogs: this.logs.length,
      errors,
      warnings,
      totalDuration: durations.length > 0 ? Math.max(...durations) : 0,
      peakMemory: memories.length > 0 ? Math.max(...memories) : 0,
      slowOperations,
    };
  }

  /**
   * Print a summary to console
   */
  printSummary(): void {
    const summary = this.generateSummary();
    
    console.log('\n📊 Test Log Summary');
    console.log('-'.repeat(50));
    console.log(`Total Logs: ${summary.totalLogs}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Warnings: ${summary.warnings}`);
    console.log(`Total Duration: ${this.formatDuration(summary.totalDuration)}`);
    console.log(`Peak Memory: ${this.formatBytes(summary.peakMemory)}`);
    
    if (summary.slowOperations.length > 0) {
      console.log('\n🐌 Slow Operations (>1s):');
      summary.slowOperations.forEach(op => {
        console.log(`  ${op.operation}: ${this.formatDuration(op.duration)}`);
      });
    }
  }

  private log(entry: Omit<LogEntry, 'timestamp'>): void {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(fullEntry);

    if (this.options.verbose) {
      console.log(JSON.stringify(fullEntry));
    }
  }

  private getCurrentTestName(): string {
    // Try to get test name from Jest's expect state
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (expect as any).getState().currentTestName || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

// Export singleton instance
export const logger = TestLogger.getInstance();
export default logger;
