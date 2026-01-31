# Database Testing Guide

This guide explains how to set up and run database integration tests for the RRC Permit Scraper application.

## Test Database Infrastructure

The test database infrastructure provides isolated PostgreSQL instances for running database tests, ensuring each test suite has a clean, consistent database environment.

### Components

1. `docker-compose.test.yml` - Docker Compose configuration for test database containers
2. `tests/helpers/testcontainers.ts` - Testcontainers helper for managing test database containers
3. `tests/helpers/db-helper.ts` - Database helper utilities for common database operations
4. `tests/config/db-test.config.ts` - Database test configuration settings
5. `tests/setup/database.ts` - Setup and teardown for database integration tests
6. `scripts/setup-test-db.sh` - Script to set up the test database environment
7. `scripts/teardown-test-db.sh` - Script to tear down the test database environment

## Setting Up the Test Database

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