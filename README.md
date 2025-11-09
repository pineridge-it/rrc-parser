
# DAF420 Parser - TypeScript Edition

A fully-typed TypeScript implementation of the DAF420 permit parser, providing enhanced type safety, modern best practices, and comprehensive interfaces.

## 🎯 Overview

This TypeScript version maintains **100% functional compatibility** with the Python parser while offering:

- **Strong Type Safety** with TypeScript's strict mode enabled
- **Modern ES2020+ Features** including async/await and optional chaining
- **Comprehensive Interfaces** for all data structures
- **Enhanced IDE Support** with full IntelliSense and autocomplete
- **Improved Error Handling** with typed exceptions
- **Better Maintainability** through explicit type definitions

## 📦 Installation

```bash
npm install
```

## 🏗️ Building

```bash
# Build the project
npm run build

# Watch mode for development
npm run build:watch

# Clean build artifacts
npm run clean
```

## 🚀 Usage

### Command-Line Interface

```bash
# Basic usage
npm run parse -- -i input.dat -o output.csv

# With verbose logging
npm run parse -- -i input.dat -o output.csv -v

# Strict mode (fail on errors)
npm run parse -- -i input.dat -o output.csv --strict

# Custom config file
npm run parse -- -i input.dat -o output.csv -c custom_config.yaml
```

### Programmatic Usage

```typescript
import { Config, PermitParser, CSVExporter } from './src';

// Initialize with config
const config = new Config();
const parser = new PermitParser(config);

// Parse file
const { permits, stats } = await parser.parseFile('input.dat');

// Export to CSV
const exporter = new CSVExporter(config);
await exporter.export(permits, 'output.csv');

// Access statistics
console.log(`Permits parsed: ${stats.successfulPermits}`);
console.log(`Errors: ${stats.validationErrors}`);
```

## 📁 Project Structure

```
refactored_parser_ts/
├── src/
│   ├── types/              # TypeScript type definitions
│   │   ├── common.ts       # Common types and enums
│   │   ├── config.ts       # Configuration-related types
│   │   └── permit.ts       # Permit and record types
│   ├── models/             # Data models
│   │   ├── Permit.ts       # Permit class with typed fields
│   │   ├── ParseStats.ts   # Parsing statistics
│   │   └── ParsedRecord.ts # Individual record wrapper
│   ├── config/             # Configuration management
│   │   ├── Config.ts       # Main configuration manager
│   │   ├── RecordSchema.ts # Schema definitions
│   │   └── FieldSpec.ts    # Field specifications
│   ├── validators/         # Validation logic
│   │   └── Validator.ts    # Field validators
│   ├── parser/             # Core parsing engine
│   │   └── PermitParser.ts # State machine parser
│   ├── exporter/           # CSV export
│   │   └── CSVExporter.ts  # Export engine
│   ├── cli/                # Command-line interface
│   │   └── index.ts        # CLI entry point
│   ├── utils/              # Utility functions
│   │   └── typeConverters.ts # Date, int, float converters
│   └── index.ts            # Main export file
├── config.yaml             # Schema and lookup tables
├── tsconfig.json           # TypeScript configuration
├── package.json            # NPM dependencies
└── README.md               # This file
```

## 🔑 Key TypeScript Features

### Strong Typing

All data structures are strongly typed:

```typescript
interface PermitData {
  daroot: DaRootRecord | null;
  dapermit: DaPermitRecord | null;
  dafield: DaFieldRecord[];
  dalease: DaLeaseRecord[];
  // ... more typed fields
}

interface ParseStats {
  linesProcessed: number;
  recordsByType: Map<string, number>;
  validationErrors: number;
  // ... more typed fields
}
```

### Type-Safe Configuration

```typescript
interface FieldSpec {
  name: string;
  start: number;
  end: number;
  type: FieldType;
  required: boolean;
  validator?: ValidatorType;
}

type FieldType = 'str' | 'date' | 'int' | 'float';
type ValidatorType = 'county_code' | 'app_type' | 'well_type' | 'flag' | 'depth' | 'latitude' | 'longitude';
```

### Error Handling

```typescript
class ParseError extends Error {
  constructor(
    message: string,
    public readonly lineNumber: number,
    public readonly recordType?: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm test:watch
```

## 🔍 Linting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📊 Type Coverage

This project maintains 100% type coverage with:
- No implicit `any` types
- Strict null checks enabled
- All functions have explicit return types
- Full interface definitions for all data structures

## 🔄 Migration from Python

Key differences from the Python version:

| Python | TypeScript |
|--------|-----------|
| `Dict[str, Any]` | Typed interfaces |
| `@dataclass` | `class` with explicit types |
| `Optional[T]` | `T \| null` or `T \| undefined` |
| `List[T]` | `T[]` or `Array<T>` |
| `Counter` | `Map<string, number>` |
| `defaultdict` | `Map` with default values |

## 🎓 Advanced Usage

### Custom Validators

```typescript
class CustomValidator extends Validator {
  validateCustomField(value: string, context: string): boolean {
    // Your validation logic
    return true;
  }
}
```

### Extending Record Types

```typescript
interface CustomRecord extends BaseRecord {
  customField: string;
  customValue: number;
}
```

## 📝 Documentation

- **Type Definitions**: See `src/types/` for all interfaces and types
- **API Reference**: Generated from TSDoc comments
- **Examples**: See test files for usage examples

## 🤝 Contributing

1. Ensure all code is properly typed
2. Add TSDoc comments for public APIs
3. Run tests and linting before committing
4. Update type definitions as needed

## 📄 License

Same license as the original Python parser.

## 🙏 Credits

TypeScript port of the Python DAF420 parser, maintaining all functionality while adding comprehensive type safety.
