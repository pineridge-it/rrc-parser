/**
 * Configuration-related type definitions
 */
import { FieldType, ValidatorType, RangeValidation, OperatorNumberValidation, FlagValidation } from './common';
/**
 * Field specification interface
 */
export interface IFieldSpec {
    name: string;
    start: number;
    end: number;
    type: FieldType;
    required: boolean;
    validator?: ValidatorType;
}
/**
 * Record schema interface
 */
export interface IRecordSchema {
    name: string;
    expectedMinLength: number | null;
    storageKey: string | null;
    fields: IFieldSpec[];
}
/**
 * Parser settings
 */
export interface ISettings {
    minRecordLength: number;
    strictMode: boolean;
    encoding: string;
}
/**
 * Validation rules configuration
 */
export interface IValidationRules {
    ranges: Record<string, RangeValidation>;
    flags: Record<string, FlagValidation>;
    operator_number: OperatorNumberValidation;
}
/**
 * Lookup tables type
 */
export type LookupTables = Record<string, Record<string, string>>;
/**
 * Raw YAML configuration structure
 */
export interface RawConfigData {
    settings?: Partial<ISettings>;
    schemas?: Record<string, RawSchemaData>;
    lookup_tables?: LookupTables;
    validation?: Partial<IValidationRules>;
}
/**
 * Raw schema data from YAML
 */
export interface RawSchemaData {
    name: string;
    expected_min_length?: number;
    storage_key?: string;
    fields?: RawFieldData[];
}
/**
 * Raw field data from YAML
 */
export interface RawFieldData {
    name: string;
    start: number;
    end: number;
    type?: FieldType;
    required?: boolean;
    validator?: ValidatorType;
}
//# sourceMappingURL=config.d.ts.map