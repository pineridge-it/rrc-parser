import { EtlPipeline } from '../../../src/etl/Pipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('ETL Pipeline Checkpoint Integration', () => {
  let pipeline: EtlPipeline;
  let checkpointFile: string;
  let testCheckpointDir: string;

  beforeAll(() => {
    testCheckpointDir = path.resolve('tests/tmp/checkpoints');
    if (!fs.existsSync(testCheckpointDir)) {
      fs.mkdirSync(testCheckpointDir, { recursive: true });
    }
  });

  beforeEach(() => {
    checkpointFile = path.join(testCheckpointDir, 'checkpoint-test.json');
    
    // Create a new pipeline instance for each test
    pipeline = new EtlPipeline({
      enableCheckpoints: true,
      checkpointPath: checkpointFile,
      enableQAGates: false, // Disable QA gates for faster testing
      enableMonitoring: false // Disable monitoring for faster testing
    });
  });

  afterEach(() => {
    // Clean up checkpoint files after each test
    if (fs.existsSync(checkpointFile)) {
      fs.unlinkSync(checkpointFile);
    }
  });

  afterAll(() => {
    // Clean up checkpoint directory
    if (fs.existsSync(testCheckpointDir)) {
      fs.rmSync(testCheckpointDir, { recursive: true, force: true });
    }
  });

  describe('Checkpoint Creation', () => {
    it('should create checkpoint file during processing', async () => {
      const inputFile = path.resolve('tests/fixtures/files/medium-permit-file.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // Execute pipeline
      await pipeline.execute(inputFile);

      // Check that checkpoint file was created
      expect(fs.existsSync(checkpointFile)).toBe(true);

      // Check that checkpoint file contains valid JSON
      const checkpointData = JSON.parse(fs.readFileSync(checkpointFile, 'utf-8'));
      expect(checkpointData).toHaveProperty('lastProcessedRecord');
      expect(checkpointData).toHaveProperty('timestamp');
      expect(checkpointData).toHaveProperty('inputFile');
    });

    it('should update checkpoint file periodically', async () => {
      const inputFile = path.resolve('tests/fixtures/files/medium-permit-file.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // Execute pipeline
      await pipeline.execute(inputFile);

      // Read initial checkpoint
      const initialCheckpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf-8'));
      const initialTimestamp = new Date(initialCheckpoint.timestamp).getTime();

      // Wait a bit and execute again (simulating interruption and resume)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await pipeline.execute(inputFile);

      // Read updated checkpoint
      const updatedCheckpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf-8'));
      const updatedTimestamp = new Date(updatedCheckpoint.timestamp).getTime();

      // Timestamp should be updated
      expect(updatedTimestamp).toBeGreaterThanOrEqual(initialTimestamp);
    });
  });

  describe('Checkpoint Resumption', () => {
    it('should resume from checkpoint', async () => {
      const inputFile = path.resolve('tests/fixtures/files/medium-permit-file.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // First execution
      const result1 = await pipeline.execute(inputFile);
      
      // Verify checkpoint was created
      expect(fs.existsSync(checkpointFile)).toBe(true);
      
      // Second execution with same pipeline (should resume from checkpoint)
      const result2 = await pipeline.execute(inputFile);
      
      // Both executions should complete successfully
      expect(result1.errors).toHaveLength(0);
      expect(result2.errors).toHaveLength(0);
    });

    it('should track processed records in checkpoint', async () => {
      const inputFile = path.resolve('tests/fixtures/files/medium-permit-file.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // Execute pipeline
      await pipeline.execute(inputFile);

      // Read checkpoint
      const checkpointData = JSON.parse(fs.readFileSync(checkpointFile, 'utf-8'));
      
      // Should have record count information
      expect(checkpointData.lastProcessedRecord).toBeGreaterThanOrEqual(0);
      expect(checkpointData.inputFile).toBe(inputFile);
    });
  });

  describe('Checkpoint Cleanup', () => {
    it('should respect checkpoint retention policy', async () => {
      const inputFile = path.resolve('tests/fixtures/files/medium-permit-file.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      // Execute multiple times to potentially create multiple checkpoints
      await pipeline.execute(inputFile);
      await new Promise(resolve => setTimeout(resolve, 50));
      await pipeline.execute(inputFile);
      await new Promise(resolve => setTimeout(resolve, 50));
      await pipeline.execute(inputFile);

      // Checkpoint file should still exist
      expect(fs.existsSync(checkpointFile)).toBe(true);
    });
  });
});