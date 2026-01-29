/**
 * Custom error types for better error handling
 * Location: src/utils/ParseError.ts
 */
/**
 * Error thrown during parsing operations
 */
export declare class ParseError extends Error {
    readonly lineNumber: number;
    readonly recordType?: string | undefined;
    readonly originalError?: Error | undefined;
    constructor(message: string, lineNumber: number, recordType?: string | undefined, originalError?: Error | undefined);
    toString(): string;
}
/**
 * Error thrown during validation
 */
export declare class ValidationError extends Error {
    readonly fieldName: string;
    readonly value: string;
    readonly context: string;
    constructor(message: string, fieldName: string, value: string, context: string);
    toString(): string;
}
/**
 * Error thrown when configuration is invalid
 */
export declare class ConfigurationError extends Error {
    readonly errors: string[];
    constructor(message: string, errors: string[]);
    toString(): string;
}
//# sourceMappingURL=ParseError.d.ts.map