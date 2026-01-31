# Alert System E2E Tests

This directory contains comprehensive end-to-end tests for the alert system, verifying the complete workflow from rule creation to notification delivery.

## Test Structure

The tests are organized into several categories:

1. `complete-workflow.test.ts` - Complete workflow tests covering rule creation to notification delivery
2. `quiet-hours.test.ts` - Quiet hours enforcement tests
3. `rate-limiting.test.ts` - Rate limiting enforcement tests
4. `multi-rule.test.ts` - Multi-rule matching tests
5. `delivery.test.ts` - Notification delivery tests

## Key Test Scenarios

### Complete Workflow
- Rule creation and matching permit triggering notification
- Non-matching permit not triggering notification
- Inactive rule handling
- Alert event creation with correct metadata
- Alert event linking to correct rule and permit

### Quiet Hours
- Quiet hours enforcement for immediate alerts
- Delayed notification delivery after quiet hours end
- Digest notification handling during quiet hours
- User timezone respect for quiet hours
- Timezone transition handling

### Rate Limiting
- Hourly rate limits per channel enforcement
- Notification queuing when exceeding rate limits
- Rate limit tracking per channel separately
- Burst notification allowance within limits
- Burst notification queuing when exceeding limits

### Multi-Rule Matching
- Multiple rule triggering for one permit
- Duplicate alert prevention for same rule
- Rule changes mid-stream handling
- Rule priority ordering respect
- Conflicting rule handling

### Delivery
- Email notification delivery
- Email delivery failure handling
- In-app notification support
- In-app notification limits handling
- SMS notification delivery
- SMS delivery failure handling

## Configuration

Tests use the configuration defined in `tests/e2e/config/alerts.config.ts`:

```typescript
export const ALERT_E2E_CONFIG = {
  // Timing
  alertGenerationDelay: 5000,     // Wait for async processing
  notificationDeliveryDelay: 10000,
  
  // Rate limits (relaxed for testing)
  rateLimits: {
    perHour: 10,
    burst: 5
  },
  
  // Quiet hours
  quietHours: {
    start: '22:00',
    end: '06:00',
    timezone: 'America/Chicago'
  },
  
  // Test channels
  channels: ['email', 'in-app', 'sms']
};
```

## Test Philosophy

Following the production-like data principle, all tests use:
- Real alert rule creation via API
- Real permit ingestion through the ETL pipeline
- Real database operations for verification
- Real notification delivery mechanisms
- Real rate limiting and quiet hours enforcement
- Real timezone handling

## Test Dependencies

These tests require:
- Running ETL pipeline (Phase 4.1)
- Alert system database tables (Phase 3.4)
- Test data factories (Phase 5.1)
- Properly configured notification channels

## Performance Considerations

Alert E2E tests involve:
- Asynchronous processing delays
- Notification delivery delays
- Database operations
- External service interactions

Tests should account for these delays in timeout configurations.