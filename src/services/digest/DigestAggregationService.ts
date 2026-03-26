import { createDatabaseClient } from '../../lib/database';
import { SupabaseClient } from '@supabase/supabase-js';

interface DigestPreferences {
  user_id: string;
  workspace_id: string;
  digest_enabled: boolean;
  digest_frequency: string;
  digest_day_of_week: number;
  digest_hour_utc: number;
  include_saved_searches: boolean;
  include_status_changes: boolean;
  include_new_operators: boolean;
  last_digest_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SavedSearch {
  id: string;
  name: string;
  criteria: any;
  permit_count: number;
  new_permits: number;
}

interface StatusChange {
  api_number: string;
  old_status: string;
  new_status: string;
  filed_date: string;
  operator_name: string;
  lease_name: string;
  county: string;
}

interface NewOperator {
  operator_name: string;
  first_permit_date: string;
  permit_count: number;
}

interface DigestData {
  period_start: string;
  period_end: string;
  saved_searches: SavedSearch[];
  status_changes: StatusChange[];
  top_movers: StatusChange[];
  new_operators: NewOperator[];
  summary_stats: {
    total_new_permits: number;
    total_status_changes: number;
    total_new_operators: number;
  };
}

/**
 * Digest Data Aggregation Service
 * Aggregates user activity data for rich digest emails
 */
export class DigestAggregationService {
  private db: SupabaseClient;

  constructor() {
    this.db = createDatabaseClient();
  }

  /**
   * Aggregate digest data for a user
   */
  async aggregateDigestData(userId: string, workspaceId: string): Promise<DigestData | null> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId, workspaceId);
      if (!preferences || !preferences.digest_enabled) {
        return null;
      }
      
      // Calculate period start/end based on frequency
      const { periodStart, periodEnd } = this.calculatePeriod(preferences);
      
      // Check if we already have cached data for this period
      const cachedData = await this.getCachedDigestData(userId, periodStart, periodEnd);
      if (cachedData) {
        return cachedData;
      }
      
      // Aggregate data based on preferences
      const digestData: DigestData = {
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        saved_searches: [],
        status_changes: [],
        top_movers: [],
        new_operators: [],
        summary_stats: {
          total_new_permits: 0,
          total_status_changes: 0,
          total_new_operators: 0,
        }
      };
      
      // Get saved search results
      if (preferences.include_saved_searches) {
        digestData.saved_searches = await this.getSavedSearchResults(workspaceId, periodStart, periodEnd);
        digestData.summary_stats.total_new_permits = digestData.saved_searches.reduce(
          (sum, search) => sum + search.new_permits, 0
        );
      }
      
      // Get status changes
      if (preferences.include_status_changes) {
        digestData.status_changes = await this.getStatusChanges(workspaceId, periodStart, periodEnd);
        digestData.summary_stats.total_status_changes = digestData.status_changes.length;
        
        // Get top movers (permits with status changes)
        digestData.top_movers = await this.getTopMovers(workspaceId, periodStart, periodEnd);
      }
      
      // Get new operators
      if (preferences.include_new_operators) {
        digestData.new_operators = await this.getNewOperators(workspaceId, periodStart, periodEnd);
        digestData.summary_stats.total_new_operators = digestData.new_operators.length;
      }
      
      // Cache the aggregated data
      await this.cacheDigestData(userId, workspaceId, digestData);
      
      return digestData;
    } catch (error) {
      console.error(`Error aggregating digest data for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get user digest preferences
   */
  private async getUserPreferences(userId: string, workspaceId: string): Promise<DigestPreferences | null> {
    try {
      const { data, error } = await this.db
        .from('user_digest_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch user preferences: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching preferences for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Calculate period start/end based on user preferences
   */
  private calculatePeriod(preferences: DigestPreferences): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    const periodEnd = new Date(now);
    
    // Start of the period depends on frequency
    const periodStart = new Date(now);
    
    if (preferences.digest_frequency === 'daily') {
      // Daily: Last 24 hours
      periodStart.setDate(periodStart.getDate() - 1);
    } else {
      // Weekly: Last 7 days
      periodStart.setDate(periodStart.getDate() - 7);
    }
    
    return { periodStart, periodEnd };
  }

  /**
   * Get cached digest data if available
   */
  private async getCachedDigestData(userId: string, periodStart: Date, periodEnd: Date): Promise<DigestData | null> {
    try {
      const { data, error } = await this.db
        .from('digest_data_cache')
        .select('digest_data')
        .eq('user_id', userId)
        .eq('period_start', periodStart.toISOString())
        .eq('period_end', periodEnd.toISOString())
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch cached digest data: ${error.message}`);
      }
      
      return data.digest_data as DigestData;
    } catch (error) {
      console.error('Error fetching cached digest data:', error);
      return null;
    }
  }

  /**
   * Cache aggregated digest data
   */
  private async cacheDigestData(userId: string, workspaceId: string, digestData: DigestData): Promise<void> {
    try {
      const { error } = await this.db
        .from('digest_data_cache')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          period_start: digestData.period_start,
          period_end: digestData.period_end,
          digest_data: digestData,
        });
      
      if (error) {
        throw new Error(`Failed to cache digest data: ${error.message}`);
      }
    } catch (error) {
      console.error('Error caching digest data:', error);
    }
  }

  /**
   * Get saved search results with new permits
   */
  private async getSavedSearchResults(workspaceId: string, periodStart: Date, periodEnd: Date): Promise<SavedSearch[]> {
    try {
      // Get all saved searches for the workspace
      const { data: searches, error: searchesError } = await this.db
        .from('saved_searches')
        .select('id, name, criteria')
        .eq('workspace_id', workspaceId);
      
      if (searchesError) {
        throw new Error(`Failed to fetch saved searches: ${searchesError.message}`);
      }
      
      // For each search, count new permits in the period
      const results = await Promise.all(
        (searches || []).map(async (search) => {
          // This is a simplified implementation - in a real app, you'd need to parse the criteria
          // and build a query to count permits matching the search criteria
          
          // Count total permits for this search
          const { count: totalCount, error: countError } = await this.db
            .from('permits_clean')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .gte('filed_date', periodStart.toISOString())
            .lte('filed_date', periodEnd.toISOString());
          
          if (countError) {
            throw new Error(`Failed to count permits: ${countError.message}`);
          }
          
          // Count new permits in the period
          const { count: newCount, error: newCountError } = await this.db
            .from('permits_clean')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .gte('filed_date', periodStart.toISOString())
            .lte('filed_date', periodEnd.toISOString());
          
          if (newCountError) {
            throw new Error(`Failed to count new permits: ${newCountError.message}`);
          }
          
          return {
            id: search.id,
            name: search.name,
            criteria: search.criteria,
            permit_count: totalCount || 0,
            new_permits: newCount || 0,
          };
        })
      );
      
      return results;
    } catch (error) {
      console.error(`Error getting saved search results for workspace ${workspaceId}:`, error);
      return [];
    }
  }

  /**
   * Get permit status changes in the period
   */
  private async getStatusChanges(workspaceId: string, periodStart: Date, periodEnd: Date): Promise<StatusChange[]> {
    try {
      // Get alert events with status changes in the period
      const { data: events, error: eventsError } = await this.db
        .from('permit_alert_events')
        .select(`
          id,
          permit_api_number,
          old_status,
          new_status,
          detected_at,
          permit:permits_clean(
            operator_name,
            lease_name,
            county
          )
        `)
        .gte('detected_at', periodStart.toISOString())
        .lte('detected_at', periodEnd.toISOString())
        .limit(50); // Limit to avoid huge responses
      
      if (eventsError) {
        throw new Error(`Failed to fetch status changes: ${eventsError.message}`);
      }
      
      // Transform to StatusChange format
      const statusChanges = (events || []).map(event => {
        const permit = Array.isArray(event.permit) ? event.permit[0] : event.permit;
        return {
          api_number: event.permit_api_number,
          old_status: event.old_status,
          new_status: event.new_status,
          filed_date: event.detected_at,
          operator_name: permit?.operator_name || '',
          lease_name: permit?.lease_name || '',
          county: permit?.county || '',
        };
      });
      
      return statusChanges;
    } catch (error) {
      console.error(`Error getting status changes for workspace ${workspaceId}:`, error);
      return [];
    }
  }

  /**
   * Get top movers (permits with status changes)
   */
  private async getTopMovers(workspaceId: string, periodStart: Date, periodEnd: Date): Promise<StatusChange[]> {
    try {
      // Get the most frequent status changers
      const { data: events, error: eventsError } = await this.db
        .from('permit_alert_events')
        .select(`
          permit_api_number,
          old_status,
          new_status,
          detected_at,
          permit:permits_clean(
            operator_name,
            lease_name,
            county
          )
        `)
        .gte('detected_at', periodStart.toISOString())
        .lte('detected_at', periodEnd.toISOString())
        .limit(10); // Top 10 movers
      
      if (eventsError) {
        throw new Error(`Failed to fetch top movers: ${eventsError.message}`);
      }
      
      // Transform to StatusChange format
      const topMovers = (events || []).map(event => {
        const permit = Array.isArray(event.permit) ? event.permit[0] : event.permit;
        return {
          api_number: event.permit_api_number,
          old_status: event.old_status,
          new_status: event.new_status,
          filed_date: event.detected_at,
          operator_name: permit?.operator_name || '',
          lease_name: permit?.lease_name || '',
          county: permit?.county || '',
        };
      });
      
      return topMovers;
    } catch (error) {
      console.error(`Error getting top movers for workspace ${workspaceId}:`, error);
      return [];
    }
  }

  /**
   * Get new operators in the period
   */
  private async getNewOperators(workspaceId: string, periodStart: Date, periodEnd: Date): Promise<NewOperator[]> {
    try {
      // Get operators with their first permit in the period
      const { data: operators, error: operatorsError } = await this.db
        .from('permits_clean')
        .select(`
          operator_name,
          filed_date
        `)
        .eq('workspace_id', workspaceId)
        .gte('filed_date', periodStart.toISOString())
        .lte('filed_date', periodEnd.toISOString())
        .order('filed_date', { ascending: true })
        .limit(20); // Limit to avoid huge responses
      
      if (operatorsError) {
        throw new Error(`Failed to fetch new operators: ${operatorsError.message}`);
      }
      
      // Group by operator and get first permit date
      const operatorMap = new Map<string, { first_permit_date: string; permit_count: number }>();
      
      (operators || []).forEach(permit => {
        if (!permit.operator_name) return;
        
        if (operatorMap.has(permit.operator_name)) {
          const entry = operatorMap.get(permit.operator_name)!;
          entry.permit_count++;
        } else {
          operatorMap.set(permit.operator_name, {
            first_permit_date: permit.filed_date,
            permit_count: 1,
          });
        }
      });
      
      // Convert to NewOperator format
      const newOperators: NewOperator[] = Array.from(operatorMap.entries()).map(([operator_name, data]) => ({
        operator_name,
        first_permit_date: data.first_permit_date,
        permit_count: data.permit_count,
      }));
      
      return newOperators;
    } catch (error) {
      console.error(`Error getting new operators for workspace ${workspaceId}:`, error);
      return [];
    }
  }
}