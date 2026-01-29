"use strict";
/**
 * Progress reporting for CLI operations
 * Location: src/cli/ProgressReporter.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.ProgressReporter = void 0;
class ProgressReporter {
    constructor(totalLines) {
        this.totalLines = totalLines;
        this.lastUpdate = 0;
        this.updateInterval = 1000; // Update every second
        this.lastLine = '';
        this.startTime = Date.now();
    }
    /**
     * Update progress display
     */
    update(currentLine, stats) {
        const now = Date.now();
        // Don't update too frequently (performance)
        if (now - this.lastUpdate < this.updateInterval) {
            return;
        }
        this.lastUpdate = now;
        const elapsed = (now - this.startTime) / 1000;
        const progress = (currentLine / this.totalLines) * 100;
        const linesPerSec = currentLine / elapsed;
        const remainingLines = this.totalLines - currentLine;
        const eta = remainingLines / linesPerSec;
        // Build progress line
        const progressBar = this.buildProgressBar(progress, 30);
        const line = `${progressBar} ${progress.toFixed(1)}% | ` +
            `Lines: ${currentLine.toLocaleString()}/${this.totalLines.toLocaleString()} | ` +
            `Speed: ${linesPerSec.toFixed(0)}/s | ` +
            `ETA: ${this.formatTime(eta)} | ` +
            `Permits: ${stats.successfulPermits} | ` +
            `Errors: ${stats.malformedRecords}`;
        // Clear previous line and write new one
        if (this.lastLine) {
            process.stdout.write('\r' + ' '.repeat(this.lastLine.length) + '\r');
        }
        process.stdout.write(line);
        this.lastLine = line;
    }
    /**
     * Display completion message
     */
    complete(stats, elapsed) {
        // Clear progress line
        if (this.lastLine) {
            process.stdout.write('\r' + ' '.repeat(this.lastLine.length) + '\r');
        }
        const seconds = elapsed / 1000;
        const linesPerSec = stats.linesProcessed / seconds;
        console.log(`\n${'='.repeat(80)}`);
        console.log('✓ PARSING COMPLETE');
        console.log('='.repeat(80));
        console.log(`Time elapsed:      ${this.formatTime(seconds)}`);
        console.log(`Lines processed:   ${stats.linesProcessed.toLocaleString()}`);
        console.log(`Processing speed:  ${linesPerSec.toFixed(0)} lines/second`);
        console.log(`Permits parsed:    ${stats.successfulPermits.toLocaleString()}`);
        if (stats.malformedRecords > 0 || stats.orphanedRecords > 0) {
            console.log('\n' + '⚠️  Issues Detected:');
            if (stats.malformedRecords > 0) {
                console.log(`  Malformed records: ${stats.malformedRecords.toLocaleString()}`);
            }
            if (stats.orphanedRecords > 0) {
                console.log(`  Orphaned records:  ${stats.orphanedRecords.toLocaleString()}`);
                console.log(`    Recovered:       ${stats.recoveredRecords.toLocaleString()}`);
                console.log(`    Lost:            ${(stats.orphanedRecords - stats.recoveredRecords).toLocaleString()}`);
            }
        }
    }
    /**
     * Display error message
     */
    error(message) {
        // Clear progress line
        if (this.lastLine) {
            process.stdout.write('\r' + ' '.repeat(this.lastLine.length) + '\r');
        }
        console.error(`\n❌ ERROR: ${message}\n`);
    }
    /**
     * Build a visual progress bar
     */
    buildProgressBar(percent, width) {
        const filled = Math.floor((percent / 100) * width);
        const empty = width - filled;
        return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
    }
    /**
     * Format time duration nicely
     */
    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds.toFixed(0)}s`;
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        if (mins < 60) {
            return `${mins}m ${secs}s`;
        }
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hours}h ${remainingMins}m ${secs}s`;
    }
    /**
     * Create a spinner for indeterminate progress
     */
    static spinner() {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let currentFrame = 0;
        let lastMessage = '';
        let interval = null;
        const update = (message) => {
            lastMessage = message;
            if (!interval) {
                interval = setInterval(() => {
                    process.stdout.write(`\r${frames[currentFrame]} ${lastMessage}`);
                    currentFrame = (currentFrame + 1) % frames.length;
                }, 80);
            }
        };
        const stop = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
                // Clear spinner line
                process.stdout.write('\r' + ' '.repeat(lastMessage.length + 2) + '\r');
            }
        };
        return { update, stop };
    }
}
exports.ProgressReporter = ProgressReporter;
/**
 * Simple logging with colors (if terminal supports it)
 */
class Logger {
    constructor(useColors = true) {
        this.useColors = useColors;
        this.colors = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            gray: '\x1b[90m'
        };
        // Disable colors if not in TTY
        if (!process.stdout.isTTY) {
            this.useColors = false;
        }
    }
    colorize(text, color) {
        if (!this.useColors)
            return text;
        return `${this.colors[color]}${text}${this.colors.reset}`;
    }
    info(message) {
        console.log(`${this.colorize('ℹ', 'blue')} ${message}`);
    }
    success(message) {
        console.log(`${this.colorize('✓', 'green')} ${message}`);
    }
    warning(message) {
        console.warn(`${this.colorize('⚠', 'yellow')} ${message}`);
    }
    error(message) {
        console.error(`${this.colorize('✗', 'red')} ${message}`);
    }
    debug(message) {
        console.log(`${this.colorize('→', 'gray')} ${message}`);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=ProgressReporter.js.map