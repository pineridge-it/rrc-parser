/**
 * Custom error types for better error handling
 * Location: src/utils/ParseError.ts
 */

/**
 * Error thrown during parsing operations
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly lineNumber: number,
    public readonly recordType?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ParseError';
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ParseError);
    }
  }
  
  toString(): string {
    let msg = `${this.name} at line ${this.lineNumber}`;
    if (this.recordType) {
      msg += ` (type: ${this.recordType})`;
    }
    msg += `: ${this.message}`;
    
    if (this.originalError) {
      msg += `\n  Caused by: ${this.originalError.message}`;
    }
    
    return msg;
  }
}

/**
 * Error thrown during validation
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly fieldName: string,
    public readonly value: string,
    public readonly context: string
  ) {
    super(message);
    this.name = 'ValidationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
  
  toString(): string {
    return `${this.name} [${this.context}] field '${this.fieldName}' = '${this.value}': ${this.message}`;
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly errors: string[]
  ) {
    super(message);
    this.name = 'ConfigurationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConfigurationError);
    }
  }
  
  toString(): string {
    let msg = `${this.name}: ${this.message}`;
    if (this.errors.length > 0) {
      msg += '\n' + this.errors.map(e => `  - ${e}`).join('\n');
    }
    return msg;
  }
}