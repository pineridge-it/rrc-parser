# Configuration Schema Documentation

## Overview

The `config.yaml` file defines how the DAF420 parser processes permit records. This document explains each configuration section and provides examples.

## Table of Contents

- [Settings](#settings)
- [Schemas](#schemas)
- [Lookup Tables](#lookup-tables)
- [Validation Rules](#validation-rules)
- [Complete Examples](#complete-examples)

---

## Settings

Global parser settings that affect behavior.

```yaml
settings:
  minRecordLength: 10      # Minimum record length in bytes
  strictMode: false        # Fail on any errors if true
  encoding: latin1         # File encoding: utf8, latin1, or ascii
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `minRecordLength` | number | 10 | Minimum bytes for a valid record |
| `strictMode` | boolean | false | Parser fails on any error |
| `encoding` | string | 'latin1' | Character encoding for input files |

---

## Schemas

Defines the structure of each record type (01-15).

### Schema Structure

```yaml
schemas:
  "01":                          # Record type (2 digits)
    name: DAROOT                 # Human-readable name
    expected_min_length: 127     # Expected minimum length
    storage_key: null            # Where to store in permit object
    fields:                      # Array of field definitions
      - name: permit_number      # Field name
        start: 112               # Start position (0-based)
        end: 119                 # End position (exclusive)
        type: str                # Data type: str, date, int, float
        required: true           # Must have a value
        validator: null          # Optional validator
```

### Field Types

| Type | Description | Example Input | Parsed Output |
|------|-------------|---------------|---------------|
| `str` | String (default) | `"SMITH 1"` | `"SMITH 1"` |
| `date` | Date in YYYYMMDD | `"20231015"` | `"10/15/2023"` |
| `int` | Integer | `"12345"` | `12345` |
| `float` | Decimal number | `"123.45"` | `123.45` |

### Storage Keys

Storage keys determine where records are stored in the permit object:

| Storage Key | Description | Cardinality |
|-------------|-------------|-------------|
| `null` | Root record (DAROOT, DAPERMIT) | Single |
| `dafield` | Field records | Array |
| `dalease` | Lease records | Array |
| `dasurvey` | Survey records | Array |
| `dacanres` | Restriction records | Array |
| `daareas` | Area records | Array |
| `daremarks` | Remark records | Array |
| `daareares` | Area restriction records | Array |
| `daaddress` | Address records | Array |
| `gis_surface` | Surface coordinates | Single |
| `gis_bottomhole` | Bottomhole coordinates | Single |

### Validators

Optional validators for field values:

| Validator | Description | Valid Values |
|-----------|-------------|--------------|
| `county_code` | Texas county codes | Lookup table |
| `app_type` | Application types | Lookup table |
| `well_type` | Well types | Lookup table |
| `flag` | Y/N/0/9 flags | Y, N, 0, 9, (space) |
| `depth` | Depth in feet | 0-10000 |
| `latitude` | Texas latitude | 25.0-37.0 |
| `longitude` | Texas longitude | -107.5 to -93.0 |
| `operator_number` | Operator ID | 5-6 digits |
| `district` | RRC district | No validation |

### Complete Schema Example

```yaml
schemas:
  "02":
    name: DAPERMIT
    expected_min_length: 510
    storage_key: null
    fields:
      - name: permit_number
        start: 2
        end: 9
        type: str
        required: true
        
      - name: total_depth
        start: 54
        end: 59
        type: int
        validator: depth
        
      - name: issued_date
        start: 129
        end: 137
        type: date
        
      - name: horizontal_flag
        start: 493
        end: 494
        type: str
        validator: flag
```

---

## Lookup Tables

Key-value mappings for code translation.

```yaml
lookup_tables:
  county_codes:
    "001": Anderson
    "003": Andrews
    "005": Angelina
    # ...
  
  app_type_codes:
    "01": Drill
    "02": Deepen (Below Casing)
    "04": Plug Back
    # ...
  
  well_type_codes:
    O: Oil
    G: Gas
    B: Oil & Gas
    I: Injection
```

### Usage in CSV Export

Lookup tables are used to translate codes to descriptions:

```typescript
// Input: county_code = "001"
// Output CSV: county_code = "001", county_name = "Anderson"

// Input: application_type = "01"  
// Output CSV: application_type = "01", app_type_desc = "Drill"
```

---

## Validation Rules

Define validation constraints for fields.

### Range Validation

For numeric fields with min/max bounds:

```yaml
validation:
  ranges:
    depth:
      min: 0
      max: 10000
      description: ft
      
    longitude:
      min: -107.5
      max: -93.0
      description: TX range
      
    latitude:
      min: 25.0
      max: 37.0
      description: TX range
```

### Flag Validation

Valid values for flag fields:

```yaml
validation:
  flags:
    valid_values: ["Y", "N", "0", "9", " "]
```

### Operator Number Validation

Rules for operator numbers:

```yaml
validation:
  operator_number:
    numeric_only: true    # Only digits allowed
    min_length: 5         # Minimum length
    max_length: 6         # Maximum length
```

---

## Complete Examples

### Minimal Configuration

```yaml
settings:
  minRecordLength: 10
  encoding: latin1

schemas:
  "01":
    name: DAROOT
    expected_min_length: 127
    fields:
      - name: permit_number
        start: 112
        end: 119
        type: str
        required: true
```

### Full Configuration with Validation

```yaml
settings:
  minRecordLength: 10
  strictMode: false
  encoding: latin1

schemas:
  "02":
    name: DAPERMIT
    expected_min_length: 510
    storage_key: null
    fields:
      - name: permit_number
        start: 2
        end: 9
        type: str
        required: true
        
      - name: county_code
        start: 11
        end: 14
        type: str
        validator: county_code
        
      - name: total_depth
        start: 54
        end: 59
        type: int
        validator: depth
        
      - name: issued_date
        start: 129
        end: 137
        type: date

lookup_tables:
  county_codes:
    "001": Anderson
    "003": Andrews

validation:
  ranges:
    depth:
      min: 0
      max: 10000
      description: ft
  
  flags:
    valid_values: ["Y", "N", "0", "9", " "]
  
  operator_number:
    numeric_only: true
    min_length: 5
    max_length: 6
```

---

## Adding New Record Types

To add a new record type:

1. **Identify the record type code** (e.g., "16")
2. **Add schema definition**:

```yaml
schemas:
  "16":
    name: NEWRECORD
    expected_min_length: 100
    storage_key: newrecord  # Add to StorageKey type in types/common.ts
    fields:
      - name: field1
        start: 2
        end: 10
        type: str
```

3. **Update TypeScript types** in `src/types/permit.ts`:

```typescript
export interface NewRecord extends RecordData {
  segment: string;
  field1?: string;
}

export interface PermitData {
  // ... existing fields
  newrecord: NewRecord[];  // Add new field
}
```

4. **Update Permit model** in `src/models/Permit.ts`:

```typescript
export class Permit implements PermitData {
  // ... existing fields
  newrecord: NewRecord[] = [];
}
```

---

## Validation and Schema Checking

The parser includes built-in configuration validation:

```typescript
// Automatically validates:
// - Required fields are present
// - Field positions don't overlap
// - Start < end for all fields
// - Valid types and validators
// - Lookup table structure

// To generate JSON Schema for IDE support:
npm run generate-schema
```

---

## Best Practices

1. **Always specify `required: true`** for key fields like permit_number
2. **Use validators** for fields with known valid ranges
3. **Document field positions** with comments in the YAML
4. **Test configuration changes** with a small sample file first
5. **Keep lookup tables alphabetically sorted** for maintainability
6. **Use meaningful field names** that match the source documentation

---

## Troubleshooting

### Common Configuration Errors

**Error: "Field end must be greater than start"**
- Check that `end` > `start` for all fields

**Error: "Overlapping fields"**
- Two fields have overlapping positions
- Check start/end values don't conflict

**Error: "Unknown validator type"**
- Validator name misspelled or not supported
- Check available validators list above

**Warning: "Field shorter than expected"**
- Input record is shorter than `expected_min_length`
- This is usually okay, just a warning

---

## Related Files

- **Configuration**: `config.yaml`
- **Schema Validation**: `src/config/ConfigValidator.ts`
- **Type Definitions**: `src/types/config.ts`
- **Parser Implementation**: `src/parser/PermitParser.ts`

---

## Additional Resources

- [TypeScript Architecture Documentation](ARCHITECTURE.md)
- [Main README](README.md)
- [Type Definitions](src/types/)