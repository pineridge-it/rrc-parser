/**
 * Format Converters for Multiple Export Formats
 * Location: src/exporter/FormatConverter.ts
 */

import * as fs from 'fs';
import {
  ExportFormat,
  ExportOptions,
  ExportResult,
  ExportWarning,
  ProgressCallback,
  DEFAULT_EXPORT_OPTIONS
} from './types';
import { ExportProgressTracker } from './ExportProgressTracker';

export interface ConverterResult {
  success: boolean;
  outputPath: string;
  recordCount: number;
  warnings: ExportWarning[];
  error?: string;
}

export class FormatConverter {
  async convert(
    data: Record<string, unknown>[],
    outputPath: string,
    options: Partial<ExportOptions> = {},
    progressCallback?: ProgressCallback
  ): Promise<ConverterResult> {
    const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
    
    if (data.length === 0) {
      return {
        success: false,
        outputPath,
        recordCount: 0,
        warnings: [],
        error: 'No data to export'
      };
    }

    const tracker = new ExportProgressTracker(data.length, progressCallback);
    tracker.start();

    try {
      let result: ConverterResult;

      switch (opts.format) {
        case 'csv':
          result = await this.convertToCSV(data, outputPath, opts, tracker);
          break;
        case 'tsv':
          result = await this.convertToTSV(data, outputPath, opts, tracker);
          break;
        case 'json':
          result = await this.convertToJSON(data, outputPath, opts, tracker);
          break;
        case 'xlsx':
          result = await this.convertToExcel(data, outputPath, opts, tracker);
          break;
        default:
          throw new Error(`Unsupported format: ${opts.format}`);
      }

      tracker.complete();
      return result;
    } catch (error) {
      tracker.fail(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        outputPath,
        recordCount: tracker.getProgress().processedRows,
        warnings: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async convertToCSV(
    data: Record<string, unknown>[],
    outputPath: string,
    options: ExportOptions,
    tracker: ExportProgressTracker
  ): Promise<ConverterResult> {
    const warnings: ExportWarning[] = [];
    const delimiter = options.delimiter ?? ',';
    const includeHeaders = options.includeHeaders ?? true;

    const columns = Object.keys(data[0]);
    const rows: string[] = [];

    if (includeHeaders) {
      rows.push(columns.map(col => this.escapeCSVField(col, delimiter)).join(delimiter));
    }

    for (const record of data) {
      const row = columns.map(col => {
        const value = record[col];
        return this.escapeCSVField(this.formatValue(value, options), delimiter);
      });
      rows.push(row.join(delimiter));
      tracker.increment();
    }

    const content = this.applyEncoding(rows.join('\n'), options.encoding);
    await fs.promises.writeFile(outputPath, content, 'utf8');

    return {
      success: true,
      outputPath,
      recordCount: data.length,
      warnings
    };
  }

  private async convertToTSV(
    data: Record<string, unknown>[],
    outputPath: string,
    options: ExportOptions,
    tracker: ExportProgressTracker
  ): Promise<ConverterResult> {
    const tsvOptions = { ...options, delimiter: '\t' as const };
    return this.convertToCSV(data, outputPath, tsvOptions, tracker);
  }

  private async convertToJSON(
    data: Record<string, unknown>[],
    outputPath: string,
    options: ExportOptions,
    tracker: ExportProgressTracker
  ): Promise<ConverterResult> {
    const warnings: ExportWarning[] = [];
    const output: Record<string, unknown>[] = [];

    for (const record of data) {
      const formatted: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(record)) {
        formatted[key] = this.formatJsonValue(value, options);
      }
      output.push(formatted);
      tracker.increment();
    }

    let content: string;
    if (options.encoding === 'utf8-bom') {
      content = '\uFEFF' + JSON.stringify(output, null, 2);
    } else {
      content = JSON.stringify(output, null, 2);
    }

    await fs.promises.writeFile(outputPath, content, 'utf8');

    return {
      success: true,
      outputPath,
      recordCount: data.length,
      warnings
    };
  }

  private async convertToExcel(
    data: Record<string, unknown>[],
    outputPath: string,
    options: ExportOptions,
    tracker: ExportProgressTracker
  ): Promise<ConverterResult> {
    const warnings: ExportWarning[] = [];

    warnings.push({
      type: 'invalid_format',
      message: 'Excel export requires exceljs library - falling back to CSV format'
    });

    const csvOutputPath = outputPath.replace(/\.xlsx$/i, '.csv');
    const result = await this.convertToCSV(data, csvOutputPath, options, tracker);

    return {
      ...result,
      outputPath: csvOutputPath,
      warnings
    };
  }

  private escapeCSVField(value: string, delimiter: string): string {
    const needsQuote = value.includes(delimiter) || 
                       value.includes('"') || 
                       value.includes('\n') ||
                       value.includes('\r');

    if (needsQuote) {
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return value;
  }

  private formatValue(value: unknown, options: ExportOptions): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (value instanceof Date) {
      return this.formatDate(value, options.dateFormat);
    }

    if (Array.isArray(value)) {
      return value.map(v => this.formatValue(v, options)).join('; ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private formatJsonValue(value: unknown, options: ExportOptions): unknown {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return this.formatDate(value, options.dateFormat);
    }

    if (Array.isArray(value)) {
      return value.map(v => this.formatJsonValue(v, options));
    }

    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = this.formatJsonValue(v, options);
      }
      return result;
    }

    return value;
  }

  private formatDate(date: Date, format?: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
      case 'us':
        return `${month}/${day}/${year}`;
      case 'eu':
        return `${day}/${month}/${year}`;
      case 'iso':
        return `${year}-${month}-${day}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  private applyEncoding(content: string, encoding?: string): string {
    if (encoding === 'utf8-bom') {
      return '\uFEFF' + content;
    }
    return content;
  }

  static getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      csv: 'text/csv',
      tsv: 'text/tab-separated-values',
      json: 'application/json',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[format];
  }

  static getFileExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      csv: '.csv',
      tsv: '.tsv',
      json: '.json',
      xlsx: '.xlsx'
    };
    return extensions[format];
  }

  static getFormatFromFileExtension(filename: string): ExportFormat | null {
    const ext = filename.toLowerCase().split('.').pop();
    
    const formatMap: Record<string, ExportFormat> = {
      csv: 'csv',
      tsv: 'tsv',
      json: 'json',
      xlsx: 'xlsx'
    };

    return ext ? formatMap[ext] ?? null : null;
  }
}