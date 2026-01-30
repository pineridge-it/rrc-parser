import { describe, it, expect } from 'bun:test';
import { VolumeChecks } from '../../src/qa/checks/VolumeChecks';
import { SchemaChecks } from '../../src/qa/checks/SchemaChecks';
import { ValueChecks } from '../../src/qa/checks/ValueChecks';
import { QAGate, QAGateRunner } from '../../src/qa/QAGate';
import { DEFAULT_QA_CONFIG } from '../../src/qa/types';

describe('QA Gates', () => {
  describe('VolumeChecks', () => {
    it('should pass when record count is within bounds', () => {
      const checks = new VolumeChecks({
        maxDeltaPercent: 20,
        minRecords: 1,
        maxRecords: 1000,
        alertOnZero: true
      });

      const result = checks.checkRowCount({
        currentCount: 100,
        previousCount: 90,
        records: []
      });

      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
    });

    it('should fail when zero records detected', () => {
      const checks = new VolumeChecks({
        maxDeltaPercent: 20,
        minRecords: 1,
        alertOnZero: true
      });

      const result = checks.checkRowCount({
        currentCount: 0,
        records: []
      });

      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
    });

    it('should detect duplicates', () => {
      const checks = new VolumeChecks({
        maxDeltaPercent: 20,
        minRecords: 1,
        alertOnZero: true
      });

      const result = checks.checkDuplicates({
        currentCount: 3,
        records: [
          { permit_number: '123' },
          { permit_number: '123' },
          { permit_number: '456' }
        ],
        idField: 'permit_number'
      });

      expect(result.passed).toBe(false);
      expect(result.actual).toBe(1);
    });
  });

  describe('SchemaChecks', () => {
    it('should pass when all required fields present', () => {
      const checks = new SchemaChecks({
        requiredFields: ['permit_number', 'operator'],
        allowNewFields: true,
        allowMissingFields: false
      });

      const result = checks.checkRequiredFields({
        records: [
          { permit_number: '123', operator: 'ABC' },
          { permit_number: '456', operator: 'DEF' }
        ]
      });

      expect(result.passed).toBe(true);
    });

    it('should fail when required fields missing', () => {
      const checks = new SchemaChecks({
        requiredFields: ['permit_number', 'operator'],
        allowNewFields: true,
        allowMissingFields: false
      });

      const result = checks.checkRequiredFields({
        records: [
          { permit_number: '123' },
          { operator: 'DEF' }
        ]
      });

      expect(result.passed).toBe(false);
      expect(result.severity).toBe('critical');
    });
  });

  describe('ValueChecks', () => {
    it('should pass when null rates are acceptable', () => {
      const checks = new ValueChecks({
        maxNullRate: 0.5,
        maxFutureDays: 1,
        maxPastDays: 365
      });

      const result = checks.checkNullRates({
        records: [
          { field1: 'value', field2: 'value' },
          { field1: 'value', field2: null },
          { field1: 'value', field2: 'value' }
        ]
      });

      expect(result.passed).toBe(true);
    });

    it('should detect invalid coordinates', () => {
      const checks = new ValueChecks({
        maxNullRate: 0.5,
        maxFutureDays: 1,
        maxPastDays: 365
      });

      const result = checks.checkCoordinateBounds({
        records: [
          { latitude: 30.5, longitude: -97.5 },
          { latitude: 95, longitude: -97.5 },
          { latitude: 30.5, longitude: 200 }
        ]
      });

      expect(result.passed).toBe(false);
      expect(result.actual).toEqual({ invalidCoordinates: 2 });
    });
  });

  describe('QAGate', () => {
    it('should run all checks for post-transform stage', async () => {
      const gate = new QAGate(DEFAULT_QA_CONFIG);

      const result = await gate.run({
        stage: 'post-transform',
        records: [
          { permit_number: '123', operator_name: 'ABC', county: 'Harris', latitude: 30.5, longitude: -95.5 },
          { permit_number: '456', operator_name: 'DEF', county: 'Dallas', latitude: 32.5, longitude: -96.5 }
        ],
        expectedSchema: {
          permit_number: 'string',
          operator_name: 'string',
          county: 'string'
        }
      });

      expect(result.stage).toBe('post-transform');
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should fail when critical errors present', async () => {
      const gate = new QAGate({
        ...DEFAULT_QA_CONFIG,
        failOnCritical: true,
        failOnError: true
      });

      // Use pre-ingestion stage to trigger volume checks on empty records
      const result = await gate.run({
        stage: 'pre-ingestion',
        records: [],
        expectedSchema: {}
      });

      // Empty records should trigger volume check failure
      expect(result.passed).toBe(false);
    });
  });

  describe('QAGateRunner', () => {
    it('should track multiple runs', async () => {
      const runner = new QAGateRunner(DEFAULT_QA_CONFIG);

      await runner.runStage({
        stage: 'pre-ingestion',
        records: [{ id: 1 }]
      });

      await runner.runStage({
        stage: 'post-transform',
        records: [{ id: 1, name: 'test' }]
      });

      const summary = runner.getSummary();
      expect(summary.totalRuns).toBe(2);
    });

    it('should clear results', async () => {
      const runner = new QAGateRunner(DEFAULT_QA_CONFIG);

      await runner.runStage({
        stage: 'pre-ingestion',
        records: [{ id: 1 }]
      });

      runner.clear();

      expect(runner.getResults().length).toBe(0);
    });
  });
});
