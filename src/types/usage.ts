/**
 * Usage tracking and limits type definitions
 */

export type PlanType = 'free' | 'pro' | 'team' | 'enterprise';

export interface PlanLimits {
  aois: number;
  alertsPerMonth: number;
  exportsPerMonth: number;
  apiCallsPerMonth: number;
  teamMembers: number;
}

export interface UsageLimits {
  aois: { current: number; limit: number };
  alertsThisMonth: { current: number; limit: number };
  exportsThisMonth: { current: number; limit: number };
  apiCallsThisMonth: { current: number; limit: number };
}

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
  wouldExceed: boolean;
}

export interface UsageWarning {
  resource: string;
  percentage: number;
  threshold: 'soft' | 'hard';
  message: string;
}

export interface UsagePeriod {
  workspaceId: string;
  periodStart: Date;
  periodEnd: Date;
  alertsSent: number;
  exportsCount: number;
  apiCalls: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    aois: 3,
    alertsPerMonth: 50,
    exportsPerMonth: 10,
    apiCallsPerMonth: 0,
    teamMembers: 1,
  },
  pro: {
    aois: 25,
    alertsPerMonth: 500,
    exportsPerMonth: 100,
    apiCallsPerMonth: 0,
    teamMembers: 1,
  },
  team: {
    aois: 100,
    alertsPerMonth: 5000,
    exportsPerMonth: 1000,
    apiCallsPerMonth: 10000,
    teamMembers: 5,
  },
  enterprise: {
    aois: 1000,
    alertsPerMonth: 50000,
    exportsPerMonth: 10000,
    apiCallsPerMonth: 100000,
    teamMembers: 25,
  },
};

export const SOFT_LIMIT_THRESHOLD = 0.8;
export const HARD_LIMIT_THRESHOLD = 1.0;
