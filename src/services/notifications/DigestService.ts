import { EmailService } from '../email/EmailService';
import { NotificationPreferencesService } from './NotificationPreferencesService';
import {
  QueuedAlert,
  DigestFrequency,
  DigestEmail,
} from '../../types/notifications';

export interface DigestSendResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Service for managing and sending digest emails
 */
export class DigestService {
  private emailService: EmailService;
  private preferencesService: NotificationPreferencesService;

  constructor(
    emailService: EmailService,
    preferencesService: NotificationPreferencesService
  ) {
    this.emailService = emailService;
    this.preferencesService = preferencesService;
  }

  /**
   * Send daily digests to all users who have opted in
   */
  async sendDailyDigests(): Promise<DigestSendResult> {
    const result: DigestSendResult = {
      success: true,
      sentCount: 0,
      failedCount: 0,
      errors: [],
    };

    // TODO: Get all users with daily digest preference
    // For now, this is a placeholder implementation

    return result;
  }

  /**
   * Send weekly digests to all users who have opted in
   */
  async sendWeeklyDigests(): Promise<DigestSendResult> {
    const result: DigestSendResult = {
      success: true,
      sentCount: 0,
      failedCount: 0,
      errors: [],
    };

    // TODO: Get all users with weekly digest preference
    // For now, this is a placeholder implementation

    return result;
  }

  /**
   * Send a digest to a specific user
   */
  async sendDigestToUser(
    userId: string,
    workspaceId: string,
    frequency: DigestFrequency
  ): Promise<DigestEmail | null> {
    // Get queued alerts for this user
    const alerts = await this.preferencesService.getQueuedAlertsForDigest(
      userId,
      workspaceId,
      frequency
    );

    if (alerts.length === 0) {
      return null;
    }

    // Create digest email
    const digest: DigestEmail = {
      id: crypto.randomUUID(),
      userId,
      workspaceId,
      frequency,
      alerts,
      createdAt: new Date(),
    };

    // Send the digest email
    try {
      await this.sendDigestEmail(digest);
      
      // Mark alerts as sent
      await this.preferencesService.markAlertsAsSentInDigest(
        alerts.map(a => a.id)
      );

      return { ...digest, sentAt: new Date() };
    } catch (error) {
      console.error('Failed to send digest:', error);
      throw error;
    }
  }

  /**
   * Generate and send the digest email
   */
  private async sendDigestEmail(digest: DigestEmail): Promise<void> {
    const subject = this.generateDigestSubject(digest);
    const htmlBody = this.generateDigestHtml(digest);
    const textBody = this.generateDigestText(digest);

    // TODO: Get user email from user service
    const userEmail = 'user@example.com';

    await this.emailService.send({
      to: { email: userEmail },
      subject,
      htmlBody,
      textBody,
    });
  }

  /**
   * Generate digest email subject
   */
  private generateDigestSubject(digest: DigestEmail): string {
    const alertCount = digest.alerts.length;
    const frequencyLabel = digest.frequency === 'daily' ? 'Daily' : 'Weekly';
    
    if (alertCount === 1) {
      return `${frequencyLabel} Digest: 1 New Permit Alert`;
    }
    return `${frequencyLabel} Digest: ${alertCount} New Permit Alerts`;
  }

  /**
   * Generate HTML version of digest email
   */
  private generateDigestHtml(digest: DigestEmail): string {
    const alertCount = digest.alerts.length;
    const frequencyLabel = digest.frequency === 'daily' ? 'Daily' : 'Weekly';
    
    const alertsHtml = digest.alerts
      .map(
        (alert, index) => `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            ${index + 1}. ${alert.title}
          </div>
          <div style="color: #6b7280; font-size: 14px;">
            ${alert.message}
          </div>
          <div style="color: #9ca3af; font-size: 12px; margin-top: 8px;">
            ${new Date(alert.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Permit Alert Digest</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ${frequencyLabel} Digest
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                ${alertCount} new permit ${alertCount === 1 ? 'alert' : 'alerts'}
              </p>
            </td>
          </tr>
          
          <!-- Alerts -->
          <tr>
            <td style="padding: 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${alertsHtml}
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                You're receiving this because you have ${digest.frequency} digest notifications enabled.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                <a href="#" style="color: #4f46e5; text-decoration: none;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text version of digest email
   */
  private generateDigestText(digest: DigestEmail): string {
    const alertCount = digest.alerts.length;
    const frequencyLabel = digest.frequency === 'daily' ? 'Daily' : 'Weekly';
    
    const alertsText = digest.alerts
      .map(
        (alert, index) => `
${index + 1}. ${alert.title}
${alert.message}
Received: ${new Date(alert.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
`
      )
      .join('\n---\n');

    return `
${frequencyLabel.toUpperCase()} DIGEST
${alertCount} new permit ${alertCount === 1 ? 'alert' : 'alerts'}

${alertsText}

---
You're receiving this because you have ${digest.frequency} digest notifications enabled.
Manage notification preferences: [Link]
    `.trim();
  }
}

export default DigestService;
