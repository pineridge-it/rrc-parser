/**
 * Main configuration manager class
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
     * @returns Map of record type to schema
     */
    private loadSchemas;
    /**
     * Load validation rules from raw configuration
     * @returns Validation rules object
     */
    private loadValidationRules;
    /**
     * Get a schema by record type
     * @param recordType - The record type code (e.g., '01', '02')
     * @returns Record schema or undefined
     */
    getSchema(recordType: string): RecordSchema | undefined;
    /**
     * Get a lookup table by name
     * @param tableName - The lookup table name
     * @returns Lookup table or empty object
     */
    getLookup(tableName: string): Record<string, string>;
    /**
     * Get all schema names
     * @returns Array of schema names
     */
    getSchemaNames(): string[];
    /**
     * Check if a record type is valid
     * @param recordType - The record type to check
     * @returns True if valid
     */
    isValidRecordType(recordType: string): boolean;
}
//# sourceMappingURL=Config.d.ts.map