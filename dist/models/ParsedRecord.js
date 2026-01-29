"use strict";
/**
 * Parsed record wrapper class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsedRecord = void 0;
class ParsedRecord {
    constructor(segment, data, lineNumber) {
        this.segment = segment;
        this.data = data;
        this.lineNumber = lineNumber;
    }
    /**
     * Get a field value from the record data
     * @param fieldName - Name of the field
     * @returns Field value or undefined
     */
    getField(fieldName) {
        return this.data[fieldName];
    }
    /**
     * Convert to plain object
     * @returns Plain object representation
     */
    toObject() {
        return {
            segment: this.segment,
            data: this.data,
            lineNumber: this.lineNumber
        };
    }
}
exports.ParsedRecord = ParsedRecord;
//# sourceMappingURL=ParsedRecord.js.map