import { QACheck, ValueThresholds } from '../types';

export interface ValueCheckContext {
  records: Array<Record<string, unknown>>;
}

export class ValueChecks {
  private thresholds: ValueThresholds;

  constructor(thresholds: ValueThresholds) {
    this.thresholds = thresholds;
  }

  /**
   * Check null rates across all fields
   */
  checkNullRates(context: ValueCheckContext): QACheck {
    const { records } = context;
    const nullCounts: Record<string, number> = {};
    const totalRecords = records.length;

    for (const record of records) {
      for (const [field, value] of Object.entries(record)) {
        if (value === null || value === undefined || value === '') {
          nullCounts[field] = (nullCounts[field] || 0) + 1;
        }
      }
    }

    const nullRates: Record<string, number> = {};
    const issues: string[] = [];
    let totalViolations = 0;

    for (const [field, count] of Object.entries(nullCounts)) {
      const rate = count / totalRecords;
      nullRates[field] = rate;

      if (rate > this.thresholds.maxNullRate) {
        totalViolations++;
        if (issues.length < 5) {
          issues.push(`${field}: ${(rate * 100).toFixed(1)}%`);
        }
      }
    }

    const passed = totalViolations === 0;

    return {
      name: 'values.null_rates',
      passed,
      severity: passed ? 'info' : 'warning',
      message: passed
        ? 'All fields have acceptable null rates'
        : `${totalViolations} fields exceed max null rate (${(this.thresholds.maxNullRate * 100).toFixed(0)}%): ${issues.join(', ')}`,
      actual: nullRates,
      expected: this.thresholds.maxNullRate,
      timestamp: new Date()
    };
  }

  /**
   * Check for date sanity (no future dates, no dates too far in the past)
   */
  checkDateSanity(context: ValueCheckContext): QACheck {
    const { records } = context;
    const now = new Date();
    const maxFuture = new Date(now.getTime() + this.thresholds.maxFutureDays * 24 * 60 * 60 * 1000);
    const maxPast = new Date(now.getTime() - this.thresholds.maxPastDays * 24 * 60 * 60 * 1000);

    let futureCount = 0;
    let pastCount = 0;
    const issues: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record) continue;

      for (const [field, value] of Object.entries(record)) {
        if (field.includes('date') || field.includes('Date')) {
          // Skip non-date values and empty strings
          if (value == null || value === '') continue;

          // Handle Date objects directly
          let date: Date;
          if (value instanceof Date) {
            date = value;
          } else if (typeof value === 'number') {
            // Validate timestamp is within reasonable range (1900-2100)
            if (value < -2208988800000 || value > 4102444800000) continue;
            date = new Date(value);
          } else {
            // For strings, use strict parsing
            const strValue = String(value).trim();
            if (!strValue) continue;

            // Reject obviously invalid date strings
            if (strValue.toLowerCase() === 'invalid date') continue;

            date = new Date(strValue);
          }

          if (isNaN(date.getTime())) continue;

          if (date > maxFuture) {
            futureCount++;
            if (issues.length < 5) issues.push(`${field}[${i}]: ${date.toISOString()} (future)`);
          }

          if (date < maxPast) {
            pastCount++;
            if (issues.length < 5) issues.push(`${field}[${i}]: ${date.toISOString()} (past)`);
          }
        }
      }
    }

    const totalIssues = futureCount + pastCount;
    const passed = totalIssues === 0;

    return {
      name: 'values.date_sanity',
      passed,
      severity: passed ? 'info' : 'error',
      message: passed
        ? 'All dates are within acceptable range'
        : `Found ${futureCount} future dates and ${pastCount} dates too far in the past. Examples: ${issues.join('; ')}`,
      actual: { futureDates: futureCount, pastDates: pastCount },
      expected: { maxFutureDays: this.thresholds.maxFutureDays, maxPastDays: this.thresholds.maxPastDays },
      timestamp: new Date()
    };
  }

  /**
   * Check coordinate bounds (valid latitude/longitude)
   */
  checkCoordinateBounds(context: ValueCheckContext): QACheck {
    const { records } = context;
    let invalidCount = 0;
    const issues: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record) continue;
      
      const lat = record.latitude as number | null | undefined;
      const lng = record.longitude as number | null | undefined;

      if (lat !== null && lat !== undefined) {
        if (lat < -90 || lat > 90) {
          invalidCount++;
          if (issues.length < 5) issues.push(`lat[${i}]: ${lat}`);
        }
      }

      if (lng !== null && lng !== undefined) {
        if (lng < -180 || lng > 180) {
          invalidCount++;
          if (issues.length < 5) issues.push(`lng[${i}]: ${lng}`);
        }
      }
    }

    const passed = invalidCount === 0;

    return {
      name: 'values.coordinate_bounds',
      passed,
      severity: passed ? 'info' : 'error',
      message: passed
        ? 'All coordinates are within valid bounds'
        : `Found ${invalidCount} invalid coordinates. Examples: ${issues.join(', ')}`,
      actual: { invalidCoordinates: invalidCount },
      expected: { latRange: [-90, 90], lngRange: [-180, 180] },
      timestamp: new Date()
    };
  }

  /**
   * Run all value checks
   */
  runAll(context: ValueCheckContext): QACheck[] {
    return [
      this.checkNullRates(context),
      this.checkDateSanity(context),
      this.checkCoordinateBounds(context)
    ];
  }
}