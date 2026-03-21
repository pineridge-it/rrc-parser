/**
 * Free Tier Banner Component
 * Displays free tier status and upgrade prompts
 */

'use client';

import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface FreeTierBannerProps {
  onUpgrade?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function FreeTierBanner({ onUpgrade, onDismiss, className = '' }: FreeTierBannerProps): React.ReactElement {
  return (
    <div
      className={`relative px-4 py-3 ${className}`}
      style={{ background: 'var(--color-brand-primary)', color: '#fff' }}
      role="banner"
      aria-label="Free tier information"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">
            You are on the Free plan. Upgrade to unlock more AOIs, alerts, and API access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="text-sm font-medium px-4 py-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
              style={{ background: '#fff', color: 'var(--color-brand-primary)' }}
              aria-label="Upgrade to premium plan"
            >
              Upgrade Now
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              aria-label="Dismiss free tier banner"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface FreeTierUsageCardProps {
  usage: {
    aois: { current: number; limit: number; percentage: number };
    alerts: { current: number; limit: number; percentage: number };
    exports: { current: number; limit: number; percentage: number };
    apiAccess: { allowed: boolean };
  };
  onUpgrade?: () => void;
  className?: string;
}

export function FreeTierUsageCard({ usage, onUpgrade, className = '' }: FreeTierUsageCardProps): React.ReactElement {
  const getStatusStyle = (percentage: number): React.CSSProperties => {
    if (percentage >= 100) return { color: 'var(--color-error)', background: 'var(--color-error-subtle)' };
    if (percentage >= 80) return { color: 'var(--color-warning)', background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)' };
    return { color: 'var(--color-success)', background: 'var(--color-success-subtle)' };
  };

  const getBarColor = (percentage: number): string => {
    if (percentage >= 100) return 'var(--color-error)';
    if (percentage >= 80) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  return (
    <div className={`rounded-xl border p-6 ${className}`} style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-default)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Free Plan Usage</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Your monthly usage limits</p>
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-sm font-medium focus:outline-none focus:underline"
            style={{ color: 'var(--color-text-link)' }}
            aria-label="Upgrade to unlock more features"
          >
            Upgrade
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* AOIs */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Areas of Interest</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={getStatusStyle(usage.aois.percentage)}>
              {usage.aois.current} / {usage.aois.limit}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--color-surface-inset)' }}
            role="progressbar"
            aria-valuenow={usage.aois.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Areas of Interest usage"
          >
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${Math.min(usage.aois.percentage, 100)}%`, background: getBarColor(usage.aois.percentage) }}
            />
          </div>
        </div>

        {/* Alerts */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Alerts This Month</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={getStatusStyle(usage.alerts.percentage)}>
              {usage.alerts.current} / {usage.alerts.limit}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--color-surface-inset)' }}
            role="progressbar"
            aria-valuenow={usage.alerts.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Alerts usage"
          >
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${Math.min(usage.alerts.percentage, 100)}%`, background: getBarColor(usage.alerts.percentage) }}
            />
          </div>
        </div>

        {/* Exports */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Exports This Month</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={getStatusStyle(usage.exports.percentage)}>
              {usage.exports.current} / {usage.exports.limit}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--color-surface-inset)' }}
            role="progressbar"
            aria-valuenow={usage.exports.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Exports usage"
          >
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${Math.min(usage.exports.percentage, 100)}%`, background: getBarColor(usage.exports.percentage) }}
            />
          </div>
        </div>

        {/* API Access */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--color-border-default)' }}>
          <div className="flex items-center justify-between">
            <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>API Access</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={usage.apiAccess.allowed
                ? { color: 'var(--color-success)', background: 'var(--color-success-subtle)' }
                : { color: 'var(--color-text-tertiary)', background: 'var(--color-surface-subtle)' }
              }
            >
              {usage.apiAccess.allowed ? 'Enabled' : 'Not Available'}
            </span>
          </div>
          {!usage.apiAccess.allowed && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
              API access requires a paid plan. Upgrade to integrate with your tools.
            </p>
          )}
        </div>
      </div>

      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="w-full mt-6 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ background: 'var(--color-brand-primary)' }}
          aria-label="Upgrade to unlock more features"
        >
          Upgrade to Unlock More
        </button>
      )}
    </div>
  );
}

export default FreeTierBanner;
