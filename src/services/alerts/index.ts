/**
 * Alert Service with Free Tier Limits
 */

import { LimitsEnforcer } from '../limits';

export interface AlertCreateRequest {
  title: string;
  message: string;
  aoiId: string;
  workspaceId: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  aoiId: string;
  workspaceId: string;
  sentAt: Date;
  createdAt: Date;
}

export class AlertService {
  private limitsEnforcer: LimitsEnforcer;

  constructor() {
    this.limitsEnforcer = new LimitsEnforcer();
  }

  /**
   * Send an alert with limit enforcement
   */
  async sendAlert(request: AlertCreateRequest): Promise<Alert> {
    // Check alert limit before sending
    await this.limitsEnforcer.enforceLimit(
      request.workspaceId as `${string}-${string}-${string}-${string}-${string}`,
      'alerts'
    );

    // Create and send alert
    const alert: Alert = {
      id: crypto.randomUUID(),
      title: request.title,
      message: request.message,
      aoiId: request.aoiId,
      workspaceId: request.workspaceId,
      sentAt: new Date(),
      createdAt: new Date(),
    };

    await this.saveAlert(alert);

    // Increment usage after successful send
    await this.limitsEnforcer.incrementUsage(
      request.workspaceId as `${string}-${string}-${string}-${string}-${string}`,
      'alerts'
    );

    return alert;
  }

  /**
   * Get alert count for workspace in current period
   */
  async getAlertCount(_workspaceId: string): Promise<number> {
    // TODO: Implement database query for current month
    return 0;
  }

  /**
   * List alerts for workspace
   */
  async listAlerts(_workspaceId: string): Promise<Alert[]> {
    // TODO: Implement database query
    return [];
  }

  private async saveAlert(alert: Alert): Promise<void> {
    // TODO: Implement database insert
    console.log('Saving alert:', alert.id);
  }
}

export default AlertService;
