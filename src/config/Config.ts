/**
 * Enhanced Config with validation
 * Location: src/config/Config.ts
 * 
 * REPLACE your existing Config.ts with this version
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
  IFieldSpec,
  FieldType
} from '../types';
import { RecordSchema } from './RecordSchema';
import { ConfigValidator } from './ConfigValidator';
import { ConfigurationError } from '../utils/ParseError';

export class Config {
  settings: ISettings;
  schemas: Map<string, RecordSchema>;
  lookupTables: LookupTables;
  validationRules: IValidationRules;
  
  private rawConfig: RawConfigData;
  
  constructor(configPath?: string) {
    const defaultConfigPath = path.join(__dirname, '../../config.yaml');
    const finalPath = configPath || defaultConfigPath;
    
    // Check if config file exists
    if (!fs.existsSync(finalPath)) {
      throw new ConfigurationError(
        `Configuration file not found: ${finalPath}`,
        []
      );
    }
    
    // Load YAML configuration
    let configContent: string;
    try {
      configContent = fs.readFileSync(finalPath, 'utf8');
    } catch (error) {
      throw new ConfigurationError(
        `Failed to read configuration file: ${finalPath}`,
        [error instanceof Error ? error.message : String(error)]
      );
    }
    
    // Parse YAML
    try {
      this.rawConfig = yaml.load(configContent) as RawConfigData;
    } catch (error) {
      throw new ConfigurationError(
        `Failed to parse YAML configuration: ${finalPath}`,
        [error instanceof Error ? error.message : String(error)]
      );
    }
    
    // Validate configuration
    const validation = ConfigValidator.validate(this.rawConfig);
    if (!validation.isValid) {
      throw new ConfigurationError(
        'Invalid configuration detected',
        validation.errors
      );
    }
    
    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('⚠️  Configuration warnings:');
      for (const warning of validation.warnings) {
        console.warn(`  - ${warning}`);
      }
    }
    
    // Initialize settings with defaults
    this.settings = {
      minRecordLength: 10,
      strictMode: false,
      encoding: 'latin1',
      ...this.rawConfig.settings
    };
    
    // Load schemas
    try {
      this.schemas = this.loadSchemas();
    } catch (error) {
      throw new ConfigurationError(
        'Failed to load schemas',
        [error instanceof Error ? error.message : String(error)]
      );
    }
    
    // Load lookup tables
    this.lookupTables = this.rawConfig.lookup_tables || {};
    
    // Load validation rules
    try {
      this.validationRules = this.loadValidationRules();
    } catch (error) {
      throw new ConfigurationError(
        'Failed to load validation rules',
        [error instanceof Error ? error.message : String(error)]
      );
    }
  }
  
  /**
   * Load schemas from raw configuration
   */
  private loadSchemas(): Map<string, RecordSchema> {
    const schemas = new Map<string, RecordSchema>();
    
    if (!this.rawConfig.schemas) {
      return schemas;
    }
    
    for (const [recordType, schemaData] of Object.entries(this.rawConfig.schemas)) {
      try {
        const fields: IFieldSpec[] = (schemaData.fields || []).map((fieldData: RawFieldData) => ({
          name: fieldData.name,
          start: fieldData.start,
          end: fieldData.end,
          type: (fieldData.type || 'string') as FieldType,
          required: fieldData.required || false,
          validator: fieldData.validator
        }));
        
        schemas.set(recordType, new RecordSchema({
          name: schemaData.name,
          expectedMinLength: schemaData.expected_min_length || null,
          storageKey: schemaData.storage_key || null,
          fields
        }));
      } catch (error) {
        throw new Error(
          `Failed to load schema for record type ${recordType}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    
    return schemas;
  }
  
  /**
   * Load validation rules from raw configuration
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
   */
  getSchema(recordType: string): RecordSchema | undefined {
    return this.schemas.get(recordType);
  }
  
  /**
   * Get a lookup table by name
   */
  getLookup(tableName: string): Record<string, string> {
    return this.lookupTables[tableName] || {};
  }
  
  /**
   * Get all schema names
   */
  getSchemaNames(): string[] {
    return Array.from(this.schemas.keys());
  }
  
  /**
   * Check if a record type is valid
   */
  isValidRecordType(recordType: string): boolean {
    return this.schemas.has(recordType);
  }
  
  /**
   * Get configuration summary
   */
  getSummary(): {
    schemasCount: number;
    lookupTablesCount: number;
    settings: ISettings;
  } {
    return {
      schemasCount: this.schemas.size,
      lookupTablesCount: Object.keys(this.lookupTables).length,
      settings: { ...this.settings }
    };
  }
  
  /**
   * Validate a specific lookup value
   */
  validateLookup(tableName: string, key: string): boolean {
    const table = this.lookupTables[tableName];
    return table ? key in table : false;
  }
}