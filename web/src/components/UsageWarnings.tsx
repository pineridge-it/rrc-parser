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
          className="flex items-start gap-3 p-4 rounded-lg"
          style={{ background: 'var(--color-error-subtle)', border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)' }}
          role="alert"
        >
          <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-error)' }} />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium" style={{ color: 'var(--color-error)' }}>Limit Reached</h4>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{warning.message}</p>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline"
                style={{ color: 'var(--color-error)' }}
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
          className="flex items-start gap-3 p-4 rounded-lg"
          style={{ background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)' }}
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium" style={{ color: 'var(--color-warning)' }}>Approaching Limit</h4>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{warning.message}</p>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline"
                style={{ color: 'var(--color-warning)' }}
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
    ? 'var(--color-error)'
    : isSoftLimit
    ? 'var(--color-warning)'
    : 'var(--color-brand-primary)';

  const textColor = isHardLimit
    ? 'var(--color-error)'
    : isSoftLimit
    ? 'var(--color-warning)'
    : 'var(--color-text-secondary)';

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ color: textColor }}>
          {current} / {limit} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-inset)' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%`, background: barColor }}
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
    <div className={`rounded-xl border p-6 ${className}`} style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-default)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Usage This Month</h3>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-link)' }}
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
