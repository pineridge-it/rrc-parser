import { UUID } from '../../types/common';
import {
  PlanType,
  PlanLimits,
  UsageLimits,
  UsageCheckResult,
  UsageWarning,
  UsagePeriod,
  PLAN_LIMITS,
  SOFT_LIMIT_THRESHOLD,
  HARD_LIMIT_THRESHOLD,
} from '../../types/usage';
import { createDatabaseClient } from '../../lib/database';

export interface UsageServiceConfig {
  supabaseUrl: string;
  supabaseKey: string;
  softLimitThreshold: number;
  hardLimitThreshold: number;
}

export class UsageService {
  private db = createDatabaseClient();

  async getUsage(workspaceId: UUID): Promise<UsageLimits> {
    const plan = await this.getWorkspacePlan(workspaceId);
    const limits = PLAN_LIMITS[plan];
    
    const period = await this.getOrCreateCurrentPeriod(workspaceId);
    const aoiCount = await this.getAOICount(workspaceId);

    return {
      aois: { current: aoiCount, limit: limits.aois },
      alertsThisMonth: { current: period.alertsSent, limit: limits.alertsPerMonth },
      exportsThisMonth: { current: period.exportsCount, limit: limits.exportsPerMonth },
      apiCallsThisMonth: { current: period.apiCalls, limit: limits.apiCallsPerMonth },
    };
  }

  async checkLimit(
    workspaceId: UUID,
    resource: 'aois' | 'alerts' | 'exports' | 'apiCalls',
    amount: number = 1
  ): Promise<UsageCheckResult> {
    const usage = await this.getUsage(workspaceId);
    
    let current: number;
    let limit: number;
    
    switch (resource) {
      case 'aois':
        current = usage.aois.current;
        limit = usage.aois.limit;
        break;
      case 'alerts':
        current = usage.alertsThisMonth.current;
        limit = usage.alertsThisMonth.limit;
        break;
      case 'exports':
        current = usage.exportsThisMonth.current;
        limit = usage.exportsThisMonth.limit;
        break;
      case 'apiCalls':
        current = usage.apiCallsThisMonth.current;
        limit = usage.apiCallsThisMonth.limit;
        break;
      default:
        throw new Error(`Unknown resource: ${resource}`);
    }

    const newTotal = current + amount;
    const percentage = limit > 0 ? newTotal / limit : 0;
    const wouldExceed = newTotal > limit;

    return {
      allowed: !wouldExceed,
      current,
      limit,
      percentage,
      wouldExceed,
    };
  }

  async incrementUsage(
    workspaceId: UUID,
    resource: 'alerts' | 'exports' | 'apiCalls',
    amount: number = 1
  ): Promise<void> {
    const { error } = await this.db.rpc('increment_usage', {
      p_workspace_id: workspaceId,
      p_resource: resource,
      p_amount: amount,
    });

    if (error) {
      throw new Error(`Failed to increment usage: ${error.message}`);
    }
  }

  async checkWarnings(workspaceId: UUID): Promise<UsageWarning[]> {
    const usage = await this.getUsage(workspaceId);
    const warnings: UsageWarning[] = [];

    const checkResource = (
      resource: string,
      current: number,
      limit: number
    ): void => {
      if (limit === 0) return;
      
      const percentage = current / limit;
      
      if (percentage >= HARD_LIMIT_THRESHOLD) {
        warnings.push({
          resource,
          percentage,
          threshold: 'hard',
          message: `${resource} limit reached: ${current}/${limit} (${Math.round(percentage * 100)}%)`,
        });
      } else if (percentage >= SOFT_LIMIT_THRESHOLD) {
        warnings.push({
          resource,
          percentage,
          threshold: 'soft',
          message: `${resource} approaching limit: ${current}/${limit} (${Math.round(percentage * 100)}%)`,
        });
      }
    };

    checkResource('AOIs', usage.aois.current, usage.aois.limit);
    checkResource('Alerts', usage.alertsThisMonth.current, usage.alertsThisMonth.limit);
    checkResource('Exports', usage.exportsThisMonth.current, usage.exportsThisMonth.limit);
    checkResource('API Calls', usage.apiCallsThisMonth.current, usage.apiCallsThisMonth.limit);

    return warnings;
  }

  async getPlanLimits(workspaceId: UUID): Promise<PlanLimits> {
    const plan = await this.getWorkspacePlan(workspaceId);
    return PLAN_LIMITS[plan];
  }

  private async getWorkspacePlan(workspaceId: UUID): Promise<PlanType> {
    const { data, error } = await this.db
      .from('workspaces')
      .select('plan')
      .eq('id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return 'free';
      }
      console.error(`Failed to fetch workspace plan for ${workspaceId}:`, error.message);
      throw new Error(`Failed to fetch workspace plan: ${error.message}`);
    }

    const planValue = data?.plan || 'free';
    if (!['free', 'pro', 'team', 'enterprise'].includes(planValue)) {
      console.warn(`Unknown plan value "${planValue}" for workspace ${workspaceId}, defaulting to free`);
      return 'free';
    }

    return planValue as PlanType;
  }

  private async getAOICount(workspaceId: UUID): Promise<number> {
    const { count, error } = await this.db
      .from('areas_of_interest')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null);

    if (error) {
      console.error(`Failed to count AOIs for workspace ${workspaceId}:`, error.message);
      throw new Error(`Failed to count AOIs: ${error.message}`);
    }

    return count || 0;
  }

  private async getOrCreateCurrentPeriod(workspaceId: UUID): Promise<UsagePeriod> {
    const { data, error } = await this.db.rpc('get_or_create_usage_period', {
      p_workspace_id: workspaceId,
    });

    if (error) {
      console.error(`Failed to get/create usage period for workspace ${workspaceId}:`, error.message);
      throw new Error(`Failed to get or create usage period: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Usage period RPC returned no data');
    }

    const period = Array.isArray(data) ? data[0] : data;

    return {
      workspaceId: period.workspace_id,
      periodStart: new Date(period.period_start),
      periodEnd: new Date(period.period_end),
      alertsSent: period.alerts_sent || 0,
      exportsCount: period.exports_count || 0,
      apiCalls: period.api_calls || 0,
    };
  }

  async resetMonthlyUsage(): Promise<void> {
    try {
      // Rotate usage periods - move current period to history and create new period
      const { error } = await this.db.rpc('rotate_usage_periods');

      if (error) {
        console.error('Failed to rotate usage periods:', error);
        throw new Error(`Failed to reset monthly usage: ${error.message}`);
      }

      console.log('Monthly usage reset completed successfully');
    } catch (error) {
      console.error('Error in resetMonthlyUsage:', error);
      throw error;
    }
  }
}

export default UsageService;
