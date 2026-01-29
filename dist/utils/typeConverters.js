"use strict";
/**
 * Type conversion utilities for parsing field values
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDate = parseDate;
exports.parseIntValue = parseIntValue;
exports.parseFloatValue = parseFloatValue;
exports.parseNumeric = parseNumeric;
exports.extractField = extractField;
/**
 * Parse a date string in YYYYMMDD format to MM/DD/YYYY format
 * @param value - The date string to parse
 * @returns Formatted date string or null if invalid
 */
function parseDate(value) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '0000' || trimmed === '    ') {
        return null;
    }
    try {
        // Parse YYYYMMDD format
        const year = Number.parseInt(trimmed.substring(0, 4), 10);
        const month = Number.parseInt(trimmed.substring(4, 6), 10);
        const day = Number.parseInt(trimmed.substring(6, 8), 10);
        // Basic validation
        if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
            return null;
        }
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return null;
        }
        // Format as MM/DD/YYYY
        return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
    }
    catch (error) {
        return null;
    }
}
/**
 * Parse a string to integer
 * @param value - The string to parse
 * @returns Parsed integer or null if invalid
 */
function parseIntValue(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? null : parsed;
}
/**
 * Parse a string to float
 * @param value - The string to parse
 * @returns Parsed float or null if invalid
 */
function parseFloatValue(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const parsed = Number.parseFloat(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
}
/**
 * Parse a numeric value, handling special cases for coordinates
 * @param value - The string to parse
 * @param validatorName - The validator type (for coordinate handling)
 * @returns Parsed numeric value or null
 */
function parseNumeric(value, validatorName) {
    let trimmed = value.trim().replace(/\+/g, '');
    if (!trimmed) {
        return null;
    }
    // Handle longitude/latitude special format
    if (validatorName === 'longitude' || validatorName === 'latitude') {
        if (trimmed.includes('.')) {
            return parseFloatValue(trimmed);
        }
        const sign = trimmed.startsWith('-') ? -1 : 1;
        const digits = trimmed.replace(/^[+-]/, '');
        if (!/^\d+$/.test(digits)) {
            return null;
        }
        return sign * (Number.parseInt(digits, 10) / 1e7);
    }
    return parseFloatValue(trimmed);
}
/**
 * Extract a substring from a record, handling bounds checking
 * @param record - The full record string
 * @param start - Start position (0-based)
 * @param end - End position (exclusive)
 * @returns Extracted and trimmed string
 */
function extractField(record, start, end) {
    if (start >= record.length) {
        return '';
    }
    const actualEnd = Math.min(end, record.length);
    return record.substring(start, actualEnd).trimEnd();
}
//# sourceMappingURL=typeConverters.js.map