/**
 * Volume-based QA checks
 * - Row count validation
 * - Delta detection
 * - Duplicate detection
 */

import { QACheck, CheckSeverity, VolumeThresholds } from '../types';

export interface VolumeCheckContext {
  currentCount: number;
  previousCount?: number;
  records: Array<Record<string, unknown>>;
  idField?: string;
}

export class VolumeChecks {
  private thresholds: VolumeThresholds;

  constructor(thresholds: VolumeThresholds) {
    this.thresholds = thresholds;
  }

  /**
   * Check if record count is within acceptable bounds
   */
  checkRowCount(context: VolumeCheckContext): QACheck {
    const { currentCount, previousCount } = context;
    const checks: string[] = [];
    let passed = true;
    let severity: CheckSeverity = 'info';

    // Check for zero records
    if (this.thresholds.alertOnZero && currentCount === 0) {
      passed = false;
      severity = 'critical';
      checks.push('Zero records detected');
    }

    // Check minimum records
    if (currentCount < this.thresholds.minRecords) {
      passed = false;
      severity = 'error';
      checks.push(`Record count (${currentCount}) below minimum (${this.thresholds.minRecords})`);
    }

    // Check maximum records
    if (this.thresholds.maxRecords && currentCount > this.thresholds.maxRecords) {
      passed = false;
      severity = 'warning';
      checks.push(`Record count (${currentCount}) exceeds maximum (${this.thresholds.maxRecords})`);
    }

    // Check delta from previous run
    if (previousCount !== undefined && previousCount > 0) {
      const deltaPercent = Math.abs((currentCount - previousCount) / previousCount) * 100;
      if (deltaPercent > this.thresholds.maxDeltaPercent) {
        passed = false;
        severity = 'error';
        checks.push(`Volume delta (${deltaPercent.toFixed(1)}%) exceeds threshold (${this.thresholds.maxDeltaPercent}%)`);
      }
    }

    return {
      name: 'volume.row_count',
      passed,
      expected: {
        min: this.thresholds.minRecords,
        max: this.thresholds.maxRecords,
        maxDeltaPercent: this.thresholds.maxDeltaPercent
      },
      actual: {
        current: currentCount,
        previous: previousCount,
        delta: previousCount ? ((currentCount - previousCount) / previousCount) * 100 : undefined
      },
      severity,
      message: checks.length > 0 ? checks.join('; ') : `Volume check passed: ${currentCount} records`,
      timestamp: new Date()
    };
  }

  /**
   * Check for duplicate records based on ID field
   */
  checkDuplicates(context: VolumeCheckContext): QACheck {
    const { records, idField = 'permit_number' } = context;
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const record of records) {
      const rawValue = record[idField];
      // Skip null/undefined/empty values to avoid false duplicates
      if (rawValue == null || rawValue === '') continue;

      const id = String(rawValue);
      if (seen.has(id)) {
        duplicates.add(id);
      }
      seen.add(id);
    }

    const duplicateCount = duplicates.size;
    const passed = duplicateCount === 0;

    return {
      name: 'volume.duplicates',
      passed,
      expected: 0,
      actual: duplicateCount,
      severity: duplicateCount > 0 ? 'error' : 'info',
      message: passed
        ? 'No duplicates detected'
        : `Found ${duplicateCount} duplicate records (field: ${idField})`,
      timestamp: new Date()
    };
  }

  /**
   * Run all volume checks
   */
  runAll(context: VolumeCheckContext): QACheck[] {
    return [
      this.checkRowCount(context),
      this.checkDuplicates(context)
    ];
  }
}
