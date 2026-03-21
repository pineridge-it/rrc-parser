/**
 * Alert Service with Free Tier Limits
 */

import { LimitsEnforcer } from '../limits';
import { asUUID, UUID } from '../../types/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { createDatabaseClient } from '../../lib/database';
import { createLogger } from '../logger';
import { Logger } from '../../types/logging';

export interface AlertCreateRequest {
  title: string;
  message: string;
  aoiId?: string;
  permitId?: string;
  alertRuleId?: string;
  workspaceId: string;
  channels?: string[];
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  aoiId?: string;
  permitId?: string;
  alertRuleId?: string;
  workspaceId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  channels: string[];
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface AlertDelivery {
  id: string;
  alertId: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  providerMessageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
}

export interface ListAlertsOptions {
  limit?: number;
  offset?: number;
  status?: Alert['status'];
  startDate?: Date;
  endDate?: Date;
}

export class AlertService {
  private limitsEnforcer: LimitsEnforcer;
  private supabase: SupabaseClient;
  private logger: Logger;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase ?? createDatabaseClient();
    this.limitsEnforcer = new LimitsEnforcer();
    this.logger = createLogger({ service: 'alert-service' });
  }

  async sendAlert(request: AlertCreateRequest): Promise<Alert> {
    const validatedWorkspaceId = asUUID(request.workspaceId);

    await this.limitsEnforcer.enforceLimit(
      validatedWorkspaceId,
      'alerts'
    );

    const alert: Alert = {
      id: crypto.randomUUID(),
      title: request.title,
      message: request.message,
      aoiId: request.aoiId,
      permitId: request.permitId,
      alertRuleId: request.alertRuleId,
      workspaceId: request.workspaceId,
      status: 'pending',
      channels: request.channels ?? ['in_app'],
      createdAt: new Date(),
    };

    const savedAlert = await this.saveAlert(alert);

    await this.limitsEnforcer.incrementUsage(
      validatedWorkspaceId,
      'alerts'
    );

    return savedAlert;
  }

  async getAlertCount(workspaceId: string, startDate?: Date, endDate?: Date): Promise<number> {
    const start = startDate ?? this.getCurrentPeriodStart();
    const end = endDate ?? new Date();

    const { count, error } = await this.supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) {
      this.logger.error(`Failed to get alert count: ${error.message}`);
      return 0;
    }

    return count ?? 0;
  }

  async listAlerts(workspaceId: string, options: ListAlertsOptions = {}): Promise<Alert[]> {
    const { limit = 50, offset = 0, status, startDate, endDate } = options;

    let query = this.supabase
      .from('alerts')
      .select('id, title, message, aoi_id, permit_id, alert_rule_id, workspace_id, status, channels, sent_at, delivered_at, created_at, metadata')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Failed to list alerts: ${error.message}`);
      return [];
    }

    return (data ?? []).map(this.mapAlertFromDb);
  }

  async getAlertById(alertId: string, workspaceId: string): Promise<Alert | null> {
    const { data, error } = await this.supabase
      .from('alerts')
      .select('id, title, message, aoi_id, permit_id, alert_rule_id, workspace_id, status, channels, sent_at, delivered_at, created_at, metadata')
      .eq('id', alertId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Failed to get alert by id: ${error.message}`);
      return null;
    }

    return data ? this.mapAlertFromDb(data) : null;
  }

  async updateAlertStatus(alertId: string, status: Alert['status'], metadata?: Record<string, unknown>): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { error } = await this.supabase
      .from('alerts')
      .update(updateData)
      .eq('id', alertId);

    if (error) {
      this.logger.error(`Failed to update alert status: ${error.message}`);
    }
  }

  async createAlertDelivery(alertId: string, channel: AlertDelivery['channel']): Promise<AlertDelivery | null> {
    const delivery = {
      id: crypto.randomUUID(),
      alert_id: alertId,
      channel,
      status: 'pending' as const,
    };

    const { data, error } = await this.supabase
      .from('alert_deliveries')
      .insert(delivery)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create alert delivery: ${error.message}`);
      return null;
    }

    return {
      id: data.id,
      alertId: data.alert_id,
      channel: data.channel,
      status: data.status,
      providerMessageId: data.provider_message_id,
      sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
      deliveredAt: data.delivered_at ? new Date(data.delivered_at) : undefined,
      errorMessage: data.error_message,
    };
  }

  async updateDeliveryStatus(deliveryId: string, status: AlertDelivery['status'], details?: { providerMessageId?: string; errorMessage?: string }): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    if (details?.providerMessageId) {
      updateData.provider_message_id = details.providerMessageId;
    }

    if (details?.errorMessage) {
      updateData.error_message = details.errorMessage;
    }

    const { error } = await this.supabase
      .from('alert_deliveries')
      .update(updateData)
      .eq('id', deliveryId);

    if (error) {
      this.logger.error(`Failed to update delivery status: ${error.message}`);
    }
  }

  async deleteOldAlerts(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await this.supabase
      .from('alerts')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      this.logger.error(`Failed to delete old alerts: ${error.message}`);
      return 0;
    }

    const deletedCount = data?.length ?? 0;
    this.logger.info(`Deleted ${deletedCount} alerts older than ${olderThanDays} days`);
    return deletedCount;
  }

  private async saveAlert(alert: Alert): Promise<Alert> {
    const dbAlert = {
      id: alert.id,
      workspace_id: alert.workspaceId,
      alert_rule_id: alert.alertRuleId,
      permit_id: alert.permitId,
      title: alert.title,
      message: alert.message,
      status: alert.status,
      channels: alert.channels,
      created_at: alert.createdAt.toISOString(),
      metadata: alert.metadata,
    };

    const { error } = await this.supabase
      .from('alerts')
      .insert(dbAlert);

    if (error) {
      this.logger.error(`Failed to save alert: ${error.message}`);
      throw new Error(`Failed to save alert: ${error.message}`);
    }

    this.logger.debug(`Saved alert ${alert.id} for workspace ${alert.workspaceId}`);
    return alert;
  }

  private mapAlertFromDb(data: Record<string, unknown>): Alert {
    return {
      id: data.id as string,
      title: data.title as string,
      message: data.message as string,
      aoiId: data.aoi_id as string | undefined,
      permitId: data.permit_id as string | undefined,
      alertRuleId: data.alert_rule_id as string | undefined,
      workspaceId: data.workspace_id as string,
      status: data.status as Alert['status'],
      channels: (data.channels as string[]) ?? [],
      sentAt: data.sent_at ? new Date(data.sent_at as string) : undefined,
      deliveredAt: data.delivered_at ? new Date(data.delivered_at as string) : undefined,
      createdAt: new Date(data.created_at as string),
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  }

  private getCurrentPeriodStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

export default AlertService;
