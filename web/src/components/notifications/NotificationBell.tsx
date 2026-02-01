"use client";

/**
 * NotificationBell Component
 *
 * Enhanced notification bell with prominent badge, pulse animation for new notifications,
 * and different icon states based on notification status.
 *
 * @component
 * @example
 * ```tsx
 * <NotificationBell
 *   unreadCount={5}
 *   snoozedCount={2}
 *   hasImportant={true}
 *   onClick={() => setIsOpen(true)}
 * />
 * ```
 *
 * @author IvoryWaterfall
 * @since 2026-01-31
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, BellDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Notification } from "./types";

export interface NotificationBellProps {
  /** Number of unread notifications */
  unreadCount: number;
  /** Number of snoozed notifications */
  snoozedCount?: number;
  /** Array of notifications to calculate batched count */
  notifications?: Notification[];
  /** Whether there are important/critical notifications */
  hasImportant?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the dropdown is open */
  isOpen?: boolean;
  /** Pulse animation trigger - set to true when new notifications arrive */
  pulseTrigger?: boolean;
  /** Function to batch similar notifications */
  onBatchSimilarNotifications?: (ids: string[]) => void;
}

/**
 * NotificationBell - Enhanced bell icon with prominent badge and animations
 */
export function NotificationBell({
  unreadCount,
  snoozedCount = 0,
  notifications = [],
  hasImportant = false,
  onClick,
  className,
  isOpen = false,
  pulseTrigger = false,
  onBatchSimilarNotifications,
}: NotificationBellProps) {
  const [isPulsing, setIsPulsing] = React.useState(false);

  // Trigger pulse animation when pulseTrigger changes
  React.useEffect(() => {
    if (pulseTrigger) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [pulseTrigger]);

  // Total notifications count (unread + snoozed)
  const totalCount = unreadCount + snoozedCount;

  // Count of batched notifications
  const batchedCount = notifications ? notifications.filter(n => n.isBatched).length : 0;

  // Determine which bell icon to show
  const getBellIcon = () => {
    if (totalCount === 0) {
      return <Bell className="h-6 w-6" />;
    }
    if (hasImportant) {
      return <BellRing className="h-6 w-6" />;
    }
    return <BellDot className="h-6 w-6" />;
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={cn(
          "relative p-2 rounded-full transition-all duration-200",
          "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-surface-raised)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:ring-offset-2",
          isOpen && "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]",
          className
        )}
        aria-label={`Notifications${totalCount > 0 ? `, ${totalCount} unread or snoozed${snoozedCount > 0 ? `, ${snoozedCount} snoozed` : ''}${batchedCount > 0 ? `, ${batchedCount} batched` : ''}` : ""}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {/* Bell Icon with animation */}
        <motion.div
          animate={isPulsing ? {
            scale: [1, 1.2, 1, 1.1, 1],
            rotate: [0, -10, 10, -5, 5, 0],
          } : {}}
          transition={{ duration: 0.5 }}
        >
          {getBellIcon()}
        </motion.div>

        {/* Unread Badge */}
        <AnimatePresence>
          {totalCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={cn(
                "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                "min-w-[20px] h-5 px-1.5",
                "rounded-full text-xs font-bold text-white",
                "border-2 border-[var(--color-surface-default)]",
                hasImportant
                  ? "bg-[var(--color-danger)]"
                  : "bg-[var(--color-brand-primary)]"
              )}
            >
              {totalCount > 99 ? "99+" : totalCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring animation for new notifications */}
        <AnimatePresence>
          {isPulsing && (
            <motion.span
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "absolute inset-0 rounded-full",
                hasImportant
                  ? "bg-[var(--color-danger)]"
                  : "bg-[var(--color-brand-primary)]"
              )}
              style={{ zIndex: -1 }}
            />
          )}
        </AnimatePresence>
      </button>

      {/* Batch button - only show when there are notifications that can be batched */}
      {onBatchSimilarNotifications && notifications && notifications.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBatchSimilarNotifications(notifications.map(n => n.id));
          }}
          className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center shadow-sm hover:bg-blue-600 transition-colors"
          aria-label="Batch similar notifications"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default NotificationBell;
