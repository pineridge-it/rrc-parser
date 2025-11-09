/**
 * Configuration validation utility
 * Location: src/config/ConfigValidator.ts
 */
import { RawConfigData } from '../types';
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare class ConfigValidator {
    /**
     * Validate the entire configuration
     */
    static validate(config: RawConfigData): ValidationResult;
    /**
     * Validate settings section
     */
    private static validateSettings;
    /**
     * Validate schemas section
     */
    private static validateSchemas;
    /**
     * Validate fields array
     */
    private static validateFields;
    /**
     * Validate lookup tables
     */
    private static validateLookupTables;
    /**
     * Validate validation rules
     */
    private static validateValidationRules;
}
//# sourceMappingURL=ConfigValidator.d.ts.map