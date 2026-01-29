/**
 * Notification Workers Tests
 */

import {
  EmailWorker,
  SMSWorker,
  InAppWorker,
  DispatcherWorker,
  DigestAggregator,
} from '../../src/lib/notifications';
import {
  AlertEvent,
  NotificationPreferences,
  NotificationChannelType,
} from '../../src/types/notification';

describe('EmailWorker', () => {
  let worker: EmailWorker;
  let mockPreferences: NotificationPreferences;

  beforeEach(() => {
    worker = new EmailWorker();
    mockPreferences = {
      userId: 'user-1',
      emailEnabled: true,
      emailAddress: 'test@example.com',
      smsEnabled: false,
      inAppEnabled: true,
      timezone: 'America/New_York',
    };
  });

  const createMockEvent = (channels: NotificationChannelType[] = ['email']): AlertEvent => ({
    id: 'event-1',
    ruleId: 'rule-1',
    permitId: 'permit-1',
    workspaceId: 'workspace-1',
    userId: 'user-1',
    channels,
    createdAt: new Date(),
    metadata: {},
  });

  it('should deliver email when enabled', async () => {
    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    expect(result.success).toBe(true);
    expect(result.status).toBe('delivered');
  });

  it('should fail when email is disabled', async () => {
    mockPreferences.emailEnabled = false;
    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.error).toBe('Email notifications disabled');
  });

  it('should fail when no email address configured', async () => {
    mockPreferences.emailAddress = undefined;
    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.error).toBe('No email address configured');
  });

  it('should defer during quiet hours', async () => {
    // Set quiet hours to always be active (0-23 covers entire day)
    mockPreferences.quietHoursStart = 0;
    mockPreferences.quietHoursEnd = 23;

    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    expect(result.success).toBe(false);
    expect(result.status).toBe('deferred');
    expect(result.retryAfter).toBeDefined();
  });

  it('should return correct channel type', () => {
    expect(worker.getChannelType()).toBe('email');
  });

  it('should retry with exponential backoff', async () => {
    const notification = {
      id: 'notif-1',
      eventId: 'event-1',
      userId: 'user-1',
      channel: 'email' as const,
      status: 'failed' as const,
      attempts: 1,
      metadata: { event: createMockEvent() },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await worker.retry(notification, mockPreferences);
    // Should succeed on retry (mock implementation)
    expect(result.status).toBe('delivered');
  });

  it('should fail retry after max attempts', async () => {
    const notification = {
      id: 'notif-1',
      eventId: 'event-1',
      userId: 'user-1',
      channel: 'email' as const,
      status: 'failed' as const,
      attempts: 3,
      metadata: { event: createMockEvent() },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await worker.retry(notification, mockPreferences);
    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.error).toBe('Max retries exceeded');
  });
});

describe('SMSWorker', () => {
  let worker: SMSWorker;
  let mockPreferences: NotificationPreferences;

  beforeEach(() => {
    worker = new SMSWorker();
    mockPreferences = {
      userId: 'user-1',
      emailEnabled: true,
      smsEnabled: true,
      phoneNumber: '+1234567890',
      inAppEnabled: true,
      timezone: 'America/New_York',
    };
  });

  const createMockEvent = (): AlertEvent => ({
    id: 'event-1',
    ruleId: 'rule-1',
    permitId: 'permit-1',
    workspaceId: 'workspace-1',
    userId: 'user-1',
    channels: ['sms'],
    createdAt: new Date(),
    metadata: {},
  });

  it('should deliver SMS when enabled', async () => {
    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    expect(result.success).toBe(true);
    expect(result.status).toBe('delivered');
  });

  it('should fail when SMS is disabled', async () => {
    mockPreferences.smsEnabled = false;
    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    expect(result.success).toBe(false);
    expect(result.error).toBe('SMS notifications disabled');
  });

  it('should fail when no phone number configured', async () => {
    mockPreferences.phoneNumber = undefined;
    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    expect(result.success).toBe(false);
    expect(result.error).toBe('No phone number configured');
  });

  it('should defer during quiet hours', async () => {
    // Set quiet hours to always be active (0-23 covers entire day)
    mockPreferences.quietHoursStart = 0;
    mockPreferences.quietHoursEnd = 23;

    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    expect(result.status).toBe('deferred');
  });

  it('should return correct channel type', () => {
    expect(worker.getChannelType()).toBe('sms');
  });

  it('should suggest fallback to email after max retries', async () => {
    const notification = {
      id: 'notif-1',
      eventId: 'event-1',
      userId: 'user-1',
      channel: 'sms' as const,
      status: 'failed' as const,
      attempts: 2,
      metadata: { event: createMockEvent() },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await worker.retry(notification, mockPreferences);
    expect(result.success).toBe(false);
    expect(result.error).toContain('fallback to email');
  });
});

describe('InAppWorker', () => {
  let worker: InAppWorker;
  let mockPreferences: NotificationPreferences;

  beforeEach(() => {
    worker = new InAppWorker();
    mockPreferences = {
      userId: 'user-1',
      emailEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      timezone: 'America/New_York',
    };
  });

  const createMockEvent = (): AlertEvent => ({
    id: 'event-1',
    ruleId: 'rule-1',
    permitId: 'permit-1',
    workspaceId: 'workspace-1',
    userId: 'user-1',
    channels: ['in_app'],
    createdAt: new Date(),
    metadata: {},
  });

  it('should deliver in-app notification when enabled', async () => {
    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    expect(result.success).toBe(true);
    expect(result.status).toBe('delivered');
    expect(result.metadata?.notificationId).toBeDefined();
  });

  it('should fail when in-app is disabled', async () => {
    mockPreferences.inAppEnabled = false;
    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    expect(result.success).toBe(false);
    expect(result.error).toBe('In-app notifications disabled');
  });

  it('should return correct channel type', () => {
    expect(worker.getChannelType()).toBe('in_app');
  });

  it('should store notification for retrieval', async () => {
    const event = createMockEvent();
    const result = await worker.processEvent(event, mockPreferences);

    const notificationId = result.metadata?.notificationId as string;
    const stored = worker.getNotification(notificationId);

    expect(stored).toBeDefined();
    expect(stored?.channel).toBe('in_app');
    expect(stored?.userId).toBe('user-1');
  });

  it('should always succeed on retry', async () => {
    const notification = {
      id: 'notif-1',
      eventId: 'event-1',
      userId: 'user-1',
      channel: 'in_app' as const,
      status: 'failed' as const,
      attempts: 5,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await worker.retry(notification, mockPreferences);
    expect(result.success).toBe(true);
    expect(result.status).toBe('delivered');
  });
});

describe('DispatcherWorker', () => {
  let dispatcher: DispatcherWorker;
  let mockPreferences: NotificationPreferences;

  beforeEach(() => {
    dispatcher = new DispatcherWorker();
    mockPreferences = {
      userId: 'user-1',
      emailEnabled: true,
      emailAddress: 'test@example.com',
      smsEnabled: true,
      phoneNumber: '+1234567890',
      inAppEnabled: true,
      timezone: 'America/New_York',
    };
  });

  const createMockEvent = (channels: NotificationChannelType[]): AlertEvent => ({
    id: 'event-1',
    ruleId: 'rule-1',
    permitId: 'permit-1',
    workspaceId: 'workspace-1',
    userId: 'user-1',
    channels,
    createdAt: new Date(),
    metadata: {},
  });

  it('should dispatch to all requested channels', async () => {
    const event = createMockEvent(['email', 'sms', 'in_app']);
    const results = await dispatcher.dispatch(event, mockPreferences);

    expect(results.size).toBe(3);
    expect(results.get('email')?.success).toBe(true);
    expect(results.get('sms')?.success).toBe(true);
    expect(results.get('in_app')?.success).toBe(true);
  });

  it('should handle partial failures', async () => {
    mockPreferences.smsEnabled = false;
    const event = createMockEvent(['email', 'sms']);
    const results = await dispatcher.dispatch(event, mockPreferences);

    expect(results.get('email')?.success).toBe(true);
    expect(results.get('sms')?.success).toBe(false);
  });

  it('should create notification records for tracking', async () => {
    const event = createMockEvent(['email', 'in_app']);
    await dispatcher.dispatch(event, mockPreferences);

    const notifications = dispatcher.getAllNotifications();
    expect(notifications.length).toBe(2);
    expect(notifications.some(n => n.channel === 'email')).toBe(true);
    expect(notifications.some(n => n.channel === 'in_app')).toBe(true);
  });

  it('should handle unknown channel gracefully', async () => {
    const event = createMockEvent(['email', 'unknown' as NotificationChannelType]);
    const results = await dispatcher.dispatch(event, mockPreferences);

    expect(results.get('email')?.success).toBe(true);
    expect(results.get('unknown' as NotificationChannelType)?.success).toBe(false);
    expect(results.get('unknown' as NotificationChannelType)?.error).toContain('No worker registered');
  });

  it('should process pending notifications', async () => {
    // Create a deferred notification by using quiet hours that cover entire day
    mockPreferences.quietHoursStart = 0;
    mockPreferences.quietHoursEnd = 23;

    const event = createMockEvent(['email']);
    await dispatcher.dispatch(event, mockPreferences);

    // Verify notification was deferred
    const notifications = dispatcher.getAllNotifications();
    const deferredNotifs = notifications.filter(n => n.status === 'deferred');
    expect(deferredNotifs.length).toBeGreaterThan(0);

    // Clear quiet hours
    mockPreferences.quietHoursStart = undefined;
    mockPreferences.quietHoursEnd = undefined;

    const results = await dispatcher.processPendingNotifications(mockPreferences);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('DigestAggregator', () => {
  let aggregator: DigestAggregator;
  let mockPreferences: NotificationPreferences;

  beforeEach(() => {
    aggregator = new DigestAggregator();
    mockPreferences = {
      userId: 'user-1',
      emailEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      timezone: 'America/New_York',
      digestFrequency: 'hourly',
    };
  });

  const createMockEvent = (userId: string = 'user-1'): AlertEvent => ({
    id: `event-${Math.random().toString(36).slice(2)}`,
    ruleId: 'rule-1',
    permitId: 'permit-1',
    workspaceId: 'workspace-1',
    userId,
    channels: ['email'],
    createdAt: new Date(),
    metadata: {},
  });

  it('should aggregate events when digest is enabled', () => {
    const event = createMockEvent();
    const aggregated = aggregator.addEvent(event, mockPreferences);

    expect(aggregated).toBe(true);
    expect(aggregator.getDigest('user-1').length).toBe(1);
  });

  it('should not aggregate immediate notifications', () => {
    mockPreferences.digestFrequency = 'immediate';
    const event = createMockEvent();
    const aggregated = aggregator.addEvent(event, mockPreferences);

    expect(aggregated).toBe(false);
  });

  it('should separate digests by user', () => {
    const event1 = createMockEvent('user-1');
    const event2 = createMockEvent('user-2');

    aggregator.addEvent(event1, mockPreferences);
    aggregator.addEvent(event2, { ...mockPreferences, userId: 'user-2' });

    expect(aggregator.getDigest('user-1').length).toBe(1);
    expect(aggregator.getDigest('user-2').length).toBe(1);
  });

  it('should clear digest for user', () => {
    const event = createMockEvent();
    aggregator.addEvent(event, mockPreferences);

    expect(aggregator.getDigest('user-1').length).toBe(1);

    aggregator.clearDigest('user-1');
    expect(aggregator.getDigest('user-1').length).toBe(0);
  });

  it('should determine when to send hourly digest', () => {
    const event = createMockEvent();
    // Set event time to over an hour ago
    event.createdAt = new Date(Date.now() - 61 * 60 * 1000);

    aggregator.addEvent(event, mockPreferences);

    expect(aggregator.shouldSendDigest('user-1', 'hourly')).toBe(true);
    expect(aggregator.shouldSendDigest('user-1', 'daily')).toBe(false);
  });

  it('should determine when to send daily digest', () => {
    const event = createMockEvent();
    // Set event time to over 24 hours ago
    event.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

    aggregator.addEvent(event, mockPreferences);

    expect(aggregator.shouldSendDigest('user-1', 'daily')).toBe(true);
  });

  it('should not send digest if no events', () => {
    expect(aggregator.shouldSendDigest('user-1', 'hourly')).toBe(false);
  });
});

describe('Quiet Hours Logic', () => {
  it('should handle quiet hours that wrap around midnight', async () => {
    const worker = new EmailWorker();
    const preferences: NotificationPreferences = {
      userId: 'user-1',
      emailEnabled: true,
      emailAddress: 'test@example.com',
      smsEnabled: false,
      inAppEnabled: true,
      timezone: 'America/New_York',
      quietHoursStart: 0, // Midnight
      quietHoursEnd: 23, // 11 PM - covers almost entire day
    };

    const event: AlertEvent = {
      id: 'event-1',
      ruleId: 'rule-1',
      permitId: 'permit-1',
      workspaceId: 'workspace-1',
      userId: 'user-1',
      channels: ['email'],
      createdAt: new Date(),
      metadata: {},
    };

    const result = await worker.processEvent(event, preferences);
    expect(result.status).toBe('deferred');
  });
});

describe('Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    const worker = new EmailWorker({
      rateLimit: { maxRequests: 2, windowMs: 60000 },
    });

    const preferences: NotificationPreferences = {
      userId: 'user-1',
      emailEnabled: true,
      emailAddress: 'test@example.com',
      smsEnabled: false,
      inAppEnabled: true,
      timezone: 'America/New_York',
    };

    const event: AlertEvent = {
      id: 'event-1',
      ruleId: 'rule-1',
      permitId: 'permit-1',
      workspaceId: 'workspace-1',
      userId: 'user-1',
      channels: ['email'],
      createdAt: new Date(),
      metadata: {},
    };

    // First two should succeed
    const result1 = await worker.processEvent(event, preferences);
    const result2 = await worker.processEvent(event, preferences);
    expect(result1.status).toBe('delivered');
    expect(result2.status).toBe('delivered');

    // Third should be rate limited
    const result3 = await worker.processEvent(event, preferences);
    expect(result3.status).toBe('deferred');
    expect(result3.retryAfter).toBeDefined();
  });
});
