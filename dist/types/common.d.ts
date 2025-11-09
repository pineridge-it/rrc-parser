/**
 * Common type definitions used throughout the parser
 */
/**
 * Field data types supported by the parser
 */
export type FieldType = 'str' | 'date' | 'int' | 'float';
/**
 * Validator types for field validation
 */
export type ValidatorType = 'county_code' | 'app_type' | 'well_type' | 'flag' | 'depth' | 'latitude' | 'longitude' | 'operator_number' | 'district';
/**
 * Record types in the DAF420 format
 */
export declare enum RecordType {
    DAROOT = "01",
    DAPERMIT = "02",
    DAFIELD = "03",
    DALEASE = "04",
    DASURVEY = "05",
    DACANRES = "06",
    DAAREAS = "07",
    DAREMARKS = "08",
    DAAREARES = "09",
    DAADDRESS = "10",
    GIS_SURFACE = "14",
    GIS_BOTTOMHOLE = "15"
}
/**
 * Storage keys for different record types
 */
export type StorageKey = 'daroot' | 'dapermit' | 'dafield' | 'dalease' | 'dasurvey' | 'dacanres' | 'daareas' | 'daremarks' | 'daareares' | 'daaddress' | 'gis_surface' | 'gis_bottomhole';
/**
 * Generic record data structure
 */
export type RecordData = Record<string, string | number | null | undefined>;
/**
 * Validation result
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Range validation configuration
 */
export interface RangeValidation {
    min: number;
    max: number;
    description: string;
}
/**
 * Operator number validation configuration
 */
export interface OperatorNumberValidation {
    numeric_only: boolean;
    min_length: number;
    max_length: number;
}
/**
 * Flag validation configuration
 */
export interface FlagValidation {
    valid_values: string[];
}
/**
 * Logger interface
 */
export interface ILogger {
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
/**
 * Simple console logger implementation
 */
export declare class ConsoleLogger implements ILogger {
    private verbose;
    constructor(verbose?: boolean);
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
//# sourceMappingURL=common.d.ts.map