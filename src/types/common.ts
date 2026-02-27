/**
 * Branded UUID type for compile-time type safety
 */
export type UUID = string & { __brand: 'UUID' };

/**
 * UUID v4 format validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * ValidationError for validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Converts a string to a UUID branded type with runtime validation
 * Throws ValidationError if the string is not a valid UUID v4
 */
export function asUUID(value: string): UUID {
  if (!UUID_REGEX.test(value)) {
    throw new ValidationError(`Invalid UUID format: ${value}`);
  }
  return value.toLowerCase() as UUID;
}

/**
 * Safely parses a string to a UUID branded type
 * Returns null if the string is not a valid UUID v4
 */
export function parseUUID(value: string): UUID | null {
  if (!UUID_REGEX.test(value)) {
    return null;
  }
  return value.toLowerCase() as UUID;
}

/**
 * Common types used across the application
 */

/**
 * Field type for validation
 */
export type FieldType = 'string' | 'number' | 'int' | 'float' | 'date' | 'boolean' | 'flag';

/**
 * Validator type for field validation
 */
export type ValidatorType = 
  | 'api_number' 
  | 'permit_number' 
  | 'operator_number' 
  | 'county' 
  | 'district' 
  | 'date' 
  | 'depth' 
  | 'coordinate'
  | string;

/**
 * Range validation configuration
 */
export interface RangeValidation {
  min?: number;
  max?: number;
  message?: string;
  description?: string;
}

/**
 * Operator number validation configuration
 */
export interface OperatorNumberValidation {
  required?: boolean;
  allowWildcard?: boolean;
  message?: string;
  numeric_only?: boolean;
  min_length?: number;
  max_length?: number;
}

/**
 * Flag validation configuration
 */
export interface FlagValidation {
  validValues: string[];
  message?: string;
}

/**
 * Represents a raw record from the source file
 */
export interface RecordData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Console-based logger implementation
 */
export class ConsoleLogger implements ILogger {
  constructor(private verbose: boolean = false) {}

  debug(message: string): void {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  info(message: string): void {
    console.info(`[INFO] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

/**
 * Storage key type for checkpoint management
 */
export type StorageKey = string;
