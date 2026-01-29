/**
 * Performance monitoring utility
 * Location: src/utils/PerformanceMonitor.ts
 */
export declare class PerformanceMonitor {
    private metrics;
    private enabled;
    constructor(enabled?: boolean);
    /**
     * Time a synchronous operation
     */
    time<T>(label: string, fn: () => T): T;
    /**
     * Time an asynchronous operation
     */
    timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Manually start timing an operation
     */
    start(label: string): () => void;
    /**
     * Record a timing measurement
     */
    private recordTime;
    /**
     * Get performance report
     */
    getReport(): Record<string, {
        avg: string;
        max: string;
        min: string;
        total: string;
        count: number;
    }>;
    /**
     * Print performance report to console
     */
    printReport(): void;
    /**
     * Reset all metrics
     */
    reset(): void;
    /**
     * Enable or disable monitoring
     */
    setEnabled(enabled: boolean): void;
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map