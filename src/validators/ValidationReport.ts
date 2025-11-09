/**
 * Validation reporting system for better error tracking
 * Location: src/validators/ValidationReport.ts
 */

import { createObjectCsvWriter } from 'csv-writer';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  field: string;
  value: string;
  message: string;
  lineNumber?: number;
  permitNumber?: string;
  rule: string;
  timestamp: Date;
}

export class ValidationReport {
  private issues: ValidationIssue[] = [];
  
  /**
   * Add a validation issue
   */
  addIssue(issue: Omit<ValidationIssue, 'timestamp'>): void {
    this.issues.push({
      ...issue,
      timestamp: new Date()
    });
  }
  
  /**
   * Add an error
   */
  addError(
    field: string,
    value: string,
    message: string,
    rule: string,
    context?: { lineNumber?: number; permitNumber?: string }
  ): void {
    this.addIssue({
      severity: 'error',
      field,
      value,
      message,
      rule,
      lineNumber: context?.lineNumber,
      permitNumber: context?.permitNumber
    });
  }
  
  /**
   * Add a warning
   */
  addWarning(
    field: string,
    value: string,
    message: string,
    rule: string,
    context?: { lineNumber?: number; permitNumber?: string }
  ): void {
    this.addIssue({
      severity: 'warning',
      field,
      value,
      message,
      rule,
      lineNumber: context?.lineNumber,
      permitNumber: context?.permitNumber
    });
  }
  
  /**
   * Get all issues, optionally filtered
   */
  getIssues(filter?: {
    severity?: 'error' | 'warning';
    field?: string;
    permitNumber?: string;
    rule?: string;
  }): ValidationIssue[] {
    if (!filter) return [...this.issues];
    
    return this.issues.filter(issue => {
      if (filter.severity && issue.severity !== filter.severity) return false;
      if (filter.field && issue.field !== filter.field) return false;
      if (filter.permitNumber && issue.permitNumber !== filter.permitNumber) return false;
      if (filter.rule && issue.rule !== filter.rule) return false;
      return true;
    });
  }
  
  /**
   * Get summary statistics
   */
  getSummary(): {
    totalErrors: number;
    totalWarnings: number;
    total: number;
    byField: Record<string, number>;
    byRule: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const summary = {
      totalErrors: 0,
      totalWarnings: 0,
      total: this.issues.length,
      byField: {} as Record<string, number>,
      byRule: {} as Record<string, number>,
      bySeverity: { error: 0, warning: 0 }
    };
    
    for (const issue of this.issues) {
      // Count by severity
      if (issue.severity === 'error') {
        summary.totalErrors++;
        summary.bySeverity.error++;
      } else {
        summary.totalWarnings++;
        summary.bySeverity.warning++;
      }
      
      // Count by field
      summary.byField[issue.field] = (summary.byField[issue.field] || 0) + 1;
      
      // Count by rule
      summary.byRule[issue.rule] = (summary.byRule[issue.rule] || 0) + 1;
    }
    
    return summary;
  }
  
  /**
   * Export issues to CSV file
   */
  async exportToCSV(outputPath: string): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'severity', title: 'Severity' },
        { id: 'permitNumber', title: 'Permit Number' },
        { id: 'lineNumber', title: 'Line Number' },
        { id: 'field', title: 'Field' },
        { id: 'value', title: 'Value' },
        { id: 'rule', title: 'Rule' },
        { id: 'message', title: 'Message' },
        { id: 'timestamp', title: 'Timestamp' }
      ]
    });
    
    const records = this.issues.map(issue => ({
      severity: issue.severity.toUpperCase(),
      permitNumber: issue.permitNumber || '',
      lineNumber: issue.lineNumber || '',
      field: issue.field,
      value: issue.value,
      rule: issue.rule,
      message: issue.message,
      timestamp: issue.timestamp.toISOString()
    }));
    
    await csvWriter.writeRecords(records);
  }
  
  /**
   * Print summary to console
   */
  printSummary(): void {
    const summary = this.getSummary();
    
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Issues: ${summary.total}`);
    console.log(`  Errors:   ${summary.totalErrors}`);
    console.log(`  Warnings: ${summary.totalWarnings}`);
    
    if (Object.keys(summary.byField).length > 0) {
      console.log('\nIssues by Field:');
      const sortedFields = Object.entries(summary.byField)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10
      
      for (const [field, count] of sortedFields) {
        console.log(`  ${field.padEnd(30)} ${count.toLocaleString()}`);
      }
    }
    
    if (Object.keys(summary.byRule).length > 0) {
      console.log('\nIssues by Rule:');
      const sortedRules = Object.entries(summary.byRule)
        .sort((a, b) => b[1] - a[1]);
      
      for (const [rule, count] of sortedRules) {
        console.log(`  ${rule.padEnd(30)} ${count.toLocaleString()}`);
      }
    }
  }
  
  /**
   * Clear all issues
   */
  clear(): void {
    this.issues = [];
  }
  
  /**
   * Get issues for a specific permit
   */
  getPermitIssues(permitNumber: string): ValidationIssue[] {
    return this.getIssues({ permitNumber });
  }
  
  /**
   * Check if there are any errors (not warnings)
   */
  hasErrors(): boolean {
    return this.issues.some(issue => issue.severity === 'error');
  }
}