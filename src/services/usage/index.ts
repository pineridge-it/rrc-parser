import { UUID } from 'crypto';
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

export interface UsageServiceConfig {
  supabaseUrl: string;
  supabaseKey: string;
  softLimitThreshold: number;
  hardLimitThreshold: number;
}

const DEFAULT_CONFIG: UsageServiceConfig = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY || '',
  softLimitThreshold: SOFT_LIMIT_THRESHOLD,
  hardLimitThreshold: HARD_LIMIT_THRESHOLD,
};

export class UsageService {
  private config: UsageServiceConfig;

  constructor(config: Partial<UsageServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current usage for a workspace
   */
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

  /**
   * Check if an action would exceed limits
   */
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

  /**
   * Increment usage for a resource
   */
  async incrementUsage(
    workspaceId: UUID,
    resource: 'alerts' | 'exports' | 'apiCalls',
    amount: number = 1
  ): Promise<void> {
    const period = await this.getOrCreateCurrentPeriod(workspaceId);
    
    let field: string;
    switch (resource) {
      case 'alerts':
        field = 'alerts_sent';
        break;
      case 'exports':
        field = 'exports_count';
        break;
      case 'apiCalls':
        field = 'api_calls';
        break;
      default:
        throw new Error(`Unknown resource: ${resource}`);
    }

    await this.updateUsageField(period.workspaceId, period.periodStart, field, amount);
  }

  /**
   * Check for usage warnings (soft limit at 80%)
   */
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

  /**
   * Get plan limits for a workspace
   */
  async getPlanLimits(workspaceId: UUID): Promise<PlanLimits> {
    const plan = await this.getWorkspacePlan(workspaceId);
    return PLAN_LIMITS[plan];
  }

  // Placeholder methods for database interactions
  
  private async getWorkspacePlan(workspaceId: UUID): Promise<PlanType> {
    // TODO: Implement database query
    // Placeholder - should query workspaces table
    return 'free';
  }

  private async getAOICount(workspaceId: UUID): Promise<number> {
    // TODO: Implement database query
    // Placeholder - should count AOIs for workspace
    return 0;
  }

  private async getOrCreateCurrentPeriod(workspaceId: UUID): Promise<UsagePeriod> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // TODO: Implement database query/insert
    // Placeholder
    return {
      workspaceId: workspaceId.toString(),
      periodStart,
      periodEnd,
      alertsSent: 0,
      exportsCount: 0,
      apiCalls: 0,
    };
  }

  private async updateUsageField(
    workspaceId: string,
    periodStart: Date,
    field: string,
    amount: number
  ): Promise<void> {
    // TODO: Implement database update
    console.log(`Updating ${field} for workspace ${workspaceId} by ${amount}`);
  }

  /**
   * Reset monthly usage (should be called by cron job)
   */
  async resetMonthlyUsage(): Promise<void> {
    // TODO: Implement monthly reset logic
    // This would create new periods for all active workspaces
    console.log('Resetting monthly usage...');
  }
}

export default UsageService;
