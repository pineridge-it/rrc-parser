/**
 * Log Analyzer
 * 
 * Analyzes test logs to identify performance bottlenecks, memory issues,
 * and failure patterns. Provides actionable insights from test execution.
 */

import { LogEntry } from './logger';

export class LogAnalyzer {
  constructor(private logs: LogEntry[]) {}

  /**
   * Find slow operations that exceed the threshold
   */
  findSlowOperations(thresholdMs: number = 1000): LogEntry[] {
    return this.logs.filter(
      log => log.duration && log.duration > thresholdMs
    );
  }

  /**
   * Calculate total test duration from start to completion
   */
  getTotalDuration(): number {
    const start = this.logs.find(l => l.operation === 'test_start');
    const end = this.logs.find(l => l.operation === 'test_complete');
    if (start && end) {
      return new Date(end.timestamp).getTime() - new Date(start.timestamp).getTime();
    }
    return 0;
  }

  /**
   * Find memory spikes that are significantly above average
   */
  findMemorySpikes(): LogEntry[] {
    const memoryLogs = this.logs.filter(l => l.memory);
    if (memoryLogs.length === 0) return [];
    
    const avgMemory = memoryLogs.reduce((sum, l) => sum + (l.memory || 0), 0) / memoryLogs.length;
    return memoryLogs.filter(l => (l.memory || 0) > avgMemory * 2);
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.logs.filter(l => l.level === 'error').length;
  }

  /**
   * Get warning count
   */
  getWarningCount(): number {
    return this.logs.filter(l => l.level === 'warn').length;
  }

  /**
   * Get operations by phase
   */
  getOperationsByPhase(phase: string): LogEntry[] {
    return this.logs.filter(l => l.phase === phase);
  }

  /**
   * Get operations by type
   */
  getOperationsByType(operationType: string): LogEntry[] {
    return this.logs.filter(l => l.operation.includes(operationType));
  }

  /**
   * Generate a comprehensive summary of the logs
   */
  generateSummary(): {
    totalDuration: number;
    slowOperations: LogEntry[];
    memoryPeak: number;
    errorCount: number;
    warningCount: number;
    operationCounts: Record<string, number>;
  } {
    // Get all operations and count them
    const operationCounts: Record<string, number> = {};
    this.logs.forEach(log => {
      const op = log.operation;
      if (op) {
        operationCounts[op] = (operationCounts[op] || 0) + 1;
      }
    });

    return {
      totalDuration: this.getTotalDuration(),
      slowOperations: this.findSlowOperations(),
      memoryPeak: Math.max(...this.logs.map(l => l.memory || 0)),
      errorCount: this.getErrorCount(),
      warningCount: this.getWarningCount(),
      operationCounts
    };
  }

  /**
   * Find repeated operations that might indicate inefficiency
   */
  findRepeatedOperations(minCount: number = 5): Array<{ operation: string; count: number }> {
    const counts: Record<string, number> = {};
    
    this.logs.forEach(log => {
      if (log.operation) {
        counts[log.operation] = (counts[log.operation] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .filter(([, count]) => count >= minCount)
      .map(([operation, count]) => ({ operation, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get timing distribution for performance analysis
   */
  getTimingDistribution(): { 
    fast: number;     // < 100ms
    medium: number;   // 100ms - 1s
    slow: number;     // > 1s
  } {
    const fast = this.logs.filter(l => l.duration && l.duration < 100).length;
    const medium = this.logs.filter(l => l.duration && l.duration >= 100 && l.duration < 1000).length;
    const slow = this.logs.filter(l => l.duration && l.duration >= 1000).length;
    
    return { fast, medium, slow };
  }

  /**
   * Find operations with high memory usage
   */
  findHighMemoryOperations(thresholdBytes: number = 100 * 1024 * 1024): LogEntry[] { // 100MB default
    return this.logs.filter(l => l.memory && l.memory > thresholdBytes);
  }
}