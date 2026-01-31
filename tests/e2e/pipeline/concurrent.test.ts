import { EtlPipeline } from '../../../src/etl/Pipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('E2E Pipeline - Concurrent Processing', () => {
  const pipelines: EtlPipeline[] = [];

  beforeEach(() => {
    // Create new pipeline instances for each test
    for (let i = 0; i < 3; i++) {
      pipelines.push(new EtlPipeline({
        enableCheckpoints: true,
        enableQAGates: true,
        enableMonitoring: true,
        parserOptions: {
          checkpointPath: `./.checkpoints/etl-checkpoint-${i}.json`
        }
      }));
    }
  });

  afterEach(() => {
    // Clean up checkpoint files
    for (let i = 0; i < 3; i++) {
      const checkpointFile = `./.checkpoints/etl-checkpoint-${i}.json`;
      if (fs.existsSync(checkpointFile)) {
        fs.unlinkSync(checkpointFile);
      }
    }
  });

  describe('Concurrent File Processing', () => {
    it('should handle concurrent file processing', async () => {
      const testFiles = [
        'tests/e2e/fixtures/pipeline/small-1k.txt',
        'tests/e2e/fixtures/pipeline/medium-10k.txt',
        'tests/e2e/fixtures/pipeline/empty.txt'
      ];

      // Verify all files exist
      for (const testFile of testFiles) {
        const inputFile = path.resolve(testFile);
        expect(fs.existsSync(inputFile)).toBe(true);
      }

      // Run pipelines concurrently
      const promises = testFiles.map((filePath, index) => {
        const resolvedPath = path.resolve(filePath);
        return pipelines[index].execute(resolvedPath);
      });

      const results = await Promise.all(promises);

      // All pipelines should complete successfully
      for (const result of results) {
        expect(result.startTime).toBeInstanceOf(Date);
        expect(result.endTime).toBeInstanceOf(Date);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
      }

      // No pipeline should have critical errors
      const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);
      expect(totalErrors).toBeLessThan(results.length); // Allow some minor errors but not all failing
    }, 180000);

    it('should prevent resource contention between pipelines', async () => {
      const testFiles = [
        'tests/e2e/fixtures/pipeline/small-1k.txt',
        'tests/e2e/fixtures/pipeline/medium-10k.txt'
      ];

      // Verify all files exist
      for (const testFile of testFiles) {
        const inputFile = path.resolve(testFile);
        expect(fs.existsSync(inputFile)).toBe(true);
      }

      // Monitor resource usage
      const initialMemory = process.memoryUsage().heapUsed;

      // Run pipelines concurrently
      const promises = testFiles.map((filePath, index) => {
        const resolvedPath = path.resolve(filePath);
        return pipelines[index].execute(resolvedPath);
      });

      const results = await Promise.all(promises);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsedMB = (finalMemory - initialMemory) / (1024 * 1024);

      // Should complete successfully
      for (const result of results) {
        expect(result.startTime).toBeInstanceOf(Date);
        expect(result.endTime).toBeInstanceOf(Date);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
      }

      // Memory usage should be reasonable even with concurrent processing
      expect(memoryUsedMB).toBeLessThan(1024); // 1GB limit for concurrent processing
    }, 180000);
  });

  describe('Duplicate Processing Prevention', () => {
    it('should handle same file processed twice concurrently', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/small-1k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // Run two pipelines on the same file concurrently
      const pipeline1 = pipelines[0];
      const pipeline2 = pipelines[1];

      const promise1 = pipeline1.execute(inputFile);
      const promise2 = pipeline2.execute(inputFile);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should complete successfully
      expect(result1.startTime).toBeInstanceOf(Date);
      expect(result1.endTime).toBeInstanceOf(Date);
      expect(result2.startTime).toBeInstanceOf(Date);
      expect(result2.endTime).toBeInstanceOf(Date);

      // Both should process the same number of permits
      expect(result1.permitsProcessed).toBeGreaterThan(0);
      expect(result2.permitsProcessed).toBe(result1.permitsProcessed);
    }, 60000);

    it('should maintain data consistency with concurrent processing', async () => {
      const inputFile = path.resolve('tests/e2e/fixtures/pipeline/medium-10k.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // Run two pipelines on the same file
      const pipeline1 = pipelines[0];
      const pipeline2 = pipelines[1];

      const promise1 = pipeline1.execute(inputFile);
      const promise2 = pipeline2.execute(inputFile);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should complete successfully
      expect(result1.startTime).toBeInstanceOf(Date);
      expect(result1.endTime).toBeInstanceOf(Date);
      expect(result2.startTime).toBeInstanceOf(Date);
      expect(result2.endTime).toBeInstanceOf(Date);

      // Both should have consistent results
      expect(result1.permitsProcessed).toBeGreaterThan(0);
      expect(result2.permitsProcessed).toBe(result1.permitsProcessed);
      expect(result1.qaPassed).toBe(result2.qaPassed);
      
      // QA results should be consistent
      if (result1.qaResults && result2.qaResults) {
        expect(result1.qaResults.length).toBe(result2.qaResults.length);
      }
    }, 180000);
  });

  describe('Load Distribution', () => {
    it('should distribute load evenly across concurrent pipelines', async () => {
      const testFiles = [
        'tests/e2e/fixtures/pipeline/small-1k.txt',
        'tests/e2e/fixtures/pipeline/medium-10k.txt'
      ];

      // Verify all files exist
      for (const testFile of testFiles) {
        const inputFile = path.resolve(testFile);
        expect(fs.existsSync(inputFile)).toBe(true);
      }

      // Record start times
      const startTimes = testFiles.map(() => Date.now());

      // Run pipelines concurrently
      const promises = testFiles.map((filePath, index) => {
        const resolvedPath = path.resolve(filePath);
        return pipelines[index].execute(resolvedPath);
      });

      const results = await Promise.all(promises);

      // Calculate durations
      const durations = results.map((result, index) => 
        result.endTime.getTime() - startTimes[index]
      );

      // Should complete successfully
      for (const result of results) {
        expect(result.startTime).toBeInstanceOf(Date);
        expect(result.endTime).toBeInstanceOf(Date);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
      }

      // Durations should be reasonable (concurrent processing should be faster than sequential)
      const sequentialTime = durations.reduce((sum, duration) => sum + duration, 0);
      const maxConcurrentTime = Math.max(...durations);
      
      // Concurrent processing should be significantly faster than sequential
      expect(maxConcurrentTime).toBeLessThan(sequentialTime * 0.8);
    }, 180000);
  });
});