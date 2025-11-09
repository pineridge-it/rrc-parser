"use strict";
/**
 * Enhanced Config with validation
 * Location: src/config/Config.ts
 *
 * REPLACE your existing Config.ts with this version
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const yaml = tslib_1.__importStar(require("js-yaml"));
const RecordSchema_1 = require("./RecordSchema");
const ConfigValidator_1 = require("./ConfigValidator");
const ParseError_1 = require("../utils/ParseError");
class Config {
    constructor(configPath) {
        const defaultConfigPath = path.join(__dirname, '../../config.yaml');
        const finalPath = configPath || defaultConfigPath;
        // Check if config file exists
        if (!fs.existsSync(finalPath)) {
            throw new ParseError_1.ConfigurationError(`Configuration file not found: ${finalPath}`, []);
        }
        // Load YAML configuration
        let configContent;
        try {
            configContent = fs.readFileSync(finalPath, 'utf8');
        }
        catch (error) {
            throw new ParseError_1.ConfigurationError(`Failed to read configuration file: ${finalPath}`, [error instanceof Error ? error.message : String(error)]);
        }
        // Parse YAML
        try {
            this.rawConfig = yaml.load(configContent);
        }
        catch (error) {
            throw new ParseError_1.ConfigurationError(`Failed to parse YAML configuration: ${finalPath}`, [error instanceof Error ? error.message : String(error)]);
        }
        // Validate configuration
        const validation = ConfigValidator_1.ConfigValidator.validate(this.rawConfig);
        if (!validation.isValid) {
            throw new ParseError_1.ConfigurationError('Invalid configuration detected', validation.errors);
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
        }
        catch (error) {
            throw new ParseError_1.ConfigurationError('Failed to load schemas', [error instanceof Error ? error.message : String(error)]);
        }
        // Load lookup tables
        this.lookupTables = this.rawConfig.lookup_tables || {};
        // Load validation rules
        try {
            this.validationRules = this.loadValidationRules();
        }
        catch (error) {
            throw new ParseError_1.ConfigurationError('Failed to load validation rules', [error instanceof Error ? error.message : String(error)]);
        }
    }
    /**
     * Load schemas from raw configuration
     */
    loadSchemas() {
        const schemas = new Map();
        if (!this.rawConfig.schemas) {
            return schemas;
        }
        for (const [recordType, schemaData] of Object.entries(this.rawConfig.schemas)) {
            try {
                const fields = (schemaData.fields || []).map((fieldData) => ({
                    name: fieldData.name,
                    start: fieldData.start,
                    end: fieldData.end,
                    type: fieldData.type || 'str',
                    required: fieldData.required || false,
                    validator: fieldData.validator
                }));
                schemas.set(recordType, new RecordSchema_1.RecordSchema({
                    name: schemaData.name,
                    expectedMinLength: schemaData.expected_min_length || null,
                    storageKey: schemaData.storage_key || null,
                    fields
                }));
            }
            catch (error) {
                throw new Error(`Failed to load schema for record type ${recordType}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return schemas;
    }
    /**
     * Load validation rules from raw configuration
     */
    loadValidationRules() {
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
    getSchema(recordType) {
        return this.schemas.get(recordType);
    }
    /**
     * Get a lookup table by name
     */
    getLookup(tableName) {
        return this.lookupTables[tableName] || {};
    }
    /**
     * Get all schema names
     */
    getSchemaNames() {
        return Array.from(this.schemas.keys());
    }
    /**
     * Check if a record type is valid
     */
    isValidRecordType(recordType) {
        return this.schemas.has(recordType);
    }
    /**
     * Get configuration summary
     */
    getSummary() {
        return {
            schemasCount: this.schemas.size,
            lookupTablesCount: Object.keys(this.lookupTables).length,
            settings: { ...this.settings }
        };
    }
    /**
     * Validate a specific lookup value
     */
    validateLookup(tableName, key) {
        const table = this.lookupTables[tableName];
        return table ? key in table : false;
    }
}
exports.Config = Config;
//# sourceMappingURL=Config.js.map