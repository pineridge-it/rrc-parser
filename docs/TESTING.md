# Testing Guide

This guide explains how to set up and run tests for the RRC Permit Scraper application. It covers all testing types including unit tests, integration tests, and end-to-end tests.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Testing Infrastructure](#testing-infrastructure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Data Factories](#test-data-factories)
6. [Test Helpers](#test-helpers)
7. [Database Testing](#database-testing)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/parser/PermitParser.test.ts

# Run tests with coverage
npm test -- --coverage
```

---

## Testing Infrastructure

### Test Framework

The project uses **Jest** with **ts-jest** for TypeScript support:

- **Framework**: Jest 29.x
- **Test Environment**: Node.js (server), jsdom (frontend)
- **TypeScript**: ts-jest for type checking during tests
- **Test Data**: @faker-js/faker for realistic test data generation

### Project Structure

```
├── tests/
│   ├── unit/              # Unit tests (fast, isolated)
│   │   ├── parser/        # Parser unit tests
│   │   ├── qa/            # Quality assurance tests
│   │   ├── validators/    # Validation tests
│   │   └── reporters/     # Reporter tests
│   ├── integration/       # Integration tests (database, API)
│   │   ├── db/            # Database integration tests
│   │   ├── api/           # API client tests
│   │   └── etl/           # ETL pipeline tests
│   ├── e2e/               # End-to-end tests (full workflows)
│   │   ├── alerts/        # Alert workflow tests
│   │   ├── pipeline/      # Pipeline tests
│   │   └── web/           # Web app tests
│   ├── factories/         # Test data factories
│   ├── helpers/           # Test utilities and helpers
│   └── config/            # Test configuration
├── src/
│   └── __tests__/         # Co-located tests with source
└── web/
    └── __tests__/         # Web frontend tests
```

### Test Types

| Type | Location | Purpose | Speed |
|------|----------|---------|-------|
| Unit | `tests/unit/`, `src/__tests__/` | Test isolated functions/modules | Fast (< 1s) |
| Integration | `tests/integration/` | Test component interactions | Medium (1-10s) |
| E2E | `tests/e2e/` | Test complete workflows | Slow (> 10s) |

---

## Running Tests

### All Tests

```bash
npm test
```

### By Type

```bash
# Unit tests only
npm test -- tests/unit/

# Integration tests only
npm test -- tests/integration/

# E2E tests only
npm test -- tests/e2e/
```

### Specific Files

```bash
# Single test file
npm test -- tests/unit/parser/PermitParser.test.ts

# Multiple test files
npm test -- tests/unit/parser/*.test.ts

# Tests matching a pattern
npm test -- --testNamePattern="should parse"
```

### Watch Mode

```bash
# Run tests on file changes
npm run test:watch

# Watch specific directory
npm test -- --watch tests/unit/
```

### Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Open coverage report
open coverage/lcov-report/index.html
```

---

## Writing Tests

### Basic Test Structure

```typescript
import { PermitFactory } from '../factories';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup code runs before each test
  });

  afterEach(() => {
    // Cleanup code runs after each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test data';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    // Test edge cases explicitly
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Using Test Factories

```typescript
import { PermitFactory, UserFactory } from '../factories';

describe('Permit Processing', () => {
  it('should process a valid permit', () => {
    // Create realistic test data
    const permit = PermitFactory.create({ county: 'Midland' });
    
    const result = processPermit(permit);
    
    expect(result.success).toBe(true);
  });

  it('should handle multiple permits', () => {
    // Create multiple test items
    const permits = PermitFactory.createMany(10, { county: 'Reagan' });
    
    const results = permits.map(processPermit);
    
    expect(results).toHaveLength(10);
  });

  it('should create horizontal well permit', () => {
    // Use specialized factory methods
    const permit = PermitFactory.horizontal();
    
    expect(permit.isHorizontal).toBe(true);
    expect(permit.lateralLength).toBeGreaterThan(5000);
  });
});
```

### Async Tests

```typescript
describe('Async Operations', () => {
  it('should handle async operations', async () => {
    const result = await fetchData();
    expect(result).toBeDefined();
  });

  it('should handle promises', () => {
    return expect(fetchData()).resolves.toBeDefined();
  });

  it('should handle rejected promises', async () => {
    await expect(fetchInvalidData()).rejects.toThrow();
  });
});
```

### Parameterized Tests

```typescript
describe.each([
  ['Midland', true],
  ['Reagan', true],
  ['InvalidCounty', false],
])('County validation for %s', (county, expected) => {
  it(`should return ${expected}`, () => {
    expect(isValidCounty(county)).toBe(expected);
  });
});
```

---

## Test Data Factories

Test factories generate realistic test data using `@faker-js/faker`. They ensure consistency across tests and make test data creation easy.

### Available Factories

| Factory | File | Purpose |
|---------|------|---------|
| `PermitFactory` | `tests/factories/permit.factory.ts` | Create permit test data |
| `UserFactory` | `tests/factories/user.factory.ts` | Create user test data |
| `AlertRuleFactory` | `tests/factories/alert-rule.factory.ts` | Create alert rule test data |
| `WorkspaceFactory` | `tests/factories/workspace.factory.ts` | Create workspace test data |

### PermitFactory Examples

```typescript
import { PermitFactory } from '../factories';

// Basic permit
const permit = PermitFactory.create();

// Permit with overrides
const midlandPermit = PermitFactory.create({ county: 'Midland' });

// Multiple permits
const permits = PermitFactory.createMany(100);

// Permits in specific county
const reaganPermits = PermitFactory.manyInCounty(50, 'Reagan');

// Specialized permits
const oilPermit = PermitFactory.oil();
const gasPermit = PermitFactory.gas();
const horizontalPermit = PermitFactory.horizontal();
const injectionPermit = PermitFactory.injection();

// Edge cases
const expiredPermit = PermitFactory.expired();
const pendingPermit = PermitFactory.pending();
const invalidPermit = PermitFactory.invalid();

// Convert to RRC format for parser testing
const rrcText = PermitFactory.toRrcFormat(permit);
```

### UserFactory Examples

```typescript
import { UserFactory } from '../factories';

const user = UserFactory.create();
const admin = UserFactory.admin();
const tenantAdmin = UserFactory.tenantAdmin();
const users = UserFactory.createMany(20);
```

### AlertRuleFactory Examples

```typescript
import { AlertRuleFactory } from '../factories';

const rule = AlertRuleFactory.create();
const countyRule = AlertRuleFactory.forCounty('Midland');
const operatorRule = AlertRuleFactory.forOperator('ExxonMobil');
```

### Custom Test Data

```typescript
import { randomTexasCounty, randomDepth, randomFormation } from '../factories/generators';

const customPermit = {
  county: randomTexasCounty(),
  depth: randomDepth(),
  formation: randomFormation(),
};
```

---

## Test Helpers

### TestLogger

```typescript
import { TestLogger, logger } from '../helpers';

describe('MyComponent', () => {
  let testLogger: TestLogger;

  beforeEach(() => {
    testLogger = new TestLogger();
  });

  it('should log operations', () => {
    testLogger.info('Operation started');
    testLogger.expectLog('Operation started');
  });
});
```

### Database Helper

```typescript
import { DatabaseHelper } from '../helpers/db-helper';

describe('Database Operations', () => {
  let dbHelper: DatabaseHelper;

  beforeEach(async () => {
    dbHelper = new DatabaseHelper();
    await dbHelper.connect();
  });

  afterEach(async () => {
    await dbHelper.cleanup();
    await dbHelper.disconnect();
  });

  it('should query database', async () => {
    const results = await dbHelper.executeQuery(
      'SELECT * FROM permits WHERE county = $1',
      ['Midland']
    );
    expect(results).toBeDefined();
  });
});
```

### Logged Operations

```typescript
import { 
  loggedOperation, 
  loggedQuery, 
  timeOperation 
} from '../helpers';

it('should track operation timing', async () => {
  const result = await timeOperation('myOperation', async () => {
    // Your operation here
    return doSomething();
  });
  
  // Timing is automatically logged
});
```

---

## Database Testing

### Prerequisites

- Docker installed
- docker-compose installed

### Using Docker Compose

1. Start the test database containers:
   ```bash
   ./scripts/setup-test-db.sh
   ```

2. Run the database tests:
   ```bash
   npm run test:db
   ```

3. Tear down the test database containers:
   ```bash
   ./scripts/teardown-test-db.sh
   ```

### Using Testcontainers (Alternative)

For a more isolated approach, you can use Testcontainers to automatically manage database containers:

```typescript
import { TestDatabase } from '../helpers/testcontainers';

let testDatabase: TestDatabase;

beforeAll(async () => {
  testDatabase = new TestDatabase();
  await testDatabase.start();
}, 60000); // 60 second timeout for container startup

afterAll(async () => {
  await testDatabase.stop();
});
```

## Test Isolation Strategies

### Transaction Rollback (Fastest)

```typescript
beforeEach(async () => {
  await client.query('BEGIN');
});

afterEach(async () => {
  await client.query('ROLLBACK');
});
```

Pros: Very fast, no data cleanup needed
Cons: Can't test transaction behavior, can't test RLS with multiple connections

### TRUNCATE Tables

```typescript
afterEach(async () => {
  await client.query('TRUNCATE permits, workspaces, users CASCADE');
});
```

Pros: Clean slate for each test, can test transactions
Cons: Slower than rollback, must respect FK order

### Template Database

```typescript
// Create template after migrations
await client.query('CREATE DATABASE rrc_test_template WITH TEMPLATE rrc_test');

// Before each test, drop and recreate
await client.query('DROP DATABASE rrc_test');
await client.query('CREATE DATABASE rrc_test WITH TEMPLATE rrc_test_template');
```

Pros: Perfect isolation, includes all schema
Cons: Slowest option, complex to manage

## Configuration

The database tests use the configuration defined in `tests/config/db-test.config.ts`:

```typescript
export const DB_TEST_CONFIG = {
  // Database connection
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/rrc_test',
  
  // Test isolation
  isolationStrategy: 'transaction', // 'transaction', 'truncate', or 'template'
  
  // Cleanup
  cleanupAfterEach: true,
  
  // Timeout settings
  containerStartupTimeout: 60000, // 60 seconds
  queryTimeout: 30000, // 30 seconds
  
  // Test data
  seed: {
    permitCount: 100,
    workspaceCount: 5,
    userCount: 20
  }
};
```

## Running Database Tests

### Running All Database Tests

```bash
npm run test:db
```

### Running Specific Database Tests

```bash
npm run test:db -- tests/integration/db/rls-workspace.test.ts
```

### Running Tests with Verbose Output

```bash
npm run test:db -- --verbose
```

## Writing Database Tests

### Basic Test Structure

```typescript
import { DatabaseHelper } from '../../helpers/db-helper';

describe('Database Integration Tests', () => {
  let dbHelper: DatabaseHelper;

  beforeEach(() => {
    dbHelper = new DatabaseHelper();
  });

  it('should insert and retrieve data correctly', async () => {
    // Setup test data
    const testData = { name: 'Test Permit', county: 'Midland' };
    
    // Insert data
    await dbHelper.executeQuery(
      'INSERT INTO permits (name, county) VALUES ($1, $2)',
      [testData.name, testData.county]
    );
    
    // Retrieve data
    const results = await dbHelper.executeQuery(
      'SELECT * FROM permits WHERE name = $1',
      [testData.name]
    );
    
    // Verify results
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe(testData.name);
    expect(results[0].county).toBe(testData.county);
  });
});
```

### Using Test Data Factories

```typescript
import { PermitFactory } from '../../factories/permit.factory';

it('should handle multiple permits correctly', async () => {
  // Create test data using factories
  const permits = PermitFactory.createMany(10);
  
  // Insert data
  for (const permit of permits) {
    await dbHelper.executeQuery(
      'INSERT INTO permits (permit_number, county, filed_date) VALUES ($1, $2, $3)',
      [permit.permitNumber, permit.county, permit.filedDate]
    );
  }
  
  // Verify count
  const counts = await dbHelper.getTableCounts();
  expect(counts.permits).toBeGreaterThanOrEqual(10);
});
```

## Troubleshooting

### Database Container Won't Start

1. Check if Docker is running:
   ```bash
   docker info
   ```

2. Check container logs:
   ```bash
   docker-compose -f docker-compose.test.yml logs
   ```

3. Try restarting Docker:
   ```bash
   sudo systemctl restart docker
   ```

### Tests Fail Due to Connection Issues

1. Verify the database is running:
   ```bash
   docker-compose -f docker-compose.test.yml ps
   ```

2. Check the connection string:
   ```bash
   echo $TEST_DATABASE_URL
   ```

3. Test the connection manually:
   ```bash
   docker-compose -f docker-compose.test.yml exec postgres-test pg_isready -U test -d rrc_test
   ```

### Tests Are Running Slowly

1. Use transaction rollback strategy instead of truncate:
   ```typescript
   // In tests/config/db-test.config.ts
   export const DB_TEST_CONFIG = {
     isolationStrategy: 'transaction',
     // ... other config
   };
   ```

2. Reduce the amount of test data being seeded:
   ```typescript
   // In tests/config/db-test.config.ts
   export const DB_TEST_CONFIG = {
     seed: {
       permitCount: 10, // Reduced from 100
       workspaceCount: 2, // Reduced from 5
       userCount: 5 // Reduced from 20
     },
     // ... other config
   };
   ```

## Best Practices

1. Always clean up test data after each test to prevent state leakage
2. Use realistic test data generated by factories
3. Test with both small and large datasets to verify performance
4. Use appropriate timeout values for database operations
5. Test error conditions and edge cases
6. Use the fastest isolation strategy that meets your testing needs
7. Document any database-specific behavior or constraints
8. Keep test data factories in sync with schema changes