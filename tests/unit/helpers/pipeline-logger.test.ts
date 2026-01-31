import { PipelineLogger } from '../../helpers/pipeline-logger';
import { TestLogger } from '../../helpers/logger';

describe('PipelineLogger', () => {
  let pipelineLogger: PipelineLogger;
  let testLogger: TestLogger;

  beforeEach(() => {
    TestLogger.reset();
    testLogger = TestLogger.getInstance();
    pipelineLogger = new PipelineLogger();
  });

  afterEach(() => {
    TestLogger.reset();
  });

  describe('logParseStart', () => {
    it('should log parse start with file path and size', () => {
      const filePath = '/test/path/file.txt';
      const fileSize = 1024;

      pipelineLogger.logParseStart(filePath, fileSize);

      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe('parse_start');
      expect(logs[0].phase).toBe('execute');
      expect(logs[0].data).toEqual({
        filePath,
        fileSize,
        operation: 'parsing'
      });
    });
  });

  describe('logParseComplete', () => {
    it('should log parse completion with performance metrics', () => {
      const filePath = '/test/path/file.txt';
      const recordsParsed = 1000;
      const durationMs = 1500;
      const violations = 5;

      pipelineLogger.logParseComplete(filePath, recordsParsed, durationMs, violations);

      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe('parse_complete');
      expect(logs[0].phase).toBe('execute');
      expect(logs[0].duration).toBe(durationMs);
      expect(logs[0].data).toEqual({
        filePath,
        recordsParsed,
        violations,
        recordsPerSecond: 667
      });
    });

    it('should calculate records per second correctly', () => {
      const filePath = '/test/path/file.txt';
      const recordsParsed = 500;
      const durationMs = 250; // 0.25 seconds

      pipelineLogger.logParseComplete(filePath, recordsParsed, durationMs);

      const logs = testLogger.getLogs();
      expect(logs[0].data?.recordsPerSecond).toBe(2000);
    });
  });

  describe('logQaGateStart', () => {
    it('should log QA gate start with gate name', () => {
      const gateName = 'schema_validation';

      pipelineLogger.logQaGateStart(gateName);

      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe('qa_gate_start');
      expect(logs[0].data).toEqual({
        gateName,
        operation: 'qa_check'
      });
    });
  });

  describe('logQaGateComplete', () => {
    it('should log QA gate completion with results', () => {
      const gateName = 'schema_validation';
      const passed = true;
      const violations = 0;
      const durationMs = 120;

      pipelineLogger.logQaGateComplete(gateName, passed, violations, durationMs);

      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe('qa_gate_complete');
      expect(logs[0].duration).toBe(durationMs);
      expect(logs[0].data).toEqual({
        gateName,
        passed,
        violations
      });
    });
  });

  describe('logLoadStart', () => {
    it('should log load start with record count', () => {
      const recordCount = 5000;

      pipelineLogger.logLoadStart(recordCount);

      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe('load_start');
      expect(logs[0].data).toEqual({ recordCount });
    });
  });

  describe('logLoadComplete', () => {
    it('should log load completion with performance metrics', () => {
      const recordsLoaded = 5000;
      const durationMs = 2500;

      pipelineLogger.logLoadComplete(recordsLoaded, durationMs);

      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe('load_complete');
      expect(logs[0].duration).toBe(durationMs);
      expect(logs[0].data).toEqual({
        recordsLoaded,
        insertsPerSecond: 2000
      });
    });

    it('should calculate inserts per second correctly', () => {
      const recordsLoaded = 100;
      const durationMs = 500; // 0.5 seconds

      pipelineLogger.logLoadComplete(recordsLoaded, durationMs);

      const logs = testLogger.getLogs();
      expect(logs[0].data?.insertsPerSecond).toBe(200);
    });
  });

  describe('logCheckpoint', () => {
    it('should log checkpoint with saved position and file path', () => {
      const savedAt = 10000;
      const filePath = '/tmp/checkpoint.json';

      pipelineLogger.logCheckpoint(savedAt, filePath);

      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe('checkpoint_saved');
      expect(logs[0].data).toEqual({
        recordCount: savedAt,
        filePath
      });
    });
  });

  describe('logError', () => {
    it('should log error with phase and context', () => {
      const phase = 'parsing';
      const error = new Error('Test error message');
      const context = { fileId: 'test123' };

      pipelineLogger.logError(phase, error, context);

      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].phase).toBe(phase);
      expect(logs[0].error).toBeDefined();
      expect(logs[0].error?.message).toBe('Test error message');
      expect(logs[0].data).toEqual(context);
    });

    it('should log error without context', () => {
      const phase = 'loading';
      const error = new Error('Another error');

      pipelineLogger.logError(phase, error);

      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].phase).toBe(phase);
      expect(logs[0].error).toBeDefined();
      expect(logs[0].error?.message).toBe('Another error');
      expect(logs[0].data).toBeUndefined();
    });
  });
});