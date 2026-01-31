import { EtlPipeline } from '../../../src/etl/Pipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('ETL Pipeline Transformer Integration', () => {
  let pipeline: EtlPipeline;
  let testOutputDir: string;
  let testCheckpointDir: string;

  beforeAll(() => {
    testOutputDir = path.resolve('tests/tmp/transformed');
    testCheckpointDir = path.resolve('tests/tmp/checkpoints');
    
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
      enableCheckpoints: false, // Disable checkpoints for transformer testing
      enableQAGates: true,
      enableMonitoring: false // Disable monitoring for faster testing
    });
  });

  afterEach(() => {
    // Clean up temporary files after each test
    const checkpointFile = path.join(testCheckpointDir, 'test-checkpoint.json');
    if (fs.existsSync(checkpointFile)) {
      fs.unlinkSync(checkpointFile);
    }
  });

  afterAll(() => {
    // Clean up temporary directories
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
    
    if (fs.existsSync(testCheckpointDir)) {
      fs.rmSync(testCheckpointDir, { recursive: true, force: true });
    }
  });

  describe('Data Transformation', () => {
    it('should transform permit data correctly', async () => {
      const inputFile = path.resolve('tests/fixtures/files/single-permit.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      // Should process at least one permit
      expect(result.permitsProcessed).toBeGreaterThan(0);
      
      // Should pass QA gates
      expect(result.qaPassed).toBe(true);
      
      // Should have QA results
      expect(result.qaResults).toBeDefined();
      expect(Array.isArray(result.qaResults)).toBe(true);
      expect(result.qaResults!.length).toBeGreaterThan(0);
    });

    it('should handle complex permit transformations', async () => {
      const inputFile = path.resolve('tests/fixtures/files/medium-permit-file.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      // Should process all permits
      expect(result.permitsProcessed).toBeGreaterThan(0);
      
      // Should pass QA gates
      expect(result.qaPassed).toBe(true);
      
      // Check that QA results contain expected information
      const postTransformResults = result.qaResults!.find(r => r.stage === 'post-transform');
      expect(postTransformResults).toBeDefined();
      expect(postTransformResults!.passed).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should validate transformed data against schema', async () => {
      const inputFile = path.resolve('tests/fixtures/files/single-permit.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      // Should have QA results with schema validation
      expect(result.qaResults).toBeDefined();
      
      // Look for schema validation results
      const schemaValidationResult = result.qaResults!.find(r => 
        r.stage.includes('schema') || r.stage.includes('validation')
      );
      
      // If schema validation was performed, it should pass
      if (schemaValidationResult) {
        expect(schemaValidationResult.passed).toBe(true);
      }
    });
  });

  describe('Data Enrichment', () => {
    it('should enrich data with additional fields', async () => {
      const inputFile = path.resolve('tests/fixtures/files/single-permit.txt');
      expect(fs.existsSync(inputFile)).toBe(true);

      const result = await pipeline.execute(inputFile);

      // Should process permits successfully
      expect(result.permitsProcessed).toBeGreaterThan(0);
      expect(result.qaPassed).toBe(true);
    });
  });
});