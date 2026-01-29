/**
 * Notification system type definitions
 */

type UUID = string;

/**
 * Alert event triggered when a permit matches a rule
 */
export interface AlertEvent {
  id: UUID;
  ruleId: UUID;
  permitId: UUID;
  workspaceId: UUID;
  userId: UUID;
  channels: NotificationChannelType[];
  createdAt: Date;
  metadata: Record<string, unknown>;
}

/**
 * Notification channel types
 */
export type NotificationChannelType = 'email' | 'sms' | 'in_app';

/**
 * Notification record for tracking delivery
 */
export interface Notification {
  id: UUID;
  eventId: UUID;
  userId: UUID;
  channel: NotificationChannelType;
  status: NotificationStatus;
  attempts: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification delivery status
 */
export type NotificationStatus =
  | 'pending'
  | 'processing'
  | 'delivered'
  | 'failed'
  | 'deferred';

/**
 * Result of a delivery attempt
 */
export interface DeliveryResult {
  success: boolean;
  status: NotificationStatus;
  error?: string;
  retryAfter?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: UUID;
  quietHoursStart?: number; // 0-23 hour
  quietHoursEnd?: number; // 0-23 hour
  timezone: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  digestFrequency?: 'immediate' | 'hourly' | 'daily';
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Email template data
 */
export interface EmailTemplateData {
  subject: string;
  body: string;
  html?: string;
}

/**
 * SMS message data
 */
export interface SMSData {
  body: string;
}

/**
 * In-app notification data
 */
export interface InAppData {
  title: string;
  body: string;
  actionUrl?: string;
  icon?: string;
}

/**
 * Worker configuration
 */
export interface WorkerConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  rateLimit: RateLimitConfig;
}

/**
 * Digest aggregation configuration
 */
export interface DigestConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily';
  maxEvents: number;
}
