"use client";

import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  PermitsOverTime,
  PermitStatusChart,
  ActivityTrendChart,
} from "@/components/charts";
import {
  TopOperators,
  CountyActivityMap,
  QuickActions,
} from "@/components/dashboard";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface DashboardSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  action?: React.ReactNode;
}

function DashboardSection({
  title,
  description,
  children,
  defaultExpanded = true,
  action,
}: DashboardSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border-default)] overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-[var(--color-border-default)] flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors"
            aria-label={isExpanded ? "Collapse section" : "Expand section"}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="p-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, change, changeLabel, icon, iconBg, trend = "neutral" }: StatCardProps) {
  const trendConfig = {
    up: { color: "text-[var(--color-success)]", arrow: "↑" },
    down: { color: "text-[var(--color-error)]", arrow: "↓" },
    neutral: { color: "text-[var(--color-text-tertiary)]", arrow: "→" },
  };
  const { color, arrow } = trendConfig[trend];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border-default)] p-5 cursor-default"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--color-text-primary)]">{value}</p>
          {change !== undefined && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`text-xs font-medium ${color}`}>
                {arrow} {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-[var(--color-text-tertiary)]">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 p-2.5 rounded-lg ${iconBg || "bg-[var(--color-surface-subtle)]"}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function DashboardLoading() {
  return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard className="h-[300px]" />
        <SkeletonCard className="h-[300px]" />
      </div>
      <SkeletonTable rows={5} />
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="w-14 h-14 bg-[var(--color-error-subtle)] rounded-full flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">Failed to load dashboard</h3>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        There was an error loading your dashboard data.
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-[var(--color-brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-brand-primary-hover)] transition-colors"
      >
        Try again
      </button>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: dashboardData, loading, error, refresh } = useDashboard();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Dashboard</h2>
        <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
          Monitor your drilling permits and alerts
        </p>
      </header>

      <div className="mb-6">
        <QuickActions />
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DashboardLoading />
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DashboardError onRetry={refresh} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="New Permits (7d)"
                value={dashboardData?.recentActivity?.newPermits ?? 0}
                change={12}
                changeLabel="vs last week"
                iconBg="bg-[var(--color-brand-primary)]/10"
                icon={
                  <svg className="w-5 h-5 text-[var(--color-brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                trend="up"
              />
              <StatCard
                title="Status Changes"
                value={dashboardData?.recentActivity?.statusChanges ?? 0}
                change={8}
                changeLabel="vs last week"
                iconBg="bg-[var(--color-success)]/10"
                icon={
                  <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
                trend="up"
              />
              <StatCard
                title="Unread Alerts"
                value={dashboardData?.alerts?.unreadCount ?? 0}
                change={-2}
                changeLabel="vs yesterday"
                iconBg="bg-[var(--color-warning)]/10"
                icon={
                  <svg className="w-5 h-5 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                }
                trend="down"
              />
              <StatCard
                title="Saved Searches"
                value={dashboardData?.savedSearches?.length ?? 0}
                iconBg="bg-[var(--color-info)]/10"
                icon={
                  <svg className="w-5 h-5 text-[var(--color-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                trend="neutral"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DashboardSection title="Permits Over Time">
                <div className="h-[300px]">
                  <PermitsOverTime data={dashboardData?.chartData?.permitsOverTime || []} />
                </div>
              </DashboardSection>

              <DashboardSection title="Permit Status Distribution">
                <div className="h-[300px]">
                  <PermitStatusChart data={dashboardData?.chartData?.permitStatus || []} />
                </div>
              </DashboardSection>
            </div>

            <DashboardSection title="Activity Trend" defaultExpanded={false}>
              <div className="h-[300px]">
                <ActivityTrendChart data={dashboardData?.chartData?.activityTrends || []} />
              </div>
            </DashboardSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DashboardSection
                title="Top Operators"
                description="Most active operators this week"
                action={
                  <Link
                    href="/operators"
                    className="text-xs font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] transition-colors"
                  >
                    View all
                  </Link>
                }
              >
                <TopOperators operators={dashboardData?.topOperators || []} />
              </DashboardSection>

              <DashboardSection
                title="County Activity"
                description="Permit filings by county"
              >
                <CountyActivityMap counties={dashboardData?.countyActivity || []} />
              </DashboardSection>
            </div>

            <DashboardSection
              title="Recent Alerts"
              description="Latest permit notifications and updates"
              action={
                <Link
                  href="/alerts"
                  className="text-xs font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] transition-colors"
                >
                  View all
                </Link>
              }
            >
              {dashboardData?.alerts?.recentAlerts?.length ? (
                <ul className="divide-y divide-[var(--color-border-default)]">
                  {dashboardData.alerts.recentAlerts.map((alert, index) => (
                    <motion.li
                      key={alert.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="py-3.5 flex items-center justify-between hover:bg-[var(--color-surface-subtle)] transition-colors rounded-lg px-3 -mx-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-info)] flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            {alert.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                            {alert.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                            {" · "}
                            {alert.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success-subtle)] text-[var(--color-success)] flex-shrink-0">
                        New
                      </span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-text-tertiary)] text-center py-6">No recent alerts</p>
              )}
            </DashboardSection>

            <DashboardSection
              title="Areas of Interest"
              description="Monitor specific geographic regions"
              action={
                <Link
                  href="/aois"
                  className="text-xs font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] transition-colors"
                >
                  Manage
                </Link>
              }
            >
              {dashboardData?.aois?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dashboardData.aois.map((aoi, index) => (
                    <motion.div
                      key={aoi.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                      className="bg-[var(--color-surface-subtle)] rounded-lg p-4 border border-[var(--color-border-default)] hover:border-[var(--color-brand-primary)]/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                            {aoi.name}
                          </h4>
                          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                            {aoi.permitCount} total permits
                          </p>
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
                          +{aoi.recentPermitCount}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[var(--color-border-default)]">
                        <Link
                          href={`/aois/${aoi.id}`}
                          className="text-xs font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] flex items-center gap-1 transition-colors"
                        >
                          View details
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-[var(--color-text-tertiary)] mb-3">No areas of interest added yet</p>
                  <Link
                    href="/aois"
                    className="text-sm font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] transition-colors"
                  >
                    Add your first AOI
                  </Link>
                </div>
              )}
            </DashboardSection>

            <DashboardSection
              title="Saved Searches"
              description="Quick access to your saved searches"
              defaultExpanded={false}
            >
              {dashboardData?.savedSearches?.length ? (
                <ul className="divide-y divide-[var(--color-border-default)]">
                  {dashboardData.savedSearches.map((search) => (
                    <motion.li
                      key={search.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="py-3.5 flex items-center justify-between hover:bg-[var(--color-surface-subtle)] transition-colors rounded-lg px-3 -mx-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {search.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                          Last used {search.lastUsed.toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        href={`/search?saved=${search.id}`}
                        className="ml-4 text-xs font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] transition-colors flex-shrink-0"
                      >
                        Run search
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-text-tertiary)] text-center py-6">No saved searches</p>
              )}
            </DashboardSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
