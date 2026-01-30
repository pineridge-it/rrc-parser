/**
 * Detailed Test Reporter
 * 
 * Custom Jest reporter that provides comprehensive test metrics including
 * timing, memory usage, coverage, and actionable recommendations.
 */

import type { Reporter, TestContext, TestResult, AggregatedResult } from '@jest/reporters';
import type { Config } from '@jest/types';

interface TestMetrics {
  name: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  retryCount: number;
}

interface SuiteMetrics {
  name: string;
  tests: TestMetrics[];
  totalDuration: number;
  passed: number;
  failed: number;
  skipped: number;
}

interface ReporterOptions {
  outputPath?: string;
  includeCoverage?: boolean;
  includeHistory?: boolean;
  slowThreshold?: number;
}

export default class DetailedReporter implements Reporter {
  private suites: SuiteMetrics[] = [];
  private currentSuite: SuiteMetrics | null = null;
  private startTime: number;
  private initialMemory: number;
  private options: ReporterOptions;

  constructor(
    _globalConfig: Config.GlobalConfig,
    options: ReporterOptions = {}
  ) {
    this.options = {
      outputPath: 'tests/reports',
      includeCoverage: true,
      includeHistory: true,
      slowThreshold: 5000,
      ...options,
    };
    this.startTime = Date.now();
    this.initialMemory = process.memoryUsage().heapUsed;
  }

  onRunStart(): void {
    this.startTime = Date.now();
    this.initialMemory = process.memoryUsage().heapUsed;

    console.log('\n' + '='.repeat(80));
    console.log('🧪 RRC Permit Scraper - Comprehensive Test Suite');
    console.log('='.repeat(80) + '\n');
  }

  onTestSuiteStart(testSuite: TestContext): void {
    this.currentSuite = {
      name: testSuite.path,
      tests: [],
      totalDuration: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    };
  }

  onTestResult(_testSuite: TestContext, testResult: TestResult): void {
    if (!this.currentSuite) return;

    this.currentSuite.totalDuration = testResult.perfStats.runtime;

    testResult.testResults.forEach(test => {
      const status = test.status as 'passed' | 'failed' | 'skipped' | 'pending';
      
      if (status === 'passed') this.currentSuite!.passed++;
      if (status === 'failed') this.currentSuite!.failed++;
      if (status === 'skipped' || status === 'pending') this.currentSuite!.skipped++;

      this.currentSuite!.tests.push({
        name: test.title,
        duration: test.duration || 0,
        status,
        retryCount: test.invocations || 1,
      });
    });

    this.suites.push(this.currentSuite);
  }

  onRunComplete(_testContexts: Set<TestContext>, results: AggregatedResult): void {
    const totalDuration = Date.now() - this.startTime;
    const totalMemory = process.memoryUsage().heapUsed - this.initialMemory;

    this.printSummary(results);
    this.printPerformanceReport();
    this.printSlowTests();
    this.printMemoryReport();
    this.printRecommendations(results);

    this.writeJsonReport(results, totalDuration, totalMemory);
  }

  private printSummary(results: AggregatedResult): void {
    console.log('\n📊 Test Summary');
    console.log('-'.repeat(80));
    console.log(`Total Suites:    ${this.suites.length}`);
    console.log(`Total Tests:     ${results.numTotalTests}`);
    console.log(`✅ Passed:        ${results.numPassedTests}`);
    console.log(`❌ Failed:        ${results.numFailedTests}`);
    console.log(`⏭️  Skipped:       ${results.numPendingTests}`);
    console.log(`⏱️  Total Time:    ${this.formatDuration(Date.now() - this.startTime)}`);
    console.log(`💾 Memory Used:   ${this.formatBytes(process.memoryUsage().heapUsed - this.initialMemory)}`);
  }

  private printPerformanceReport(): void {
    console.log('\n⚡ Performance Report');
    console.log('-'.repeat(80));

    const allTests = this.suites.flatMap(s => s.tests);
    if (allTests.length === 0) {
      console.log('No tests to report.');
      return;
    }

    const avgDuration = allTests.reduce((sum, t) => sum + t.duration, 0) / allTests.length;
    const slowestTests = [...allTests].sort((a, b) => b.duration - a.duration).slice(0, 10);

    console.log(`Average Test Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`\nSlowest Tests:`);
    slowestTests.forEach((test, i) => {
      console.log(`  ${i + 1}. ${test.name}: ${this.formatDuration(test.duration)}`);
    });
  }

  private printSlowTests(): void {
    const slowTests = this.suites
      .flatMap(s => s.tests)
      .filter(t => t.duration > this.options.slowThreshold!);

    if (slowTests.length > 0) {
      console.log(`\n🐌 Slow Tests (>${this.options.slowThreshold}ms)`);
      console.log('-'.repeat(80));
      slowTests.forEach(test => {
        console.log(`  ⚠️  ${test.name}: ${this.formatDuration(test.duration)}`);
      });
    }
  }

  private printMemoryReport(): void {
    console.log('\n💾 Memory Report');
    console.log('-'.repeat(80));

    const memUsage = process.memoryUsage();
    console.log(`Heap Used:  ${this.formatBytes(memUsage.heapUsed)}`);
    console.log(`Heap Total: ${this.formatBytes(memUsage.heapTotal)}`);
    console.log(`RSS:        ${this.formatBytes(memUsage.rss)}`);
    console.log(`External:   ${this.formatBytes(memUsage.external)}`);
  }

  private printRecommendations(results: AggregatedResult): void {
    console.log('\n💡 Recommendations');
    console.log('-'.repeat(80));

    const allTests = this.suites.flatMap(s => s.tests);
    const slowTests = allTests.filter(t => t.duration > this.options.slowThreshold!);
    const flakyTests = allTests.filter(t => t.retryCount > 1);

    if (slowTests.length > 0) {
      console.log(`• ${slowTests.length} tests are slow. Consider optimizing or moving to E2E suite.`);
    }

    if (flakyTests.length > 0) {
      console.log(`• ${flakyTests.length} tests needed retries. Investigate flakiness.`);
    }

    if (results.numFailedTests > 0) {
      console.log(`• ${results.numFailedTests} tests failed. See details above.`);
    }

    if (slowTests.length === 0 && flakyTests.length === 0 && results.numFailedTests === 0) {
      console.log('• All tests passed! Great job! 🎉');
    }
  }

  private writeJsonReport(results: AggregatedResult, totalDuration: number, totalMemory: number): void {
    const fs = require('fs');
    const path = require('path');

    const reportPath = this.options.outputPath!;
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: this.suites.length,
        totalTests: results.numTotalTests,
        passed: results.numPassedTests,
        failed: results.numFailedTests,
        skipped: results.numPendingTests,
        duration: totalDuration,
        memory: totalMemory,
      },
      suites: this.suites,
      performance: {
        averageTestTime: this.calculateAverageTestTime(),
        slowestTests: this.getSlowestTests(10),
      },
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        rss: process.memoryUsage().rss,
      },
    };

    fs.writeFileSync(
      path.join(reportPath, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  private calculateAverageTestTime(): number {
    const allTests = this.suites.flatMap(s => s.tests);
    if (allTests.length === 0) return 0;
    return allTests.reduce((sum, t) => sum + t.duration, 0) / allTests.length;
  }

  private getSlowestTests(count: number): TestMetrics[] {
    const allTests = this.suites.flatMap(s => s.tests);
    return [...allTests].sort((a, b) => b.duration - a.duration).slice(0, count);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
