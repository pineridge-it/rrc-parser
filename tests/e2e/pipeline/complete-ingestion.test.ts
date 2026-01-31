import { EtlPipeline } from '../../../src/etl/Pipeline';
import { E2E_PIPELINE_CONFIG } from '../config/pipeline.config';
import * as fs from 'fs';
import * as path from 'path';

describe('E2E Pipeline - Complete Ingestion Flow', () => {
  let pipeline: EtlPipeline;

  beforeEach(() => {
    // Create a new pipeline instance for each test
    pipeline = new EtlPipeline({
      enableCheckpoints: true,
      enableQAGates: true,
      enableMonitoring: true
    });
  });

  describe('Small File Processing', () => {
    it('should process small files quickly', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/small-1k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      expect(result.permitsProcessed).toBeGreaterThan(0);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.durationMs).toBeLessThan(E2E_PIPELINE_CONFIG.performance.smallFileTimeout);
      expect(result.qaPassed).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, E2E_PIPELINE_CONFIG.performance.smallFileTimeout);

    it('should handle empty files gracefully', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/empty.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      expect(result.permitsProcessed).toBe(0);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.errors).toHaveLength(0);
    }, E2E_PIPELINE_CONFIG.performance.smallFileTimeout);
  });

  describe('Medium File Processing', () => {
    it('should process medium files within time limits', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/medium-10k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      expect(result.permitsProcessed).toBeGreaterThan(0);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.durationMs).toBeLessThan(E2E_PIPELINE_CONFIG.performance.mediumFileTimeout);
      expect(result.qaPassed).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, E2E_PIPELINE_CONFIG.performance.mediumFileTimeout);

    it('should maintain memory usage within limits for medium files', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/medium-10k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const initialMemory = process.memoryUsage().heapUsed;
      
      const result = await pipeline.execute(inputFile);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsedMB = (finalMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryUsedMB).toBeLessThan(E2E_PIPELINE_CONFIG.performance.maxMemoryMB);
    }, E2E_PIPELINE_CONFIG.performance.mediumFileTimeout);
  });

  describe('Large File Processing', () => {
    it('should process large files within time limits', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/large-100k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      expect(result.permitsProcessed).toBeGreaterThan(0);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.durationMs).toBeLessThan(E2E_PIPELINE_CONFIG.performance.largeFileTimeout);
      expect(result.qaPassed).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, E2E_PIPELINE_CONFIG.performance.largeFileTimeout);

    it('should maintain memory usage within limits for large files', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/large-100k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const initialMemory = process.memoryUsage().heapUsed;
      
      const result = await pipeline.execute(inputFile);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsedMB = (finalMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryUsedMB).toBeLessThan(E2E_PIPELINE_CONFIG.performance.maxMemoryMB);
    }, E2E_PIPELINE_CONFIG.performance.largeFileTimeout);
  });

  describe('Data Integrity', () => {
    it('should preserve data integrity through the pipeline', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/small-1k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      // Should have processed permits
      expect(result.permitsProcessed).toBeGreaterThan(0);
      
      // Should have passed QA gates
      expect(result.qaPassed).toBe(true);
      
      // Should have QA results
      expect(result.qaResults).toBeDefined();
      expect(Array.isArray(result.qaResults)).toBe(true);
      expect(result.qaResults!.length).toBeGreaterThan(0);
      
      // Should not have errors
      expect(result.errors).toHaveLength(0);
    }, E2E_PIPELINE_CONFIG.performance.smallFileTimeout);

    it('should produce consistent monitoring data', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/small-1k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      // Should have monitoring data
      expect(result.monitoring).toBeDefined();
      expect(result.monitoring!.runId).toBeDefined();
      expect(Array.isArray(result.monitoring!.sloStatus)).toBe(true);
      expect(typeof result.monitoring!.activeAlerts).toBe('number');
    }, E2E_PIPELINE_CONFIG.performance.smallFileTimeout);
  });
});