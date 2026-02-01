"use client";

/**
 * Notification Center Page
 * 
 * Full-page notification center with advanced filtering, search,
 * bulk actions, and notification history.
 * 
 * @page
 * @route /notifications
 * 
 * @author IvoryWaterfall
 * @since 2026-01-31
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BellOff,
  Search,
  Check,
  Trash2,
  Settings,
  ChevronLeft,
  Download,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/components/notifications/NotificationContext";
import { Notification } from "@/components/notifications/types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// Get icon based on notification type
const getNotificationIcon = (type?: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "warning":
    case "alert":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "error":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "info":
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

// Get category badge color
const getCategoryColor = (category?: string) => {
  switch (category) {
    case "permit":
      return "bg-green-100 text-green-800";
    case "alert":
      return "bg-red-100 text-red-800";
    case "system":
      return "bg-gray-100 text-gray-800";
    case "export":
      return "bg-blue-100 text-blue-800";
    case "usage":
      return "bg-purple-100 text-purple-800";
    case "account":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Format date
const formatDate = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Snooze options
const snoozeOptions = [
  { label: "15 minutes", duration: 15 * 60 * 1000 },
  { label: "1 hour", duration: 60 * 60 * 1000 },
  { label: "3 hours", duration: 3 * 60 * 60 * 1000 },
  { label: "Tomorrow", duration: 24 * 60 * 60 * 1000 },
];

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    getUnreadCountByCategory,
    snoozeNotification,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Filter notifications
  const filteredNotifications = React.useMemo(() => {
    let result = [...notifications];

    // Apply tab filter
    if (activeTab === "unread") {
      result = result.filter((n) => !n.isRead && !n.isSnoozed);
    } else if (activeTab !== "all") {
      result = result.filter((n) => n.category === activeTab);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.body?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, activeTab, searchQuery]);

  // Get category counts
  const categoryCounts = React.useMemo(() => {
    const categories: Notification["category"][] = [
      "permit",
      "alert",
      "system",
      "export",
      "usage",
      "account",
    ];
    return categories.map((cat) => ({
      category: cat,
      count: notifications.filter((n) => n.category === cat).length,
      unread: getUnreadCountByCategory(cat),
    }));
  }, [notifications, getUnreadCountByCategory]);

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleMarkSelectedAsRead = () => {
    selectedIds.forEach((id) => markAsRead(id));
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach((id) => removeNotification(id));
    setSelectedIds(new Set());
  };

  // Snooze handler
  const handleSnoozeNotification = (id: string, duration: number) => {
    snoozeNotification(id, duration);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // Export notifications
  const handleExport = () => {
    const dataStr = JSON.stringify(filteredNotifications, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notifications-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)]">
      {/* Header */}
      <header className="bg-[var(--color-surface-default)] border-b border-[var(--color-border-default)] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  Notifications
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${
                        unreadCount !== 1 ? "s" : ""
                      }`
                    : "All caught up!"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filteredNotifications.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={markAllAsRead}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <Settings className="h-4 w-4 mr-2" />
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={clearNotifications}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear all
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="bg-[var(--color-surface-default)] rounded-xl border border-[var(--color-border-default)] p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <Input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkSelectedAsRead}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Cancel
                </Button>
              </motion.div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={filteredNotifications.length === 0}
              >
                <Check className="h-4 w-4 mr-1" />
                Select All
              </Button>
            )}
          </div>

          {/* Category Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-4"
          >
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="gap-2">
                All
                <Badge variant="neutral">{notifications.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="gap-2">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="error">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              {categoryCounts
                .filter((item): item is { category: Exclude<Notification["category"], undefined>; count: number; unread: number } =>
                  item.category !== undefined && item.count > 0
                )
                .map(({ category, unread }) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="gap-2 capitalize"
                  >
                    {category}
                    {unread > 0 && (
                      <Badge variant="error">{unread}</Badge>
                    )}
                  </TabsTrigger>
                ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Notification List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-[var(--color-surface-default)] rounded-xl border border-[var(--color-border-default)] overflow-hidden"
        >
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center mb-4">
                <BellOff className="h-8 w-8 text-[var(--color-text-tertiary)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
                No notifications
              </h3>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                {searchQuery
                  ? "No matches found for your search"
                  : activeTab === "unread"
                  ? "No unread notifications"
                  : activeTab !== "all"
                  ? `No ${activeTab} notifications`
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-default)]">
              <AnimatePresence>
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    variants={itemVariants}
                    layout
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 hover:bg-[var(--color-surface-subtle)] cursor-pointer transition-colors",
                      !notification.isRead &&
                        "bg-[var(--color-brand-primary)]/5",
                      selectedIds.has(notification.id) &&
                        "bg-[var(--color-brand-primary)]/10"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div
                        className="pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.has(notification.id)}
                          onCheckedChange={() =>
                            toggleSelection(notification.id)
                          }
                        />
                      </div>

                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4
                                className={cn(
                                  "text-sm",
                                  !notification.isRead
                                    ? "font-semibold text-[var(--color-text-primary)]"
                                    : "text-[var(--color-text-primary)]"
                                )}
                              >
                                {notification.title}
                                {notification.isSnoozed && (
                                  <span className="ml-2 text-xs text-[var(--color-text-tertiary)]">
                                    (Snoozed)
                                  </span>
                                )}
                                {notification.isBatched && (
                                  <span className="ml-2 text-xs text-[var(--color-text-tertiary)]">
                                    (Batch of {notification.batchCount})
                                  </span>
                                )}
                              </h4>
                              {!notification.isRead && !notification.isSnoozed && !notification.isBatched && (
                                <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)]" />
                              )}
                            </div>
                            {notification.body && (
                              <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
                                {notification.body}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-[var(--color-text-tertiary)]">
                                {formatDate(notification.createdAt)}
                              </span>
                              {notification.category && (
                                <Badge
                                  variant="neutral"
                                  className={cn(
                                    "text-xs capitalize",
                                    getCategoryColor(notification.category)
                                  )}
                                >
                                  {notification.category}
                                </Badge>
                              )}
                              {notification.priority === "critical" && (
                                <Badge
                                  variant="error"
                                  className="text-xs"
                                >
                                  Critical
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.isRead && !notification.isSnoozed && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as read
                                </DropdownMenuItem>
                              )}
                              {/* Snooze options */}
                              {!notification.isSnoozed && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleSnoozeNotification(notification.id, snoozeOptions[0].duration)}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Snooze for {snoozeOptions[0].label}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleSnoozeNotification(notification.id, snoozeOptions[1].duration)}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Snooze for {snoozeOptions[1].label}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleSnoozeNotification(notification.id, snoozeOptions[2].duration)}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Snooze for {snoozeOptions[2].label}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleSnoozeNotification(notification.id, snoozeOptions[3].duration)}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Snooze for {snoozeOptions[3].label}
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  removeNotification(notification.id);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Footer Stats */}
        {notifications.length > 0 && (
          <div className="mt-6 text-center text-sm text-[var(--color-text-tertiary)]">
            Showing {filteredNotifications.length} of {notifications.length}{" "}
            notifications
          </div>
        )}
      </main>
    </div>
  );
}
