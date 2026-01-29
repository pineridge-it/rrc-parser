/**
 * Notification Delivery Workers
 *
 * Background workers that process alert events and deliver notifications
 * via SMS, email, and in-app channels with retry logic and rate limiting.
 */

import {
  AlertEvent,
  Notification,
  NotificationChannelType,
  DeliveryResult,
  NotificationPreferences,
  WorkerConfig,
  EmailTemplateData,
  SMSData,
  InAppData,
} from '../../types/notification';

type UUID = string;

/**
 * Notification worker interface
 */
export interface NotificationWorker {
  /**
   * Process an alert event and deliver notification
   */
  processEvent(event: AlertEvent, preferences: NotificationPreferences): Promise<DeliveryResult>;

  /**
   * Retry a failed notification
   */
  retry(notification: Notification, preferences: NotificationPreferences): Promise<DeliveryResult>;

  /**
   * Get the channel type this worker handles
   */
  getChannelType(): NotificationChannelType;
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
  return delay;
}

/**
 * Check if current time is within quiet hours
 */
function isInQuietHours(preferences: NotificationPreferences): boolean {
  if (preferences.quietHoursStart === undefined || preferences.quietHoursEnd === undefined) {
    return false;
  }

  const now = new Date();
  // Get current hour in user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: preferences.timezone,
    hour: 'numeric',
    hour12: false,
  });
  const currentHour = parseInt(formatter.format(now), 10);

  if (preferences.quietHoursStart < preferences.quietHoursEnd) {
    // Simple range (e.g., 08:00 - 22:00)
    return currentHour >= preferences.quietHoursStart && currentHour < preferences.quietHoursEnd;
  } else {
    // Wraps around midnight (e.g., 22:00 - 06:00)
    return currentHour >= preferences.quietHoursStart || currentHour < preferences.quietHoursEnd;
  }
}

/**
 * Calculate when quiet hours end
 */
function getQuietHoursEnd(preferences: NotificationPreferences): Date {
  if (preferences.quietHoursEnd === undefined) {
    return new Date();
  }

  const now = new Date();
  // Get current time components in user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: preferences.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);

  const currentYear = getPart('year');
  const currentMonth = getPart('month');
  const currentDay = getPart('day');
  const currentHour = getPart('hour');

  // Determine target date
  let targetYear = currentYear;
  let targetMonth = currentMonth;
  let targetDay = currentDay;

  if (preferences.quietHoursStart !== undefined && preferences.quietHoursStart > preferences.quietHoursEnd) {
    // Quiet hours wrap around midnight
    if (currentHour < preferences.quietHoursEnd) {
      // We're in the morning part of quiet hours, end is today
    } else {
      // We're in the evening part, end is tomorrow
      targetDay++;
    }
  } else if (currentHour >= preferences.quietHoursEnd) {
    // Quiet hours end has passed for today
    targetDay++;
  }

  // Handle month/year rollover
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  if (targetDay > daysInMonth) {
    targetDay = 1;
    targetMonth++;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear++;
    }
  }

  // Create target date in user's timezone, then convert to UTC
  const targetDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T${String(preferences.quietHoursEnd).padStart(2, '0')}:00:00`;
  return new Date(targetDateStr);
}

/**
 * Simple rate limiter
 */
class RateLimiter {
  private requests: number[] = [];
  private config: WorkerConfig['rateLimit'];

  constructor(config: WorkerConfig['rateLimit']) {
    this.config = config;
  }

  async checkLimit(): Promise<{ allowed: boolean; retryAfter?: Date }> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(ts => ts > windowStart);

    if (this.requests.length >= this.config.maxRequests) {
      const oldestRequest = this.requests[0];
      if (!oldestRequest) {
        return { allowed: true };
      }
      const retryAfter = new Date(oldestRequest + this.config.windowMs);
      return { allowed: false, retryAfter };
    }

    this.requests.push(now);
    return { allowed: true };
  }

  reset(): void {
    this.requests = [];
  }
}

/**
 * Email worker using SendGrid API
 */
export class EmailWorker implements NotificationWorker {
  private config: WorkerConfig;
  private rateLimiter: RateLimiter;
  private sendGridApiKey?: string;

  constructor(config?: Partial<WorkerConfig>, sendGridApiKey?: string) {
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      baseDelayMs: config?.baseDelayMs ?? 1000,
      maxDelayMs: config?.maxDelayMs ?? 60000,
      rateLimit: config?.rateLimit ?? { maxRequests: 100, windowMs: 60000 },
    };
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.sendGridApiKey = sendGridApiKey;
  }

  getChannelType(): NotificationChannelType {
    return 'email';
  }

  async processEvent(
    event: AlertEvent,
    preferences: NotificationPreferences
  ): Promise<DeliveryResult> {
    // Check if email is enabled
    if (!preferences.emailEnabled) {
      return {
        success: false,
        status: 'failed',
        error: 'Email notifications disabled',
      };
    }

    if (!preferences.emailAddress) {
      return {
        success: false,
        status: 'failed',
        error: 'No email address configured',
      };
    }

    // Check quiet hours
    if (isInQuietHours(preferences)) {
      return {
        success: false,
        status: 'deferred',
        retryAfter: getQuietHoursEnd(preferences),
      };
    }

    // Check rate limit
    const rateLimitCheck = await this.rateLimiter.checkLimit();
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        status: 'deferred',
        retryAfter: rateLimitCheck.retryAfter,
      };
    }

    try {
      await this.sendEmail(preferences.emailAddress, this.buildTemplate(event));

      return {
        success: true,
        status: 'delivered',
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async retry(
    notification: Notification,
    _preferences: NotificationPreferences
  ): Promise<DeliveryResult> {
    if (notification.attempts >= this.config.maxRetries) {
      return {
        success: false,
        status: 'failed',
        error: 'Max retries exceeded',
      };
    }

    // Exponential backoff
    const delay = calculateBackoff(
      notification.attempts + 1,
      this.config.baseDelayMs,
      this.config.maxDelayMs
    );
    await new Promise(resolve => setTimeout(resolve, delay));

    // Reconstruct event from notification metadata
    const event = notification.metadata.event as AlertEvent;
    return this.processEvent(event, _preferences);
  }

  private buildTemplate(event: AlertEvent): EmailTemplateData {
    return {
      subject: `Alert: New permit match for rule ${event.ruleId}`,
      body: `A new permit (${event.permitId}) has matched your alert rule.`,
      html: `<p>A new permit has matched your alert rule.</p>`,
    };
  }

  private async sendEmail(to: string, template: EmailTemplateData): Promise<void> {
    // In production, this would call SendGrid API
    // For now, simulate the API call
    if (!this.sendGridApiKey) {
      // Mock implementation for testing
      return;
    }

    // Actual SendGrid integration would go here
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'alerts@example.com' },
        subject: template.subject,
        content: [
          { type: 'text/plain', value: template.body },
          { type: 'text/html', value: template.html },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`);
    }
  }
}

/**
 * SMS worker using Twilio API
 */
export class SMSWorker implements NotificationWorker {
  private config: WorkerConfig;
  private rateLimiter: RateLimiter;
  private twilioAccountSid?: string;
  private twilioAuthToken?: string;

  constructor(
    config?: Partial<WorkerConfig>,
    twilioAccountSid?: string,
    twilioAuthToken?: string
  ) {
    this.config = {
      maxRetries: config?.maxRetries ?? 2,
      baseDelayMs: config?.baseDelayMs ?? 1000,
      maxDelayMs: config?.maxDelayMs ?? 30000,
      rateLimit: config?.rateLimit ?? { maxRequests: 10, windowMs: 60000 },
    };
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.twilioAccountSid = twilioAccountSid;
    this.twilioAuthToken = twilioAuthToken;
  }

  getChannelType(): NotificationChannelType {
    return 'sms';
  }

  async processEvent(
    event: AlertEvent,
    preferences: NotificationPreferences
  ): Promise<DeliveryResult> {
    // Check if SMS is enabled
    if (!preferences.smsEnabled) {
      return {
        success: false,
        status: 'failed',
        error: 'SMS notifications disabled',
      };
    }

    if (!preferences.phoneNumber) {
      return {
        success: false,
        status: 'failed',
        error: 'No phone number configured',
      };
    }

    // Check quiet hours
    if (isInQuietHours(preferences)) {
      return {
        success: false,
        status: 'deferred',
        retryAfter: getQuietHoursEnd(preferences),
      };
    }

    // Check rate limit
    const rateLimitCheck = await this.rateLimiter.checkLimit();
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        status: 'deferred',
        retryAfter: rateLimitCheck.retryAfter,
      };
    }

    try {
      const message = this.buildMessage(event);
      await this.sendSMS(preferences.phoneNumber, message);

      return {
        success: true,
        status: 'delivered',
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async retry(
    notification: Notification,
    _preferences: NotificationPreferences
  ): Promise<DeliveryResult> {
    if (notification.attempts >= this.config.maxRetries) {
      return {
        success: false,
        status: 'failed',
        error: 'Max retries exceeded - fallback to email recommended',
      };
    }

    // Exponential backoff
    const delay = calculateBackoff(
      notification.attempts + 1,
      this.config.baseDelayMs,
      this.config.maxDelayMs
    );
    await new Promise(resolve => setTimeout(resolve, delay));

    const event = notification.metadata.event as AlertEvent;
    return this.processEvent(event, _preferences);
  }

  private buildMessage(event: AlertEvent): SMSData {
    return {
      body: `Alert: Permit ${event.permitId.slice(0, 8)} matched your rule.`,
    };
  }

  private async sendSMS(to: string, message: SMSData): Promise<void> {
    if (!this.twilioAccountSid || !this.twilioAuthToken) {
      // Mock implementation for testing
      return;
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${this.twilioAccountSid}:${this.twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: 'YOUR_TWILIO_NUMBER',
          Body: message.body,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`);
    }
  }
}

/**
 * In-app notification worker
 */
export class InAppWorker implements NotificationWorker {
  private notificationStore: Map<UUID, Notification> = new Map();

  constructor(_config?: Partial<WorkerConfig>) {
    // In-app notifications don't need configuration
  }

  getChannelType(): NotificationChannelType {
    return 'in_app';
  }

  async processEvent(
    event: AlertEvent,
    preferences: NotificationPreferences
  ): Promise<DeliveryResult> {
    if (!preferences.inAppEnabled) {
      return {
        success: false,
        status: 'failed',
        error: 'In-app notifications disabled',
      };
    }

    try {
      const notification = await this.createNotification(event.userId, {
        title: 'New Permit Alert',
        body: `Permit ${event.permitId.slice(0, 8)} matched your rule`,
        actionUrl: `/permits/${event.permitId}`,
      });

      return {
        success: true,
        status: 'delivered',
        metadata: { notificationId: notification.id },
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async retry(
    _notification: Notification,
    _preferences: NotificationPreferences
  ): Promise<DeliveryResult> {
    // In-app notifications always succeed on first attempt
    // Retry is essentially a no-op
    return {
      success: true,
      status: 'delivered',
    };
  }

  private async createNotification(userId: UUID, data: InAppData): Promise<Notification> {
    const id = crypto.randomUUID();
    const notification: Notification = {
      id,
      eventId: '',
      userId,
      channel: 'in_app',
      status: 'delivered',
      attempts: 1,
      deliveredAt: new Date(),
      metadata: { data },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notificationStore.set(id, notification);
    return notification;
  }

  // For testing purposes
  getNotification(id: UUID): Notification | undefined {
    return this.notificationStore.get(id);
  }

  clearNotifications(): void {
    this.notificationStore.clear();
  }
}

/**
 * Dispatcher worker that routes events to channel workers
 */
export class DispatcherWorker {
  private workers: Map<NotificationChannelType, NotificationWorker> = new Map();
  private notificationStore: Map<UUID, Notification> = new Map();

  constructor() {
    // Register default workers
    this.registerWorker(new EmailWorker());
    this.registerWorker(new SMSWorker());
    this.registerWorker(new InAppWorker());
  }

  registerWorker(worker: NotificationWorker): void {
    this.workers.set(worker.getChannelType(), worker);
  }

  async dispatch(
    event: AlertEvent,
    preferences: NotificationPreferences
  ): Promise<Map<NotificationChannelType, DeliveryResult>> {
    const results = new Map<NotificationChannelType, DeliveryResult>();

    for (const channel of event.channels) {
      const worker = this.workers.get(channel);
      if (!worker) {
        results.set(channel, {
          success: false,
          status: 'failed',
          error: `No worker registered for channel: ${channel}`,
        });
        continue;
      }

      const result = await worker!.processEvent(event, preferences);
      results.set(channel, result);

      // Create notification record for tracking
      if (result.status !== 'failed' || result.success === false) {
        await this.createNotificationRecord(event, channel, result);
      }
    }

    return results;
  }

  async processPendingNotifications(
    preferences: NotificationPreferences
  ): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];

    for (const notification of this.notificationStore.values()) {
      if (notification.status === 'deferred' || notification.status === 'failed') {
        const worker = this.workers.get(notification.channel);
        if (worker) {
          const result = await worker.retry(notification, preferences);
          results.push(result);

          // Update notification record
          notification.status = result.status;
          notification.attempts++;
          notification.lastAttemptAt = new Date();
          if (result.success) {
            notification.deliveredAt = new Date();
          }
          notification.updatedAt = new Date();
        }
      }
    }

    return results;
  }

  private async createNotificationRecord(
    event: AlertEvent,
    channel: NotificationChannelType,
    result: DeliveryResult
  ): Promise<Notification> {
    const id = crypto.randomUUID();
    const notification: Notification = {
      id,
      eventId: event.id,
      userId: event.userId,
      channel,
      status: result.status,
      attempts: result.status === 'delivered' ? 1 : 0,
      deliveredAt: result.status === 'delivered' ? new Date() : undefined,
      metadata: { event },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notificationStore.set(id, notification);
    return notification;
  }

  // For testing purposes
  getNotification(id: UUID): Notification | undefined {
    return this.notificationStore.get(id);
  }

  getAllNotifications(): Notification[] {
    return Array.from(this.notificationStore.values());
  }

  clearNotifications(): void {
    this.notificationStore.clear();
  }
}

/**
 * Digest aggregator for batching notifications
 */
export class DigestAggregator {
  private pendingEvents: Map<UUID, AlertEvent[]> = new Map();

  addEvent(event: AlertEvent, preferences: NotificationPreferences): boolean {
    if (preferences.digestFrequency === 'immediate') {
      return false; // Don't aggregate immediate notifications
    }

    const userEvents = this.pendingEvents.get(event.userId) || [];
    userEvents.push(event);
    this.pendingEvents.set(event.userId, userEvents);
    return true;
  }

  getDigest(userId: UUID): AlertEvent[] {
    return this.pendingEvents.get(userId) || [];
  }

  clearDigest(userId: UUID): void {
    this.pendingEvents.delete(userId);
  }

  shouldSendDigest(userId: UUID, frequency: 'hourly' | 'daily'): boolean {
    const events = this.pendingEvents.get(userId);
    if (!events || events.length === 0) {
      return false;
    }

    const oldestEvent = events[0];
    if (!oldestEvent) {
      return false;
    }
    const now = new Date();
    const ageMs = now.getTime() - oldestEvent.createdAt.getTime();

    if (frequency === 'hourly') {
      return ageMs >= 60 * 60 * 1000; // 1 hour
    } else {
      return ageMs >= 24 * 60 * 60 * 1000; // 24 hours
    }
  }
}
