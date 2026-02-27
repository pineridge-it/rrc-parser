/**
 * AlertNotificationService - Handles alert notifications through multiple channels
 */

import { Alert, AlertSeverity } from './types';

export interface NotificationChannel {
  name: string;
  enabled: boolean;
  send(alert: Alert): Promise<boolean>;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  fromAddress: string;
  toAddresses: string[];
}

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
}

export interface PagerDutyConfig {
  integrationKey: string;
  serviceName: string;
}

export interface AlertNotificationConfig {
  email?: EmailConfig;
  slack?: SlackConfig;
  pagerDuty?: PagerDutyConfig;
  minSeverity: AlertSeverity;
  throttleMinutes: number;
  enabledChannels: string[];
}

export const DEFAULT_NOTIFICATION_CONFIG: AlertNotificationConfig = {
  minSeverity: 'warning',
  throttleMinutes: 5,
  enabledChannels: ['email', 'slack'],
};

/**
 * Email notification channel
 */
export class EmailChannel implements NotificationChannel {
  name = 'email';
  enabled = true;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async send(alert: Alert): Promise<boolean> {
    // TODO: Implement actual email sending using nodemailer or similar
    console.log(`[Email] Alert ${alert.severity}: ${alert.message}`);
    console.log(`  To: ${this.config.toAddresses.join(', ')}`);
    return true;
  }
}

/**
 * Slack notification channel
 */
export class SlackChannel implements NotificationChannel {
  name = 'slack';
  enabled = true;
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  async send(alert: Alert): Promise<boolean> {
    const color = alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'good';
    
    const payload = {
      channel: this.config.channel,
      username: this.config.username || 'ETL Monitor',
      attachments: [
        {
          color,
          title: `ETL Alert: ${alert.severity.toUpperCase()}`,
          text: alert.message,
          fields: [
            { title: 'Metric', value: alert.metric, short: true },
            { title: 'Current Value', value: String(alert.currentValue), short: true },
            { title: 'Threshold', value: String(alert.threshold), short: true },
            { title: 'Alert ID', value: alert.id, short: true },
          ],
          footer: 'ETL Monitoring System',
          ts: Math.floor(alert.triggeredAt.getTime() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  }
}

/**
 * PagerDuty notification channel for critical alerts
 */
export class PagerDutyChannel implements NotificationChannel {
  name = 'pagerduty';
  enabled = true;
  private config: PagerDutyConfig;

  constructor(config: PagerDutyConfig) {
    this.config = config;
  }

  async send(alert: Alert): Promise<boolean> {
    // Only send critical alerts to PagerDuty
    if (alert.severity !== 'critical') {
      return true;
    }

    const payload = {
      routing_key: this.config.integrationKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: alert.message,
        severity: 'critical',
        source: 'etl-monitoring',
        component: alert.metric,
        custom_details: {
          current_value: alert.currentValue,
          threshold: alert.threshold,
          alert_id: alert.id,
        },
      },
    };

    try {
      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to send PagerDuty notification:', error);
      return false;
    }
  }
}

/**
 * Console notification channel for development/debugging
 */
export class ConsoleChannel implements NotificationChannel {
  name = 'console';
  enabled = true;

  async send(alert: Alert): Promise<boolean> {
    const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵';
    console.log(`${icon} [${alert.severity.toUpperCase()}] ${alert.message}`);
    console.log(`   Metric: ${alert.metric} | Current: ${alert.currentValue} | Threshold: ${alert.threshold}`);
    return true;
  }
}

/**
 * Main notification service that manages all channels
 */
export class AlertNotificationService {
  private channels: Map<string, NotificationChannel> = new Map();
  private config: AlertNotificationConfig;
  private lastNotificationTime: Map<string, Date> = new Map();

  constructor(config: Partial<AlertNotificationConfig> = {}) {
    this.config = { ...DEFAULT_NOTIFICATION_CONFIG, ...config };
    this.initializeChannels();
  }

  private initializeChannels(): void {
    // Always add console channel for visibility
    this.channels.set('console', new ConsoleChannel());

    if (this.config.email) {
      this.channels.set('email', new EmailChannel(this.config.email));
    }

    if (this.config.slack) {
      this.channels.set('slack', new SlackChannel(this.config.slack));
    }

    if (this.config.pagerDuty) {
      this.channels.set('pagerduty', new PagerDutyChannel(this.config.pagerDuty));
    }
  }

  /**
   * Send alert through all enabled channels
   */
  async sendAlert(alert: Alert): Promise<void> {
    // Check severity threshold
    if (!this.shouldNotifyForSeverity(alert.severity)) {
      return;
    }

    // Check throttling
    if (this.isThrottled(alert)) {
      console.log(`Alert ${alert.id} throttled`);
      return;
    }

    const results = await Promise.allSettled(
      Array.from(this.channels.entries())
        .filter(([name, channel]) => 
          this.config.enabledChannels.includes(name) && channel.enabled
        )
        .map(async ([name, channel]) => {
          const success = await channel.send(alert);
          return { channel: name, success };
        })
    );

    // Record notification time for throttling
    this.lastNotificationTime.set(alert.metric, new Date());

    // Log results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        console.log(`Notification to ${result.value.channel}: ${result.value.success ? 'sent' : 'failed'}`);
      } else {
        console.error(`Notification failed:`, result.reason);
      }
    });
  }

  /**
   * Check if alert should be sent based on severity configuration
   */
  private shouldNotifyForSeverity(severity: AlertSeverity): boolean {
    const severityLevels: Record<AlertSeverity, number> = {
      info: 0,
      warning: 1,
      critical: 2,
    };

    return severityLevels[severity] >= severityLevels[this.config.minSeverity];
  }

  /**
   * Check if alert is throttled
   */
  private isThrottled(alert: Alert): boolean {
    const lastTime = this.lastNotificationTime.get(alert.metric);
    if (!lastTime) return false;

    const throttleMs = this.config.throttleMinutes * 60 * 1000;
    return Date.now() - lastTime.getTime() < throttleMs;
  }

  /**
   * Add a custom notification channel
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
  }

  /**
   * Enable/disable a channel
   */
  setChannelEnabled(name: string, enabled: boolean): void {
    const channel = this.channels.get(name);
    if (channel) {
      channel.enabled = enabled;
    }
  }

  /**
   * Get list of available channels
   */
  getChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AlertNotificationConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeChannels();
  }
}

// Export singleton instance
export const alertNotificationService = new AlertNotificationService();
