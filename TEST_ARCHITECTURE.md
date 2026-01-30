# Comprehensive Test Architecture: RRC Permit Scraper

## Executive Summary

This document outlines a **5-phase testing strategy** to achieve comprehensive test coverage without mocks/fakes, using real services, filesystem operations, and database interactions.

---

## Phase 1: Core Unit Tests (No Mocks)
**Goal:** Test pure functions and business logic with real data inputs
**Duration:** 2-3 days
**Dependencies:** None

### 1.1 Parser Unit Tests
**Location:** `tests/unit/parser/`
**Files to Create:**

```
tests/unit/parser/
├── Permit.test.ts                    # Permit model operations
├── PermitParser.test.ts              # Main parser logic
├── field-parsers/
│   ├── date-parser.test.ts           # Date parsing edge cases
│   ├── coordinate-parser.test.ts     # Lat/long validation
│   └── numeric-parser.test.ts        # Number parsing
└── fixtures/
    ├── sample-permit.txt             # Real RRC permit format
    ├── malformed-permit.txt          # Edge cases
    └── multi-section-permit.txt      # Complex permits
```

**Test Coverage Requirements:**
- Parse single permit with all fields
- Parse permits with missing optional fields
- Handle malformed dates (MM/DD/YYYY, YYYY-MM-DD, etc.)
- Handle coordinate formats (DMS, decimal degrees)
- Handle empty/null values
- Handle special characters in text fields
- Performance: Parse 10,000 permits in < 5 seconds

**No Mocks Policy:**
- Use real file fixtures loaded from disk
- Use actual Date objects, not mocked dates
- Use real regex patterns, not stubbed parsers

### 1.2 QA Gates Unit Tests
**Location:** `tests/unit/qa/`

```
tests/unit/qa/
├── VolumeChecks.test.ts
├── SchemaChecks.test.ts
├── ValueChecks.test.ts
├── QAGate.test.ts
└── fixtures/
    ├── valid-records.json
    ├── records-with-nulls.json
    ├── records-with-duplicates.json
    └── records-schema-drift.json
```

**Test Coverage Requirements:**
- VolumeChecks: Test with 0, 1, 100, 10000, 1000000 records
- SchemaChecks: Test field presence, type validation, drift detection
- ValueChecks: Test null rates, date ranges, coordinate bounds
- QAGate: Test stage transitions, error aggregation

### 1.3 Validator Unit Tests
**Location:** `tests/unit/validators/`

```
tests/unit/validators/
├── permit-validator.test.ts
├── coordinate-validator.test.ts
└── date-validator.test.ts
```

---

## Phase 2: Integration Tests (Real File Operations)
**Goal:** Test component interactions with real filesystem and external APIs
**Duration:** 3-4 days
**Dependencies:** Phase 1

### 2.1 ETL Pipeline Integration
**Location:** `tests/integration/etl/`

```
tests/integration/etl/
├── Pipeline.test.ts
├── transformer/
│   └── PermitTransformer.test.ts
├── loader/
│   └── PermitLoader.test.ts
└── fixtures/
    ├── input/
    │   ├── small-permit-file.txt      # ~100 permits
    │   ├── medium-permit-file.txt     # ~10,000 permits
    │   └── large-permit-file.txt      # ~100,000 permits
    └── expected/
        └── transformed-permits.json
```

**Test Coverage Requirements:**
- Full pipeline: Parse → Transform → QA → Load
- Checkpoint/resume functionality
- Error recovery and partial processing
- Memory usage stays under 512MB for large files
- Progress reporting accuracy

**Real Operations:**
- Read actual files from `tests/fixtures/files/`
- Write checkpoints to `tests/tmp/checkpoints/`
- Generate real transformation outputs

### 2.2 RRC API Integration
**Location:** `tests/integration/api/`

```
tests/integration/api/
├── rrc-client.test.ts
├── download-service.test.ts
└── rate-limiter.test.ts
```

**Test Coverage Requirements:**
- Real HTTP requests to RRC endpoints (test environment)
- Rate limiting compliance
- Retry logic with exponential backoff
- Download resume capability
- Error handling for 4xx/5xx responses

**Configuration:**
```typescript
// tests/config/api-test.config.ts
export const API_TEST_CONFIG = {
  baseUrl: process.env.RRC_TEST_API_URL || 'https://mft.rrc.texas.gov',
  rateLimitRequests: 10,
  rateLimitWindowMs: 60000,
  maxRetries: 3,
  timeoutMs: 30000,
  testFiles: [
    { name: 'small', size: '1MB', permits: 100 },
    { name: 'medium', size: '50MB', permits: 5000 },
  ]
};
```

---

## Phase 3: Database Integration Tests
**Goal:** Test database operations with real PostgreSQL/Supabase
**Duration:** 4-5 days
**Dependencies:** Phase 2

### 3.1 Test Database Infrastructure

**Option A: Test Containers (Recommended)**
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: rrc_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"  # Different port to avoid conflicts
    volumes:
      - ./database/schema:/docker-entrypoint-initdb.d
      
  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"
```

**Option B: Supabase Local Stack**
```bash
# Uses Supabase CLI for local testing
supabase start --workdir tests/supabase-local
```

### 3.2 Database Test Structure
**Location:** `tests/integration/db/`

```
tests/integration/db/
├── connection.test.ts
├── permits/
│   ├── insert.test.ts
│   ├── update.test.ts
│   ├── query.test.ts
│   └── bulk-operations.test.ts
├── workspaces/
│   ├── crud.test.ts
│   └── rls.test.ts
├── alerts/
│   ├── rules.test.ts
│   └── notifications.test.ts
└── migrations/
    └── schema-validation.test.ts
```

**Test Coverage Requirements:**

#### 3.2.1 Permit CRUD Operations
```typescript
describe('Permit Database Operations', () => {
  it('should insert single permit with all fields', async () => {
    // Insert real permit data
    // Verify all fields persisted correctly
    // Check timestamps auto-generated
  });
  
  it('should handle idempotent inserts (upsert)', async () => {
    // Insert same permit twice
    // Verify only one record exists
    // Verify updated_at changes
  });
  
  it('should bulk insert 10,000 permits', async () => {
    // Measure insertion time
    // Verify count matches
    // Check memory usage
  });
  
  it('should query with complex filters', async () => {
    // Filter by date range
    // Filter by county
    // Filter by operator
    // Verify index usage (EXPLAIN ANALYZE)
  });
  
  it('should enforce unique constraints', async () => {
    // Attempt duplicate permit_number
    // Verify proper error thrown
  });
  
  it('should handle concurrent writes', async () => {
    // 10 parallel insert operations
    // Verify no lost writes
    // Check transaction isolation
  });
});
```

#### 3.2.2 Row Level Security (RLS)
```typescript
describe('RLS Policies', () => {
  it('should isolate workspace data', async () => {
    // User A creates permit in Workspace 1
    // User B (Workspace 2) cannot see it
    // Superadmin can see all
  });
  
  it('should enforce workspace membership', async () => {
    // Non-member attempts access
    // Verify permission denied
  });
});
```

#### 3.2.3 Alert System
```typescript
describe('Alert Database Operations', () => {
  it('should store and retrieve alert rules', async () => {
    // Create complex rule with filters
    // Query by workspace
    // Verify JSONB field handling
  });
  
  it('should log alert notifications', async () => {
    // Insert notification log
    // Query delivery status
    // Verify audit trail
  });
});
```

### 3.3 Database Test Configuration

```typescript
// tests/config/db-test.config.ts
export const DB_TEST_CONFIG = {
  // Test database connection
  connection: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5433'),
    database: process.env.TEST_DB_NAME || 'rrc_test',
    user: process.env.TEST_DB_USER || 'test',
    password: process.env.TEST_DB_PASSWORD || 'test',
  },
  
  // Test data sizes
  dataSizes: {
    small: 100,
    medium: 10000,
    large: 100000,
  },
  
  // Performance thresholds
  performance: {
    maxInsertTimeMs: 5000,      // 5 seconds for 10k records
    maxQueryTimeMs: 100,        // 100ms for indexed query
    maxBulkInsertTimeMs: 30000, // 30 seconds for 100k records
  },
  
  // Cleanup strategy
  cleanup: {
    afterEach: true,   // Clean after each test
    afterAll: true,    // Drop test database after suite
  }
};
```

---

## Phase 4: End-to-End Tests
**Goal:** Full system testing with all real components
**Duration:** 5-7 days
**Dependencies:** Phase 3

### 4.1 Full Pipeline E2E
**Location:** `tests/e2e/pipeline/`

```
tests/e2e/pipeline/
├── complete-ingestion.test.ts
├── error-recovery.test.ts
├── performance.test.ts
└── fixtures/
    └── full-permit-dumps/
```

**Test Scenarios:**

#### Scenario 1: Happy Path Complete Ingestion
```typescript
describe('E2E: Complete Ingestion Flow', () => {
  it('should download, parse, transform, QA, and load permits', async () => {
    // 1. Download real file from RRC (or use cached test file)
    const downloadResult = await downloadService.fetchFile(testFileUrl);
    
    // 2. Parse file
    const parseResult = await parser.parse(downloadResult.path);
    
    // 3. Run QA gates
    const qaResult = await qaRunner.runStage({
      stage: 'post-transform',
      records: parseResult.permits,
    });
    
    // 4. Transform for DB
    const transformed = await transformer.transform(parseResult.permits);
    
    // 5. Load to database
    const loadResult = await loader.load(transformed);
    
    // 6. Verify in database
    const dbCount = await db.query('SELECT COUNT(*) FROM permits');
    expect(dbCount).toBe(parseResult.permits.length);
    
    // 7. Verify monitoring metrics
    const metrics = monitor.getDashboardMetrics();
    expect(metrics.last24Hours.totalRuns).toBe(1);
    expect(metrics.last24Hours.successRate).toBe(100);
  }, 300000); // 5 minute timeout
});
```

#### Scenario 2: Error Recovery
```typescript
describe('E2E: Error Recovery', () => {
  it('should resume from checkpoint after failure', async () => {
    // 1. Start processing large file
    // 2. Simulate crash at 50%
    // 3. Restart pipeline
    // 4. Verify resumed from checkpoint
    // 5. Verify no duplicate records
  });
  
  it('should handle database connection failure', async () => {
    // 1. Start ingestion
    // 2. Kill database connection
    // 3. Verify proper error handling
    // 4. Restore connection
    // 5. Verify retry succeeds
  });
});
```

#### Scenario 3: Performance Benchmarks
```typescript
describe('E2E: Performance Benchmarks', () => {
  it('should process 100k permits in under 10 minutes', async () => {
    const startTime = Date.now();
    
    await pipeline.run({
      inputPath: 'tests/fixtures/large-permit-file.txt',
    });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10 * 60 * 1000); // 10 minutes
    
    // Memory usage check
    const memUsage = process.memoryUsage();
    expect(memUsage.heapUsed).toBeLessThan(512 * 1024 * 1024); // 512MB
  }, 600000);
});
```

### 4.2 Alert System E2E
**Location:** `tests/e2e/alerts/`

```typescript
describe('E2E: Alert System', () => {
  it('should trigger alert when permit matches rule', async () => {
    // 1. Create alert rule in database
    // 2. Insert matching permit
    // 3. Verify alert created
    // 4. Verify notification queued
    // 5. Verify email/SMS sent (check logs)
  });
  
  it('should respect quiet hours', async () => {
    // 1. Set quiet hours to current time
    // 2. Trigger alert
    // 3. Verify notification delayed
    // 4. Advance time past quiet hours
    // 5. Verify notification sent
  });
});
```

### 4.3 Web Application E2E
**Location:** `tests/e2e/web/`

```typescript
describe('E2E: Web Application', () => {
  it('should display permits on map', async () => {
    // 1. Seed database with permits
    // 2. Start Next.js dev server
    // 3. Navigate to map page
    // 4. Verify permit markers displayed
    // 5. Click marker, verify details
  });
  
  it('should create and trigger alert rule', async () => {
    // 1. Login via Supabase
    // 2. Create AOI on map
    // 3. Create alert rule
    // 4. Insert matching permit via API
    // 5. Verify alert appears in UI
  });
});
```

---

## Phase 5: Test Infrastructure
**Goal:** Build reusable test utilities and reporting
**Duration:** 2-3 days (parallel with other phases)
**Dependencies:** None (enables other phases)

### 5.1 Test Data Factories
**Location:** `tests/factories/`

```typescript
// tests/factories/permit.factory.ts
export class PermitFactory {
  static create(overrides: Partial<PermitData> = {}): PermitData {
    return {
      daroot: {
        permit_number: `P-${randomId()}`,
        operator_name: 'Test Operator',
        lease_name: 'Test Lease',
        county_code: '227', // Midland
        district: '08',
        status_flag: 'A',
        ...overrides.daroot,
      },
      dapermit: {
        api_number: `42-${randomId()}`,
        well_type: 'OIL',
        issued_date: new Date().toISOString(),
        ...overrides.dapermit,
      },
      // ... other sections
    };
  }
  
  static createMany(count: number): PermitData[] {
    return Array.from({ length: count }, () => this.create());
  }
  
  static toRrcFormat(permit: PermitData): string {
    // Convert to actual RRC text format
  }
}

// tests/factories/alert-rule.factory.ts
export class AlertRuleFactory {
  static create(overrides: Partial<AlertRule> = {}): AlertRule {
    return {
      id: `rule-${randomId()}`,
      workspaceId: `ws-${randomId()}`,
      name: 'Test Rule',
      filters: {},
      ...overrides,
    };
  }
}
```

### 5.2 Test Helpers
**Location:** `tests/helpers/`

```typescript
// tests/helpers/db-helper.ts
export class DatabaseHelper {
  private client: SupabaseClient;
  
  async cleanDatabase(): Promise<void> {
    // Truncate all tables in correct order
    await this.client.rpc('truncate_tables', {
      tables: ['notifications', 'alerts', 'permits', 'workspaces']
    });
  }
  
  async seedPermits(count: number): Promise<PermitData[]> {
    const permits = PermitFactory.createMany(count);
    await this.client.from('permits').insert(permits);
    return permits;
  }
  
  async getTableCount(table: string): Promise<number> {
    const { count } = await this.client
      .from(table)
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }
}

// tests/helpers/file-helper.ts
export class FileHelper {
  static async createTempFile(content: string, ext: string): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rrc-test-'));
    const filePath = path.join(tmpDir, `test-${Date.now()}.${ext}`);
    await fs.writeFile(filePath, content);
    return filePath;
  }
  
  static async createLargeFile(lineCount: number): Promise<string> {
    // Generate large RRC-format file
  }
  
  static async cleanup(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }
}

// tests/helpers/metrics-helper.ts
export class MetricsHelper {
  static captureMetrics<T>(fn: () => Promise<T>): Promise<{
    result: T;
    durationMs: number;
    memoryDelta: number;
  }> {
    const startMem = process.memoryUsage();
    const startTime = Date.now();
    
    return fn().then(result => ({
      result,
      durationMs: Date.now() - startTime,
      memoryDelta: process.memoryUsage().heapUsed - startMem.heapUsed,
    }));
  }
}
```

### 5.3 Detailed Logging System
**Location:** `tests/helpers/logger.ts`

```typescript
export interface TestLogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  phase: string;
  test: string;
  operation: string;
  details: Record<string, unknown>;
  durationMs?: number;
}

export class TestLogger {
  private logs: TestLogEntry[] = [];
  private startTimes: Map<string, number> = new Map();
  
  start(operation: string, details?: Record<string, unknown>): void {
    this.startTimes.set(operation, Date.now());
    this.log('debug', operation, 'START', details);
  }
  
  end(operation: string, details?: Record<string, unknown>): void {
    const startTime = this.startTimes.get(operation);
    const durationMs = startTime ? Date.now() - startTime : undefined;
    this.log('debug', operation, 'END', { ...details, durationMs });
    this.startTimes.delete(operation);
  }
  
  info(operation: string, message: string, details?: Record<string, unknown>): void {
    this.log('info', operation, message, details);
  }
  
  error(operation: string, error: Error, details?: Record<string, unknown>): void {
    this.log('error', operation, error.message, {
      ...details,
      stack: error.stack,
    });
  }
  
  private log(
    level: TestLogEntry['level'],
    operation: string,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const entry: TestLogEntry = {
      timestamp: new Date(),
      level,
      phase: this.currentPhase,
      test: this.currentTest,
      operation: `${operation}: ${message}`,
      details: details || {},
    };
    
    this.logs.push(entry);
    
    // Console output with colors
    const color = this.getColor(level);
    console.log(
      color(`[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] [${this.currentPhase}]`),
      entry.operation,
      details ? JSON.stringify(details, null, 2) : ''
    );
  }
  
  generateReport(): TestReport {
    return {
      summary: {
        totalOperations: this.logs.length,
        errors: this.logs.filter(l => l.level === 'error').length,
        warnings: this.logs.filter(l => l.level === 'warn').length,
        totalDurationMs: this.calculateTotalDuration(),
      },
      operations: this.groupByOperation(),
      timeline: this.logs,
    };
  }
  
  private getColor(level: TestLogEntry['level']): (s: string) => string {
    const colors = {
      debug: chalk.gray,
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red,
    };
    return colors[level];
  }
}
```

### 5.4 Test Reporter
**Location:** `tests/reporters/detailed-reporter.ts`

```typescript
export class DetailedTestReporter {
  onTestSuiteStart(suite: TestSuite): void {
    console.log(chalk.bold(`\n📦 Test Suite: ${suite.name}`));
    console.log(chalk.gray(`   Started: ${new Date().toISOString()}`));
  }
  
  onTestStart(test: TestCase): void {
    console.log(chalk.blue(`  ⏳ ${test.name}`));
  }
  
  onTestEnd(test: TestCase, result: TestResult): void {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? chalk.green : chalk.red;
    console.log(color(`  ${icon} ${test.name} (${result.durationMs}ms)`));
    
    if (!result.passed) {
      console.log(chalk.red(`     Error: ${result.error}`));
    }
    
    // Print detailed logs
    if (result.logs) {
      for (const log of result.logs) {
        console.log(chalk.gray(`     ${log.operation}: ${JSON.stringify(log.details)}`));
      }
    }
  }
  
  onTestSuiteEnd(suite: TestSuite, summary: TestSummary): void {
    console.log(chalk.bold(`\n📊 Summary:`));
    console.log(`   Passed: ${chalk.green(summary.passed)}`);
    console.log(`   Failed: ${chalk.red(summary.failed)}`);
    console.log(`   Duration: ${summary.durationMs}ms`);
    console.log(`   Coverage: ${summary.coverage.percent}%`);
  }
}
```

---

## Test Execution Strategy

### Local Development
```bash
# Run all unit tests (fast, no external deps)
bun test:unit

# Run integration tests (requires test DB)
bun test:integration

# Run specific phase
bun test:phase1
bun test:phase2
bun test:phase3

# Run E2E tests (requires full stack)
bun test:e2e

# Run with detailed logging
bun test:verbose

# Run performance benchmarks
bun test:perf
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Comprehensive Tests

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: bun install
      - run: bun test:unit --coverage
      
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7
    steps:
      - run: bun test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - run: docker-compose -f docker-compose.test.yml up -d
      - run: bun test:e2e
      - run: docker-compose -f docker-compose.test.yml down
```

---

## Success Criteria

### Coverage Targets
- **Line Coverage:** ≥ 90%
- **Branch Coverage:** ≥ 85%
- **Function Coverage:** ≥ 95%

### Quality Gates
- All unit tests pass in < 30 seconds
- All integration tests pass in < 5 minutes
- All E2E tests pass in < 15 minutes
- No test uses mocks/fakes (except external APIs)
- All database tests use real transactions
- All file operations use real filesystem

### Performance Benchmarks
- Parse 10,000 permits: < 2 seconds
- Insert 10,000 permits: < 5 seconds
- Query with filters: < 100ms
- Full ETL pipeline (100k permits): < 10 minutes
- Memory usage: < 512MB peak

---

## Dependencies & Timeline

```
Phase 1 (Unit Tests)
├── Duration: 2-3 days
├── Dependencies: None
└── Unblocks: Phase 2

Phase 2 (Integration Tests)
├── Duration: 3-4 days
├── Dependencies: Phase 1
└── Unblocks: Phase 3

Phase 3 (DB Tests)
├── Duration: 4-5 days
├── Dependencies: Phase 2
└── Unblocks: Phase 4

Phase 4 (E2E Tests)
├── Duration: 5-7 days
├── Dependencies: Phase 3
└── Unblocks: Production readiness

Phase 5 (Infrastructure)
├── Duration: 2-3 days (parallel)
├── Dependencies: None
└── Enables: All other phases
```

**Total Estimated Duration:** 3-4 weeks for complete implementation
