"use strict";
/**
 * Main configuration manager class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const yaml = tslib_1.__importStar(require("js-yaml"));
const RecordSchema_1 = require("./RecordSchema");
class Config {
    constructor(configPath) {
        const defaultConfigPath = path.join(__dirname, '../../config.yaml');
        const finalPath = configPath || defaultConfigPath;
        // Load YAML configuration
        const configContent = fs.readFileSync(finalPath, 'utf8');
        this.rawConfig = yaml.load(configContent);
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
    loadSchemas() {
        const schemas = new Map();
        if (!this.rawConfig.schemas) {
            return schemas;
        }
        for (const [recordType, schemaData] of Object.entries(this.rawConfig.schemas)) {
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
        return schemas;
    }
    /**
     * Load validation rules from raw configuration
     * @returns Validation rules object
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
     * @param recordType - The record type code (e.g., '01', '02')
     * @returns Record schema or undefined
     */
    getSchema(recordType) {
        return this.schemas.get(recordType);
    }
    /**
     * Get a lookup table by name
     * @param tableName - The lookup table name
     * @returns Lookup table or empty object
     */
    getLookup(tableName) {
        return this.lookupTables[tableName] || {};
    }
    /**
     * Get all schema names
     * @returns Array of schema names
     */
    getSchemaNames() {
        return Array.from(this.schemas.keys());
    }
    /**
     * Check if a record type is valid
     * @param recordType - The record type to check
     * @returns True if valid
     */
    isValidRecordType(recordType) {
        return this.schemas.has(recordType);
    }
}
exports.Config = Config;
//# sourceMappingURL=Config.js.map