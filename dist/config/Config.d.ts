/**
 * Enhanced Config with validation
 * Location: src/config/Config.ts
 *
 * REPLACE your existing Config.ts with this version
 */
import { ISettings, IValidationRules, LookupTables } from '../types';
import { RecordSchema } from './RecordSchema';
export declare class Config {
    settings: ISettings;
    schemas: Map<string, RecordSchema>;
    lookupTables: LookupTables;
    validationRules: IValidationRules;
    private rawConfig;
    constructor(configPath?: string);
    /**
     * Load schemas from raw configuration
     */
    private loadSchemas;
    /**
     * Load validation rules from raw configuration
     */
    private loadValidationRules;
    /**
     * Get a schema by record type
     */
    getSchema(recordType: string): RecordSchema | undefined;
    /**
     * Get a lookup table by name
     */
    getLookup(tableName: string): Record<string, string>;
    /**
     * Get all schema names
     */
    getSchemaNames(): string[];
    /**
     * Check if a record type is valid
     */
    isValidRecordType(recordType: string): boolean;
    /**
     * Get configuration summary
     */
    getSummary(): {
        schemasCount: number;
        lookupTablesCount: number;
        settings: ISettings;
    };
    /**
     * Validate a specific lookup value
     */
    validateLookup(tableName: string, key: string): boolean;
}
//# sourceMappingURL=Config.d.ts.map