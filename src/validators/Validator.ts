/**
 * Validation logic for field values
 */

import { Config } from '../config';
import { ValidatorType } from '../types';
import { parseNumeric } from '../utils';

export class Validator {
  private errors: Map<string, string[]> = new Map();
  private warnings: Map<string, string[]> = new Map();
  private lookupValidators: Map<string, (value: string) => boolean> = new Map();
  
  constructor(private config: Config) {
    this.buildValidators();
  }
  
  /**
   * Build lookup validators based on configuration
   */
  private buildValidators(): void {
    this.lookupValidators.set('county_code', (v: string) => 
      v in this.config.getLookup('county_codes')
    );
    
    this.lookupValidators.set('app_type', (v: string) => 
      v in this.config.getLookup('app_type_codes')
    );
    
    this.lookupValidators.set('well_type', (v: string) => 
      v in this.config.getLookup('well_type_codes')
    );
    
    this.lookupValidators.set('flag', (v: string) => {
      const flagsConfig = this.config.validationRules.flags as any;
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
  validate(validatorName: ValidatorType, value: string, context: string = ''): boolean {
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
  private validateRange(validatorName: string, value: string, context: string): boolean {
    const rangeConfig = this.config.validationRules.ranges[validatorName];
    if (!rangeConfig) {
      return true;
    }
    
    const { min, max, description } = rangeConfig;
    
    try {
      const num = parseNumeric(value, validatorName);
      
      if (num === null) {
        return true;
      }
      
      if (num < min || num > max) {
        this.addWarning(context, `${validatorName} outside ${description}: ${num}`);
        return false;
      }
    } catch (error) {
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
  private validateOperatorNumber(value: string, context: string): boolean {
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
  private addError(context: string, message: string): void {
    const errors = this.errors.get(context) || [];
    errors.push(message);
    this.errors.set(context, errors);
  }
  
  /**
   * Add a warning message
   * @param context - The context (e.g., line number)
   * @param message - The warning message
   */
  private addWarning(context: string, message: string): void {
    const warnings = this.warnings.get(context) || [];
    warnings.push(message);
    this.warnings.set(context, warnings);
  }
  
  /**
   * Get validation summary
   * @returns Summary object with error and warning counts
   */
  getSummary(): {
    errorCount: number;
    warningCount: number;
    errorsByType: Record<string, string[]>;
    warningsByType: Record<string, string[]>;
  } {
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
  reset(): void {
    this.errors.clear();
    this.warnings.clear();
  }
  
  /**
   * Get all errors
   * @returns Map of context to error messages
   */
  getErrors(): Map<string, string[]> {
    return new Map(this.errors);
  }
  
  /**
   * Get all warnings
   * @returns Map of context to warning messages
   */
  getWarnings(): Map<string, string[]> {
    return new Map(this.warnings);
  }
}
