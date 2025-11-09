"use strict";
/**
 * Custom error types for better error handling
 * Location: src/utils/ParseError.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationError = exports.ValidationError = exports.ParseError = void 0;
/**
 * Error thrown during parsing operations
 */
class ParseError extends Error {
    constructor(message, lineNumber, recordType, originalError) {
        super(message);
        this.lineNumber = lineNumber;
        this.recordType = recordType;
        this.originalError = originalError;
        this.name = 'ParseError';
        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ParseError);
        }
    }
    toString() {
        let msg = `${this.name} at line ${this.lineNumber}`;
        if (this.recordType) {
            msg += ` (type: ${this.recordType})`;
        }
        msg += `: ${this.message}`;
        if (this.originalError) {
            msg += `\n  Caused by: ${this.originalError.message}`;
        }
        return msg;
    }
}
exports.ParseError = ParseError;
/**
 * Error thrown during validation
 */
class ValidationError extends Error {
    constructor(message, fieldName, value, context) {
        super(message);
        this.fieldName = fieldName;
        this.value = value;
        this.context = context;
        this.name = 'ValidationError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ValidationError);
        }
    }
    toString() {
        return `${this.name} [${this.context}] field '${this.fieldName}' = '${this.value}': ${this.message}`;
    }
}
exports.ValidationError = ValidationError;
/**
 * Error thrown when configuration is invalid
 */
class ConfigurationError extends Error {
    constructor(message, errors) {
        super(message);
        this.errors = errors;
        this.name = 'ConfigurationError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConfigurationError);
        }
    }
    toString() {
        let msg = `${this.name}: ${this.message}`;
        if (this.errors.length > 0) {
            msg += '\n' + this.errors.map(e => `  - ${e}`).join('\n');
        }
        return msg;
    }
}
exports.ConfigurationError = ConfigurationError;
//# sourceMappingURL=ParseError.js.map