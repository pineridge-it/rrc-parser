"use strict";
/**
 * Field specification class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldSpec = void 0;
const utils_1 = require("../utils");
class FieldSpec {
    constructor(spec) {
        this.name = spec.name;
        this.start = spec.start;
        this.end = spec.end;
        this.type = spec.type;
        this.required = spec.required;
        this.validator = spec.validator;
    }
    /**
     * Extract the field value from a record string
     * @param record - The full record string
     * @returns Extracted field value
     */
    extract(record) {
        return (0, utils_1.extractField)(record, this.start, this.end);
    }
    /**
     * Validate the field specification
     * @throws Error if invalid
     */
    validate() {
        if (this.start < 0) {
            throw new Error(`Field '${this.name}': start position cannot be negative`);
        }
        if (this.end <= this.start) {
            throw new Error(`Field '${this.name}': end position must be greater than start`);
        }
    }
}
exports.FieldSpec = FieldSpec;
//# sourceMappingURL=FieldSpec.js.map