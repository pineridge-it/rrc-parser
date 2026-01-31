/**
 * React hook for usage tracking and limit enforcement
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface UsageLimits {
  aois: { current: number; limit: number };
  alertsThisMonth: { current: number; limit: number };
  exportsThisMonth: { current: number; limit: number };
  apiCallsThisMonth: { current: number; limit: number };
}

export interface UsageWarning {
  resource: string;
  percentage: number;
  threshold: 'soft' | 'hard';
  message: string;
}

export interface UseUsageOptions {
  workspaceId: string;
  pollInterval?: number;
}

export interface UseUsageReturn {
  usage: UsageLimits | null;
  warnings: UsageWarning[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  checkLimit: (resource: 'aois' | 'alerts' | 'exports' | 'apiCalls', amount?: number) => Promise<{
    allowed: boolean;
    percentage: number;
    wouldExceed: boolean;
  }>;
  getSoftLimitWarnings: () => UsageWarning[];
  getHardLimitWarnings: () => UsageWarning[];
}

const SOFT_LIMIT_THRESHOLD = 0.8;
const HARD_LIMIT_THRESHOLD = 1.0;

export function useUsage(options: UseUsageOptions): UseUsageReturn {
  const { workspaceId, pollInterval = 60000 } = options;

  const [usage, setUsage] = useState<UsageLimits | null>(null);
  const [warnings, setWarnings] = useState<UsageWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast, error: toastError, success: toastSuccess, warning: toastWarning } = useToast();

  const calculateWarnings = useCallback((currentUsage: UsageLimits): UsageWarning[] => {
    const newWarnings: UsageWarning[] = [];

    const checkResource = (
      resource: string,
      current: number,
      limit: number
    ): void => {
      if (limit === 0) return;
      
      const percentage = current / limit;
      
      if (percentage >= HARD_LIMIT_THRESHOLD) {
        newWarnings.push({
          resource,
          percentage,
          threshold: 'hard',
          message: `${resource} limit reached: ${current}/${limit} (${Math.round(percentage * 100)}%)`,
        });
      } else if (percentage >= SOFT_LIMIT_THRESHOLD) {
        newWarnings.push({
          resource,
          percentage,
          threshold: 'soft',
          message: `${resource} approaching limit: ${current}/${limit} (${Math.round(percentage * 100)}%)`,
        });
      }
    };

    checkResource('AOIs', currentUsage.aois.current, currentUsage.aois.limit);
    checkResource('Alerts', currentUsage.alertsThisMonth.current, currentUsage.alertsThisMonth.limit);
    checkResource('Exports', currentUsage.exportsThisMonth.current, currentUsage.exportsThisMonth.limit);
    checkResource('API Calls', currentUsage.apiCallsThisMonth.current, currentUsage.apiCallsThisMonth.limit);

    return newWarnings;
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      const response = await fetch(`/api/workspaces/${workspaceId}/usage`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const data: UsageLimits = await response.json();
      setUsage(data);
      setWarnings(calculateWarnings(data));
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      toastError('Usage Data Error', {
        description: errorObj.message
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, calculateWarnings, toast]);

  const checkLimit = useCallback(async (
    resource: 'aois' | 'alerts' | 'exports' | 'apiCalls',
    amount: number = 1
  ): Promise<{ allowed: boolean; percentage: number; wouldExceed: boolean }> => {
    if (!usage) {
      return { allowed: false, percentage: 0, wouldExceed: true };
    }

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
        return { allowed: false, percentage: 0, wouldExceed: true };
    }

    const newTotal = current + amount;
    const percentage = limit > 0 ? newTotal / limit : 0;
    const wouldExceed = newTotal > limit;

    // Show warning if approaching limits
    if (percentage >= HARD_LIMIT_THRESHOLD) {
      toastError('Usage Limit Reached', {
        description: `You've reached your ${resource} limit. Please upgrade your plan to continue.`
      });
    } else if (percentage >= SOFT_LIMIT_THRESHOLD) {
      toastWarning('Approaching Usage Limit', {
        description: `You're approaching your ${resource} limit (${Math.round(percentage * 100)}%).`
      });
    }

    return {
      allowed: !wouldExceed,
      percentage,
      wouldExceed,
    };
  }, [usage, toast]);

  const getSoftLimitWarnings = useCallback(() => {
    return warnings.filter(w => w.threshold === 'soft');
  }, [warnings]);

  const getHardLimitWarnings = useCallback(() => {
    return warnings.filter(w => w.threshold === 'hard');
  }, [warnings]);

  // Initial fetch
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Polling
  useEffect(() => {
    if (!pollInterval) return;

    const interval = setInterval(fetchUsage, pollInterval);
    return () => clearInterval(interval);
  }, [fetchUsage, pollInterval]);

  return {
    usage,
    warnings,
    loading,
    error,
    refresh: fetchUsage,
    checkLimit,
    getSoftLimitWarnings,
    getHardLimitWarnings,
  };
}

export default useUsage;
