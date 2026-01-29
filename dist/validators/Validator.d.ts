/**
 * Validation logic for field values
 */
import { Config } from '../config';
import { ValidatorType } from '../types';
export declare class Validator {
    private config;
    private errors;
    private warnings;
    private lookupValidators;
    constructor(config: Config);
    /**
     * Build lookup validators based on configuration
     */
    private buildValidators;
    /**
     * Validate a field value
     * @param validatorName - The validator type
     * @param value - The value to validate
     * @param context - Context for error messages (e.g., line number)
     * @returns True if valid
     */
    validate(validatorName: ValidatorType, value: string, context?: string): boolean;
    /**
     * Validate a numeric range
     * @param validatorName - The validator name
     * @param value - The value to validate
     * @param context - Context for error messages
     * @returns True if valid
     */
    private validateRange;
    /**
     * Validate an operator number
     * @param value - The operator number to validate
     * @param context - Context for error messages
     * @returns True if valid
     */
    private validateOperatorNumber;
    /**
     * Add an error message
     * @param context - The context (e.g., line number)
     * @param message - The error message
     */
    private addError;
    /**
     * Add a warning message
     * @param context - The context (e.g., line number)
     * @param message - The warning message
     */
    private addWarning;
    /**
     * Get validation summary
     * @returns Summary object with error and warning counts
     */
    getSummary(): {
        errorCount: number;
        warningCount: number;
        errorsByType: Record<string, string[]>;
        warningsByType: Record<string, string[]>;
    };
    /**
     * Reset validation state
     */
    reset(): void;
    /**
     * Get all errors
     * @returns Map of context to error messages
     */
    getErrors(): Map<string, string[]>;
    /**
     * Get all warnings
     * @returns Map of context to warning messages
     */
    getWarnings(): Map<string, string[]>;
}
//# sourceMappingURL=Validator.d.ts.map