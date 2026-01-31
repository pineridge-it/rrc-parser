/**
 * Schema-based QA checks
 * - Required field validation
 * - Type checking
 * - Schema drift detection
 */

import { QACheck, CheckSeverity, SchemaThresholds } from '../types';

export interface SchemaCheckContext {
  records: Array<Record<string, unknown>>;
  expectedSchema?: Record<string, string>; // field name -> expected type
}

export class SchemaChecks {
  private thresholds: SchemaThresholds;

  constructor(thresholds: SchemaThresholds) {
    this.thresholds = thresholds;
  }

  /**
   * Check for required fields
   */
  checkRequiredFields(context: SchemaCheckContext): QACheck {
    const { records } = context;
    const missingFields = new Map<string, number>();

    for (const record of records) {
      for (const field of this.thresholds.requiredFields) {
        if (record[field] === undefined || record[field] === null || record[field] === '') {
          missingFields.set(field, (missingFields.get(field) || 0) + 1);
        }
      }
    }

    const missingFieldList = Array.from(missingFields.entries())
      .filter(([, count]) => count > 0)
      .map(([field, count]) => `${field} (${count} records)`);

    const passed = missingFieldList.length === 0;

    return {
      name: 'schema.required_fields',
      passed,
      expected: this.thresholds.requiredFields,
      actual: passed ? 'All present' : missingFieldList,
      severity: passed ? 'info' : 'critical',
      message: passed 
        ? `All required fields present: ${this.thresholds.requiredFields.join(', ')}`
        : `Missing required fields: ${missingFieldList.join(', ')}`,
      timestamp: new Date()
    };
  }

  /**
   * Detect schema drift - new or missing fields
   */
  checkSchemaDrift(context: SchemaCheckContext): QACheck {
    const { records, expectedSchema } = context;
    
    if (!expectedSchema) {
      return {
        name: 'schema.drift',
        passed: true,
        expected: 'No baseline schema provided',
        actual: 'Skipped',
        severity: 'info',
        message: 'Schema drift check skipped - no baseline provided',
        timestamp: new Date()
      };
    }

    // Collect all fields from current records - sample from beginning, middle, and end
    const currentFields = new Set<string>();
    const sampleSize = Math.min(100, Math.max(10, Math.floor(records.length * 0.1))); // 10% or at least 10, max 100

    if (records.length <= sampleSize) {
      // Check all records if small dataset
      for (const record of records) {
        Object.keys(record).forEach(field => currentFields.add(field));
      }
    } else {
      // Stratified sampling: beginning, middle, end
      const third = Math.floor(records.length / 3);
      const samples = [
        ...records.slice(0, sampleSize / 3),
        ...records.slice(third, third + sampleSize / 3),
        ...records.slice(-Math.ceil(sampleSize / 3))
      ];

      for (const record of samples) {
        Object.keys(record).forEach(field => currentFields.add(field));
      }
    }

    const expectedFields = new Set(Object.keys(expectedSchema));
    
    const newFields = Array.from(currentFields).filter(f => !expectedFields.has(f));
    const missingFields = Array.from(expectedFields).filter(f => !currentFields.has(f));

    let passed = true;
    let severity: CheckSeverity = 'info';

    if (newFields.length > 0 && !this.thresholds.allowNewFields) {
      passed = false;
      severity = 'error';
    }
    if (missingFields.length > 0 && !this.thresholds.allowMissingFields) {
      passed = false;
      severity = 'critical';
    }

    return {
      name: 'schema.drift',
      passed,
      expected: Array.from(expectedFields),
      actual: {
        current: Array.from(currentFields),
        newFields,
        missingFields
      },
      severity,
      message: passed
        ? 'No schema drift detected'
        : `Schema drift detected: ${newFields.length} new fields, ${missingFields.length} missing`,
      timestamp: new Date()
    };
  }

  /**
   * Validate data types
   */
  checkDataTypes(context: SchemaCheckContext): QACheck {
    const { records, expectedSchema } = context;
    
    if (!expectedSchema) {
      return {
        name: 'schema.data_types',
        passed: true,
        expected: 'No type schema provided',
        actual: 'Skipped',
        severity: 'info',
        message: 'Data type check skipped - no schema provided',
        timestamp: new Date()
      };
    }

    const typeErrors: string[] = [];

    // Stratified sampling for type checking
    const sampleSize = Math.min(100, Math.max(10, Math.floor(records.length * 0.1)));
    let indices: number[];

    if (records.length <= sampleSize) {
      indices = records.map((_, i) => i);
    } else {
      const third = Math.floor(records.length / 3);
      indices = [
        ...Array.from({ length: Math.floor(sampleSize / 3) }, (_, i) => i),
        ...Array.from({ length: Math.floor(sampleSize / 3) }, (_, i) => third + i),
        ...Array.from({ length: Math.ceil(sampleSize / 3) }, (_, i) => records.length - Math.ceil(sampleSize / 3) + i)
      ];
    }

    for (const i of indices) {
      const record = records[i];
      if (!record) continue;

      for (const [field, expectedType] of Object.entries(expectedSchema)) {
        const value = record[field];
        if (value === undefined || value === null) continue;

        const actualType = typeof value;
        if (actualType !== expectedType && !(expectedType === 'date' && !isNaN(Date.parse(String(value))))) {
          typeErrors.push(`${field}[${i}]: expected ${expectedType}, got ${actualType}`);
        }
      }
    }

    const passed = typeErrors.length === 0;

    return {
      name: 'schema.data_types',
      passed,
      expected: expectedSchema,
      actual: passed ? 'All valid' : `${typeErrors.length} type mismatches`,
      severity: passed ? 'info' : 'warning',
      message: passed 
        ? 'All data types valid'
        : `Type errors: ${typeErrors.slice(0, 5).join('; ')}${typeErrors.length > 5 ? '...' : ''}`,
      timestamp: new Date()
    };
  }

  /**
   * Run all schema checks
   */
  runAll(context: SchemaCheckContext): QACheck[] {
    return [
      this.checkRequiredFields(context),
      this.checkSchemaDrift(context),
      this.checkDataTypes(context)
    ];
  }
}
