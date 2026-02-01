"use client";

import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { useNotifications } from "@/components/notifications/NotificationContext";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  PermitsOverTime,
  PermitStatusChart,
  ActivityTrendChart,
} from "@/components/charts";

export const dynamic = "force-dynamic";

// Dashboard section wrapper with collapsible functionality
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isExpanded ? "Collapse section" : "Expand section"}
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${
                isExpanded ? "" : "-rotate-90"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// Quick stat card component
interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, change, changeLabel, icon, trend = "neutral" }: StatCardProps) {
  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-gray-600 dark:text-gray-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)" }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <span className={trendColors[trend]}>
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// Loading state component
function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Stats Loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard className="h-[300px]" />
        <SkeletonCard className="h-[300px]" />
      </div>

      {/* Table Loading */}
      <SkeletonTable rows={5} />
    </div>
  );
}

// Error state component
function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load dashboard</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        There was an error loading your dashboard data.
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Try Again
      </button>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: dashboardData, loading, error, refresh } = useDashboard();

  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleTestNotification = () => {
    const notifications = [
      { type: "info" as const, title: "New permit in your area", body: "A new drilling permit has been filed in Midland County." },
      { type: "success" as const, title: "Search saved successfully", body: "Your search has been saved and alerts are enabled." },
      { type: "warning" as const, title: "Permit expiring soon", body: "Permit #12345 is expiring in 7 days." },
      { type: "error" as const, title: "Failed to load data", body: "Unable to connect to the server. Please try again." },
    ];
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];

    addNotification(randomNotification);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor your drilling permits and alerts
            </p>
          </div>
          <button
            onClick={handleTestNotification}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Test Notification
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DashboardLoading />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DashboardError onRetry={refresh} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="New Permits (7d)"
                value={dashboardData?.recentActivity?.newPermits || 0}
                change={12}
                changeLabel="vs last week"
                icon={
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                trend="up"
              />
              <StatCard
                title="Status Changes"
                value={dashboardData?.recentActivity?.statusChanges || 0}
                change={8}
                changeLabel="vs last week"
                icon={
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
                trend="up"
              />
              <StatCard
                title="Unread Alerts"
                value={dashboardData?.alerts?.unreadCount || 0}
                change={-2}
                changeLabel="vs yesterday"
                icon={
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                }
                trend="down"
              />
              <StatCard
                title="Saved Searches"
                value={dashboardData?.savedSearches?.length || 0}
                icon={
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                trend="neutral"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardSection title="Permits Over Time" defaultExpanded={true}>
                <div className="h-[300px]">
                  <PermitsOverTime data={dashboardData?.chartData?.permitsOverTime || []} />
                </div>
              </DashboardSection>

              <DashboardSection title="Permit Status Distribution" defaultExpanded={true}>
                <div className="h-[300px]">
                  <PermitStatusChart data={dashboardData?.chartData?.permitStatus || []} />
                </div>
              </DashboardSection>
            </div>

            {/* Activity Trend */}
            <DashboardSection title="Activity Trend" defaultExpanded={false}>
              <div className="h-[300px]">
                <ActivityTrendChart data={dashboardData?.chartData?.activityTrends || []} />
              </div>
            </DashboardSection>

            {/* Recent Alerts Section */}
            <DashboardSection
              title="Recent Alerts"
              description="Latest permit notifications and updates"
              defaultExpanded={true}
              action={
                <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                  View All
                </button>
              }
            >
              <div className="overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dashboardData?.alerts?.recentAlerts?.map((alert, index) => (
                    <motion.li
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg px-4 -mx-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {alert.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {alert.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}{" "}
                            · {alert.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                        <span className="ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          New
                        </span>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </DashboardSection>

            {/* Areas of Interest Section */}
            <DashboardSection
              title="Areas of Interest"
              description="Monitor specific geographic regions"
              defaultExpanded={true}
              action={
                <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                  Manage AOIs
                </button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData?.aois.map((aoi, index) => (
                  <motion.div
                    key={aoi.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)" }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {aoi.name}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {aoi.permitCount} total permits
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                        +{aoi.recentPermitCount}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1">
                        View Details
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </DashboardSection>

            {/* Saved Searches Section */}
            <DashboardSection
              title="Saved Searches"
              description="Quick access to your favorite searches"
              defaultExpanded={false}
            >
              <div className="overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dashboardData?.savedSearches.map((search) => (
                    <motion.li
                      key={search.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg px-4 -mx-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {search.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Last used {search.lastUsed.toLocaleDateString()}
                        </p>
                      </div>
                      <button className="ml-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                        Run Search
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </DashboardSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
