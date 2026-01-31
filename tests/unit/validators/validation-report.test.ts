import { ValidationReport } from '../../../src/validators/ValidationReport';

describe('ValidationReport', () => {
  let validationReport: ValidationReport;

  beforeEach(() => {
    validationReport = new ValidationReport();
  });

  describe('addIssue', () => {
    it('should add issues with timestamps', () => {
      const issue = {
        severity: 'error' as const,
        field: 'test_field',
        value: 'test_value',
        message: 'Test error message',
        rule: 'test_rule',
        lineNumber: 10,
        permitNumber: '12345'
      };

      validationReport.addIssue(issue);

      const issues = validationReport.getIssues();
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('error');
      expect(issues[0].field).toBe('test_field');
      expect(issues[0].value).toBe('test_value');
      expect(issues[0].message).toBe('Test error message');
      expect(issues[0].rule).toBe('test_rule');
      expect(issues[0].lineNumber).toBe(10);
      expect(issues[0].permitNumber).toBe('12345');
      expect(issues[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('addError', () => {
    it('should add error issues', () => {
      validationReport.addError(
        'test_field',
        'test_value',
        'Test error message',
        'test_rule',
        { lineNumber: 10, permitNumber: '12345' }
      );

      const issues = validationReport.getIssues();
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('error');
      expect(issues[0].field).toBe('test_field');
      expect(issues[0].value).toBe('test_value');
      expect(issues[0].message).toBe('Test error message');
      expect(issues[0].rule).toBe('test_rule');
      expect(issues[0].lineNumber).toBe(10);
      expect(issues[0].permitNumber).toBe('12345');
    });
  });

  describe('addWarning', () => {
    it('should add warning issues', () => {
      validationReport.addWarning(
        'test_field',
        'test_value',
        'Test warning message',
        'test_rule',
        { lineNumber: 10, permitNumber: '12345' }
      );

      const issues = validationReport.getIssues();
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('warning');
      expect(issues[0].field).toBe('test_field');
      expect(issues[0].value).toBe('test_value');
      expect(issues[0].message).toBe('Test warning message');
      expect(issues[0].rule).toBe('test_rule');
      expect(issues[0].lineNumber).toBe(10);
      expect(issues[0].permitNumber).toBe('12345');
    });
  });

  describe('getIssues', () => {
    beforeEach(() => {
      // Add some test issues
      validationReport.addError('field1', 'value1', 'Error 1', 'rule1', { permitNumber: '123' });
      validationReport.addWarning('field2', 'value2', 'Warning 1', 'rule2', { permitNumber: '123' });
      validationReport.addError('field3', 'value3', 'Error 2', 'rule3', { permitNumber: '456' });
    });

    it('should return all issues when no filter is provided', () => {
      const issues = validationReport.getIssues();
      expect(issues).toHaveLength(3);
    });

    it('should filter issues by severity', () => {
      const errors = validationReport.getIssues({ severity: 'error' });
      expect(errors).toHaveLength(2);
      expect(errors.every(issue => issue.severity === 'error')).toBe(true);

      const warnings = validationReport.getIssues({ severity: 'warning' });
      expect(warnings).toHaveLength(1);
      expect(warnings[0].severity).toBe('warning');
    });

    it('should filter issues by field', () => {
      const issues = validationReport.getIssues({ field: 'field1' });
      expect(issues).toHaveLength(1);
      expect(issues[0].field).toBe('field1');
    });

    it('should filter issues by permit number', () => {
      const issues = validationReport.getIssues({ permitNumber: '123' });
      expect(issues).toHaveLength(2);
      expect(issues.every(issue => issue.permitNumber === '123')).toBe(true);
    });

    it('should filter issues by rule', () => {
      const issues = validationReport.getIssues({ rule: 'rule1' });
      expect(issues).toHaveLength(1);
      expect(issues[0].rule).toBe('rule1');
    });

    it('should apply multiple filters', () => {
      const issues = validationReport.getIssues({ 
        severity: 'error', 
        permitNumber: '123' 
      });
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('error');
      expect(issues[0].permitNumber).toBe('123');
    });
  });

  describe('getSummary', () => {
    it('should provide correct summary statistics', () => {
      // Add test issues
      validationReport.addError('field1', 'value1', 'Error 1', 'rule1');
      validationReport.addError('field1', 'value2', 'Error 2', 'rule1');
      validationReport.addWarning('field2', 'value3', 'Warning 1', 'rule2');
      validationReport.addWarning('field3', 'value4', 'Warning 2', 'rule3');
      validationReport.addWarning('field3', 'value5', 'Warning 3', 'rule3');

      const summary = validationReport.getSummary();
      
      expect(summary.total).toBe(5);
      expect(summary.totalErrors).toBe(2);
      expect(summary.totalWarnings).toBe(3);
      expect(summary.bySeverity.error).toBe(2);
      expect(summary.bySeverity.warning).toBe(3);
      expect(summary.byField.field1).toBe(2);
      expect(summary.byField.field2).toBe(1);
      expect(summary.byField.field3).toBe(2);
      expect(summary.byRule.rule1).toBe(2);
      expect(summary.byRule.rule2).toBe(1);
      expect(summary.byRule.rule3).toBe(2);
    });

    it('should handle empty reports', () => {
      const summary = validationReport.getSummary();
      
      expect(summary.total).toBe(0);
      expect(summary.totalErrors).toBe(0);
      expect(summary.totalWarnings).toBe(0);
      expect(summary.bySeverity.error).toBe(0);
      expect(summary.bySeverity.warning).toBe(0);
      expect(Object.keys(summary.byField)).toHaveLength(0);
      expect(Object.keys(summary.byRule)).toHaveLength(0);
    });
  });

  describe('getPermitIssues', () => {
    it('should return issues for a specific permit', () => {
      validationReport.addError('field1', 'value1', 'Error 1', 'rule1', { permitNumber: '123' });
      validationReport.addWarning('field2', 'value2', 'Warning 1', 'rule2', { permitNumber: '123' });
      validationReport.addError('field3', 'value3', 'Error 2', 'rule3', { permitNumber: '456' });

      const permitIssues = validationReport.getPermitIssues('123');
      expect(permitIssues).toHaveLength(2);
      expect(permitIssues.every(issue => issue.permitNumber === '123')).toBe(true);
    });

    it('should return empty array for permit with no issues', () => {
      const permitIssues = validationReport.getPermitIssues('999');
      expect(permitIssues).toHaveLength(0);
    });
  });

  describe('hasErrors', () => {
    it('should return true when there are errors', () => {
      validationReport.addError('field1', 'value1', 'Error 1', 'rule1');
      expect(validationReport.hasErrors()).toBe(true);
    });

    it('should return false when there are only warnings', () => {
      validationReport.addWarning('field1', 'value1', 'Warning 1', 'rule1');
      expect(validationReport.hasErrors()).toBe(false);
    });

    it('should return false when there are no issues', () => {
      expect(validationReport.hasErrors()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all issues', () => {
      validationReport.addError('field1', 'value1', 'Error 1', 'rule1');
      validationReport.addWarning('field2', 'value2', 'Warning 1', 'rule2');
      
      expect(validationReport.getIssues()).toHaveLength(2);
      
      validationReport.clear();
      
      expect(validationReport.getIssues()).toHaveLength(0);
      expect(validationReport.getSummary().total).toBe(0);
    });
  });
});