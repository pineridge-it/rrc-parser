import { HistoricalComparison, HistoricalRun } from '../../reporters/historical-comparison';
import * as fs from 'fs';

describe('HistoricalComparison', () => {
  let historicalComparison: HistoricalComparison;
  let tempHistoryPath: string;

  beforeEach(() => {
    tempHistoryPath = 'tests/temp-history.json';
    historicalComparison = new HistoricalComparison(tempHistoryPath);
  });

  afterEach(() => {
    // Clean up temp file
    if (fs.existsSync(tempHistoryPath)) {
      fs.unlinkSync(tempHistoryPath);
    }
  });

  describe('loadHistory', () => {
    it('should return empty array when no history file exists', () => {
      const history = historicalComparison.loadHistory();
      expect(history).toEqual([]);
    });

    it('should load history from file', () => {
      const mockHistory: HistoricalRun[] = [
        {
          timestamp: '2024-01-01T10:00:00.000Z',
          duration: 5000,
          coverage: { lines: 80, statements: 75, functions: 70, branches: 65 },
          failures: ['test1'],
          memory: { heapUsed: 1000000, heapTotal: 2000000, rss: 3000000 }
        }
      ];

      // Write mock history to file
      fs.writeFileSync(tempHistoryPath, JSON.stringify(mockHistory));

      const history = historicalComparison.loadHistory();
      expect(history).toEqual(mockHistory);
    });

    it('should return empty array when file cannot be parsed', () => {
      // Write invalid JSON to file
      fs.writeFileSync(tempHistoryPath, 'invalid json');

      const history = historicalComparison.loadHistory();
      expect(history).toEqual([]);
    });
  });

  describe('saveRun', () => {
    it('should save run to history file', () => {
      const run: HistoricalRun = {
        timestamp: '2024-01-01T10:00:00.000Z',
        duration: 5000,
        coverage: { lines: 80, statements: 75, functions: 70, branches: 65 },
        failures: ['test1'],
        memory: { heapUsed: 1000000, heapTotal: 2000000, rss: 3000000 }
      };

      historicalComparison.saveRun(run);

      const history = historicalComparison.loadHistory();
      expect(history).toEqual([run]);
    });

    it('should keep only last 30 runs', () => {
      // Create 35 runs
      const runs: HistoricalRun[] = [];
      for (let i = 0; i < 35; i++) {
        runs.push({
          timestamp: `2024-01-01T10:00:${i.toString().padStart(2, '0')}.000Z`,
          duration: 5000 + i,
          coverage: { lines: 80 + i, statements: 75 + i, functions: 70 + i, branches: 65 + i },
          failures: [`test${i}`],
          memory: { heapUsed: 1000000 + i, heapTotal: 2000000 + i, rss: 3000000 + i }
        });
      }

      // Save all runs
      runs.forEach(run => historicalComparison.saveRun(run));

      const history = historicalComparison.loadHistory();
      expect(history).toHaveLength(30);
      // Should contain the last 30 runs (indices 5-34)
      expect(history[0].duration).toBe(5005);
      expect(history[29].duration).toBe(5034);
    });
  });

  describe('compareWithHistory', () => {
    it('should return hasHistory=false when no history exists', () => {
      const current: HistoricalRun = {
        timestamp: '2024-01-01T10:00:00.000Z',
        duration: 5000,
        coverage: { lines: 80, statements: 75, functions: 70, branches: 65 },
        failures: ['test1'],
        memory: { heapUsed: 1000000, heapTotal: 2000000, rss: 3000000 }
      };

      const comparison = historicalComparison.compareWithHistory(current);
      expect(comparison.hasHistory).toBe(false);
    });

    it('should compare current run with previous run', () => {
      const previous: HistoricalRun = {
        timestamp: '2024-01-01T09:00:00.000Z',
        duration: 4500,
        coverage: { lines: 75, statements: 70, functions: 65, branches: 60 },
        failures: ['test1'],
        memory: { heapUsed: 1000000, heapTotal: 2000000, rss: 3000000 }
      };

      const current: HistoricalRun = {
        timestamp: '2024-01-01T10:00:00.000Z',
        duration: 5000,
        coverage: { lines: 80, statements: 75, functions: 70, branches: 65 },
        failures: ['test1', 'test2'], // Added new failure
        memory: { heapUsed: 1100000, heapTotal: 2100000, rss: 3100000 }
      };

      // Save previous run
      historicalComparison.saveRun(previous);

      const comparison = historicalComparison.compareWithHistory(current);
      
      expect(comparison.hasHistory).toBe(true);
      expect(comparison.durationChange).toBe(500); // 5000 - 4500
      expect(comparison.coverageChange).toBe(5); // 80 - 75
      expect(comparison.newFailures).toEqual(['test2']); // New failure
      expect(comparison.fixedTests).toEqual([]); // No fixed tests
    });
  });

  describe('calculateTrend', () => {
    it('should calculate trends from historical data', () => {
      // Create mock history with clear trends
      const history: HistoricalRun[] = [
        {
          timestamp: '2024-01-01T10:00:00.000Z',
          duration: 5000,
          coverage: { lines: 70, statements: 65, functions: 60, branches: 55 },
          failures: ['test1'],
          memory: { heapUsed: 1000000, heapTotal: 2000000, rss: 3000000 }
        },
        {
          timestamp: '2024-01-01T10:05:00.000Z',
          duration: 4500,
          coverage: { lines: 75, statements: 70, functions: 65, branches: 60 },
          failures: [],
          memory: { heapUsed: 1100000, heapTotal: 2100000, rss: 3100000 }
        },
        {
          timestamp: '2024-01-01T10:10:00.000Z',
          duration: 4000,
          coverage: { lines: 80, statements: 75, functions: 70, branches: 65 },
          failures: [],
          memory: { heapUsed: 1200000, heapTotal: 2200000, rss: 3200000 }
        }
      ];

      // We can't directly test the private method, but we can test the result
      // by saving the history and comparing with a current run
      history.forEach(run => historicalComparison.saveRun(run));
      
      const current: HistoricalRun = {
        timestamp: '2024-01-01T10:15:00.000Z',
        duration: 3500,
        coverage: { lines: 85, statements: 80, functions: 75, branches: 70 },
        failures: [],
        memory: { heapUsed: 1300000, heapTotal: 2300000, rss: 3300000 }
      };

      const comparison = historicalComparison.compareWithHistory(current);
      
      expect(comparison.trend).toBeDefined();
      if (comparison.trend) {
        // Duration should be decreasing (negative slope)
        expect(comparison.trend.durationTrend).toBeLessThan(0);
        // Coverage should be increasing (positive slope)
        expect(comparison.trend.coverageTrend).toBeGreaterThan(0);
        // Overall direction should be improving
        expect(comparison.trend.direction).toBe('improving');
      }
    });
  });

  describe('printComparison', () => {
    it('should print comparison results to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const comparison = {
        hasHistory: true,
        durationChange: 500,
        coverageChange: 5,
        newFailures: ['test2'],
        fixedTests: ['test1'],
        trend: {
          durationTrend: -100,
          coverageTrend: 2,
          direction: 'improving' as const
        }
      };

      historicalComparison.printComparison(comparison);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📈 Historical Comparison'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Duration: increased ↑'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Coverage: improved ↑'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔥 New Failures (1):'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Fixed Tests (1):'));
      
      consoleSpy.mockRestore();
    });

    it('should print message when no history is available', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const comparison = {
        hasHistory: false
      };

      historicalComparison.printComparison(comparison);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📅 No historical data available for comparison.'));
      
      consoleSpy.mockRestore();
    });
  });
});