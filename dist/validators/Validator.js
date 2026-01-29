"use strict";
/**
 * Validation logic for field values
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const utils_1 = require("../utils");
class Validator {
    constructor(config) {
        this.config = config;
        this.errors = new Map();
        this.warnings = new Map();
        this.lookupValidators = new Map();
        this.buildValidators();
    }
    /**
     * Build lookup validators based on configuration
     */
    buildValidators() {
        this.lookupValidators.set('county_code', (v) => v in this.config.getLookup('county_codes'));
        this.lookupValidators.set('app_type', (v) => v in this.config.getLookup('app_type_codes'));
        this.lookupValidators.set('well_type', (v) => v in this.config.getLookup('well_type_codes'));
        this.lookupValidators.set('flag', (v) => {
            const flagsConfig = this.config.validationRules.flags;
            const validValues = flagsConfig?.valid_values || [];
            return validValues.includes(v);
        });
    }
    /**
     * Validate a field value
     * @param validatorName - The validator type
     * @param value - The value to validate
     * @param context - Context for error messages (e.g., line number)
     * @returns True if valid
     */
    validate(validatorName, value, context = '') {
        if (!value) {
            return true;
        }
        // Lookup validators
        const lookupValidator = this.lookupValidators.get(validatorName);
        if (lookupValidator) {
            if (!lookupValidator(value)) {
                this.addWarning(context, `Invalid ${validatorName}: ${value}`);
                return false;
            }
            return true;
        }
        // Range validators
        if (validatorName in this.config.validationRules.ranges) {
            return this.validateRange(validatorName, value, context);
        }
        // Operator number validator
        if (validatorName === 'operator_number') {
            return this.validateOperatorNumber(value, context);
        }
        // District validator (always passes for now)
        if (validatorName === 'district') {
            return true;
        }
        return true;
    }
    /**
     * Validate a numeric range
     * @param validatorName - The validator name
     * @param value - The value to validate
     * @param context - Context for error messages
     * @returns True if valid
     */
    validateRange(validatorName, value, context) {
        const rangeConfig = this.config.validationRules.ranges[validatorName];
        if (!rangeConfig) {
            return true;
        }
        const { min, max, description } = rangeConfig;
        try {
            const num = (0, utils_1.parseNumeric)(value, validatorName);
            if (num === null) {
                return true;
            }
            if (num < min || num > max) {
                this.addWarning(context, `${validatorName} outside ${description}: ${num}`);
                return false;
            }
        }
        catch (error) {
            this.addError(context, `Invalid ${validatorName}: ${value} (${String(error)})`);
            return false;
        }
        return true;
    }
    /**
     * Validate an operator number
     * @param value - The operator number to validate
     * @param context - Context for error messages
     * @returns True if valid
     */
    validateOperatorNumber(value, context) {
        const rules = this.config.validationRules.operator_number;
        if (rules.numeric_only && !/^\d+$/.test(value)) {
            this.addWarning(context, `Invalid operator number: ${value}`);
            return false;
        }
        const minLen = rules.min_length || 0;
        const maxLen = rules.max_length || Infinity;
        if (value.length < minLen || value.length > maxLen) {
            this.addWarning(context, `Invalid operator number: ${value}`);
            return false;
        }
        return true;
    }
    /**
     * Add an error message
     * @param context - The context (e.g., line number)
     * @param message - The error message
     */
    addError(context, message) {
        const errors = this.errors.get(context) || [];
        errors.push(message);
        this.errors.set(context, errors);
    }
    /**
     * Add a warning message
     * @param context - The context (e.g., line number)
     * @param message - The warning message
     */
    addWarning(context, message) {
        const warnings = this.warnings.get(context) || [];
        warnings.push(message);
        this.warnings.set(context, warnings);
    }
    /**
     * Get validation summary
     * @returns Summary object with error and warning counts
     */
    getSummary() {
        return {
            errorCount: Array.from(this.errors.values()).reduce((sum, arr) => sum + arr.length, 0),
            warningCount: Array.from(this.warnings.values()).reduce((sum, arr) => sum + arr.length, 0),
            errorsByType: Object.fromEntries(this.errors),
            warningsByType: Object.fromEntries(this.warnings)
        };
    }
    /**
     * Reset validation state
     */
    reset() {
        this.errors.clear();
        this.warnings.clear();
    }
    /**
     * Get all errors
     * @returns Map of context to error messages
     */
    getErrors() {
        return new Map(this.errors);
    }
    /**
     * Get all warnings
     * @returns Map of context to warning messages
     */
    getWarnings() {
        return new Map(this.warnings);
    }
}
exports.Validator = Validator;
//# sourceMappingURL=Validator.js.map