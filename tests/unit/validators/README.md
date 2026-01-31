# Validator Unit Tests

This directory contains comprehensive unit tests for the validation system, ensuring data integrity and business rule compliance for the RRC Permit Scraper.

## Test Structure

The tests are organized into four main categories:

1. `coordinate-validator.test.ts` - Tests for geographic coordinate validation
2. `date-validator.test.ts` - Tests for date validation and temporal consistency
3. `permit-validator.test.ts` - Tests for permit-specific validations (API numbers, depths, etc.)
4. `validation-report.test.ts` - Tests for the validation reporting system

## Test Fixtures

Test data is stored in `tests/fixtures/validators/` with the following structure:

```
tests/fixtures/validators/
├── coordinates/
│   ├── valid-texas-coords.json
│   ├── invalid-out-of-state.json
│   ├── edge-case-border.json
│   └── null-coordinates.json
├── dates/
│   ├── valid-date-ranges.json
│   ├── invalid-future-dates.json
│   ├── invalid-impossible-ranges.json
│   └── edge-case-leap-years.json
├── permits/
│   ├── valid-api-numbers.json
│   ├── invalid-api-numbers.json
│   ├── valid-depth-relationships.json
│   └── invalid-depth-relationships.json
└── cross-field/
    ├── valid-cross-field.json
    └── invalid-cross-field.json
```

## Key Validation Scenarios

### Coordinate Validation
- Texas boundary enforcement (latitude: 25.8-36.5, longitude: -106.6 to -93.5)
- Boundary edge cases
- Null coordinate handling
- Invalid out-of-state coordinates

### Date Validation
- Temporal consistency (issued date before expires date)
- Future date restrictions
- Invalid date format handling
- Leap year edge cases

### Permit Validation
- API number format validation (Texas state code 42)
- Depth relationship validation
- Numeric field validation
- Invalid format rejection

### Cross-Field Validation
- Geographic consistency (coordinates matching counties)
- Permit type and well type compatibility
- Operator and lease consistency

## Validation Rules

All validation rules are defined in the configuration and tested against real-world scenarios:

```typescript
const validationRules = {
  coordinates: {
    texasBounds: {
      lat: { min: 25.8, max: 36.5 },
      lng: { min: -106.6, max: -93.5 }
    }
  },
  apiNumber: {
    pattern: /^42-\d{3}-\d{5}$/
  },
  dates: {
    maxFutureDays: 0
  }
};
```

## Test Philosophy

Following the no-mocks principle, all tests use:
- Real data fixtures
- Actual validation logic
- No stubbed dependencies
- Deterministic test cases

Each validation rule has explicit test cases covering:
- Valid scenarios
- Invalid scenarios
- Edge cases
- Boundary conditions
- Error handling

## Performance Targets

- Individual validation operations: < 1ms
- Batch validation of 10k records: < 500ms
- Memory footprint: Minimal and stable

## Coverage Goals

- Branch coverage: ≥ 95%
- Edge case coverage: 100%
- Business rule coverage: 100%
- Error path coverage: 100%