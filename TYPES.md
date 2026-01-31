# Type System Architecture

## Overview

This document describes the type system architecture for the RRC Parser project. It covers naming conventions, export patterns, UUID usage guidelines, and common type locations to help developers understand and maintain the type system.

## Table of Contents

- [UUID Type](#uuid-type)
- [Naming Conventions](#naming-conventions)
- [Export Patterns](#export-patterns)
- [Type Locations](#type-locations)
- [Common Types](#common-types)
- [Best Practices](#best-practices)

---

## UUID Type

### Branded Type Pattern

The project uses a **branded type pattern** for UUIDs to provide compile-time type safety:

```typescript
export type UUID = string & { __brand: 'UUID' };
```

### Rationale

This pattern provides several benefits:
1. **Type Safety**: Prevents accidental assignment of plain strings where UUIDs are expected
2. **Compile-time Checking**: Catches type mismatches at build time, not runtime
3. **Self-Documenting**: Makes the code's intent clear to readers
4. **Zero Runtime Cost**: The brand property is erased at compile time

### Usage Guidelines

#### Importing UUID

Always import UUID from the common types module:

```typescript
// ✅ Correct
import { UUID } from './common';

// ❌ Incorrect - Don't redefine
 type UUID = string;
```

#### Creating UUIDs

Use the standard Web Crypto API for generating UUIDs:

```typescript
const newId: UUID = crypto.randomUUID() as UUID;
```

#### Type Casting

When receiving UUIDs from external sources (APIs, databases), cast them appropriately:

```typescript
const permitId = data.permit_id as UUID;
```

### Files Using UUID

The UUID type is used across the following modules:

| Module | File | Usage |
|--------|------|-------|
| Transformer | `src/types/transformer.ts` | Raw permit IDs, match IDs |
| Rate Limiting | `src/types/rate-limiting.ts` | Rule alert counts mapping |
| Alerts | `src/lib/alerts/index.ts` | AOI IDs, workspace IDs |
| Notifications | `src/lib/notifications/index.ts` | Notification IDs, user IDs |
| Alert Config | `src/lib/alerts/AlertConfigService.ts` | Alert config IDs, history |

---

## Naming Conventions

### Interface Naming

- Use **PascalCase** for all type names
- Use descriptive names that indicate the purpose

```typescript
// ✅ Correct
export interface PermitRecord { }
export interface AlertConfiguration { }

// ❌ Incorrect
export interface permitRecord { }
export interface IAlertConfig { }  // Don't use Hungarian notation
```

### Type Aliases

- Use **PascalCase** for type aliases
- Prefer explicit types over `any`

```typescript
// ✅ Correct
export type FieldValidator = (value: unknown) => ValidationResult;
export type PermitId = UUID;

// ❌ Incorrect
export type fieldValidator = any;
```

### Generic Parameters

- Use single uppercase letters (T, K, V) for simple generics
- Use descriptive names for complex generics

```typescript
// ✅ Simple generics
export interface Container<T> { data: T; }

// ✅ Complex generics
export interface ApiResponse<DataType, ErrorType> { }
```

---

## Export Patterns

### Barrel Exports

The `src/types/index.ts` serves as the barrel file for all types:

```typescript
export * from './common';
export * from './config';
export * from './operator';
// ... etc
```

### Selective Exports

When a module needs to control its public API, use selective exports:

```typescript
// Export everything
export * from './common';

// Export specific items
export { UUID, ILogger, ConsoleLogger } from './common';

// Re-export with alias
export { CleanPermit as Permit } from './loader';
```

### Internal vs Public Types

- **Public types**: Exported from `index.ts`, meant for external use
- **Internal types**: Not exported from barrel, module-private

```typescript
// Internal type - not exported from index.ts
interface InternalCacheEntry { }

// Public type - exported from index.ts
export interface PermitRecord { }
```

---

## Type Locations

### Core Types (`src/types/`)

| File | Purpose |
|------|---------|
| `common.ts` | Shared types: UUID, ILogger, RecordData, validation types |
| `config.ts` | Configuration interfaces and parser settings |
| `permit.ts` | Permit record types: DAROOT, DAPERMIT, DAFIELD, etc. |
| `operator.ts` | Operator-related types |
| `loader.ts` | Data loading and CleanPermit type |
| `transformer.ts` | Data transformation types |
| `fetcher.ts` | Data fetching interfaces |
| `workspace.ts` | Workspace management types |
| `watchlist.ts` | Watchlist and monitoring types |
| `analytics.ts` | Analytics and reporting types |
| `rate-limiting.ts` | Rate limiting configuration |
| `alert.ts` | Alert system types |
| `notification.ts` | Notification system types |
| `email.ts` | Email template types |
| `user.ts` | User management types |
| `backfill.ts` | Backfill operation types |
| `export.ts` | Data export types |
| `map.ts` | Map and geospatial types |
| `aoi.ts` | Area of Interest types |
| `saved-search.ts` | Saved search types |
| `usage.ts` | Usage tracking types |
| `logging.ts` | Logging and monitoring types |
| `alert-config.ts` | Alert configuration types |
| `operator-admin.ts` | Operator administration types |

### Library Types (`src/lib/`)

| File | Purpose |
|------|---------|
| `alerts/index.ts` | Alert engine types |
| `alerts/AlertConfigService.ts` | Alert configuration service types |
| `notifications/index.ts` | Notification service types |

---

## Common Types

### Validation Types

Located in `src/types/common.ts`:

```typescript
export type FieldType = 'string' | 'number' | 'int' | 'float' | 'date' | 'boolean' | 'flag';
export type ValidatorType = 'api_number' | 'permit_number' | 'operator_number' | ...;

export interface RangeValidation {
  min?: number;
  max?: number;
  message?: string;
}
```

### Logger Interface

```typescript
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
```

### Record Data

Base interface for all parsed records:

```typescript
export interface RecordData {
  [key: string]: string | number | boolean | null | undefined;
}
```

---

## Best Practices

### 1. Prefer Interfaces Over Type Aliases for Objects

```typescript
// ✅ Prefer interfaces - they're extensible
export interface UserConfig {
  name: string;
  enabled: boolean;
}

// ❌ Avoid for object shapes
export type UserConfig = {
  name: string;
  enabled: boolean;
};
```

### 2. Use Strict Null Checks

Enable `strictNullChecks` in tsconfig.json and handle null/undefined explicitly:

```typescript
// ✅ Handle null explicitly
function processPermit(permit: PermitRecord | null): void {
  if (!permit) {
    return;
  }
  // Process permit
}
```

### 3. Avoid `any` Type

```typescript
// ❌ Avoid any
function process(data: any): any { }

// ✅ Use unknown and type guards
function process(data: unknown): Result {
  if (isValidPermit(data)) {
    return transformPermit(data);
  }
  throw new Error('Invalid permit data');
}
```

### 4. Document Public Types

```typescript
/**
 * Represents a parsed permit record with validated fields.
 * This is the primary data structure used throughout the application.
 */
export interface CleanPermit {
  /** Unique identifier for the permit */
  id: UUID;
  
  /** API number assigned by regulatory authority */
  apiNumber: string;
  
  // ... etc
}
```

### 5. Use Discriminated Unions for Related Types

```typescript
export type AlertEvent = 
  | { type: 'created'; permitId: UUID; timestamp: Date }
  | { type: 'updated'; permitId: UUID; changes: string[]; timestamp: Date }
  | { type: 'deleted'; permitId: UUID; timestamp: Date };
```

---

## Migration Guide

### From String UUIDs to Branded UUIDs

1. Update imports:
   ```typescript
   import { UUID } from './common';
   ```

2. Replace type definitions:
   ```typescript
   // Before
   type UUID = string;
   
   // After - remove local definition, import from common
   ```

3. Add type casts where needed:
   ```typescript
   const id = crypto.randomUUID() as UUID;
   ```

---

## Related Documents

- [Architecture Decision Records](./adr/)
- [API Documentation](./docs/api.md)
- [Configuration Schema](./CONFIG_SCHEMA.md)

---

*Last updated: 2026-01-31*
