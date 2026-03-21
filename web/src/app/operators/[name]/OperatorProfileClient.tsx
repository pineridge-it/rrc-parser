"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface OperatorStats {
  operator: {
    name: string;
    activeSince: string | null;
    lastFilingDate: string | null;
  };
  kpiCards: {
    totalPermits: number;
    approvalRate: number | null;
    countiesActive: number;
    lastFilingDate: string | null;
  };
  chartData: {
    filingTrend: Array<{
      month: string;
      permitCount: number;
      approved: number;
      denied: number;
    }>;
    topCounties: Array<{
      county: string;
      permitCount: number;
      lat: number | null;
      lng: number | null;
    }>;
    topFormations: string[];
  };
  recentPermits: Array<{
    permit_number: string;
    api_number: string | null;
    lease_name: string | null;
    county: string | null;
    well_type: string | null;
    status: string | null;
    filed_date: string | null;
    issued_date: string | null;
    surface_lat: number | null;
    surface_lon: number | null;
  }>;
  period: string;
}

interface Props {
  initialData: OperatorStats;
  operatorName: string;
}

const periodOptions = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '365d', label: '1 Year' },
  { value: 'all', label: 'All Time' },
];

function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatNumber(num: number | null): string {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString();
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border-default)] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-[var(--color-surface-subtle)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function FilingTrendChart({ data }: { data: OperatorStats['chartData']['filingTrend'] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--color-text-secondary)]">
        No filing trend data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.permitCount), 1);
  const chartHeight = 200;
  const barWidth = 100 / data.length;

  return (
    <div className="h-64">
      <div className="h-full flex items-end gap-1">
        {data.slice(-24).map((d, i) => {
          const height = (d.permitCount / maxCount) * chartHeight;
          const month = new Date(d.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end group relative"
              style={{ height: chartHeight }}
            >
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-[var(--color-surface-overlay)] px-2 py-1 rounded text-xs z-10 whitespace-nowrap">
                <div className="font-medium">{month}</div>
                <div className="text-[var(--color-text-secondary)]">{d.permitCount} permits</div>
                <div className="text-green-600">{d.approved} approved</div>
                <div className="text-red-600">{d.denied} denied</div>
              </div>
              <div
                className="w-full bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-t transition-all duration-200 hover:opacity-80"
                style={{ height: `${Math.max(height, 2)}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-[var(--color-text-tertiary)]">
        <span>{formatDate(data[0]?.month)}</span>
        <span>{formatDate(data[data.length - 1]?.month)}</span>
      </div>
    </div>
  );
}

function CountyBarChart({ data }: { data: OperatorStats['chartData']['topCounties'] }) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--color-text-secondary)]">
        No county data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.permitCount), 1);

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="group">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-[var(--color-text-primary)]">{item.county}</span>
            <span className="text-[var(--color-text-secondary)]">{item.permitCount}</span>
          </div>
          <div className="h-2 bg-[var(--color-surface-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
              style={{ width: `${(item.permitCount / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PermitsTable({ permits }: { permits: OperatorStats['recentPermits'] }) {
  const statusColors: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-blue-100 text-blue-800',
  };

  if (!permits || permits.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--color-text-secondary)]">
        No recent permits found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-default)]">
            <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Permit #</th>
            <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Lease Name</th>
            <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">County</th>
            <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Type</th>
            <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Status</th>
            <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Filed</th>
          </tr>
        </thead>
        <tbody>
          {permits.map((permit, i) => (
            <motion.tr
              key={permit.permit_number || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)] transition-colors"
            >
              <td className="py-3 px-4">
                <Link
                  href={`/permits/${permit.api_number || permit.permit_number}`}
                  className="text-[var(--color-primary)] hover:underline font-mono"
                >
                  {permit.permit_number}
                </Link>
              </td>
              <td className="py-3 px-4 text-[var(--color-text-primary)]">
                {permit.lease_name || '—'}
              </td>
              <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                {permit.county || '—'}
              </td>
              <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                {permit.well_type || '—'}
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[permit.status?.toLowerCase() || ''] || 'bg-gray-100 text-gray-800'}`}>
                  {permit.status || 'Unknown'}
                </span>
              </td>
              <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                {formatDate(permit.filed_date)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OperatorProfileClient({ initialData, operatorName }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState(searchParams.get('period') || 'all');
  const [isWatched, setIsWatched] = useState(false);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    router.push(`/operators/${encodeURIComponent(operatorName)}?period=${newPeriod}`);
  };

  const handleWatchToggle = () => {
    setIsWatched(!isWatched);
  };

  const { kpiCards, chartData, recentPermits, operator } = initialData;

  return (
    <div className="min-h-screen bg-[var(--color-surface-default)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <nav className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-4">
              <Link href="/dashboard" className="hover:text-[var(--color-text-primary)]">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/operators" className="hover:text-[var(--color-text-primary)]">
                Operators
              </Link>
              <span>/</span>
              <span className="text-[var(--color-text-primary)]">{operatorName}</span>
            </nav>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {operatorName}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Active since {formatDate(operator.activeSince)} · Last filing {formatDate(operator.lastFilingDate)}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[var(--color-border-default)] rounded-lg overflow-hidden">
                  {periodOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handlePeriodChange(opt.value)}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        period === opt.value
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={handleWatchToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isWatched
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]'
                  }`}
                >
                  <svg className="w-4 h-4" fill={isWatched ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {isWatched ? 'Watching' : 'Watch'}
                </button>

                <button
                  onClick={() => navigator.share?.({ title: operatorName, url: window.location.href })}
                  className="p-2 rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] transition-colors"
                  aria-label="Share"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
              title="Total Permits"
              value={formatNumber(kpiCards.totalPermits)}
              subtitle={period === 'all' ? 'All time' : `Last ${periodOptions.find(p => p.value === period)?.label}`}
              icon={
                <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <KPICard
              title="Approval Rate"
              value={kpiCards.approvalRate !== null ? `${kpiCards.approvalRate}%` : 'N/A'}
              subtitle="Of decided permits"
              icon={
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <KPICard
              title="Counties Active"
              value={formatNumber(kpiCards.countiesActive)}
              subtitle="Unique counties"
              icon={
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <KPICard
              title="Last Filing"
              value={formatDate(kpiCards.lastFilingDate)}
              subtitle="Most recent permit"
              icon={
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border-default)] p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  Permit Filing Trend
                </h2>
                <FilingTrendChart data={chartData.filingTrend} />
              </div>
            </div>

            <div className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border-default)] p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                Top Counties
              </h2>
              <CountyBarChart data={chartData.topCounties} />
            </div>
          </div>

          {chartData.topFormations && chartData.topFormations.length > 0 && (
            <div className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border-default)] p-6 mb-8">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                Top Formations
              </h2>
              <div className="flex flex-wrap gap-2">
                {chartData.topFormations.map((formation, i) => (
                  <span
                    key={i}
                    className="inline-flex px-3 py-1.5 rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] text-sm font-medium"
                  >
                    {formation}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border-default)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Recent Permits
              </h2>
              <Link
                href={`/search?operator=${encodeURIComponent(operatorName)}`}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                View all permits →
              </Link>
            </div>
            <PermitsTable permits={recentPermits} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
