/**
 * Historical Comparison
 * 
 * Compares current test runs with historical data to identify trends
 * in performance, coverage, and stability.
 */

interface HistoricalRun {
  timestamp: string;
  duration: number;
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  failures: string[];
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

interface ComparisonResult {
  hasHistory: boolean;
  durationChange?: number;
  coverageChange?: number;
  newFailures?: string[];
  fixedTests?: string[];
  trend?: {
    durationTrend: number; // slope of duration over time
    coverageTrend: number; // slope of coverage over time
    direction: 'improving' | 'declining' | 'stable';
  };
}

interface Trend {
  durationTrend: number;
  coverageTrend: number;
  direction: 'improving' | 'declining' | 'stable';
}

export class HistoricalComparison {
  private historyPath: string;

  constructor(historyPath: string = 'tests/reports/history.json') {
    this.historyPath = historyPath;
  }

  /**
   * Load historical test run data
   */
  loadHistory(): HistoricalRun[] {
    try {
      const fs = require('fs');
      if (!fs.existsSync(this.historyPath)) {
        return [];
      }
      const data = fs.readFileSync(this.historyPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Could not load historical data:', error);
      return [];
    }
  }

  /**
   * Save current test run to history
   */
  saveRun(run: HistoricalRun): void {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Ensure directory exists
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const history = this.loadHistory();
      history.push(run);
      
      // Keep only last 30 runs
      if (history.length > 30) {
        history.shift();
      }
      
      fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.warn('Could not save historical data:', error);
    }
  }

  /**
   * Compare current run with historical data
   */
  compareWithHistory(current: HistoricalRun): ComparisonResult {
    const history = this.loadHistory();
    if (history.length === 0) {
      return { hasHistory: false };
    }
    
    const previous = history[history.length - 1];
    
    return {
      hasHistory: true,
      durationChange: current.duration - previous.duration,
      coverageChange: current.coverage.lines - previous.coverage.lines,
      newFailures: current.failures.filter(f => !previous.failures.includes(f)),
      fixedTests: previous.failures.filter(f => !current.failures.includes(f)),
      trend: this.calculateTrend(history)
    };
  }

  /**
   * Print historical comparison results
   */
  printComparison(comparison: ComparisonResult): void {
    if (!comparison.hasHistory) {
      console.log('\\n📅 No historical data available for comparison.');
      return;
    }

    console.log('\\n📈 Historical Comparison');
    console.log('-'.repeat(80));

    if (comparison.durationChange !== undefined) {
      const durationChange = comparison.durationChange;
      const changeSymbol = durationChange > 0 ? '↑' : durationChange < 0 ? '↓' : '→';
      const changePercent = previousDuration => {
        if (previousDuration === 0) return 'N/A';
        return `${((durationChange / previousDuration) * 100).toFixed(2)}%`;
      };
      
      console.log(`Test Duration: ${durationChange > 0 ? 'increased' : 'decreased'} ${changeSymbol} ${this.formatDuration(Math.abs(durationChange))} (${changePercent(comparison.durationChange - durationChange)})`);
    }

    if (comparison.coverageChange !== undefined) {
      const coverageChange = comparison.coverageChange;
      const changeSymbol = coverageChange > 0 ? '↑' : coverageChange < 0 ? '↓' : '→';
      console.log(`Coverage: ${coverageChange > 0 ? 'improved' : 'declined'} ${changeSymbol} ${coverageChange.toFixed(2)}%`);
    }

    if (comparison.newFailures && comparison.newFailures.length > 0) {
      console.log(`\\n🔥 New Failures (${comparison.newFailures.length}):`);
      comparison.newFailures.slice(0, 5).forEach(failure => {
        console.log(`  • ${failure}`);
      });
      if (comparison.newFailures.length > 5) {
        console.log(`  ... and ${comparison.newFailures.length - 5} more`);
      }
    }

    if (comparison.fixedTests && comparison.fixedTests.length > 0) {
      console.log(`\\n✅ Fixed Tests (${comparison.fixedTests.length}):`);
      comparison.fixedTests.slice(0, 5).forEach(test => {
        console.log(`  • ${test}`);
      });
      if (comparison.fixedTests.length > 5) {
        console.log(`  ... and ${comparison.fixedTests.length - 5} more`);
      }
    }

    if (comparison.trend) {
      console.log(`\\n📊 Trend Analysis:`);
      const durationTrend = comparison.trend.durationTrend;
      const coverageTrend = comparison.trend.coverageTrend;
      
      console.log(`  Duration Trend: ${durationTrend > 0 ? 'slowing' : durationTrend < 0 ? 'improving' : 'stable'} (${durationTrend.toFixed(2)} ms/run)`);
      console.log(`  Coverage Trend: ${coverageTrend > 0 ? 'improving' : coverageTrend < 0 ? 'declining' : 'stable'} (${coverageTrend.toFixed(2)} %/run)`);
      console.log(`  Overall Direction: ${comparison.trend.direction}`);
    }
  }

  /**
   * Calculate trends from historical data
   */
  private calculateTrend(history: HistoricalRun[]): Trend {
    // We need at least 2 points to calculate a trend
    if (history.length < 2) {
      return {
        durationTrend: 0,
        coverageTrend: 0,
        direction: 'stable'
      };
    }

    // Calculate slopes using linear regression
    const durations = history.map(h => h.duration);
    const coverages = history.map(h => h.coverage.lines);
    
    const durationSlope = this.calculateSlope(durations);
    const coverageSlope = this.calculateSlope(coverages);
    
    // Determine overall direction based on both metrics
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (durationSlope < 0 && coverageSlope > 0) {
      direction = 'improving';
    } else if (durationSlope > 0 && coverageSlope < 0) {
      direction = 'declining';
    }
    
    return {
      durationTrend: durationSlope,
      coverageTrend: coverageSlope,
      direction
    };
  }

  /**
   * Calculate slope of a data series using linear regression
   */
  private calculateSlope(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0;
    
    // Simple linear regression: y = mx + b
    // Slope (m) = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = data[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = n * sumXX - sumX * sumX;
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Format duration in a human-readable way
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }
}