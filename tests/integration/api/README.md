# RRC API Integration Tests

This directory contains comprehensive integration tests for the RRC (Railroad Commission of Texas) API client, verifying real HTTP calls, rate limiting, retry mechanisms, and download services.

## Test Structure

The tests are organized into several categories:

1. `rrc-client.test.ts` - RRC client integration tests covering authentication, file listing, and file download
2. `rate-limiter.test.ts` - Rate limiter integration tests covering rate limiting behavior, burst allowance, and global rate limiting
3. `retry.test.ts` - Retry mechanism integration tests covering transient error handling, retry backoff, and retry limits
4. `download-service.test.ts` - Download service integration tests covering download and cache, resume downloads, and concurrent downloads

## Key Test Scenarios

### RRC Client
- Authentication with RRC API
- Authentication failure handling
- Expired authentication token refresh
- File listing retrieval
- Empty file listing handling
- Paginated file listing retrieval
- File download from RRC API
- Download failure handling
- Partial download handling

### Rate Limiter
- RRC API rate limit respect
- 429 Too Many Requests response handling
- Automatic retry after rate limit reset
- Burst request allowance within limits
- Burst rate limiting exceeding allowance
- Global rate limiting coordination
- Rate limit sharing between processes

### Retry Mechanism
- Retry on 5xx server errors
- Retry on network timeouts
- Retry on connection failures
- Exponential backoff implementation
- Maximum delay limit respect
- Retry stopping after maximum attempts
- Error details provision after retry exhaustion

### Download Service
- File download and caching
- Cached file validation
- Interrupted download resumption
- Partial content download handling
- Concurrent download handling
- Concurrent download limiting

## Configuration

Tests use the configuration defined in `tests/config/api-test.config.ts`:

```typescript
export const API_TEST_CONFIG = {
  // RRC API endpoints
  baseUrl: process.env.RRC_TEST_API_URL || 'https://mft.rrc.texas.gov',
  
  // Authentication (test credentials)
  auth: {
    username: process.env.RRC_TEST_USER || 'test_user',
    password: process.env.RRC_TEST_PASS || 'test_pass',
  },
  
  // Rate limiting (conservative for testing)
  rateLimit: {
    requestsPerMinute: 10,
    burstAllowance: 2,
  },
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },
  
  // Timeouts
  timeout: {
    connect: 10000,    // 10 seconds
    read: 60000,       // 60 seconds
    download: 300000,  // 5 minutes for large files
  },
  
  // Test files (small, for quick tests)
  testFiles: [
    { id: 'test-small', size: '10KB', permits: 10 },
    { id: 'test-medium', size: '1MB', permits: 500 },
  ]
};
```

## HTTP Recording and Playback

For deterministic tests without external dependency, the HTTP recorder utility is used:

```typescript
// tests/helpers/http-recorder.ts
export class HttpRecorder {
  // Record real HTTP interactions
  record(mode: 'record' | 'playback' | 'passthrough'): void;
  
  // Save recorded interactions
  save(cassette: string): void;
  
  // Load recorded interactions
  load(cassette: string): void;
}
```

Cassettes are stored in: `tests/fixtures/cassettes/`

## Test Philosophy

Following the real operations principle, all tests use:
- Real HTTP calls to the RRC API
- Real rate limiting behavior
- Real retry mechanisms
- Real download services
- Real authentication flows
- Real file operations

## Test Dependencies

These tests require:
- Access to the RRC API (or recorded cassettes for playback mode)
- Test credentials for authentication
- Network connectivity for real HTTP calls
- File system access for caching

## Performance Considerations

API integration tests involve:
- Network latency for HTTP calls
- Rate limiting delays
- Retry mechanism delays
- File download times
- Authentication overhead

Tests should account for these delays in timeout configurations and use recorded cassettes for faster playback during development.