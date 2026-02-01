/**
 * Types for notification preferences including quiet hours and digest settings
 */

export type DigestFrequency = 'immediate' | 'daily' | 'weekly';

export interface QuietHours {
  enabled: boolean;
  startTime: string; // Format: "HH:mm" (24-hour)
  endTime: string;   // Format: "HH:mm" (24-hour)
  timezone: string;  // IANA timezone identifier (e.g., "America/New_York")
}

export interface DigestPreferences {
  frequency: DigestFrequency;
  dailyTime?: string;  // Format: "HH:mm" - when to send daily digest
  weeklyDay?: number;  // 0-6 (Sunday-Saturday) - day to send weekly digest
  weeklyTime?: string; // Format: "HH:mm" - when to send weekly digest
  timezone: string;
}

export interface NotificationPreferences {
  userId: string;
  workspaceId: string;
  quietHours: QuietHours;
  digest: DigestPreferences;
  emailEnabled: boolean;
  pushEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueuedAlert {
  id: string;
  userId: string;
  workspaceId: string;
  alertId: string;
  title: string;
  message: string;
  aoiId: string;
  permitId?: string;
  createdAt: Date;
  queuedDuringQuietHours: boolean;
  sentInDigest: boolean;
}

export interface DigestEmail {
  id: string;
  userId: string;
  workspaceId: string;
  frequency: DigestFrequency;
  alerts: QueuedAlert[];
  sentAt?: Date;
  createdAt: Date;
}
