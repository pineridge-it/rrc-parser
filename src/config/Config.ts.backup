
/**
 * Main configuration manager class
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { 
  ISettings, 
  IValidationRules, 
  LookupTables,
  RawConfigData,
  RawFieldData,
  IFieldSpec
} from '../types';
import { RecordSchema } from './RecordSchema';

export class Config {
  settings: ISettings;
  schemas: Map<string, RecordSchema>;
  lookupTables: LookupTables;
  validationRules: IValidationRules;
  
  private rawConfig: RawConfigData;
  
  constructor(configPath?: string) {
    const defaultConfigPath = path.join(__dirname, '../../config.yaml');
    const finalPath = configPath || defaultConfigPath;
    
    // Load YAML configuration
    const configContent = fs.readFileSync(finalPath, 'utf8');
    this.rawConfig = yaml.load(configContent) as RawConfigData;
    
    // Initialize settings with defaults
    this.settings = {
      minRecordLength: 10,
      strictMode: false,
      encoding: 'latin1',
      ...this.rawConfig.settings
    };
    
    // Load schemas
    this.schemas = this.loadSchemas();
    
    // Load lookup tables
    this.lookupTables = this.rawConfig.lookup_tables || {};
    
    // Load validation rules
    this.validationRules = this.loadValidationRules();
  }
  
  /**
   * Load schemas from raw configuration
   * @returns Map of record type to schema
   */
  private loadSchemas(): Map<string, RecordSchema> {
    const schemas = new Map<string, RecordSchema>();
    
    if (!this.rawConfig.schemas) {
      return schemas;
    }
    
    for (const [recordType, schemaData] of Object.entries(this.rawConfig.schemas)) {
      const fields: IFieldSpec[] = (schemaData.fields || []).map((fieldData: RawFieldData) => ({
        name: fieldData.name,
        start: fieldData.start,
        end: fieldData.end,
        type: fieldData.type || 'str',
        required: fieldData.required || false,
        validator: fieldData.validator
      }));
      
      schemas.set(recordType, new RecordSchema({
        name: schemaData.name,
        expectedMinLength: schemaData.expected_min_length || null,
        storageKey: schemaData.storage_key || null,
        fields
      }));
    }
    
    return schemas;
  }
  
  /**
   * Load validation rules from raw configuration
   * @returns Validation rules object
   */
  private loadValidationRules(): IValidationRules {
    const validation = this.rawConfig.validation || {};
    
    return {
      ranges: validation.ranges || {},
      flags: validation.flags || {},
      operator_number: validation.operator_number || {
        numeric_only: true,
        min_length: 5,
        max_length: 6
      }
    };
  }
  
  /**
   * Get a schema by record type
   * @param recordType - The record type code (e.g., '01', '02')
   * @returns Record schema or undefined
   */
  getSchema(recordType: string): RecordSchema | undefined {
    return this.schemas.get(recordType);
  }
  
  /**
   * Get a lookup table by name
   * @param tableName - The lookup table name
   * @returns Lookup table or empty object
   */
  getLookup(tableName: string): Record<string, string> {
    return this.lookupTables[tableName] || {};
  }
  
  /**
   * Get all schema names
   * @returns Array of schema names
   */
  getSchemaNames(): string[] {
    return Array.from(this.schemas.keys());
  }
  
  /**
   * Check if a record type is valid
   * @param recordType - The record type to check
   * @returns True if valid
   */
  isValidRecordType(recordType: string): boolean {
    return this.schemas.has(recordType);
  }
}
