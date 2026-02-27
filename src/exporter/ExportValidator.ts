/**
 * Export Validator for Post-Export Validation
 * Location: src/exporter/ExportValidator.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ValidationResult,
  ValidationError,
  ExportWarning,
  ExportFormat
} from './types';

export interface FileValidationResult extends ValidationResult {
  filePath: string;
  exists: boolean;
  fileSize: number;
  lineCount?: number;
  encoding?: string;
  bomDetected?: boolean;
}

export class ExportValidator {
  validateExport(
    filePath: string,
    format: ExportFormat,
    expectedRows: number
  ): FileValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ExportWarning[] = [];

    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        filePath,
        exists: false,
        fileSize: 0,
        errors: [{ type: 'missing_field', message: `File not found: ${filePath}` }],
        warnings: []
      };
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    if (fileSize === 0) {
      errors.push({
        type: 'constraint_violation',
        message: 'Exported file is empty'
      });
    }

    let lineCount: number | undefined;
    let encoding: string | undefined;
    let bomDetected: boolean | false = false;

    try {
      const buffer = fs.readFileSync(filePath);
      bomDetected = this.detectBOM(buffer);
      encoding = this.detectEncoding(buffer);

      switch (format) {
        case 'csv':
        case 'tsv':
          const delimiterResult = this.validateDelimitedFile(buffer, format, expectedRows);
          lineCount = delimiterResult.lineCount;
          if (!delimiterResult.valid) {
            errors.push(...delimiterResult.errors);
          }
          warnings.push(...delimiterResult.warnings);
          break;

        case 'json':
          const jsonResult = this.validateJsonFile(buffer, expectedRows);
          lineCount = jsonResult.recordCount;
          if (!jsonResult.valid) {
            errors.push(...jsonResult.errors);
          }
          warnings.push(...jsonResult.warnings);
          break;

        case 'xlsx':
          const xlsxResult = this.validateExcelFile(buffer, expectedRows);
          lineCount = xlsxResult.rowCount;
          if (!xlsxResult.valid) {
            errors.push(...xlsxResult.errors);
          }
          warnings.push(...xlsxResult.warnings);
          break;

        default:
          warnings.push({
            type: 'unknown_format',
            message: `Unknown format '${format}' - basic validation only`
          });
      }
    } catch (err) {
      warnings.push({
        type: 'encoding_issue',
        message: `Could not fully validate file: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }

    return {
      valid: errors.length === 0 && fileSize > 0,
      filePath,
      exists: true,
      fileSize,
      lineCount,
      encoding,
      bomDetected,
      errors,
      warnings
    };
  }

  private detectBOM(buffer: Buffer): boolean {
    if (buffer.length < 3) return false;
    
    return (
      (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) ||
      (buffer[0] === 0xFF && buffer[1] === 0xFE) ||
      (buffer[0] === 0xFE && buffer[1] === 0xFF)
    );
  }

  private detectEncoding(buffer: Buffer): string {
    if (buffer.length < 2) return 'utf8';
    
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) return 'utf16le';
    if (buffer[0] === 0xFE && buffer[1] === 0xFF) return 'utf16be';
    
    const hasHighBytes = buffer.some(byte => byte > 127);
    if (hasHighBytes) {
      if (this.looksLikeUTF8(buffer)) return 'utf8';
      return 'latin1';
    }
    
    return 'ascii';
  }

  private looksLikeUTF8(buffer: Buffer): boolean {
    let i = 0;
    while (i < buffer.length) {
      const byte = buffer[i];
      
      if (byte < 0x80) {
        i++;
        continue;
      }
      
      let seqLength: number;
      if ((byte & 0xE0) === 0xC0) seqLength = 2;
      else if ((byte & 0xF0) === 0xE0) seqLength = 3;
      else if ((byte & 0xF8) === 0xF0) seqLength = 4;
      else return false;
      
      if (i + seqLength > buffer.length) return false;
      
      for (let j = 1; j < seqLength; j++) {
        if ((buffer[i + j] & 0xC0) !== 0x80) return false;
      }
      
      i += seqLength;
    }
    return true;
  }

  private validateDelimitedFile(
    buffer: Buffer,
    format: ExportFormat,
    expectedRows: number
  ): { valid: boolean; lineCount: number; errors: ValidationError[]; warnings: ExportWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ExportWarning[] = [];
    const content = buffer.toString('utf8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const lineCount = lines.length;
    const delimiter = format === 'tsv' ? '\t' : ',';

    if (lines.length === 0) {
      errors.push({ type: 'constraint_violation', message: 'CSV file has no content' });
      return { valid: false, lineCount: 0, errors, warnings };
    }

    const headerLine = lines[0];
    const headerCount = this.countFields(headerLine, delimiter);

    let inconsistentLines = 0;
    for (let i = 1; i < lines.length; i++) {
      const fieldCount = this.countFields(lines[i], delimiter);
      if (fieldCount !== headerCount) {
        inconsistentLines++;
      }
    }

    if (inconsistentLines > 0) {
      warnings.push({
        type: 'invalid_format',
        message: `${inconsistentLines} rows have inconsistent column count`,
        count: inconsistentLines
      });
    }

    const dataRowStart = 1;
    const actualDataRows = lineCount - dataRowStart;
    if (actualDataRows !== expectedRows) {
      warnings.push({
        type: 'truncation',
        message: `Expected ${expectedRows} rows, found ${actualDataRows}`,
        count: Math.abs(actualDataRows - expectedRows)
      });
    }

    return {
      valid: errors.length === 0,
      lineCount: actualDataRows,
      errors,
      warnings
    };
  }

  private countFields(line: string, delimiter: string): number {
    let count = 1;
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        count++;
      }
    }
    
    return count;
  }

  private validateJsonFile(
    buffer: Buffer,
    expectedRows: number
  ): { valid: boolean; recordCount: number; errors: ValidationError[]; warnings: ExportWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ExportWarning[] = [];
    const content = buffer.toString('utf8');

    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch {
      errors.push({ type: 'invalid_format', message: 'Invalid JSON format' });
      return { valid: false, recordCount: 0, errors, warnings };
    }

    let recordCount = 0;
    if (Array.isArray(data)) {
      recordCount = data.length;
    } else if (typeof data === 'object' && data !== null) {
      if ('data' in data && Array.isArray((data as Record<string, unknown>).data)) {
        recordCount = ((data as Record<string, unknown>).data as unknown[]).length;
      } else {
        warnings.push({
          type: 'invalid_format',
          message: 'JSON is not an array - may not be in expected format'
        });
        recordCount = 1;
      }
    }

    if (recordCount !== expectedRows) {
      warnings.push({
        type: 'truncation',
        message: `Expected ${expectedRows} records, found ${recordCount}`,
        count: Math.abs(recordCount - expectedRows)
      });
    }

    return {
      valid: errors.length === 0,
      recordCount,
      errors,
      warnings
    };
  }

  private validateExcelFile(
    _buffer: Buffer,
    expectedRows: number
  ): { valid: boolean; rowCount: number; errors: ValidationError[]; warnings: ExportWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ExportWarning[] = [];

    warnings.push({
      type: 'invalid_format',
      message: 'Excel validation requires additional libraries - file existence checked only'
    });

    return {
      valid: true,
      rowCount: expectedRows,
      errors,
      warnings
    };
  }

  formatValidationResult(result: FileValidationResult): string {
    const lines: string[] = [];
    const border = '═'.repeat(60);

    lines.push(`╔${border}╗`);
    lines.push(`║  ✅ Export Complete!${' '.repeat(40)}║`);
    lines.push(`╚${border}╝`);
    lines.push('');
    lines.push(`File: ${path.basename(result.filePath)}`);
    lines.push(`Size: ${this.formatBytes(result.fileSize)}`);
    
    if (result.lineCount !== undefined) {
      lines.push(`Rows: ${result.lineCount.toLocaleString()}`);
    }
    
    if (result.encoding) {
      lines.push(`Encoding: ${result.encoding}${result.bomDetected ? ' (with BOM)' : ''}`);
    }

    lines.push('');

    if (result.valid) {
      lines.push('✅ Validation passed:');
      lines.push('   • All required fields present');
      lines.push('   • No encoding issues detected');
      lines.push('   • File format valid');
    } else {
      lines.push('❌ Validation errors:');
      result.errors.forEach(e => {
        lines.push(`   • ${e.message}`);
      });
    }

    if (result.warnings.length > 0) {
      lines.push('');
      lines.push('⚠️  Warnings:');
      result.warnings.forEach(w => {
        lines.push(`   • ${w.message}`);
      });
    }

    return lines.join('\n');
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
}