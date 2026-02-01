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
      className={`relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 ${className}`}
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
              className="text-sm font-medium bg-white text-blue-600 px-4 py-1.5 rounded-full hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="Upgrade to premium plan"
            >
              Upgrade Now
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
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
  const getStatusColor = (percentage: number): string => {
    if (percentage >= 100) return 'text-red-600 bg-red-50';
    if (percentage >= 80) return 'text-amber-600 bg-amber-50';
    return 'text-green-600 bg-green-50';
  };

  const getBarColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Free Plan Usage</h3>
          <p className="text-sm text-gray-500 mt-1">Your monthly usage limits</p>
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
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
            <span className="font-medium text-gray-700">Areas of Interest</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(usage.aois.percentage)}`}>
              {usage.aois.current} / {usage.aois.limit}
            </span>
          </div>
          <div
            className="h-2 bg-gray-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={usage.aois.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Areas of Interest usage"
          >
            <div
              className={`h-full ${getBarColor(usage.aois.percentage)} transition-all duration-300`}
              style={{ width: `${Math.min(usage.aois.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Alerts */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Alerts This Month</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(usage.alerts.percentage)}`}>
              {usage.alerts.current} / {usage.alerts.limit}
            </span>
          </div>
          <div
            className="h-2 bg-gray-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={usage.alerts.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Alerts usage"
          >
            <div
              className={`h-full ${getBarColor(usage.alerts.percentage)} transition-all duration-300`}
              style={{ width: `${Math.min(usage.alerts.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Exports */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Exports This Month</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(usage.exports.percentage)}`}>
              {usage.exports.current} / {usage.exports.limit}
            </span>
          </div>
          <div
            className="h-2 bg-gray-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={usage.exports.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Exports usage"
          >
            <div
              className={`h-full ${getBarColor(usage.exports.percentage)} transition-all duration-300`}
              style={{ width: `${Math.min(usage.exports.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* API Access */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">API Access</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              usage.apiAccess.allowed
                ? 'text-green-600 bg-green-50'
                : 'text-gray-500 bg-gray-100'
            }`}>
              {usage.apiAccess.allowed ? 'Enabled' : 'Not Available'}
            </span>
          </div>
          {!usage.apiAccess.allowed && (
            <p className="text-xs text-gray-500 mt-2">
              API access requires a paid plan. Upgrade to integrate with your tools.
            </p>
          )}
        </div>
      </div>

      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="w-full mt-6 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Upgrade to unlock more features"
        >
          Upgrade to Unlock More
        </button>
      )}
    </div>
  );
}

export default FreeTierBanner;
