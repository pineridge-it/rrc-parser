import { createDatabaseClient } from '../../lib/database';
import { SupabaseClient } from '@supabase/supabase-js';

interface AlertEvent {
  id: string;
  subscription_id: string;
  permit_api_number: string;
  old_status: string;
  new_status: string;
  detected_at: string;
  notified_at: string | null;
  notification_status: string;
}

interface AlertSubscription {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  trigger_type: string;
  permit_api_number: string | null;
  saved_search_id: string | null;
  watched_statuses: string[];
  notify_channels: string[];
  is_active: boolean;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface Workspace {
  id: string;
  name: string;
}

/**
 * Alert Notification Service
 * Delivers alert notifications to users via their preferred channels
 */
export class AlertNotificationService {
  private db: SupabaseClient;

  constructor() {
    this.db = createDatabaseClient();
  }

  /**
   * Deliver pending alert notifications
   */
  async deliverNotifications(): Promise<void> {
    try {
      // Get all pending alert events
      const pendingEvents = await this.getPendingEvents();
      
      // For each event, deliver notifications
      for (const event of pendingEvents) {
        await this.deliverEventNotification(event);
      }
      
      console.log(`Delivered notifications for ${pendingEvents.length} alert events`);
    } catch (error) {
      console.error('Error delivering notifications:', error);
      throw error;
    }
  }

  /**
   * Get all pending alert events
   */
  private async getPendingEvents(): Promise<AlertEvent[]> {
    try {
      const { data, error } = await this.db
        .from('permit_alert_events')
        .select('*')
        .eq('notification_status', 'pending')
        .limit(100); // Process in batches to avoid memory issues
      
      if (error) {
        throw new Error(`Failed to fetch pending events: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching pending events:', error);
      throw error;
    }
  }

  /**
   * Deliver notification for a single alert event
   */
  private async deliverEventNotification(event: AlertEvent): Promise<void> {
    try {
      // Get the alert subscription
      const subscription = await this.getSubscription(event.subscription_id);
      if (!subscription) {
        console.warn(`Subscription not found for event ${event.id}`);
        return;
      }
      
      // Get user and workspace info
      const user = await this.getUser(subscription.user_id);
      const workspace = await this.getWorkspace(subscription.workspace_id);
      
      if (!user || !workspace) {
        console.warn(`User or workspace not found for event ${event.id}`);
        return;
      }
      
      // Get permit details
      const permit = await this.getPermit(event.permit_api_number);
      if (!permit) {
        console.warn(`Permit not found for event ${event.id}`);
        return;
      }
      
      // Send notifications to all channels
      const results = await Promise.allSettled(
        subscription.notify_channels.map(channel => 
          this.sendNotification(channel, event, subscription, user, workspace, permit)
        )
      );
      
      // Check if all notifications were successful
      const allSuccessful = results.every(result => result.status === 'fulfilled');
      
      // Update event notification status
      await this.updateEventStatus(
        event.id, 
        allSuccessful ? 'delivered' : 'failed',
        allSuccessful ? new Date().toISOString() : null
      );
    } catch (error) {
      console.error(`Error delivering notification for event ${event.id}:`, error);
      
      // Mark event as failed
      await this.updateEventStatus(event.id, 'failed', null);
    }
  }

  /**
   * Get alert subscription by ID
   */
  private async getSubscription(subscriptionId: string): Promise<AlertSubscription | null> {
    try {
      const { data, error } = await this.db
        .from('permit_alert_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch subscription: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching subscription ${subscriptionId}:`, error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  private async getUser(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.db
        .from('users')
        .select('id, email, phone, first_name, last_name')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch user: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get workspace by ID
   */
  private async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    try {
      const { data, error } = await this.db
        .from('workspaces')
        .select('id, name')
        .eq('id', workspaceId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch workspace: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching workspace ${workspaceId}:`, error);
      return null;
    }
  }

  /**
   * Get permit by API number
   */
  private async getPermit(apiNumber: string): Promise<any | null> {
    try {
      const { data, error } = await this.db
        .from('permits_clean')
        .select('*')
        .eq('api_number', apiNumber)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch permit: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching permit ${apiNumber}:`, error);
      return null;
    }
  }

  /**
   * Send notification via specified channel
   */
  private async sendNotification(
    channel: string,
    event: AlertEvent,
    subscription: AlertSubscription,
    user: User,
    workspace: Workspace,
    permit: any
  ): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmailNotification(event, subscription, user, workspace, permit);
          break;
        case 'sms':
          await this.sendSmsNotification(event, subscription, user, workspace, permit);
          break;
        default:
          console.warn(`Unsupported notification channel: ${channel}`);
      }
    } catch (error) {
      console.error(`Error sending ${channel} notification for event ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    event: AlertEvent,
    subscription: AlertSubscription,
    user: User,
    workspace: Workspace,
    permit: any
  ): Promise<void> {
    // In a real implementation, this would integrate with an email service like SendGrid or AWS SES
    // For now, we'll just log the email content
    
    const subject = `[${workspace.name}] Permit Status Change Alert: ${permit.api_number}`;
    
    const body = `
      Hello ${user.first_name || 'User'},
      
      A permit status change has been detected for your alert "${subscription.name}".
      
      Permit Details:
      - API Number: ${permit.api_number}
      - Operator: ${permit.operator_name}
      - Lease: ${permit.lease_name}
      - County: ${permit.county}
      - Filed Date: ${new Date(permit.filed_date).toLocaleDateString()}
      
      Status Change:
      - Old Status: ${event.old_status || 'N/A'}
      - New Status: ${event.new_status}
      - Detected At: ${new Date(event.detected_at).toLocaleString()}
      
      View this permit in the dashboard: ${process.env.APP_URL}/permits/${permit.api_number}
      
      Best regards,
      The Permit Monitoring Team
    `;
    
    console.log(`Sending email to ${user.email}: ${subject}`);
    console.log(body);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(
    event: AlertEvent,
    subscription: AlertSubscription,
    user: User,
    workspace: Workspace,
    permit: any
  ): Promise<void> {
    // In a real implementation, this would integrate with an SMS service like Twilio
    // For now, we'll just log the SMS content
    
    if (!user.phone) {
      console.warn(`User ${user.id} does not have a phone number for SMS notification`);
      return;
    }
    
    const message = `[${workspace.name}] Permit ${permit.api_number} status changed from ${event.old_status || 'N/A'} to ${event.new_status}. View details: ${process.env.APP_URL}/permits/${permit.api_number}`;
    
    console.log(`Sending SMS to ${user.phone}: ${message}`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Update event notification status
   */
  private async updateEventStatus(
    eventId: string,
    status: string,
    notifiedAt: string | null
  ): Promise<void> {
    try {
      const { error } = await this.db
        .from('permit_alert_events')
        .update({
          notification_status: status,
          notified_at: notifiedAt,
        })
        .eq('id', eventId);
      
      if (error) {
        throw new Error(`Failed to update event status: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error updating event ${eventId} status to ${status}:`, error);
    }
  }
}