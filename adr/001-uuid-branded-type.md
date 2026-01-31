# ADR 001: UUID Branded Type

## Status

**Accepted**

## Context

The RRC Parser project uses UUIDs extensively across multiple modules for identifying entities such as permits, users, workspaces, alerts, and notifications. Initially, UUIDs were typed as plain `string` throughout the codebase:

```typescript
// Common pattern found in the codebase
type UUID = string;
```

This approach had several drawbacks:

1. **No Type Safety**: Any string could be passed where a UUID was expected
2. **Silent Failures**: Invalid UUID formats would only be caught at runtime
3. **Poor Documentation**: Function signatures didn't clearly indicate UUID requirements
4. **Refactoring Risk**: Changing UUID-related code was error-prone

## Decision

We decided to implement a **branded type pattern** for UUIDs:

```typescript
export type UUID = string & { __brand: 'UUID' };
```

This creates a nominal type that is distinct from `string` at compile time while having zero runtime overhead.

## Consequences

### Positive

1. **Compile-Time Type Safety**: The TypeScript compiler will reject plain strings where UUIDs are expected
   ```typescript
   function getPermit(id: UUID): Permit { }
   
   getPermit("invalid"); // ❌ Compile error
   getPermit(validUuid); // ✅ OK
   ```

2. **Self-Documenting Code**: Function signatures clearly indicate when a UUID is required

3. **Zero Runtime Cost**: The brand property is erased during compilation

4. **Refactoring Support**: IDE tooling can accurately find and update UUID usages

5. **Consistency**: Single source of truth for UUID type definition in `src/types/common.ts`

### Negative

1. **Type Casting Required**: When creating or receiving UUIDs, explicit casting is needed:
   ```typescript
   const id = crypto.randomUUID() as UUID;
   ```

2. **Learning Curve**: Developers unfamiliar with branded types need to understand the pattern

3. **Serialization**: When serializing to JSON, the brand is lost and must be re-cast on deserialization

## Alternatives Considered

### Option 1: Class-based UUID

```typescript
class UUID {
  constructor(private value: string) {}
  toString() { return this.value; }
}
```

**Rejected**: Adds runtime overhead and requires wrapping/unwrapping strings.

### Option 2: Validation Functions

```typescript
type UUID = string;
function isValidUUID(value: string): value is UUID { }
```

**Rejected**: Only provides runtime checking, not compile-time safety.

### Option 3: Nominal Types with Symbols

```typescript
declare const UUIDBrand: unique symbol;
type UUID = string & { [UUIDBrand]: true };
```

**Rejected**: More complex syntax with no additional benefit over the string brand pattern.

## Implementation

### Export Location

The UUID type is exported from `src/types/common.ts`:

```typescript
/**
 * Branded UUID type for compile-time type safety
 */
export type UUID = string & { __brand: 'UUID' };
```

### Usage Pattern

1. **Import the type**:
   ```typescript
   import { UUID } from './common';
   ```

2. **Create UUIDs**:
   ```typescript
   const newId: UUID = crypto.randomUUID() as UUID;
   ```

3. **Use in interfaces**:
   ```typescript
   interface AlertConfig {
     id: UUID;
     workspaceId: UUID;
   }
   ```

4. **Function parameters**:
   ```typescript
   async getById(id: UUID): Promise<AlertConfig | null>;
   ```

## Migration Strategy

Files that define their own `type UUID = string` should be migrated:

1. Remove local UUID type definition
2. Import from `./common` or `../types/common`
3. Add `as UUID` casts where UUIDs are created

Example migration:

```typescript
// Before
 type UUID = string;
interface AlertConfig { id: UUID; }
const config: AlertConfig = { id: crypto.randomUUID() };

// After
import { UUID } from './common';
interface AlertConfig { id: UUID; }
const config: AlertConfig = { id: crypto.randomUUID() as UUID };
```

## References

- [TypeScript Handbook: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [Nominal Typing Techniques in TypeScript](https://medium.com/@KevinBGreene/surviving-the-typescript-ecosystem-branding-and-type-tagging-6cf6e516523d)
- [TYPES.md - Project Type System Documentation](../TYPES.md)

## Decision Date

2026-01-31

## Decision Makers

- WhiteHill (Gemini)
- WildWaterfall (Kimi K2.5)
