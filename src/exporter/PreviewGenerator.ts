/**
 * Preview Generator for Export Experience
 * Location: src/exporter/PreviewGenerator.ts
 */

import {
  ExportPreview,
  ExportOptions,
  ExportWarning,
  ValidationResult,
  ValidationError,
  DEFAULT_EXPORT_OPTIONS
} from './types';

export class PreviewGenerator {
  private readonly defaultPreviewRows: number;

  constructor(previewRows: number = 3) {
    this.defaultPreviewRows = previewRows;
  }

  generatePreview(
    data: Record<string, unknown>[],
    outputPath: string,
    options: Partial<ExportOptions> = {}
  ): ExportPreview {
    const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
    const previewRows = opts.previewRows ?? this.defaultPreviewRows;
    
    const totalRows = data.length;
    const sampleRows = data.slice(0, previewRows);
    const columns = this.extractColumns(data);
    
    const warnings = this.generateWarnings(data, columns);
    const validation = this.validateData(data, columns);
    const estimatedSize = this.estimateFileSize(data, opts.format);

    return {
      outputPath,
      format: opts.format,
      encoding: opts.encoding ?? 'utf8',
      estimatedSize,
      totalRows,
      sampleRows,
      columns,
      warnings,
      validation
    };
  }

  private extractColumns(data: Record<string, unknown>[]): string[] {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }

  private generateWarnings(
    data: Record<string, unknown>[],
    columns: string[]
  ): ExportWarning[] {
    const warnings: ExportWarning[] = [];

    const missingCounts = this.countMissingValues(data, columns);
    for (const [field, count] of Object.entries(missingCounts)) {
      if (count > 0) {
        warnings.push({
          type: 'missing_data',
          message: `${count} permits missing ${field}`,
          count,
          field
        });
      }
    }

    const gisLat = columns.find(c => c.toLowerCase().includes('lat'));
    const gisLon = columns.find(c => c.toLowerCase().includes('lon'));
    if (gisLat && gisLon) {
      const missingGis = data.filter(
        row => !row[gisLat] || !row[gisLon]
      ).length;
      if (missingGis > 0) {
        const existingWarning = warnings.find(w => w.field === gisLat);
        if (!existingWarning) {
          warnings.push({
            type: 'missing_data',
            message: `${missingGis} permits missing GIS coordinates`,
            count: missingGis,
            field: 'gis_coordinates'
          });
        }
      }
    }

    return warnings;
  }

  private countMissingValues(
    data: Record<string, unknown>[],
    columns: string[]
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const col of columns) {
      counts[col] = data.filter(row => {
        const val = row[col];
        return val === null || val === undefined || val === '';
      }).length;
    }
    
    return counts;
  }

  private validateData(
    data: Record<string, unknown>[],
    columns: string[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ExportWarning[] = [];

    if (data.length === 0) {
      errors.push({
        type: 'constraint_violation',
        message: 'No data to export'
      });
    }

    for (let i = 0; i < Math.min(data.length, 100); i++) {
      const row = data[i];
      for (const col of columns) {
        const val = row[col];
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          warnings.push({
            type: 'invalid_format',
            message: `Row ${i + 1}: Field '${col}' contains nested object`,
            field: col
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private estimateFileSize(
    data: Record<string, unknown>[],
    format: string
  ): string {
    if (data.length === 0) return '0 B';

    const sampleRow = data[0];
    const sampleRowSize = JSON.stringify(sampleRow).length;
    const overheadFactor = format === 'json' ? 1.1 : 0.9;
    const estimatedBytes = Math.round(
      sampleRowSize * data.length * overheadFactor
    );

    return this.formatBytes(estimatedBytes);
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  formatPreviewTable(preview: ExportPreview): string {
    const lines: string[] = [];
    const border = '═'.repeat(80);

    lines.push(`╔${border}╗`);
    lines.push(`║  📊 Export Preview${' '.repeat(61)}║`);
    lines.push(`╚${border}╝`);
    lines.push('');
    lines.push(`Output file: ${preview.outputPath}`);
    lines.push(`Format: ${preview.format.toUpperCase()}`);
    lines.push(`Encoding: ${preview.encoding}`);
    lines.push(`Size estimate: ${preview.estimatedSize} (${preview.totalRows.toLocaleString()} rows)`);
    lines.push('');

    if (preview.sampleRows.length > 0) {
      lines.push('Sample Output (first ' + preview.sampleRows.length + ' rows):');
      lines.push(this.formatSampleRows(preview.sampleRows, preview.columns));
    }

    lines.push('');
    if (preview.validation.valid) {
      lines.push('✅ Validation: All fields mapped correctly');
    } else {
      lines.push('❌ Validation errors detected');
      preview.validation.errors.forEach(e => {
        lines.push(`   • ${e.message}`);
      });
    }

    if (preview.warnings.length > 0) {
      preview.warnings.forEach(w => {
        lines.push(`⚠️  Warning: ${w.message}`);
      });
    }

    return lines.join('\n');
  }

  private formatSampleRows(
    rows: Record<string, unknown>[],
    columns: string[]
  ): string {
    const displayCols = columns.slice(0, 5);
    const lines: string[] = [];
    
    const header = displayCols.map(c => c.padEnd(18)).join('│ ');
    const separator = '─'.repeat(header.length);
    
    lines.push(`┌${separator}┐`);
    lines.push(`│ ${header}│`);
    lines.push(`├${separator}┤`);
    
    for (const row of rows) {
      const values = displayCols.map(col => {
        const val = row[col];
        const str = val === null || val === undefined ? '' : String(val);
        return str.substring(0, 16).padEnd(18);
      });
      lines.push(`│ ${values.join('│ ')}│`);
    }
    
    lines.push(`└${separator}┘`);
    
    if (columns.length > 5) {
      lines.push(`... and ${columns.length - 5} more columns`);
    }

    return lines.join('\n');
  }
}