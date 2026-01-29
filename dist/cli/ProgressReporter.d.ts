/**
 * Progress reporting for CLI operations
 * Location: src/cli/ProgressReporter.ts
 */
import { ParseStats } from '../models';
export declare class ProgressReporter {
    private totalLines;
    private startTime;
    private lastUpdate;
    private updateInterval;
    private lastLine;
    constructor(totalLines: number);
    /**
     * Update progress display
     */
    update(currentLine: number, stats: ParseStats): void;
    /**
     * Display completion message
     */
    complete(stats: ParseStats, elapsed: number): void;
    /**
     * Display error message
     */
    error(message: string): void;
    /**
     * Build a visual progress bar
     */
    private buildProgressBar;
    /**
     * Format time duration nicely
     */
    private formatTime;
    /**
     * Create a spinner for indeterminate progress
     */
    static spinner(): {
        update: (message: string) => void;
        stop: () => void;
    };
}
/**
 * Simple logging with colors (if terminal supports it)
 */
export declare class Logger {
    private useColors;
    private colors;
    constructor(useColors?: boolean);
    private colorize;
    info(message: string): void;
    success(message: string): void;
    warning(message: string): void;
    error(message: string): void;
    debug(message: string): void;
}
//# sourceMappingURL=ProgressReporter.d.ts.map