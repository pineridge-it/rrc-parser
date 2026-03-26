import { createDatabaseClient } from '../../lib/database';
import { SupabaseClient } from '@supabase/supabase-js';

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

interface PermitStatusChange {
  api_number: string;
  old_status: string;
  new_status: string;
  filed_date: string;
  operator_name: string;
  lease_name: string;
  county: string;
}

/**
 * Alert Detection Service
 * Periodically checks for permit status changes and creates alert events
 */
export class AlertDetectionService {
  private db: SupabaseClient;

  constructor() {
    this.db = createDatabaseClient();
  }

  /**
   * Detect permit status changes and create alert events.
   *
   * Uses Promise.allSettled to process all subscriptions in parallel while
   * ensuring that one subscription failure doesn't stop others from processing.
   * Returns a summary of processed vs failed subscriptions for monitoring.
   */
  async detectStatusChanges(): Promise<{ processed: number; errors: number }> {
    let subscriptions: AlertSubscription[];
    try {
      subscriptions = await this.getActiveSubscriptions();
    } catch (error) {
      console.error('Fatal: could not retrieve active subscriptions:', error);
      throw error; // Cannot proceed without subscription list
    }

    console.log(`Processing ${subscriptions.length} alert subscriptions`);

    // Process all subscriptions in parallel with proper error isolation
    const results = await Promise.allSettled(
      subscriptions.map(sub => this.processSubscription(sub))
    );

    const failures = results.filter(r => r.status === 'rejected');
    const successes = results.filter(r => r.status === 'fulfilled');

    if (failures.length > 0) {
      console.warn(`${failures.length} subscriptions failed processing`);
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`  Subscription ${subscriptions[i]?.id}:`, result.reason);
        }
      });
    }

    console.log(`Alert detection complete: ${successes.length} succeeded, ${failures.length} failed`);
    return { processed: successes.length, errors: failures.length };
  }

  /**
   * Get all active alert subscriptions
   */
  private async getActiveSubscriptions(): Promise<AlertSubscription[]> {
    try {
      const { data, error } = await this.db
        .from('permit_alert_subscriptions')
        .select('*')
        .eq('is_active', true)
        .eq('trigger_type', 'status_change');
      
      if (error) {
        throw new Error(`Failed to fetch active subscriptions: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching active subscriptions:', error);
      throw error;
    }
  }

  /**
   * Process a single alert subscription.
   *
   * Errors are re-thrown so that Promise.allSettled can track them properly.
   * The caller (detectStatusChanges) handles aggregation of failures.
   */
  private async processSubscription(subscription: AlertSubscription): Promise<void> {
    try {
      // Get permits to monitor based on subscription type
      let permits: PermitStatusChange[] = [];

      if (subscription.permit_api_number) {
        // Monitor specific permit
        const permit = await this.getPermitByApiNumber(subscription.permit_api_number);
        if (permit) {
          permits = [permit];
        }
      } else if (subscription.saved_search_id) {
        // Monitor permits from saved search
        permits = await this.getPermitsFromSavedSearch(subscription.saved_search_id);
      }

      // Check each permit for status changes
      for (const permit of permits) {
        await this.checkPermitStatusChange(subscription, permit);
      }
    } catch (error) {
      // Log for observability, then re-throw so Promise.allSettled can track
      console.error(`Error processing subscription ${subscription.id}:`, error);
      throw error;
    }
  }

  /**
   * Get permit by API number
   */
  private async getPermitByApiNumber(apiNumber: string): Promise<PermitStatusChange | null> {
    try {
      // Check if we have a cached status for this permit
      const { data: cached, error: cacheError } = await this.db
        .from('permit_status_cache')
        .select('api_number, status, last_checked')
        .eq('api_number', apiNumber)
        .single();
      
      if (cacheError && cacheError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch cached status: ${cacheError.message}`);
      }
      
      // Get current permit data
      const { data: permit, error: permitError } = await this.db
        .from('permits_clean')
        .select('api_number, status, filed_date, operator_name, lease_name, county')
        .eq('api_number', apiNumber)
        .single();
      
      if (permitError) {
        throw new Error(`Failed to fetch permit: ${permitError.message}`);
      }
      
      if (!permit) {
        return null;
      }
      
      // Check if status has changed
      if (cached && cached.status !== permit.status) {
        return {
          api_number: permit.api_number,
          old_status: cached.status,
          new_status: permit.status,
          filed_date: permit.filed_date,
          operator_name: permit.operator_name,
          lease_name: permit.lease_name,
          county: permit.county,
        };
      }
      
      // Update cache with current status
      await this.updateStatusCache(permit.api_number, permit.status);
      
      return null;
    } catch (error) {
      console.error(`Error getting permit ${apiNumber}:`, error);
      return null;
    }
  }

  /**
   * Get permits from saved search
   */
  private async getPermitsFromSavedSearch(savedSearchId: string): Promise<PermitStatusChange[]> {
    try {
      // Get saved search criteria
      const { data: search, error: searchError } = await this.db
        .from('saved_searches')
        .select('criteria')
        .eq('id', savedSearchId)
        .single();
      
      if (searchError) {
        throw new Error(`Failed to fetch saved search: ${searchError.message}`);
      }
      
      if (!search) {
        return [];
      }
      
      // Build query based on saved search criteria
      // This is a simplified implementation - in a real app, you'd need to parse the criteria
      let query = this.db
        .from('permits_clean')
        .select('api_number, status, filed_date, operator_name, lease_name, county');
      
      // Apply filters from saved search criteria
      // For now, we'll just get recent permits as an example
      query = query.gte('filed_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      const { data: permits, error: permitsError } = await query;
      
      if (permitsError) {
        throw new Error(`Failed to fetch permits from saved search: ${permitsError.message}`);
      }
      
      return (permits || []).map(permit => ({
        api_number: permit.api_number,
        old_status: '', // We'll determine this by checking the cache
        new_status: permit.status,
        filed_date: permit.filed_date,
        operator_name: permit.operator_name,
        lease_name: permit.lease_name,
        county: permit.county,
      }));
    } catch (error) {
      console.error(`Error getting permits from saved search ${savedSearchId}:`, error);
      return [];
    }
  }

  /**
   * Check if a permit's status has changed and create an alert event if it has
   */
  private async checkPermitStatusChange(
    subscription: AlertSubscription,
    permit: PermitStatusChange
  ): Promise<void> {
    try {
      // Get cached status for this permit
      const { data: cached, error: cacheError } = await this.db
        .from('permit_status_cache')
        .select('status, last_checked')
        .eq('api_number', permit.api_number)
        .single();
      
      if (cacheError && cacheError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch cached status: ${cacheError.message}`);
      }
      
      // If no cached status or status has changed, create an alert event
      if (!cached || cached.status !== permit.new_status) {
        // Check if this status change should trigger an alert
        if (this.shouldTriggerAlert(subscription, permit.new_status)) {
          // Create alert event
          await this.createAlertEvent(subscription.id, permit);
        }
        
        // Update cache with new status
        await this.updateStatusCache(permit.api_number, permit.new_status);
      }
    } catch (error) {
      console.error(`Error checking status change for permit ${permit.api_number}:`, error);
    }
  }

  /**
   * Determine if a status change should trigger an alert based on subscription settings
   */
  private shouldTriggerAlert(subscription: AlertSubscription, newStatus: string): boolean {
    // If no specific statuses are watched, trigger on any change
    if (!subscription.watched_statuses || subscription.watched_statuses.length === 0) {
      return true;
    }
    
    // Check if the new status is in the watched statuses
    return subscription.watched_statuses.includes(newStatus);
  }

  /**
   * Create an alert event
   */
  private async createAlertEvent(
    subscriptionId: string,
    permit: PermitStatusChange
  ): Promise<void> {
    try {
      const { error } = await this.db
        .from('permit_alert_events')
        .insert({
          subscription_id: subscriptionId,
          permit_api_number: permit.api_number,
          old_status: permit.old_status,
          new_status: permit.new_status,
          detected_at: new Date().toISOString(),
          notification_status: 'pending',
        });
      
      if (error) {
        throw new Error(`Failed to create alert event: ${error.message}`);
      }
      
      console.log(`Created alert event for permit ${permit.api_number} status change: ${permit.old_status} -> ${permit.new_status}`);
    } catch (error) {
      console.error('Error creating alert event:', error);
    }
  }

  /**
   * Update permit status cache
   */
  private async updateStatusCache(apiNumber: string, status: string): Promise<void> {
    try {
      const { error } = await this.db
        .from('permit_status_cache')
        .upsert({
          api_number: apiNumber,
          status: status,
          last_checked: new Date().toISOString(),
        }, {
          onConflict: 'api_number'
        });
      
      if (error) {
        throw new Error(`Failed to update status cache: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error updating status cache for permit ${apiNumber}:`, error);
    }
  }
}