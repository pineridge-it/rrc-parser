import { QAGate, QAGateRunner } from '../../../src/qa/QAGate';
import { DEFAULT_QA_CONFIG } from '../../../src/qa/types';
import * as fs from 'fs';
import * as path from 'path';

describe('QAGate', () => {
  let qaGate: QAGate;

  beforeEach(() => {
    qaGate = new QAGate(DEFAULT_QA_CONFIG);
  });

  describe('run', () => {
    it('should run pre-ingestion checks', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        stage: 'pre-ingestion' as const,
        records,
        previousCount: records.length // Same as current count for no delta
      };

      const result = await qaGate.run(context);
      
      expect(result.stage).toBe('pre-ingestion');
      expect(result.passed).toBe(true);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should run post-transform checks', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-valid-schema.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        stage: 'post-transform' as const,
        records,
        expectedSchema: {
          permit_number: 'string',
          operator_name: 'string',
          county: 'string',
          issued_date: 'string'
        }
      };

      const result = await qaGate.run(context);
      
      expect(result.stage).toBe('post-transform');
      expect(result.checks.length).toBeGreaterThan(0);
    });

    it('should run post-load checks', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/value/records-valid-values.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        stage: 'post-load' as const,
        records
      };

      const result = await qaGate.run(context);
      
      expect(result.stage).toBe('post-load');
      expect(result.checks.length).toBeGreaterThan(0);
    });

    it('should fail when critical errors are present and failOnCritical is true', async () => {
      // Create config that fails on critical errors
      const config = { ...DEFAULT_QA_CONFIG, failOnCritical: true };
      const qaGateFailOnCritical = new QAGate(config);
      
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/empty-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        stage: 'pre-ingestion' as const,
        records,
        previousCount: 3
      };

      const result = await qaGateFailOnCritical.run(context);
      
      expect(result.passed).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
    });

    it('should fail when errors are present and failOnError is true', async () => {
      // Create config that fails on errors and has strict volume thresholds
      const config = {
        ...DEFAULT_QA_CONFIG,
        failOnError: true,
        failOnCritical: false, // Disable critical to test error level
        volume: {
          ...DEFAULT_QA_CONFIG.volume,
          maxDeltaPercent: 10, // Strict threshold to trigger error
          alertOnZero: false,  // Disable zero alert to avoid critical
          minRecords: 0        // Disable min records check
        }
      };
      const qaGateFailOnError = new QAGate(config);

      // Use valid records but with large delta from previous count
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      const context = {
        stage: 'pre-ingestion' as const,
        records,
        previousCount: 100 // Large delta: (3-100)/100 = -97%, exceeds 10%
      };

      const result = await qaGateFailOnError.run(context);

      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('QAGateRunner', () => {
  let qaGateRunner: QAGateRunner;

  beforeEach(() => {
    qaGateRunner = new QAGateRunner(DEFAULT_QA_CONFIG);
  });

  describe('runStage', () => {
    it('should run a specific stage and store results', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        stage: 'pre-ingestion' as const,
        records,
        previousCount: 3 // Same as current count to avoid delta error
      };

      const result = await qaGateRunner.runStage(context);
      
      expect(result.stage).toBe('pre-ingestion');
      expect(result.passed).toBe(true);
      
      // Check that result was stored
      const results = qaGateRunner.getResults();
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(result);
    });
  });

  describe('getResults', () => {
    it('should return all stored results', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context1 = {
        stage: 'pre-ingestion' as const,
        records,
        previousCount: 3
      };

      const context2 = {
        stage: 'post-transform' as const,
        records
      };

      await qaGateRunner.runStage(context1);
      await qaGateRunner.runStage(context2);
      
      const results = qaGateRunner.getResults();
      expect(results).toHaveLength(2);
      expect(results[0].stage).toBe('pre-ingestion');
      expect(results[1].stage).toBe('post-transform');
    });
  });

  describe('getSummary', () => {
    it('should return a summary of all runs', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context1 = {
        stage: 'pre-ingestion' as const,
        records,
        previousCount: 3 // Same as current count
      };

      const context2 = {
        stage: 'post-transform' as const,
        records
      };

      await qaGateRunner.runStage(context1);
      await qaGateRunner.runStage(context2);
      
      const summary = qaGateRunner.getSummary();
      expect(summary.totalRuns).toBe(2);
      expect(summary.passed).toBe(2);
      expect(summary.failed).toBe(0);
      expect(summary.totalErrors).toBe(0);
      expect(summary.totalWarnings).toBe(0);
      expect(summary.totalCritical).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all stored results', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        stage: 'pre-ingestion' as const,
        records,
        previousCount: 3
      };

      await qaGateRunner.runStage(context);
      
      expect(qaGateRunner.getResults()).toHaveLength(1);
      
      qaGateRunner.clear();
      
      expect(qaGateRunner.getResults()).toHaveLength(0);
      const summary = qaGateRunner.getSummary();
      expect(summary.totalRuns).toBe(0);
    });
  });
});