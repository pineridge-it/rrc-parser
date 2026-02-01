import {
  NotificationPreferences,
  QuietHours,
  DigestPreferences,
  DigestFrequency,
  QueuedAlert,
} from '../../types/notifications';
import { asUUID } from '../../types/common';

export interface CreatePreferencesRequest {
  userId: string;
  workspaceId: string;
  quietHours?: Partial<QuietHours>;
  digest?: Partial<DigestPreferences>;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
}

export interface UpdatePreferencesRequest {
  quietHours?: Partial<QuietHours>;
  digest?: Partial<DigestPreferences>;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
}

/**
 * Service for managing notification preferences including quiet hours and digest settings
 */
export class NotificationPreferencesService {
  /**
   * Get notification preferences for a user in a workspace
   */
  async getPreferences(
    userId: string,
    workspaceId: string
  ): Promise<NotificationPreferences | null> {
    // TODO: Implement database query
    // For now, return default preferences
    return this.getDefaultPreferences(userId, workspaceId);
  }

  /**
   * Create notification preferences for a user
   */
  async createPreferences(
    request: CreatePreferencesRequest
  ): Promise<NotificationPreferences> {
    const preferences: NotificationPreferences = {
      userId: asUUID(request.userId),
      workspaceId: asUUID(request.workspaceId),
      quietHours: {
        enabled: request.quietHours?.enabled ?? false,
        startTime: request.quietHours?.startTime ?? '22:00',
        endTime: request.quietHours?.endTime ?? '08:00',
        timezone: request.quietHours?.timezone ?? 'America/New_York',
      },
      digest: {
        frequency: request.digest?.frequency ?? 'immediate',
        dailyTime: request.digest?.dailyTime ?? '09:00',
        weeklyDay: request.digest?.weeklyDay ?? 1, // Monday
        weeklyTime: request.digest?.weeklyTime ?? '09:00',
        timezone: request.digest?.timezone ?? 'America/New_York',
      },
      emailEnabled: request.emailEnabled ?? true,
      pushEnabled: request.pushEnabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.savePreferences(preferences);
    return preferences;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    workspaceId: string,
    request: UpdatePreferencesRequest
  ): Promise<NotificationPreferences> {
    const existing = await this.getPreferences(userId, workspaceId);
    if (!existing) {
      throw new Error('Notification preferences not found');
    }

    const updated: NotificationPreferences = {
      ...existing,
      quietHours: {
        ...existing.quietHours,
        ...(request.quietHours || {}),
      },
      digest: {
        ...existing.digest,
        ...(request.digest || {}),
      },
      emailEnabled: request.emailEnabled ?? existing.emailEnabled,
      pushEnabled: request.pushEnabled ?? existing.pushEnabled,
      updatedAt: new Date(),
    };

    await this.savePreferences(updated);
    return updated;
  }

  /**
   * Check if current time is within quiet hours for a user
   */
  isInQuietHours(quietHours: QuietHours): boolean {
    if (!quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const userTimezone = quietHours.timezone;
    
    // Get current time in user's timezone
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Minutes since midnight

    // Parse quiet hours
    const [startHour, startMinute] = quietHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = quietHours.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle case where quiet hours span midnight (e.g., 22:00 - 08:00)
    if (startTime > endTime) {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      // Quiet hours within same day
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * Queue an alert to be sent later (during quiet hours or for digest)
   */
  async queueAlert(alert: Omit<QueuedAlert, 'id' | 'createdAt'>): Promise<QueuedAlert> {
    const queuedAlert: QueuedAlert = {
      ...alert,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    await this.saveQueuedAlert(queuedAlert);
    return queuedAlert;
  }

  /**
   * Get queued alerts for a user that haven't been sent yet
   */
  async getQueuedAlerts(userId: string, workspaceId: string): Promise<QueuedAlert[]> {
    // TODO: Implement database query
    return [];
  }

  /**
   * Get queued alerts ready for digest
   */
  async getQueuedAlertsForDigest(
    userId: string,
    workspaceId: string,
    frequency: DigestFrequency
  ): Promise<QueuedAlert[]> {
    // TODO: Implement database query
    return [];
  }

  /**
   * Mark alerts as sent in digest
   */
  async markAlertsAsSentInDigest(alertIds: string[]): Promise<void> {
    // TODO: Implement database update
    console.log('Marking alerts as sent in digest:', alertIds);
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(
    userId: string,
    workspaceId: string
  ): NotificationPreferences {
    return {
      userId: asUUID(userId),
      workspaceId: asUUID(workspaceId),
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'America/New_York',
      },
      digest: {
        frequency: 'immediate',
        dailyTime: '09:00',
        weeklyDay: 1, // Monday
        weeklyTime: '09:00',
        timezone: 'America/New_York',
      },
      emailEnabled: true,
      pushEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Save preferences to database
   */
  private async savePreferences(preferences: NotificationPreferences): Promise<void> {
    // TODO: Implement database insert/update
    console.log('Saving notification preferences:', preferences.userId);
  }

  /**
   * Save queued alert to database
   */
  private async saveQueuedAlert(alert: QueuedAlert): Promise<void> {
    // TODO: Implement database insert
    console.log('Saving queued alert:', alert.id);
  }
}

export default NotificationPreferencesService;
