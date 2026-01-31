/**
 * Usage Warnings Component
 * Displays usage limit warnings and upgrade prompts
 */

'use client';

import React from 'react';
import { AlertTriangle, XCircle, TrendingUp } from 'lucide-react';

export interface UsageWarning {
  resource: string;
  percentage: number;
  threshold: 'soft' | 'hard';
  message: string;
}

interface UsageWarningsProps {
  warnings: UsageWarning[];
  onUpgrade?: () => void;
  className?: string;
}

export function UsageWarnings({ warnings, onUpgrade, className = '' }: UsageWarningsProps): React.ReactElement | null {
  if (warnings.length === 0) {
    return null;
  }

  const softWarnings = warnings.filter(w => w.threshold === 'soft');
  const hardWarnings = warnings.filter(w => w.threshold === 'hard');

  return (
    <div className={`space-y-2 ${className}`}>
      {hardWarnings.map((warning, index) => (
        <div
          key={`hard-${index}`}
          className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
        >
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-red-900">Limit Reached</h4>
            <p className="text-sm text-red-700 mt-1">{warning.message}</p>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-800 underline"
              >
                <TrendingUp className="w-4 h-4" />
                Upgrade Plan
              </button>
            )}
          </div>
        </div>
      ))}

      {softWarnings.map((warning, index) => (
        <div
          key={`soft-${index}`}
          className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg"
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-amber-900">Approaching Limit</h4>
            <p className="text-sm text-amber-700 mt-1">{warning.message}</p>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 underline"
              >
                <TrendingUp className="w-4 h-4" />
                Consider Upgrading
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface UsageMeterProps {
  current: number;
  limit: number;
  label: string;
  className?: string;
}

export function UsageMeter({ current, limit, label, className = '' }: UsageMeterProps): React.ReactElement {
  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  const isSoftLimit = percentage >= 80 && percentage < 100;
  const isHardLimit = percentage >= 100;

  const barColor = isHardLimit
    ? 'bg-red-500'
    : isSoftLimit
    ? 'bg-amber-500'
    : 'bg-blue-500';

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`${isHardLimit ? 'text-red-600' : isSoftLimit ? 'text-amber-600' : 'text-gray-600'}`}>
          {current} / {limit} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface UsageDashboardProps {
  usage: {
    aois: { current: number; limit: number };
    alertsThisMonth: { current: number; limit: number };
    exportsThisMonth: { current: number; limit: number };
    apiCallsThisMonth: { current: number; limit: number };
  };
  onUpgrade?: () => void;
  className?: string;
}

export function UsageDashboard({ usage, onUpgrade, className = '' }: UsageDashboardProps): React.ReactElement {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Usage This Month</h3>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Upgrade Plan
          </button>
        )}
      </div>

      <div className="space-y-4">
        <UsageMeter
          label="Areas of Interest"
          current={usage.aois.current}
          limit={usage.aois.limit}
        />
        <UsageMeter
          label="Alerts Sent"
          current={usage.alertsThisMonth.current}
          limit={usage.alertsThisMonth.limit}
        />
        <UsageMeter
          label="Exports"
          current={usage.exportsThisMonth.current}
          limit={usage.exportsThisMonth.limit}
        />
        {usage.apiCallsThisMonth.limit > 0 && (
          <UsageMeter
            label="API Calls"
            current={usage.apiCallsThisMonth.current}
            limit={usage.apiCallsThisMonth.limit}
          />
        )}
      </div>
    </div>
  );
}

export default UsageWarnings;
