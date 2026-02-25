/**
 * Configuration validation utility
 * Location: src/config/ConfigValidator.ts
 */

import { RawConfigData, RawSchemaData, RawFieldData, IValidationRules } from '../types';
import {
  ConfigUserError,
  ErrorCategory,
  UserError,
} from '../utils/UserError';
import { ErrorCodes, errorDocsUrl, ErrorCode } from '../utils/ErrorCodes';
import { AutoFixEngine } from '../utils/AutoFixEngine';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  userErrors: UserError[];
  userWarnings: UserError[];
}

export class ConfigValidator {
  /**
   * Validate the entire configuration – returns rich UserError instances
   * alongside backward-compatible string arrays.
   */
  static validate(config: RawConfigData): ValidationResult {
    const userErrors: UserError[] = [];
    const userWarnings: UserError[] = [];

    if (config.settings) {
      ConfigValidator.validateSettings(config.settings, userErrors, userWarnings);
    }
    if (config.schemas) {
      ConfigValidator.validateSchemas(config.schemas, userErrors, userWarnings);
    }
    if (config.lookup_tables) {
      ConfigValidator.validateLookupTables(config.lookup_tables, userErrors, userWarnings);
    }
    if (config.validation) {
      ConfigValidator.validateValidationRules(config.validation, userErrors, userWarnings);
    }

    return {
      isValid: userErrors.length === 0,
      errors: userErrors.map(e => e.message),
      warnings: userWarnings.map(e => e.message),
      userErrors,
      userWarnings,
    };
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private static err(
    code: ErrorCode,
    title: string,
    message: string,
    suggestion?: string,
    autoFixFn?: () => void,
    autoFixDesc?: string,
  ): ConfigUserError {
    return new ConfigUserError({
      code,
      category: ErrorCategory.CONFIGURATION,
      title,
      message,
      suggestion,
      learnMoreUrl: errorDocsUrl(code),
      autoFix: autoFixFn && autoFixDesc
        ? { description: autoFixDesc, apply: autoFixFn }
        : undefined,
    });
  }

  private static warn(
    code: ErrorCode,
    title: string,
    message: string,
    suggestion?: string,
    autoFixFn?: () => void,
    autoFixDesc?: string,
  ): ConfigUserError {
    return new ConfigUserError({
      code,
      category: ErrorCategory.CONFIGURATION,
      title,
      message,
      suggestion,
      learnMoreUrl: errorDocsUrl(code),
      autoFix: autoFixFn && autoFixDesc
        ? { description: autoFixDesc, apply: autoFixFn }
        : undefined,
    });
  }

  // ── settings ───────────────────────────────────────────────────────────────

  private static validateSettings(
    settings: Partial<{ minRecordLength?: number; encoding?: string; strictMode?: boolean }>,
    errors: UserError[],
    warnings: UserError[],
  ): void {
    if (settings.minRecordLength !== undefined) {
      if (typeof settings.minRecordLength !== 'number') {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_INVALID_MIN_LENGTH,
          'Invalid Configuration: minRecordLength',
          'settings.minRecordLength must be a number.',
          'Set minRecordLength to a positive integer, e.g. minRecordLength: 80',
        ));
      } else if (settings.minRecordLength < 1) {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_INVALID_MIN_LENGTH,
          'Invalid Configuration: minRecordLength',
          `settings.minRecordLength must be at least 1. Got: ${settings.minRecordLength}`,
          'Set a positive value such as minRecordLength: 1',
        ));
      }
    }

    if (settings.encoding !== undefined) {
      const validEncodings = ['utf8', 'latin1', 'ascii'];
      const deprecatedEncodings: Record<string, string> = { 'utf-8': 'utf8' };

      if (!validEncodings.includes(settings.encoding) && !(settings.encoding in deprecatedEncodings)) {
        const normalized = AutoFixEngine.normalizeEncoding(settings.encoding);
        const canAutoFix = normalized !== settings.encoding && validEncodings.includes(normalized);
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_INVALID_ENCODING,
          'Invalid Configuration: encoding',
          `The value "${settings.encoding}" is not a supported text encoding.`,
          `Use one of: ${validEncodings.join(', ')}`,
          canAutoFix ? () => { settings.encoding = normalized; } : undefined,
          canAutoFix ? `Change encoding "${settings.encoding}" → "${normalized}"` : undefined,
        ));
      } else if (settings.encoding in deprecatedEncodings) {
        const preferred = deprecatedEncodings[settings.encoding]!;
        warnings.push(ConfigValidator.warn(
          ErrorCodes.CFG_INVALID_ENCODING,
          'Deprecated encoding value',
          `settings.encoding "${settings.encoding}" is deprecated.`,
          `Prefer "${preferred}" instead.`,
          () => { settings.encoding = preferred; },
          `Change encoding "${settings.encoding}" → "${preferred}"`,
        ));
      }
    }

    if (settings.strictMode !== undefined && typeof settings.strictMode !== 'boolean') {
      errors.push(ConfigValidator.err(
        ErrorCodes.CFG_INVALID_STRICT_MODE,
        'Invalid Configuration: strictMode',
        'settings.strictMode must be a boolean (true or false).',
        'Set strictMode: true or strictMode: false',
      ));
    }
  }

  // ── schemas ────────────────────────────────────────────────────────────────

  private static validateSchemas(
    schemas: Record<string, RawSchemaData>,
    errors: UserError[],
    warnings: UserError[],
  ): void {
    for (const [recordType, schema] of Object.entries(schemas)) {
      const prefix = `schema[${recordType}]`;

      if (!/^\d{2}$/.test(recordType)) {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_INVALID_RECORD_TYPE,
          'Invalid Schema: record type format',
          `${prefix}: record type must be 2 digits, got: ${recordType}`,
          'Use a 2-digit record type code, e.g. "01", "12"',
        ));
      }

      if (!schema.name) {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_MISSING_SCHEMA_NAME,
          'Invalid Schema: missing name',
          `${prefix}: missing required field 'name'`,
          `Add a 'name' property to the ${recordType} schema`,
        ));
      }

      if (schema.expected_min_length !== undefined) {
        const len = schema.expected_min_length;
        if (typeof len !== 'number' || len < 0) {
          errors.push(ConfigValidator.err(
            ErrorCodes.CFG_GENERAL,
            'Invalid Schema: expected_min_length',
            `${prefix}.expected_min_length must be a non-negative number`,
            'Set expected_min_length to 0 or a positive integer',
          ));
        }
      }

      if (schema.fields) {
        ConfigValidator.validateFields(schema.fields, `${prefix}.fields`, errors, warnings);
      } else {
        warnings.push(ConfigValidator.warn(
          ErrorCodes.CFG_GENERAL,
          'Schema has no fields',
          `${prefix}: no fields defined`,
          'Add a fields array to the schema',
        ));
      }
    }
  }

  // ── fields ─────────────────────────────────────────────────────────────────

  private static validateFields(
    fields: unknown,
    prefix: string,
    errors: UserError[],
    warnings: UserError[],
  ): void {
    if (!Array.isArray(fields)) {
      errors.push(ConfigValidator.err(
        ErrorCodes.CFG_GENERAL,
        'Invalid Fields',
        `${prefix} must be an array`,
        'Define fields as a YAML array under the schema',
      ));
      return;
    }

    const fieldNames = new Set<string>();

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i] as RawFieldData;
      const fp = `${prefix}[${i}]`;

      if (!field.name) {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_MISSING_FIELD_NAME,
          'Invalid Field: missing name',
          `${fp}: missing required field 'name'`,
          'Add a name property to the field definition',
        ));
      } else {
        if (fieldNames.has(field.name)) {
          errors.push(ConfigValidator.err(
            ErrorCodes.CFG_GENERAL,
            'Invalid Field: duplicate name',
            `${fp}: duplicate field name '${field.name}'`,
            `Rename one of the '${field.name}' fields to a unique name`,
          ));
        }
        fieldNames.add(field.name);
      }

      if (field.start === undefined) {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_INVALID_FIELD_RANGE,
          'Invalid Field: missing start',
          `${fp}: missing required field 'start'`,
          'Add a start byte offset (0-indexed) to the field definition',
        ));
      } else if (typeof field.start !== 'number' || field.start < 0) {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_INVALID_FIELD_RANGE,
          'Invalid Field: start offset',
          `${fp}.start must be a non-negative number`,
          'Set start to 0 or a positive integer byte offset',
        ));
      }

      if (field.end === undefined) {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_INVALID_FIELD_RANGE,
          'Invalid Field: missing end',
          `${fp}: missing required field 'end'`,
          'Add an end byte offset (exclusive) to the field definition',
        ));
      } else if (typeof field.end !== 'number') {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_INVALID_FIELD_RANGE,
          'Invalid Field: end offset',
          `${fp}.end must be a number`,
          'Set end to a positive integer byte offset',
        ));
      }

      if (field.start !== undefined && field.end !== undefined && field.end <= field.start) {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_INVALID_FIELD_RANGE,
          'Invalid Field: end ≤ start',
          `${fp}: end (${field.end}) must be greater than start (${field.start})`,
          `Set end to at least ${(field.start as number) + 1}`,
        ));
      }

      if (field.type !== undefined) {
        const validTypes = ['str', 'date', 'int', 'float'];
        if (!validTypes.includes(field.type)) {
          errors.push(ConfigValidator.err(
            ErrorCodes.CFG_INVALID_FIELD_TYPE,
            'Invalid Field: unknown type',
            `${fp}.type must be one of: ${validTypes.join(', ')}. Got: ${field.type}`,
            `Change the type to one of: ${validTypes.join(', ')}`,
          ));
        }
      }

      if (field.validator !== undefined) {
        const validValidators = [
          'county_code', 'app_type', 'well_type', 'flag', 'depth',
          'latitude', 'longitude', 'operator_number', 'district',
        ];
        if (!validValidators.includes(field.validator)) {
          warnings.push(ConfigValidator.warn(
            ErrorCodes.CFG_GENERAL,
            'Unknown validator type',
            `${fp}.validator '${field.validator}' is not a known validator type`,
            `Use one of: ${validValidators.join(', ')}`,
          ));
        }
      }
    }

    const sortedFields = (fields as RawFieldData[])
      .filter((f): f is RawFieldData & { start: number; end: number } =>
        f.start !== undefined && f.end !== undefined
      )
      .sort((a, b) => a.start - b.start);

    for (let i = 0; i < sortedFields.length - 1; i++) {
      const current = sortedFields[i]!;
      const next = sortedFields[i + 1]!;
      if (current.end > next.start) {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_INVALID_FIELD_RANGE,
          'Invalid Field: overlapping ranges',
          `${prefix}: overlapping fields '${current.name}' (${current.start}-${current.end}) and '${next.name}' (${next.start}-${next.end})`,
          `Adjust the field ranges so '${current.name}' ends before '${next.name}' starts`,
        ));
      }
    }
  }

  // ── lookup tables ──────────────────────────────────────────────────────────

  private static validateLookupTables(
    lookupTables: Record<string, Record<string, unknown>>,
    errors: UserError[],
    warnings: UserError[],
  ): void {
    for (const [tableName, table] of Object.entries(lookupTables)) {
      if (typeof table !== 'object' || table === null) {
        errors.push(ConfigValidator.err(
          ErrorCodes.CFG_GENERAL,
          'Invalid Lookup Table',
          `lookup_tables.${tableName} must be an object`,
          `Define ${tableName} as a YAML mapping of code: description pairs`,
        ));
        continue;
      }

      if (Object.keys(table).length === 0) {
        warnings.push(ConfigValidator.warn(
          ErrorCodes.CFG_GENERAL,
          'Empty Lookup Table',
          `lookup_tables.${tableName} is empty`,
          `Add entries to lookup_tables.${tableName}`,
        ));
      }

      for (const [key, value] of Object.entries(table)) {
        if (typeof value !== 'string') {
          errors.push(ConfigValidator.err(
            ErrorCodes.CFG_GENERAL,
            'Invalid Lookup Value',
            `lookup_tables.${tableName}.${key} must be a string, got ${typeof value}`,
            `Change the value for key '${key}' to a quoted string`,
          ));
        }
      }
    }
  }

  // ── validation rules ───────────────────────────────────────────────────────

  private static validateValidationRules(
    validation: Partial<IValidationRules>,
    errors: UserError[],
    warnings: UserError[],
  ): void {
    if (validation.ranges) {
      for (const [name, range] of Object.entries(validation.ranges)) {
        const r = range;
        const p = `validation.ranges.${name}`;

        if (r.min === undefined) {
          errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid Range: missing min',
            `${p}: missing required field 'min'`, `Add min: <number> to the ${name} range`));
        } else if (typeof r.min !== 'number') {
          errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid Range: min type',
            `${p}.min must be a number`, 'Set min to a numeric value'));
        }

        if (r.max === undefined) {
          errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid Range: missing max',
            `${p}: missing required field 'max'`, `Add max: <number> to the ${name} range`));
        } else if (typeof r.max !== 'number') {
          errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid Range: max type',
            `${p}.max must be a number`, 'Set max to a numeric value'));
        }

        if (r.min !== undefined && r.max !== undefined && r.min >= r.max) {
          errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid Range: max ≤ min',
            `${p}: max must be greater than min`, `Set max to a value greater than ${r.min}`));
        }

        if (!r.description) {
          warnings.push(ConfigValidator.warn(ErrorCodes.CFG_GENERAL, 'Range missing description',
            `${p}: missing description field`, `Add description: "..." to the ${name} range`));
        }
      }
    }

    if (validation.flags) {
      const f = validation.flags;
      if (!f.valid_values) {
        errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid Flags: missing valid_values',
          'validation.flags: missing required field valid_values',
          'Add valid_values: [...] to the flags section'));
      } else if (!Array.isArray(f.valid_values)) {
        errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid Flags: valid_values type',
          'validation.flags.valid_values must be an array',
          'Define valid_values as a YAML list'));
      }
    }

    if (validation.operator_number) {
      const op = validation.operator_number;

      if (op.numeric_only !== undefined && typeof op.numeric_only !== 'boolean') {
        errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid operator_number: numeric_only',
          'validation.operator_number.numeric_only must be a boolean',
          'Set numeric_only: true or numeric_only: false'));
      }
      if (op.min_length !== undefined && (typeof op.min_length !== 'number' || op.min_length < 0)) {
        errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid operator_number: min_length',
          'validation.operator_number.min_length must be a non-negative number',
          'Set min_length to 0 or a positive integer'));
      }
      if (op.max_length !== undefined && (typeof op.max_length !== 'number' || op.max_length < 0)) {
        errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid operator_number: max_length',
          'validation.operator_number.max_length must be a non-negative number',
          'Set max_length to 0 or a positive integer'));
      }
      if (op.min_length !== undefined && op.max_length !== undefined && op.min_length > op.max_length) {
        errors.push(ConfigValidator.err(ErrorCodes.CFG_GENERAL, 'Invalid operator_number: length range',
          'validation.operator_number: max_length must be >= min_length',
          `Set max_length to at least ${op.min_length}`));
      }
    }
  }
}