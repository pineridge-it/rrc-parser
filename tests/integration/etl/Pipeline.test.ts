import { EtlPipeline } from '../../../src/etl/Pipeline';
import { ETL_TEST_CONFIG } from '../../config/etl-test.config';
import * as fs from 'fs';
import * as path from 'path';

describe('ETL Pipeline Integration', () => {
  let pipeline: EtlPipeline;
  let testOutputDir: string;
  let testCheckpointDir: string;

  beforeAll(() => {
    // Ensure output directories exist
    testOutputDir = path.resolve(ETL_TEST_CONFIG.outputDir);
    testCheckpointDir = path.resolve(ETL_TEST_CONFIG.checkpointDir);
    
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
    
    if (!fs.existsSync(testCheckpointDir)) {
      fs.mkdirSync(testCheckpointDir, { recursive: true });
    }
  });

  beforeEach(() => {
    // Create a new pipeline instance for each test
    pipeline = new EtlPipeline({
      enableCheckpoints: true,
      checkpointPath: path.join(testCheckpointDir, 'test-checkpoint.json'),
      enableQAGates: true,
      enableMonitoring: true
    });
  });

  afterEach(() => {
    // Clean up checkpoint files after each test
    const checkpointFile = path.join(testCheckpointDir, 'test-checkpoint.json');
    if (fs.existsSync(checkpointFile)) {
      fs.unlinkSync(checkpointFile);
    }
  });

  afterAll(() => {
    // Clean up temporary files
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
    
    if (fs.existsSync(testCheckpointDir)) {
      fs.rmSync(testCheckpointDir, { recursive: true, force: true });
    }
  });

  describe('Small File Processing', () => {
    it('should process a small permit file successfully', async () => {
      const inputFile = path.resolve('tests/fixtures/files/single-permit.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      expect(result.permitsProcessed).toBeGreaterThan(0);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.qaPassed).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, ETL_TEST_CONFIG.performance.smallFileMaxTime);

    it('should handle empty files gracefully', async () => {
      const inputFile = path.resolve('tests/fixtures/files/empty.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      expect(result.permitsProcessed).toBe(0);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.errors).toHaveLength(0);
    }, ETL_TEST_CONFIG.performance.smallFileMaxTime);
  });

  describe('Medium File Processing', () => {
    it('should process a medium permit file within time limits', async () => {
      const inputFile = path.resolve('tests/fixtures/files/medium-permit-file.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      expect(result.permitsProcessed).toBeGreaterThan(0);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.durationMs).toBeLessThan(ETL_TEST_CONFIG.performance.mediumFileMaxTime);
      expect(result.qaPassed).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, ETL_TEST_CONFIG.performance.mediumFileMaxTime);

    it('should maintain memory usage within limits', async () => {
      const inputFile = path.resolve('tests/fixtures/files/medium-permit-file.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const initialMemory = process.memoryUsage().heapUsed;
      
      const result = await pipeline.execute(inputFile);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsedMB = (finalMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryUsedMB).toBeLessThan(ETL_TEST_CONFIG.performance.maxMemoryMB);
    }, ETL_TEST_CONFIG.performance.mediumFileMaxTime);
  });

  describe('Error Handling', () => {
    it('should handle malformed files gracefully', async () => {
      const inputFile = path.resolve('tests/fixtures/files/malformed.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      // Should still complete execution
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      
      // May have errors but should not crash
      expect(result.errors).toBeDefined();
    }, ETL_TEST_CONFIG.performance.smallFileMaxTime);

    it('should handle files with malformed sections', async () => {
      const inputFile = path.resolve('tests/fixtures/files/malformed-sections.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      // Should still complete execution
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      
      // May have errors but should not crash
      expect(result.errors).toBeDefined();
    }, ETL_TEST_CONFIG.performance.smallFileMaxTime);
  });

  describe('QA Gate Integration', () => {
    it('should run QA gates and include results in output', async () => {
      const inputFile = path.resolve('tests/fixtures/files/single-permit.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      expect(result.qaPassed).toBe(true);
      expect(result.qaResults).toBeDefined();
      expect(Array.isArray(result.qaResults)).toBe(true);
      
      // Should have at least one QA stage
      expect(result.qaResults!.length).toBeGreaterThan(0);
      
      // Each QA result should have the expected structure
      for (const qaResult of result.qaResults!) {
        expect(qaResult.stage).toBeDefined();
        expect(typeof qaResult.passed).toBe('boolean');
        expect(Array.isArray(qaResult.errors)).toBe(true);
        expect(Array.isArray(qaResult.warnings)).toBe(true);
        expect(Array.isArray(qaResult.criticalErrors)).toBe(true);
      }
    }, ETL_TEST_CONFIG.performance.smallFileMaxTime);
  });

  describe('Monitoring Integration', () => {
    it('should integrate with monitoring system', async () => {
      const inputFile = path.resolve('tests/fixtures/files/single-permit.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      expect(result.monitoring).toBeDefined();
      expect(result.monitoring!.runId).toBeDefined();
      expect(Array.isArray(result.monitoring!.sloStatus)).toBe(true);
      expect(typeof result.monitoring!.activeAlerts).toBe('number');
    }, ETL_TEST_CONFIG.performance.smallFileMaxTime);
  });
});