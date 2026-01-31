import { LogAnalyzer } from '../../helpers/log-analyzer';
import { LogEntry } from '../../helpers/logger';

describe('LogAnalyzer', () => {
  let logAnalyzer: LogAnalyzer;
  let sampleLogs: LogEntry[];

  beforeEach(() => {
    // Create sample logs for testing
    sampleLogs = [
      {
        timestamp: '2024-01-01T10:00:00.000Z',
        level: 'info',
        phase: 'setup',
        testName: 'sample test',
        operation: 'test_start',
        data: { pid: 1234 }
      },
      {
        timestamp: '2024-01-01T10:00:01.000Z',
        level: 'info',
        phase: 'execute',
        testName: 'sample test',
        operation: 'parse_start',
        data: { filePath: '/test/file.txt', fileSize: 1024 }
      },
      {
        timestamp: '2024-01-01T10:00:03.500Z',
        level: 'info',
        phase: 'execute',
        testName: 'sample test',
        operation: 'parse_complete',
        duration: 2500,
        memory: 50 * 1024 * 1024, // 50MB
        data: { recordsParsed: 1000, recordsPerSecond: 400 }
      },
      {
        timestamp: '2024-01-01T10:00:04.000Z',
        level: 'info',
        phase: 'execute',
        testName: 'sample test',
        operation: 'qa_gate_start',
        data: { gateName: 'schema_validation' }
      },
      {
        timestamp: '2024-01-01T10:00:04.200Z',
        level: 'info',
        phase: 'execute',
        testName: 'sample test',
        operation: 'qa_gate_complete',
        duration: 200,
        data: { gateName: 'schema_validation', passed: true, violations: 0 }
      },
      {
        timestamp: '2024-01-01T10:00:05.000Z',
        level: 'warn',
        phase: 'execute',
        testName: 'sample test',
        operation: 'slow_operation',
        duration: 1500,
        data: { message: 'This operation is slow' }
      },
      {
        timestamp: '2024-01-01T10:00:06.000Z',
        level: 'error',
        phase: 'execute',
        testName: 'sample test',
        operation: 'database_error',
        duration: 50,
        error: {
          name: 'DatabaseError',
          message: 'Connection failed',
          stack: 'Error stack trace'
        },
        data: { connectionString: 'test-db' }
      },
      {
        timestamp: '2024-01-01T10:00:07.000Z',
        level: 'info',
        phase: 'execute',
        testName: 'sample test',
        operation: 'test_complete',
        data: { status: 'completed' }
      }
    ];

    logAnalyzer = new LogAnalyzer(sampleLogs);
  });

  describe('findSlowOperations', () => {
    it('should find operations slower than threshold', () => {
      const slowOps = logAnalyzer.findSlowOperations(1000);
      
      expect(slowOps).toHaveLength(2);
      expect(slowOps[0].operation).toBe('parse_complete');
      expect(slowOps[1].operation).toBe('slow_operation');
    });

    it('should use default threshold of 1000ms', () => {
      const slowOps = logAnalyzer.findSlowOperations();
      
      expect(slowOps).toHaveLength(2);
      expect(slowOps.every(op => (op.duration || 0) > 1000)).toBe(true);
    });

    it('should return empty array when no operations exceed threshold', () => {
      const slowOps = logAnalyzer.findSlowOperations(5000);
      
      expect(slowOps).toHaveLength(0);
    });
  });

  describe('getTotalDuration', () => {
    it('should calculate total duration from start to completion', () => {
      const duration = logAnalyzer.getTotalDuration();
      
      // From 10:00:00.000 to 10:00:07.000 = 7000ms
      expect(duration).toBe(7000);
    });

    it('should return 0 when start or end markers are missing', () => {
      const logsWithoutStart = sampleLogs.filter(log => log.operation !== 'test_start');
      const analyzer = new LogAnalyzer(logsWithoutStart);
      const duration = analyzer.getTotalDuration();
      
      expect(duration).toBe(0);
    });
  });

  describe('findMemorySpikes', () => {
    it('should find operations with memory usage significantly above average', () => {
      // Add a high memory usage log to our sample
      const logs = [...sampleLogs];
      logs.push({
        timestamp: '2024-01-01T10:00:08.000Z',
        level: 'info',
        phase: 'execute',
        testName: 'sample test',
        operation: 'memory_spike',
        memory: 200 * 1024 * 1024 // 200MB - much higher than average
      });
      
      const analyzer = new LogAnalyzer(logs);
      const memorySpikes = analyzer.findMemorySpikes();
      
      expect(memorySpikes).toHaveLength(1);
      expect(memorySpikes[0].operation).toBe('memory_spike');
    });

    it('should return empty array when no memory logs exist', () => {
      const logs = sampleLogs.filter(log => log.memory === undefined);
      const analyzer = new LogAnalyzer(logs);
      const memorySpikes = analyzer.findMemorySpikes();
      
      expect(memorySpikes).toHaveLength(0);
    });
  });

  describe('getErrorCount', () => {
    it('should count error level logs', () => {
      const errorCount = logAnalyzer.getErrorCount();
      
      expect(errorCount).toBe(1);
    });

    it('should return 0 when no errors exist', () => {
      const logs = sampleLogs.filter(log => log.level !== 'error');
      const analyzer = new LogAnalyzer(logs);
      const errorCount = analyzer.getErrorCount();
      
      expect(errorCount).toBe(0);
    });
  });

  describe('getWarningCount', () => {
    it('should count warning level logs', () => {
      const warningCount = logAnalyzer.getWarningCount();
      
      expect(warningCount).toBe(1);
    });

    it('should return 0 when no warnings exist', () => {
      const logs = sampleLogs.filter(log => log.level !== 'warn');
      const analyzer = new LogAnalyzer(logs);
      const warningCount = analyzer.getWarningCount();
      
      expect(warningCount).toBe(0);
    });
  });

  describe('getOperationsByPhase', () => {
    it('should filter logs by phase', () => {
      const executeOps = logAnalyzer.getOperationsByPhase('execute');
      
      expect(executeOps).toHaveLength(6);
      expect(executeOps.every(op => op.phase === 'execute')).toBe(true);
    });

    it('should return empty array for non-existent phase', () => {
      const nonExistentOps = logAnalyzer.getOperationsByPhase('nonexistent');
      
      expect(nonExistentOps).toHaveLength(0);
    });
  });

  describe('getOperationsByType', () => {
    it('should filter logs by operation type substring', () => {
      const parseOps = logAnalyzer.getOperationsByType('parse');
      
      expect(parseOps).toHaveLength(2);
      expect(parseOps[0].operation).toBe('parse_start');
      expect(parseOps[1].operation).toBe('parse_complete');
    });

    it('should return empty array for non-existent operation type', () => {
      const nonExistentOps = logAnalyzer.getOperationsByType('nonexistent');
      
      expect(nonExistentOps).toHaveLength(0);
    });
  });

  describe('generateSummary', () => {
    it('should generate a comprehensive summary', () => {
      const summary = logAnalyzer.generateSummary();
      
      expect(summary).toEqual({
        totalDuration: 7000,
        slowOperations: [
          expect.objectContaining({ operation: 'parse_complete' }),
          expect.objectContaining({ operation: 'slow_operation' })
        ],
        memoryPeak: 50 * 1024 * 1024,
        errorCount: 1,
        warningCount: 1,
        operationCounts: {
          'test_start': 1,
          'parse_start': 1,
          'parse_complete': 1,
          'qa_gate_start': 1,
          'qa_gate_complete': 1,
          'slow_operation': 1,
          'database_error': 1,
          'test_complete': 1
        }
      });
    });
  });

  describe('findRepeatedOperations', () => {
    it('should find operations that occur frequently', () => {
      // Add repeated operations to our sample
      const logs = [...sampleLogs];
      for (let i = 0; i < 5; i++) {
        logs.push({
          timestamp: `2024-01-01T10:00:10.${i.toString().padStart(3, '0')}Z`,
          level: 'info',
          phase: 'execute',
          testName: 'sample test',
          operation: 'repeated_op',
          data: { iteration: i }
        });
      }
      
      const analyzer = new LogAnalyzer(logs);
      const repeatedOps = analyzer.findRepeatedOperations(5);
      
      expect(repeatedOps).toHaveLength(1);
      expect(repeatedOps[0]).toEqual({ operation: 'repeated_op', count: 5 });
    });

    it('should use default minimum count of 5', () => {
      const repeatedOps = logAnalyzer.findRepeatedOperations();
      
      // In our sample logs, no operation repeats 5 times
      expect(repeatedOps).toHaveLength(0);
    });
  });

  describe('getTimingDistribution', () => {
    it('should categorize operations by timing', () => {
      const distribution = logAnalyzer.getTimingDistribution();
      
      expect(distribution).toEqual({
        fast: 2,    // Operations < 100ms
        medium: 2,  // Operations 100ms - 1s
        slow: 2     // Operations > 1s
      });
    });
  });

  describe('findHighMemoryOperations', () => {
    it('should find operations with memory usage above threshold', () => {
      // Add a high memory usage log to our sample
      const logs = [...sampleLogs];
      logs.push({
        timestamp: '2024-01-01T10:00:08.000Z',
        level: 'info',
        phase: 'execute',
        testName: 'sample test',
        operation: 'high_memory_op',
        memory: 150 * 1024 * 1024 // 150MB
      });
      
      const analyzer = new LogAnalyzer(logs);
      const highMemoryOps = analyzer.findHighMemoryOperations(100 * 1024 * 1024); // 100MB threshold
      
      expect(highMemoryOps).toHaveLength(1);
      expect(highMemoryOps[0].operation).toBe('high_memory_op');
    });

    it('should use default threshold of 100MB', () => {
      // Add operations with various memory usage levels
      const logs = [...sampleLogs];
      logs.push({
        timestamp: '2024-01-01T10:00:08.000Z',
        level: 'info',
        phase: 'execute',
        testName: 'sample test',
        operation: 'normal_memory_op',
        memory: 50 * 1024 * 1024 // 50MB - below default threshold
      });
      logs.push({
        timestamp: '2024-01-01T10:00:09.000Z',
        level: 'info',
        phase: 'execute',
        testName: 'sample test',
        operation: 'high_memory_op',
        memory: 150 * 1024 * 1024 // 150MB - above default threshold
      });
      
      const analyzer = new LogAnalyzer(logs);
      const highMemoryOps = analyzer.findHighMemoryOperations();
      
      expect(highMemoryOps).toHaveLength(1);
      expect(highMemoryOps[0].operation).toBe('high_memory_op');
    });
  });
});