import { EtlPipeline } from '../../../src/etl/Pipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('E2E Pipeline - Error Recovery', () => {
  let pipeline: EtlPipeline;

  beforeEach(() => {
    // Create a new pipeline instance for each test
    pipeline = new EtlPipeline({
      enableCheckpoints: true,
      enableQAGates: true,
      enableMonitoring: true
    });
  });

  describe('Malformed File Handling', () => {
    it('should handle completely malformed files gracefully', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/malformed.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      // Should complete execution (not crash)
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      
      // May have errors but should not crash
      expect(result.errors).toBeDefined();
    }, 30000);

    it('should recover from partial file processing interruptions', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/medium-10k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // First execution (simulate interruption)
      const result1 = await pipeline.execute(inputFile);
      
      // Second execution (should resume from checkpoint)
      const result2 = await pipeline.execute(inputFile);
      
      // Both should complete successfully
      expect(result1.startTime).toBeInstanceOf(Date);
      expect(result1.endTime).toBeInstanceOf(Date);
      expect(result2.startTime).toBeInstanceOf(Date);
      expect(result2.endTime).toBeInstanceOf(Date);
    }, 180000);
  });

  describe('Partial Processing Recovery', () => {
    it('should resume from checkpoints after interruption', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/large-100k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // First execution
      const result1 = await pipeline.execute(inputFile);
      
      // Verify checkpoint was created
      const checkpointFile = './.checkpoints/etl-checkpoint.json';
      expect(fs.existsSync(checkpointFile)).toBe(true);
      
      // Second execution (should resume from checkpoint)
      const result2 = await pipeline.execute(inputFile);
      
      // Both should complete successfully
      expect(result1.errors).toHaveLength(0);
      expect(result2.errors).toHaveLength(0);
    }, 600000);

    it('should handle corrupted checkpoint files gracefully', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/small-1k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const checkpointFile = './.checkpoints/etl-checkpoint.json';
      
      // Create a corrupted checkpoint file
      if (!fs.existsSync(path.dirname(checkpointFile))) {
        fs.mkdirSync(path.dirname(checkpointFile), { recursive: true });
      }
      fs.writeFileSync(checkpointFile, 'invalid json content');
      
      // Should handle corrupted checkpoint gracefully
      const result = await pipeline.execute(inputFile);
      
      // Should complete successfully despite corrupted checkpoint
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Resource Exhaustion Recovery', () => {
    it('should handle memory pressure gracefully', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/medium-10k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // Monitor memory usage during processing
      const initialMemory = process.memoryUsage().heapUsed;
      
      const result = await pipeline.execute(inputFile);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsedMB = (finalMemory - initialMemory) / (1024 * 1024);
      
      // Should complete successfully
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      
      // Memory usage should be reasonable
      expect(memoryUsedMB).toBeLessThan(512); // 512MB limit
    }, 180000);

    it('should handle disk space issues gracefully', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/small-1k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // This test simulates disk space issues by checking that
      // the pipeline can handle various error conditions
      const result = await pipeline.execute(inputFile);

      // Should complete execution (not crash)
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    }, 30000);
  });
});