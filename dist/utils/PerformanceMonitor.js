"use strict";
/**
 * Performance monitoring utility
 * Location: src/utils/PerformanceMonitor.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
class PerformanceMonitor {
    constructor(enabled = true) {
        this.metrics = new Map();
        this.enabled = true;
        this.enabled = enabled;
    }
    /**
     * Time a synchronous operation
     */
    time(label, fn) {
        if (!this.enabled)
            return fn();
        const start = performance.now();
        try {
            return fn();
        }
        finally {
            this.recordTime(label, performance.now() - start);
        }
    }
    /**
     * Time an asynchronous operation
     */
    async timeAsync(label, fn) {
        if (!this.enabled)
            return fn();
        const start = performance.now();
        try {
            return await fn();
        }
        finally {
            this.recordTime(label, performance.now() - start);
        }
    }
    /**
     * Manually start timing an operation
     */
    start(label) {
        if (!this.enabled)
            return () => { };
        const start = performance.now();
        return () => {
            this.recordTime(label, performance.now() - start);
        };
    }
    /**
     * Record a timing measurement
     */
    recordTime(label, duration) {
        const existing = this.metrics.get(label);
        if (existing) {
            this.metrics.set(label, {
                count: existing.count + 1,
                totalTime: existing.totalTime + duration,
                maxTime: Math.max(existing.maxTime, duration),
                minTime: Math.min(existing.minTime, duration)
            });
        }
        else {
            this.metrics.set(label, {
                count: 1,
                totalTime: duration,
                maxTime: duration,
                minTime: duration
            });
        }
    }
    /**
     * Get performance report
     */
    getReport() {
        const report = {};
        for (const [label, metrics] of this.metrics.entries()) {
            report[label] = {
                avg: `${(metrics.totalTime / metrics.count).toFixed(2)}ms`,
                max: `${metrics.maxTime.toFixed(2)}ms`,
                min: `${metrics.minTime.toFixed(2)}ms`,
                total: `${metrics.totalTime.toFixed(2)}ms`,
                count: metrics.count
            };
        }
        return report;
    }
    /**
     * Print performance report to console
     */
    printReport() {
        console.log('\n' + '='.repeat(80));
        console.log('PERFORMANCE REPORT');
        console.log('='.repeat(80));
        const report = this.getReport();
        const labels = Object.keys(report);
        if (labels.length === 0) {
            console.log('No metrics recorded');
            return;
        }
        // Find longest label for formatting
        const maxLabelLength = Math.max(...labels.map(l => l.length));
        for (const [label, metrics] of Object.entries(report)) {
            console.log(`${label.padEnd(maxLabelLength)} | ` +
                `Avg: ${metrics.avg.padStart(10)} | ` +
                `Max: ${metrics.max.padStart(10)} | ` +
                `Min: ${metrics.min.padStart(10)} | ` +
                `Total: ${metrics.total.padStart(10)} | ` +
                `Count: ${metrics.count}`);
        }
    }
    /**
     * Reset all metrics
     */
    reset() {
        this.metrics.clear();
    }
    /**
     * Enable or disable monitoring
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
//# sourceMappingURL=PerformanceMonitor.js.map