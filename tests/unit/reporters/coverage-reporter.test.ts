import { CoverageReporter } from '../../reporters/coverage-reporter';

describe('CoverageReporter', () => {
  let coverageReporter: CoverageReporter;

  beforeEach(() => {
    coverageReporter = new CoverageReporter(80);
  });

  describe('generateReport', () => {
    it('should generate an empty report when no coverage data is provided', () => {
      const mockAggregatedResults = {
        coverageMap: null
      };

      const report = coverageReporter.generateReport(mockAggregatedResults as any);
      
      expect(report.timestamp).toBeDefined();
      expect(report.summary).toEqual({
        lines: { pct: 0, covered: 0, total: 0 },
        statements: { pct: 0, covered: 0, total: 0 },
        functions: { pct: 0, covered: 0, total: 0 },
        branches: { pct: 0, covered: 0, total: 0 }
      });
      expect(report.files).toHaveLength(0);
      expect(report.uncoveredLines).toHaveLength(0);
      expect(report.lowCoverageFiles).toHaveLength(0);
    });

    it('should generate a report with coverage data', () => {
      // Mock coverage data
      const mockCoverageMap = {
        getCoverageSummary: () => ({
          data: {
            lines: { pct: 85, covered: 85, total: 100 },
            statements: { pct: 80, covered: 80, total: 100 },
            functions: { pct: 75, covered: 75, total: 100 },
            branches: { pct: 70, covered: 70, total: 100 }
          }
        }),
        files: () => ['/src/file1.ts', '/src/file2.ts'],
        fileCoverageFor: (filePath: string) => ({
          toSummary: () => ({
            data: {
              lines: { pct: filePath === '/src/file1.ts' ? 90 : 80 },
              statements: { pct: filePath === '/src/file1.ts' ? 85 : 75 },
              functions: { pct: filePath === '/src/file1.ts' ? 80 : 70 },
              branches: { pct: filePath === '/src/file1.ts' ? 75 : 65 }
            }
          }),
          statementMap: {},
          s: {}
        })
      };

      const mockAggregatedResults = {
        coverageMap: mockCoverageMap
      };

      const report = coverageReporter.generateReport(mockAggregatedResults as any);
      
      expect(report.timestamp).toBeDefined();
      expect(report.summary.lines.pct).toBe(85);
      expect(report.summary.statements.pct).toBe(80);
      expect(report.summary.functions.pct).toBe(75);
      expect(report.summary.branches.pct).toBe(70);
      expect(report.files).toHaveLength(2);
      expect(report.lowCoverageFiles).toHaveLength(1); // file2.ts has 80%, which is at threshold
    });
  });

  describe('printReport', () => {
    it('should print coverage report to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          lines: { pct: 85, covered: 85, total: 100 },
          statements: { pct: 80, covered: 80, total: 100 },
          functions: { pct: 75, covered: 75, total: 100 },
          branches: { pct: 70, covered: 70, total: 100 }
        },
        files: [
          { path: '/src/file1.ts', lines: 90, statements: 85, functions: 80, branches: 75 },
          { path: '/src/file2.ts', lines: 80, statements: 75, functions: 70, branches: 65 }
        ],
        uncoveredLines: [
          { file: '/src/file1.ts', lines: [10, 15, 20] },
          { file: '/src/file2.ts', lines: [5, 12] }
        ],
        lowCoverageFiles: [
          { path: '/src/file2.ts', lines: 80, statements: 75, functions: 70, branches: 65 }
        ]
      };

      coverageReporter.printReport(report);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📋 Coverage Report'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Lines:      85.00%'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  Files with <80% coverage:'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations based on coverage data', () => {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          lines: { pct: 70, covered: 70, total: 100 },
          statements: { pct: 65, covered: 65, total: 100 },
          functions: { pct: 60, covered: 60, total: 100 },
          branches: { pct: 55, covered: 55, total: 100 }
        },
        files: [],
        uncoveredLines: [],
        lowCoverageFiles: [{ path: '/src/file1.ts', lines: 70, statements: 65, functions: 60, branches: 55 }]
      };

      const recommendations = coverageReporter.generateRecommendations(report);
      
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0]).toContain('Overall line coverage is 70.00%. Aim for 80%+ coverage.');
      expect(recommendations[1]).toContain('1 files have low coverage. Prioritize adding tests for these files.');
    });

    it('should generate branch coverage recommendation when significantly lower', () => {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          lines: { pct: 90, covered: 90, total: 100 },
          statements: { pct: 85, covered: 85, total: 100 },
          functions: { pct: 80, covered: 80, total: 100 },
          branches: { pct: 50, covered: 50, total: 100 } // Significantly lower
        },
        files: [],
        uncoveredLines: [],
        lowCoverageFiles: []
      };

      const recommendations = coverageReporter.generateRecommendations(report);
      
      expect(recommendations).toContain('• Branch coverage is significantly lower than line coverage. Add tests for conditional branches.');
    });
  });
});