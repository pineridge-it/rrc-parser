/**
 * Rich Progress reporting for CLI operations
 * Location: src/cli/ProgressReporter.ts
 * 
 * IMPROVEMENTS:
 * - Smart ETA calculation with smoothing algorithm
 * - Throughput sparkline visualization
 * - Multi-line progress display without flickering
 * - Error-resilient progress (errors shown inline)
 * - Resume indication for checkpoint recovery
 * - Human-readable time formatting
 */

import { ParseStats } from '../models';

/**
 * Throughput sample for sparkline calculation
 */
interface ThroughputSample {
  timestamp: number;
  linesPerSecond: number;
}

/**
 * Error entry for inline error display
 */
interface ErrorEntry {
  lineNumber: number;
  message: string;
  timestamp: number;
}

/**
 * Resume information for checkpoint recovery
 */
interface ResumeInfo {
  resumedFromLine: number;
  timeSavedMs: number;
  originalStartLine: number;
}

/**
 * Rich progress reporter with visual enhancements
 */
export class RichProgressReporter {
  private startTime: number;
  private lastUpdate: number = 0;
  private updateInterval: number = 500; // Update every 500ms for smoother display
  private throughputHistory: ThroughputSample[] = [];
  private readonly maxThroughputHistory = 20;
  private errors: ErrorEntry[] = [];
  private readonly maxErrors = 3; // Show last 3 errors
  private resumeInfo?: ResumeInfo;
  private lastEtaSeconds: number = 0;
  private etaSmoothingFactor: number = 0.3; // EMA smoothing factor
  private isTTY: boolean;
  private linesWritten: number = 0;
  private operationName: string = 'Processing';
  
  constructor(
    private totalLines: number,
    private startLine: number = 0,
    resumeInfo?: { resumedFromLine: number; timeSavedMs: number; originalStartLine: number }
  ) {
    this.startTime = Date.now();
    this.isTTY = process.stdout.isTTY ?? false;
    
    if (resumeInfo) {
      this.resumeInfo = resumeInfo;
      this.operationName = 'Resuming Processing';
    }
  }
  
  /**
   * Set operation name displayed in header
   */
  setOperationName(name: string): void {
    this.operationName = name;
  }
  
  /**
   * Update progress display with rich visual feedback
   */
  update(currentLine: number, stats: ParseStats): void {
    const now = Date.now();
    
    // Don't update too frequently (performance)
    if (now - this.lastUpdate < this.updateInterval) {
      return;
    }
    
    this.lastUpdate = now;
    const elapsed = (now - this.startTime) / 1000;
    const progress = ((currentLine - this.startLine) / (this.totalLines - this.startLine)) * 100;
    const linesProcessed = currentLine - this.startLine;
    const linesPerSec = linesProcessed / elapsed;
    
    // Track throughput for sparkline
    this.addThroughputSample(now, linesPerSec);
    
    // Calculate smoothed ETA
    const remainingLines = this.totalLines - currentLine;
    const instantEta = linesPerSec > 0 ? remainingLines / linesPerSec : 0;
    this.lastEtaSeconds = this.smoothEta(instantEta);
    
    // Clear previous output
    this.clearDisplay();
    
    // Build and display rich progress output
    const output = this.buildRichOutput(currentLine, progress, linesPerSec, stats);
    process.stdout.write(output);
    this.linesWritten = output.split('\n').length - 1;
  }
  
  /**
   * Log an error without clearing progress display
   */
  logError(lineNumber: number, message: string): void {
    this.errors.push({
      lineNumber,
      message,
      timestamp: Date.now()
    });
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }
  
  /**
   * Display completion message with rich summary
   */
  complete(stats: ParseStats, elapsed: number): void {
    this.clearDisplay();
    
    const seconds = elapsed / 1000;
    const linesPerSec = stats.linesProcessed / seconds;
    
    // Build completion box
    const width = 70;
    const header = '✓ PARSING COMPLETE';
    const padding = Math.floor((width - header.length - 2) / 2);
    
    console.log('╔' + '═'.repeat(width) + '╗');
    console.log('║' + ' '.repeat(padding) + header + ' '.repeat(width - padding - header.length - 2) + '║');
    console.log('╚' + '═'.repeat(width) + '╝');
    console.log();
    
    // Stats in a nice format
    console.log(`  ⏱  Time elapsed:      ${this.formatDuration(seconds)}`);
    console.log(`  📄 Lines processed:   ${stats.linesProcessed.toLocaleString()}`);
    console.log(`  ⚡ Processing speed:  ${linesPerSec.toFixed(0)} lines/second`);
    console.log(`  ✅ Permits parsed:    ${stats.successfulPermits.toLocaleString()}`);
    
    if (stats.malformedRecords > 0 || stats.orphanedRecords > 0) {
      console.log();
      console.log('  ⚠️  Issues Detected:');
      if (stats.malformedRecords > 0) {
        console.log(`      Malformed records: ${stats.malformedRecords.toLocaleString()}`);
      }
      if (stats.orphanedRecords > 0) {
        console.log(`      Orphaned records:  ${stats.orphanedRecords.toLocaleString()}`);
        console.log(`        Recovered:       ${stats.recoveredRecords.toLocaleString()}`);
        console.log(`        Lost:            ${(stats.orphanedRecords - stats.recoveredRecords).toLocaleString()}`);
      }
    }
    
    if (this.resumeInfo) {
      console.log();
      console.log(`  ➡️  Resumed from checkpoint saved ${this.formatDuration(this.resumeInfo.timeSavedMs / 1000)}`);
    }
    
    console.log();
  }
  
  /**
   * Display error message
   */
  error(message: string): void {
    this.clearDisplay();
    console.error(`\n❌ ERROR: ${message}\n`);
  }
  
  /**
   * Clear the display for in-place updates
   */
  private clearDisplay(): void {
    if (!this.isTTY || this.linesWritten === 0) return;
    
    // Move cursor up and clear lines
    for (let i = 0; i < this.linesWritten; i++) {
      process.stdout.write('\x1b[1A\x1b[2K'); // Move up and clear line
    }
    process.stdout.write('\r');
  }
  
  /**
   * Build rich multi-line progress output
   */
  private buildRichOutput(
    currentLine: number,
    progress: number,
    linesPerSec: number,
    stats: ParseStats
  ): string {
    const lines: string[] = [];
    const width = 70;
    
    // Header with operation name
    const headerText = `📊 ${this.operationName}`;
    lines.push('╔' + '═'.repeat(width) + '╗');
    lines.push('║' + headerText.padEnd(width - 2) + '  ║');
    lines.push('╚' + '═'.repeat(width) + '╝');
    lines.push('');
    
    // Progress bar (full width)
    const progressBar = this.buildProgressBar(progress, width - 10);
    const percentStr = `${Math.min(100, progress).toFixed(1)}%`.padStart(6);
    lines.push(`${progressBar} ${percentStr}`);
    lines.push('');
    
    // ETA and speed
    const etaText = this.formatSmartEta(this.lastEtaSeconds);
    const speedText = `${linesPerSec.toFixed(0).toLocaleString()} lines/sec`;
    lines.push(`⏱  ${etaText} (${speedText})`);
    
    // Throughput sparkline
    const sparkline = this.buildSparkline();
    const sparklineLabel = this.getThroughputLabel(linesPerSec);
    lines.push(`📈 ${sparkline} (${sparklineLabel})`);
    lines.push('');
    
    // Stats summary
    const permits = stats.successfulPermits.toLocaleString().padStart(6);
    const errors = stats.malformedRecords.toLocaleString().padStart(4);
    const warnings = stats.validationWarnings.toLocaleString().padStart(4);
    lines.push(`   Permits: ${permits}  │  Errors: ${errors}  │  Warnings: ${warnings}`);
    
    // Resume indication
    if (this.resumeInfo) {
      lines.push('');
      const savedTime = this.formatDuration(this.resumeInfo.timeSavedMs / 1000);
      lines.push(`➡️  Resumed from line ${this.resumeInfo.resumedFromLine.toLocaleString()} (saved ${savedTime})`);
    }
    
    // Recent errors (if any)
    if (this.errors.length > 0) {
      lines.push('');
      lines.push('⚠️  Recent errors:');
      this.errors.slice(-2).forEach(err => {
        const truncatedMsg = err.message.length > 50 
          ? err.message.substring(0, 47) + '...' 
          : err.message;
        lines.push(`   Line ${err.lineNumber.toLocaleString()}: ${truncatedMsg}`);
      });
    }
    
    return lines.join('\n') + '\n';
  }
  
  /**
   * Build a visual progress bar
   */
  private buildProgressBar(percent: number, width: number): string {
    const filled = Math.floor((Math.min(100, percent) / 100) * width);
    const empty = width - filled;
    
    const filledChar = '■';
    const emptyChar = '□';
    
    return filledChar.repeat(filled) + emptyChar.repeat(empty);
  }
  
  /**
   * Add throughput sample for sparkline
   */
  private addThroughputSample(timestamp: number, linesPerSecond: number): void {
    this.throughputHistory.push({ timestamp, linesPerSecond });
    
    if (this.throughputHistory.length > this.maxThroughputHistory) {
      this.throughputHistory.shift();
    }
  }
  
  /**
   * Build sparkline from throughput history
   */
  private buildSparkline(): string {
    if (this.throughputHistory.length < 2) {
      return '▁'.repeat(10);
    }
    
    const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const values = this.throughputHistory.map(s => s.linesPerSecond);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    // Take last 10 samples for display
    const displayValues = values.slice(-10);
    
    return displayValues.map(v => {
      const normalized = (v - min) / range;
      const index = Math.floor(normalized * (sparkChars.length - 1));
      return sparkChars[Math.min(index, sparkChars.length - 1)];
    }).join('');
  }
  
  /**
   * Get throughput status label
   */
  private getThroughputLabel(linesPerSec: number): string {
    if (linesPerSec === 0) return 'stalled';
    if (linesPerSec < 100) return 'slow';
    if (linesPerSec < 500) return 'moderate';
    if (linesPerSec < 1000) return 'fast';
    return 'very fast';
  }
  
  /**
   * Smooth ETA using exponential moving average
   */
  private smoothEta(instantEta: number): number {
    if (this.lastEtaSeconds === 0) {
      return instantEta;
    }
    // EMA: new_value = alpha * instant + (1 - alpha) * previous
    return this.etaSmoothingFactor * instantEta + (1 - this.etaSmoothingFactor) * this.lastEtaSeconds;
  }
  
  /**
   * Format ETA with smart human-readable ranges
   */
  private formatSmartEta(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) {
      return 'Calculating...';
    }
    
    if (seconds < 30) {
      return 'Less than a minute remaining';
    }
    
    if (seconds < 90) {
      return 'About a minute remaining';
    }
    
    const mins = Math.round(seconds / 60);
    
    if (mins < 60) {
      // Add range for uncertainty: ±20%
      const minMins = Math.max(1, Math.floor(mins * 0.8));
      const maxMins = Math.ceil(mins * 1.2);
      
      if (minMins === maxMins) {
        return `About ${mins} minute${mins === 1 ? '' : 's'} remaining`;
      }
      return `${minMins}-${maxMins} minutes remaining`;
    }
    
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (remainingMins === 0) {
      return `About ${hours} hour${hours === 1 ? '' : 's'} remaining`;
    }
    
    return `About ${hours} hour${hours === 1 ? '' : 's'} ${remainingMins} min remaining`;
  }
  
  /**
   * Format duration in human-readable form
   */
  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    
    if (mins < 60) {
      if (secs === 0) {
        return `${mins} minute${mins === 1 ? '' : 's'}`;
      }
      return `${mins} minute${mins === 1 ? '' : 's'} ${secs} second${secs === 1 ? '' : 's'}`;
    }
    
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (remainingMins === 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    
    return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMins} minute${remainingMins === 1 ? '' : 's'}`;
  }
  
  /**
   * Create a spinner for indeterminate progress
   */
  static spinner(): { update: (message: string) => void; stop: () => void } {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let currentFrame = 0;
    let lastMessage = '';
    let interval: NodeJS.Timeout | null = null;
    
    const update = (message: string) => {
      lastMessage = message;
      if (!interval) {
        interval = setInterval(() => {
          process.stdout.write(
            `\r${frames[currentFrame]} ${lastMessage}`
          );
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

/**
 * Simple logging with colors (if terminal supports it)
 */
export class Logger {
  private colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
  };
  
  constructor(private useColors: boolean = true) {
    // Disable colors if not in TTY
    if (!process.stdout.isTTY) {
      this.useColors = false;
    }
  }
  
  private colorize(text: string, color: keyof typeof this.colors): string {
    if (!this.useColors) return text;
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }
  
  info(message: string): void {
    console.log(`${this.colorize('ℹ', 'blue')} ${message}`);
  }
  
  success(message: string): void {
    console.log(`${this.colorize('✓', 'green')} ${message}`);
  }
  
  warning(message: string): void {
    console.warn(`${this.colorize('⚠', 'yellow')} ${message}`);
  }
  
  error(message: string): void {
    console.error(`${this.colorize('✗', 'red')} ${message}`);
  }
  
  debug(message: string): void {
    console.log(`${this.colorize('→', 'gray')} ${message}`);
  }
}

/**
 * Legacy ProgressReporter for backward compatibility
 * @deprecated Use RichProgressReporter instead
 */
export class ProgressReporter extends RichProgressReporter {
  constructor(totalLines: number, startLine?: number) {
    super(totalLines, startLine);
    console.warn('ProgressReporter is deprecated. Use RichProgressReporter instead.');
  }
}
