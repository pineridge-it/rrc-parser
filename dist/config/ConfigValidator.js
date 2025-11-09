"use strict";
/**
 * Configuration validation utility
 * Location: src/config/ConfigValidator.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidator = void 0;
class ConfigValidator {
    /**
     * Validate the entire configuration
     */
    static validate(config) {
        const errors = [];
        const warnings = [];
        // Validate settings
        if (config.settings) {
            ConfigValidator.validateSettings(config.settings, errors, warnings);
        }
        // Validate schemas
        if (config.schemas) {
            ConfigValidator.validateSchemas(config.schemas, errors, warnings);
        }
        // Validate lookup tables
        if (config.lookup_tables) {
            ConfigValidator.validateLookupTables(config.lookup_tables, errors, warnings);
        }
        // Validate validation rules
        if (config.validation) {
            ConfigValidator.validateValidationRules(config.validation, errors, warnings);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate settings section
     */
    static validateSettings(settings, errors) {
        if (settings.minRecordLength !== undefined) {
            if (typeof settings.minRecordLength !== 'number') {
                errors.push('settings.minRecordLength must be a number');
            }
            else if (settings.minRecordLength < 1) {
                errors.push('settings.minRecordLength must be at least 1');
            }
        }
        if (settings.encoding !== undefined) {
            const validEncodings = ['utf8', 'latin1', 'ascii', 'utf-8'];
            if (!validEncodings.includes(settings.encoding)) {
                errors.push(`settings.encoding must be one of: ${validEncodings.join(', ')}. ` +
                    `Got: ${settings.encoding}`);
            }
        }
        if (settings.strictMode !== undefined && typeof settings.strictMode !== 'boolean') {
            errors.push('settings.strictMode must be a boolean');
        }
    }
    /**
     * Validate schemas section
     */
    static validateSchemas(schemas, errors) {
        for (const [recordType, schema] of Object.entries(schemas)) {
            const prefix = `schema[${recordType}]`;
            // Validate record type format
            if (!/^\d{2}$/.test(recordType)) {
                errors.push(`${prefix}: record type must be 2 digits, got: ${recordType}`);
            }
            // Validate schema has name
            if (!schema.name) {
                errors.push(`${prefix}: missing required field 'name'`);
            }
            // Validate expected_min_length if present
            if (schema.expected_min_length !== undefined) {
                const len = schema.expected_min_length;
                if (typeof len !== 'number' || len < 0) {
                    errors.push(`${prefix}.expected_min_length must be a non-negative number`);
                }
            }
            // Validate fields
            if (schema.fields) {
                ConfigValidator.validateFields(schema.fields, `${prefix}.fields`, errors, warnings);
            }
            else {
                warnings.push(`${prefix}: no fields defined`);
            }
        }
    }
    /**
     * Validate fields array
     */
    static validateFields(fields, prefix, errors) {
        if (!Array.isArray(fields)) {
            errors.push(`${prefix} must be an array`);
            return;
        }
        const fieldNames = new Set();
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const fieldPrefix = `${prefix}[${i}]`;
            // Check required properties
            if (!field.name) {
                errors.push(`${fieldPrefix}: missing required field 'name'`);
            }
            else {
                // Check for duplicate field names
                if (fieldNames.has(field.name)) {
                    errors.push(`${fieldPrefix}: duplicate field name '${field.name}'`);
                }
                fieldNames.add(field.name);
            }
            if (field.start === undefined) {
                errors.push(`${fieldPrefix}: missing required field 'start'`);
            }
            else if (typeof field.start !== 'number' || field.start < 0) {
                errors.push(`${fieldPrefix}.start must be a non-negative number`);
            }
            if (field.end === undefined) {
                errors.push(`${fieldPrefix}: missing required field 'end'`);
            }
            else if (typeof field.end !== 'number') {
                errors.push(`${fieldPrefix}.end must be a number`);
            }
            // Validate start < end
            if (field.start !== undefined && field.end !== undefined) {
                if (field.end <= field.start) {
                    errors.push(`${fieldPrefix}: end (${field.end}) must be greater than start (${field.start})`);
                }
            }
            // Validate type if present
            if (field.type !== undefined) {
                const validTypes = ['str', 'date', 'int', 'float'];
                if (!validTypes.includes(field.type)) {
                    errors.push(`${fieldPrefix}.type must be one of: ${validTypes.join(', ')}. ` +
                        `Got: ${field.type}`);
                }
            }
            // Validate validator if present
            if (field.validator !== undefined) {
                const validValidators = [
                    'county_code', 'app_type', 'well_type', 'flag', 'depth',
                    'latitude', 'longitude', 'operator_number', 'district'
                ];
                if (!validValidators.includes(field.validator)) {
                    warnings.push(`${fieldPrefix}.validator '${field.validator}' is not a known validator type`);
                }
            }
        }
        // Check for overlapping fields
        const sortedFields = [...fields]
            .filter(f => f.start !== undefined && f.end !== undefined)
            .sort((a, b) => a.start - b.start);
        for (let i = 0; i < sortedFields.length - 1; i++) {
            const current = sortedFields[i];
            const next = sortedFields[i + 1];
            if (current.end > next.start) {
                errors.push(`${prefix}: overlapping fields '${current.name}' ` +
                    `(${current.start}-${current.end}) and '${next.name}' ` +
                    `(${next.start}-${next.end})`);
            }
        }
    }
    /**
     * Validate lookup tables
     */
    static validateLookupTables(lookupTables, errors) {
        for (const [tableName, table] of Object.entries(lookupTables)) {
            if (typeof table !== 'object' || table === null) {
                errors.push(`lookup_tables.${tableName} must be an object`);
                continue;
            }
            const entries = Object.keys(table);
            if (entries.length === 0) {
                warnings.push(`lookup_tables.${tableName} is empty`);
            }
            // Validate all values are strings
            for (const [key, value] of Object.entries(table)) {
                if (typeof value !== 'string') {
                    errors.push(`lookup_tables.${tableName}.${key} must be a string, got ${typeof value}`);
                }
            }
        }
    }
    /**
     * Validate validation rules
     */
    static validateValidationRules(validation, errors) {
        // Validate ranges
        if (validation.ranges) {
            for (const [name, range] of Object.entries(validation.ranges)) {
                const r = range;
                const prefix = `validation.ranges.${name}`;
                if (r.min === undefined) {
                    errors.push(`${prefix}: missing required field 'min'`);
                }
                else if (typeof r.min !== 'number') {
                    errors.push(`${prefix}.min must be a number`);
                }
                if (r.max === undefined) {
                    errors.push(`${prefix}: missing required field 'max'`);
                }
                else if (typeof r.max !== 'number') {
                    errors.push(`${prefix}.max must be a number`);
                }
                if (r.min !== undefined && r.max !== undefined && r.min >= r.max) {
                    errors.push(`${prefix}: max must be greater than min`);
                }
                if (!r.description) {
                    warnings.push(`${prefix}: missing description field`);
                }
            }
        }
        // Validate flags
        if (validation.flags) {
            const f = validation.flags;
            if (!f.valid_values) {
                errors.push('validation.flags: missing required field valid_values');
            }
            else if (!Array.isArray(f.valid_values)) {
                errors.push('validation.flags.valid_values must be an array');
            }
        }
        // Validate operator_number
        if (validation.operator_number) {
            const op = validation.operator_number;
            if (op.numeric_only !== undefined && typeof op.numeric_only !== 'boolean') {
                errors.push('validation.operator_number.numeric_only must be a boolean');
            }
            if (op.min_length !== undefined && (typeof op.min_length !== 'number' || op.min_length < 0)) {
                errors.push('validation.operator_number.min_length must be a non-negative number');
            }
            if (op.max_length !== undefined && (typeof op.max_length !== 'number' || op.max_length < 0)) {
                errors.push('validation.operator_number.max_length must be a non-negative number');
            }
            if (op.min_length !== undefined && op.max_length !== undefined && op.min_length > op.max_length) {
                errors.push('validation.operator_number: max_length must be >= min_length');
            }
        }
    }
}
exports.ConfigValidator = ConfigValidator;
//# sourceMappingURL=ConfigValidator.js.map