/**
 * Coverage Reporter
 * 
 * Processes coverage data from Jest and provides detailed reports
 * with actionable insights for improving test coverage.
 */

import type { AggregatedResult } from '@jest/reporters';
import type { CoverageMap } from 'istanbul-lib-coverage';

interface CoverageSummary {
  lines: { pct: number; covered: number; total: number };
  statements: { pct: number; covered: number; total: number };
  functions: { pct: number; covered: number; total: number };
  branches: { pct: number; covered: number; total: number };
}

interface FileCoverage {
  path: string;
  lines: number;
  statements: number;
  functions: number;
  branches: number;
}

interface CoverageReport {
  timestamp: string;
  summary: CoverageSummary;
  files: FileCoverage[];
  uncoveredLines: Array<{ file: string; lines: number[] }>;
  lowCoverageFiles: FileCoverage[];
}

export class CoverageReporter {
  private coverageThreshold: number;

  constructor(coverageThreshold: number = 80) {
    this.coverageThreshold = coverageThreshold;
  }

  /**
   * Generate a comprehensive coverage report from Jest results
   */
  generateReport(aggregatedResults: AggregatedResult): CoverageReport {
    const coverageMap = aggregatedResults.coverageMap as unknown as CoverageMap;
    
    if (!coverageMap) {
      return this.createEmptyReport();
    }

    const summary = coverageMap.getCoverageSummary().data;
    const files: FileCoverage[] = [];
    const uncoveredLines: Array<{ file: string; lines: number[] }> = [];
    const lowCoverageFiles: FileCoverage[] = [];

    // Process each file's coverage data
    coverageMap.files().forEach(filePath => {
      const fileCoverage = coverageMap.fileCoverageFor(filePath);
      const fileSummary = fileCoverage.toSummary().data;
      
      const fileCoverageData: FileCoverage = {
        path: filePath,
        lines: fileSummary.lines.pct,
        statements: fileSummary.statements.pct,
        functions: fileSummary.functions.pct,
        branches: fileSummary.branches.pct
      };

      files.push(fileCoverageData);

      // Track files with low coverage
      if (fileSummary.lines.pct < this.coverageThreshold) {
        lowCoverageFiles.push(fileCoverageData);
      }

      // Find uncovered lines
      const uncovered = this.findUncoveredLines(fileCoverage);
      if (uncovered.length > 0) {
        uncoveredLines.push({ file: filePath, lines: uncovered });
      }
    });

    return {
      timestamp: new Date().toISOString(),
      summary: {
        lines: summary.lines,
        statements: summary.statements,
        functions: summary.functions,
        branches: summary.branches
      },
      files,
      uncoveredLines,
      lowCoverageFiles: lowCoverageFiles.sort((a, b) => a.lines - b.lines)
    };
  }

  /**
   * Print a human-readable coverage report to console
   */
  printReport(report: CoverageReport): void {
    console.log('\\n📋 Coverage Report');
    console.log('-'.repeat(80));
    console.log(`Lines:      ${report.summary.lines.pct.toFixed(2)}% (${report.summary.lines.covered}/${report.summary.lines.total})`);
    console.log(`Statements: ${report.summary.statements.pct.toFixed(2)}% (${report.summary.statements.covered}/${report.summary.statements.total})`);
    console.log(`Functions:  ${report.summary.functions.pct.toFixed(2)}% (${report.summary.functions.covered}/${report.summary.functions.total})`);
    console.log(`Branches:   ${report.summary.branches.pct.toFixed(2)}% (${report.summary.branches.covered}/${report.summary.branches.total})`);

    if (report.lowCoverageFiles.length > 0) {
      console.log(`\\n⚠️  Files with <${this.coverageThreshold}% coverage:`);
      console.log('-'.repeat(80));
      report.lowCoverageFiles.slice(0, 10).forEach(file => {
        console.log(`  ${file.path}: ${file.lines.toFixed(2)}%`);
      });
      
      if (report.lowCoverageFiles.length > 10) {
        console.log(`  ... and ${report.lowCoverageFiles.length - 10} more files`);
      }
    }

    if (report.uncoveredLines.length > 0) {
      console.log(`\\n🔍 Uncovered Lines:`);
      console.log('-'.repeat(80));
      report.uncoveredLines.slice(0, 5).forEach(({ file, lines }) => {
        const fileName = file.split('/').pop() || file;
        console.log(`  ${fileName}: ${lines.slice(0, 10).join(', ')}${lines.length > 10 ? '...' : ''}`);
      });
      
      if (report.uncoveredLines.length > 5) {
        console.log(`  ... and ${report.uncoveredLines.length - 5} more files`);
      }
    }
  }

  /**
   * Write coverage report to JSON file
   */
  writeJsonReport(report: CoverageReport, outputPath: string): void {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputPath, 'coverage-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  /**
   * Generate actionable recommendations based on coverage data
   */
  generateRecommendations(report: CoverageReport): string[] {
    const recommendations: string[] = [];

    if (report.summary.lines.pct < 80) {
      recommendations.push(`• Overall line coverage is ${report.summary.lines.pct.toFixed(2)}%. Aim for 80%+ coverage.`);
    }

    if (report.lowCoverageFiles.length > 0) {
      recommendations.push(`• ${report.lowCoverageFiles.length} files have low coverage. Prioritize adding tests for these files.`);
    }

    if (report.summary.branches.pct < report.summary.lines.pct * 0.8) {
      recommendations.push(`• Branch coverage is significantly lower than line coverage. Add tests for conditional branches.`);
    }

    if (report.summary.functions.pct < report.summary.lines.pct * 0.8) {
      recommendations.push(`• Function coverage is significantly lower than line coverage. Add tests for uncovered functions.`);
    }

    return recommendations;
  }

  /**
   * Find uncovered lines in a file
   */
  private findUncoveredLines(fileCoverage: any): number[] {
    const uncovered: number[] = [];
    const statementMap = fileCoverage.statementMap;
    const s = fileCoverage.s; // statement coverage data

    for (const [key, statement] of Object.entries(statementMap)) {
      const statementIndex = parseInt(key, 10);
      if (s[statementIndex] === 0) {
        // Statement is not covered, add its line numbers
        const startLine = statement.start.line;
        const endLine = statement.end.line;
        for (let line = startLine; line <= endLine; line++) {
          if (!uncovered.includes(line)) {
            uncovered.push(line);
          }
        }
      }
    }

    return uncovered.sort((a, b) => a - b);
  }

  /**
   * Create an empty report when no coverage data is available
   */
  private createEmptyReport(): CoverageReport {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        lines: { pct: 0, covered: 0, total: 0 },
        statements: { pct: 0, covered: 0, total: 0 },
        functions: { pct: 0, covered: 0, total: 0 },
        branches: { pct: 0, covered: 0, total: 0 }
      },
      files: [],
      uncoveredLines: [],
      lowCoverageFiles: []
    };
  }
}