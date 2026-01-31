/**
 * Branded UUID type for compile-time type safety
 */
export type UUID = string & { __brand: 'UUID' };