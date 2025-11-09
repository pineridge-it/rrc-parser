"use strict";
/**
 * Record schema class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordSchema = void 0;
const FieldSpec_1 = require("./FieldSpec");
class RecordSchema {
    constructor(schema) {
        this.name = schema.name;
        this.expectedMinLength = schema.expectedMinLength;
        this.storageKey = schema.storageKey;
        this.fields = schema.fields.map(f => new FieldSpec_1.FieldSpec(f));
        // Validate all fields
        this.fields.forEach(field => field.validate());
    }
    /**
     * Parse a record string according to this schema
     * @param record - The record string to parse
     * @returns Parsed record data with segment name
     */
    parseRecord(record) {
        const data = {
            segment: this.name
        };
        for (const field of this.fields) {
            data[field.name] = field.extract(record);
        }
        return data;
    }
    /**
     * Get a field specification by name
     * @param fieldName - The field name
     * @returns Field specification or undefined
     */
    getField(fieldName) {
        return this.fields.find(f => f.name === fieldName);
    }
    /**
     * Check if this schema has a specific validator
     * @param validatorType - The validator type
     * @returns True if any field uses this validator
     */
    hasValidator(validatorType) {
        return this.fields.some(f => f.validator === validatorType);
    }
}
exports.RecordSchema = RecordSchema;
//# sourceMappingURL=RecordSchema.js.map