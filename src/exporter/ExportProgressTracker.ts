/**
 * Export Progress Tracker for Real-time Export Progress
 * Location: src/exporter/ExportProgressTracker.ts
 */

import {
  ExportProgress,
  ProgressCallback
} from './types';

export class ExportProgressTracker {
  private totalRows: number;
  private processedRows: number = 0;
  private startTime: Date;
  private status: ExportProgress['status'] = 'pending';
  private error?: string;
  private callback?: ProgressCallback;
  private lastUpdateTime: Date;
  private rowsSinceLastUpdate: number = 0;
  private updateIntervalMs: number;

  constructor(
    totalRows: number,
    callback?: ProgressCallback,
    updateIntervalMs: number = 100
  ) {
    this.totalRows = totalRows;
    this.callback = callback;
    this.updateIntervalMs = updateIntervalMs;
    this.startTime = new Date();
    this.lastUpdateTime = this.startTime;
  }

  start(): void {
    this.status = 'running';
    this.startTime = new Date();
    this.lastUpdateTime = this.startTime;
    this.emitProgress();
  }

  increment(count: number = 1): void {
    this.processedRows += count;
    this.rowsSinceLastUpdate += count;
    
    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - this.lastUpdateTime.getTime();
    
    if (timeSinceLastUpdate >= this.updateIntervalMs || this.processedRows >= this.totalRows) {
      this.emitProgress();
      this.lastUpdateTime = now;
      this.rowsSinceLastUpdate = 0;
    }
  }

  complete(): void {
    this.status = 'completed';
    this.processedRows = this.totalRows;
    this.emitProgress();
  }

  cancel(): void {
    this.status = 'cancelled';
    this.emitProgress();
  }

  fail(error: string): void {
    this.status = 'failed';
    this.error = error;
    this.emitProgress();
  }

  getProgress(): ExportProgress {
    const now = new Date();
    const elapsedMs = now.getTime() - this.startTime.getTime();
    
    let currentRate = 0;
    if (elapsedMs > 0) {
      currentRate = Math.round((this.processedRows / elapsedMs) * 1000);
    }

    let etaSeconds = 0;
    if (currentRate > 0 && this.processedRows < this.totalRows) {
      const remainingRows = this.totalRows - this.processedRows;
      etaSeconds = Math.round(remainingRows / currentRate);
    }

    let percentComplete = 0;
    if (this.totalRows > 0) {
      percentComplete = Math.round((this.processedRows / this.totalRows) * 100);
    }

    return {
      totalRows: this.totalRows,
      processedRows: this.processedRows,
      currentRate,
      etaSeconds,
      percentComplete,
      startTime: this.startTime,
      status: this.status,
      error: this.error
    };
  }

  private emitProgress(): void {
    if (this.callback) {
      this.callback(this.getProgress());
    }
  }

  formatProgressBar(width: number = 50): string {
    const progress = this.getProgress();
    const filledWidth = Math.round((progress.percentComplete / 100) * width);
    const emptyWidth = width - filledWidth;
    
    const filled = '■'.repeat(filledWidth);
    const empty = '─'.repeat(emptyWidth);
    
    const progressBar = `${filled}${empty}`;
    const percentStr = `${progress.percentComplete}%`.padStart(4);
    
    let statusLine = '';
    switch (progress.status) {
      case 'running':
        statusLine = `Exporting: ${progress.processedRows.toLocaleString()} / ${progress.totalRows.toLocaleString()} rows`;
        if (progress.currentRate > 0) {
          statusLine += ` (${progress.currentRate.toLocaleString()} rows/sec)`;
        }
        if (progress.etaSeconds > 0) {
          statusLine += `\nETA: ${this.formatDuration(progress.etaSeconds)}`;
        }
        break;
      case 'completed':
        statusLine = '✅ Export complete!';
        break;
      case 'cancelled':
        statusLine = '⏹️ Export cancelled';
        break;
      case 'failed':
        statusLine = `❌ Export failed: ${progress.error}`;
        break;
      case 'pending':
        statusLine = '⏳ Preparing export...';
        break;
      default:
        statusLine = `Status: ${progress.status}`;
    }

    return `${progressBar}  ${percentStr}\n\n${statusLine}`;
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      let result = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      if (remainingSeconds > 0) {
        result += ` ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
      }
      return result;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    let result = `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (remainingMinutes > 0) {
      result += ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
    return result;
  }

  static createSpinner(frames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']): () => string {
    let index = 0;
    return () => {
      const frame = frames[index];
      index = (index + 1) % frames.length;
      return frame ?? '';
    };
  }
}