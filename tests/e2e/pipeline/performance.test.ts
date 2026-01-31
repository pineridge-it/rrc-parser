import { EtlPipeline } from '../../../src/etl/Pipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('E2E Pipeline - Performance', () => {
  let pipeline: EtlPipeline;

  beforeEach(() => {
    // Create a new pipeline instance for each test
    pipeline = new EtlPipeline({
      enableCheckpoints: true,
      enableQAGates: true,
      enableMonitoring: true
    });
  });

  describe('Processing Time Benchmarks', () => {
    it('should process 1k permits in under 30 seconds', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/small-1k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const startTime = Date.now();
      const result = await pipeline.execute(inputFile);
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      expect(result.permitsProcessed).toBeGreaterThan(0);
      expect(durationMs).toBeLessThan(30000); // 30 seconds
      expect(result.errors).toHaveLength(0);
    }, 30000);

    it('should process 10k permits in under 3 minutes', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/medium-10k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const startTime = Date.now();
      const result = await pipeline.execute(inputFile);
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      expect(result.permitsProcessed).toBeGreaterThan(0);
      expect(durationMs).toBeLessThan(180000); // 3 minutes
      expect(result.errors).toHaveLength(0);
    }, 180000);

    it('should process 100k permits in under 10 minutes', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/large-100k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const startTime = Date.now();
      const result = await pipeline.execute(inputFile);
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      expect(result.permitsProcessed).toBeGreaterThan(0);
      expect(durationMs).toBeLessThan(600000); // 10 minutes
      expect(result.errors).toHaveLength(0);
    }, 600000);
  });

  describe('Memory Usage', () => {
    it('should maintain memory usage under 512MB for all file sizes', async () => {
      const testFiles = [
        { path: 'tests/e2e/fixtures/pipeline/small-1k.txt', name: 'small' },
        { path: 'tests/e2e/fixtures/pipeline/medium-10k.txt', name: 'medium' }
      ];

      for (const testFile of testFiles) {
        const inputFile = path.resolve(testFile.path);
        expect(fs.existsSync(inputFile)).toBe(true);

        const initialMemory = process.memoryUsage().heapUsed;
        
        const result = await pipeline.execute(inputFile);
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryUsedMB = (finalMemory - initialMemory) / (1024 * 1024);
        
        expect(memoryUsedMB).toBeLessThan(512); // 512MB limit
        
        // Clean up for next test
        const checkpointFile = './.checkpoints/etl-checkpoint.json';
        if (fs.existsSync(checkpointFile)) {
          fs.unlinkSync(checkpointFile);
        }
      }
    }, 200000);

    it('should not leak memory between pipeline executions', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/small-1k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // Run multiple pipeline executions
      const memoryUsages: number[] = [];
      
      for (let i = 0; i < 3; i++) {
        const initialMemory = process.memoryUsage().heapUsed;
        
        await pipeline.execute(inputFile);
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryUsedMB = (finalMemory - initialMemory) / (1024 * 1024);
        memoryUsages.push(memoryUsedMB);
        
        // Clean up checkpoint
        const checkpointFile = './.checkpoints/etl-checkpoint.json';
        if (fs.existsSync(checkpointFile)) {
          fs.unlinkSync(checkpointFile);
        }
      }
      
      // Memory usage should be consistent (no significant growth)
      const avgMemory = memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length;
      const maxMemory = Math.max(...memoryUsages);
      const minMemory = Math.min(...memoryUsages);
      
      // Difference between max and min should be reasonable
      expect(maxMemory - minMemory).toBeLessThan(100); // 100MB difference tolerance
    }, 90000);
  });

  describe('Throughput Consistency', () => {
    it('should maintain consistent throughput', async () => {
      const testFiles = [
        { path: 'tests/e2e/fixtures/pipeline/small-1k.txt', name: 'small' },
        { path: 'tests/e2e/fixtures/pipeline/medium-10k.txt', name: 'medium' }
      ];

      const throughputs: number[] = [];
      
      for (const testFile of testFiles) {
        const inputFile = path.resolve(testFile.path);
        expect(fs.existsSync(inputFile)).toBe(true);

        const startTime = Date.now();
        const result = await pipeline.execute(inputFile);
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        
        const throughput = result.permitsProcessed / durationSeconds;
        throughputs.push(throughput);
        
        // Clean up checkpoint
        const checkpointFile = './.checkpoints/etl-checkpoint.json';
        if (fs.existsSync(checkpointFile)) {
          fs.unlinkSync(checkpointFile);
        }
      }
      
      // Throughput should be reasonably consistent
      const avgThroughput = throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length;
      const throughputVariance = throughputs.map(t => Math.abs(t - avgThroughput)).reduce((sum, v) => sum + v, 0) / throughputs.length;
      
      // Variance should be reasonable (within 50% of average)
      expect(throughputVariance).toBeLessThan(avgThroughput * 0.5);
    }, 200000);

    it('should scale linearly with file size', async () => {
      const testFiles = [
        { path: 'tests/e2e/fixtures/pipeline/small-1k.txt', name: 'small', expectedSize: 1 },
        { path: 'tests/e2e/fixtures/pipeline/medium-10k.txt', name: 'medium', expectedSize: 10 }
      ];

      const timings: { size: number; time: number }[] = [];
      
      for (const testFile of testFiles) {
        const inputFile = path.resolve(testFile.path);
        expect(fs.existsSync(inputFile)).toBe(true);

        const startTime = Date.now();
        const result = await pipeline.execute(inputFile);
        const endTime = Date.now();
        const durationMs = endTime - startTime;
        
        timings.push({ size: testFile.expectedSize, time: durationMs });
        
        // Clean up checkpoint
        const checkpointFile = './.checkpoints/etl-checkpoint.json';
        if (fs.existsSync(checkpointFile)) {
          fs.unlinkSync(checkpointFile);
        }
      }
      
      // Calculate scaling factor
      if (timings.length >= 2) {
        const ratio1 = timings[0].time / timings[0].size;
        const ratio2 = timings[1].time / timings[1].size;
        const scalingRatio = ratio2 / ratio1;
        
        // Should scale roughly linearly (within 50% tolerance)
        expect(scalingRatio).toBeGreaterThan(0.5);
        expect(scalingRatio).toBeLessThan(2.0);
      }
    }, 200000);
  });
});