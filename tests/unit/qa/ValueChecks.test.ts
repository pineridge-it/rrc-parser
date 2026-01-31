import { ValueChecks } from '../../../src/qa/checks/ValueChecks';
import { DEFAULT_QA_CONFIG } from '../../../src/qa/types';
import * as fs from 'fs';
import * as path from 'path';

describe('ValueChecks', () => {
  let valueChecks: ValueChecks;

  beforeEach(() => {
    valueChecks = new ValueChecks(DEFAULT_QA_CONFIG.values);
  });

  describe('checkNullRates', () => {
    it('should pass when null rates are within acceptable threshold', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/value/records-valid-values.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
      };

      const result = valueChecks.checkNullRates(context);
      
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.name).toBe('values.null_rates');
      expect(result.message).toContain('All fields have acceptable null rates');
    });

    it('should fail when null rate exceeds threshold', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/value/records-excessive-nulls.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
      };

      const result = valueChecks.checkNullRates(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('fields exceed max null rate');
    });
  });

  describe('checkDateSanity', () => {
    it('should pass when all dates are within acceptable range', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/value/records-valid-values.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
      };

      const result = valueChecks.checkDateSanity(context);
      
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.name).toBe('values.date_sanity');
      expect(result.message).toContain('All dates are within acceptable range');
    });

    it('should fail when dates are outside acceptable range', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/value/records-invalid-dates.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
      };

      const result = valueChecks.checkDateSanity(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.message).toContain('future dates and');
    });
  });

  describe('checkCoordinateBounds', () => {
    it('should pass when all coordinates are within valid bounds', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/value/records-valid-values.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
      };

      const result = valueChecks.checkCoordinateBounds(context);
      
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.name).toBe('values.coordinate_bounds');
      expect(result.message).toContain('All coordinates are within valid bounds');
    });

    it('should fail when coordinates are outside valid bounds', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/value/records-invalid-coordinates.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
      };

      const result = valueChecks.checkCoordinateBounds(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.message).toContain('invalid coordinates');
    });
  });

  describe('runAll', () => {
    it('should run all value checks', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/value/records-valid-values.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
      };

      const results = valueChecks.runAll(context);
      
      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('values.null_rates');
      expect(results[1].name).toBe('values.date_sanity');
      expect(results[2].name).toBe('values.coordinate_bounds');
    });
  });
});