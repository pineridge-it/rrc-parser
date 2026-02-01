'use client'

/**
 * NotificationCenter Component
 *
 * Enhanced notification dropdown with search, filtering, bulk actions,
 * and improved visual hierarchy.
 *
 * @component
 * @example
 * ```tsx
 * <NotificationCenter
 *   notifications={notifications}
 *   unreadCount={5}
 *   onMarkAsRead={handleMarkAsRead}
 *   onMarkAllAsRead={handleMarkAllAsRead}
 *   onNotificationClick={handleClick}
 *   onBatchSimilarNotifications={handleBatchSimilar}
 * />
 * ```
 *
 * @author IvoryWaterfall
 * @since 2026-01-31
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { Notification } from './types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Trash2, BellOff, Filter, Search,
  CheckCheck, Archive, Settings, ChevronRight,
  Clock
} from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onNotificationClick: (notification: Notification) => void
  onRemoveNotification?: (id: string) => void
  onArchiveNotifications?: (ids: string[]) => void
  onSnoozeNotification?: (id: string, duration: number) => void
  onBatchSimilarNotifications?: (ids: string[]) => void
  hasImportant?: boolean
  pulseTrigger?: boolean
}

export default function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onRemoveNotification,
  onArchiveNotifications,
  onSnoozeNotification,
  onBatchSimilarNotifications,
  hasImportant = false,
  pulseTrigger = false,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['category']>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkMode, setIsBulkMode] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsBulkMode(false)
        setSelectedIds(new Set())
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Reset selection when closing
  useEffect(() => {
    if (!isOpen) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setIsBulkMode(false)
        setSelectedIds(new Set())
        setSearchQuery('')
      })
    }
  }, [isOpen])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  // Calculate unread and snoozed counts
  const unreadCountCalculated = useMemo(() => {
    return notifications.filter(n => !n.isRead && !n.isSnoozed).length
  }, [notifications])

  const snoozedCount = useMemo(() => {
    return notifications.filter(n => n.isSnoozed).length
  }, [notifications])

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let result = notifications

    // Apply category filter
    if (filter === 'unread') {
      result = result.filter(n => !n.isRead && !n.isSnoozed)
    } else if (filter !== 'all') {
      result = result.filter(n => n.category === filter)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.body?.toLowerCase().includes(query)
      )
    }

    return result
  }, [notifications, filter, searchQuery])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<Notification['category']>()
    notifications.forEach(n => {
      if (n.category) cats.add(n.category)
    })
    return ['all', 'unread', ...Array.from(cats)] as const
  }, [notifications])

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotifications.map(n => n.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleMarkSelectedAsRead = () => {
    selectedIds.forEach(id => onMarkAsRead(id))
    setSelectedIds(new Set())
  }

  const handleArchiveSelected = () => {
    onArchiveNotifications?.(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onMarkAsRead(id)
  }

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkAllAsRead()
  }

  const handleRemoveNotification = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onRemoveNotification?.(id)
  }

  const handleSnoozeNotification = (id: string, duration: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onSnoozeNotification?.(id, duration)
  }

  const handleNotificationClick = (notification: Notification) => {
    if (isBulkMode) {
      toggleSelection(notification.id)
    } else {
      onNotificationClick(notification)
      setIsOpen(false)
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      return 'Just now'
    } else if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Get icon based on notification type
  const getIcon = (iconType?: string, notificationType?: string) => {
    const type = notificationType || iconType || 'default'

    const iconClasses = "h-5 w-5"
    const containerClasses = "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"

    switch (type) {
      case 'permit':
      case 'success':
        return (
          <div className={`${containerClasses} bg-green-100`}>
            <svg className={`${iconClasses} text-green-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'alert':
      case 'warning':
        return (
          <div className={`${containerClasses} bg-yellow-100`}>
            <svg className={`${iconClasses} text-yellow-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className={`${containerClasses} bg-red-100`}>
            <svg className={`${iconClasses} text-red-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'system':
        return (
          <div className={`${containerClasses} bg-gray-100`}>
            <svg className={`${iconClasses} text-gray-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )
      case 'export':
        return (
          <div className={`${containerClasses} bg-blue-100`}>
            <svg className={`${iconClasses} text-blue-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )
      case 'usage':
        return (
          <div className={`${containerClasses} bg-purple-100`}>
            <svg className={`${iconClasses} text-purple-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className={`${containerClasses} bg-gray-100`}>
            <svg className={`${iconClasses} text-gray-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  // Get category label
  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'all': return 'All'
      case 'unread': return 'Unread'
      case 'permit': return 'Permits'
      case 'alert': return 'Alerts'
      case 'system': return 'System'
      case 'export': return 'Exports'
      case 'usage': return 'Usage'
      case 'account': return 'Account'
      default: return 'General'
    }
  }

  // Get priority class
  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-yellow-500'
      case 'critical': return 'border-l-4 border-l-red-500'
      default: return ''
    }
  }

  // Snooze options
  const snoozeOptions = [
    { label: '15 minutes', duration: 15 * 60 * 1000 },
    { label: '1 hour', duration: 60 * 60 * 1000 },
    { label: '3 hours', duration: 3 * 60 * 60 * 1000 },
    { label: 'Tomorrow', duration: 24 * 60 * 60 * 1000 },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <NotificationBell
        unreadCount={unreadCountCalculated}
        hasImportant={hasImportant}
        onClick={toggleDropdown}
        isOpen={isOpen}
        pulseTrigger={pulseTrigger}
        snoozedCount={snoozedCount}
        notifications={notifications}
        onBatchSimilarNotifications={onBatchSimilarNotifications}
      />

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="origin-top-right absolute right-0 mt-3 w-[420px] rounded-xl shadow-2xl bg-[var(--color-surface-default)] border border-[var(--color-border-default)] overflow-hidden z-50"
          >
            {/* Header */}
            <div className="border-b border-[var(--color-border-default)] px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Notifications
                </h3>
                <div className="flex items-center gap-1">
                  {unreadCountCalculated > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="h-8 text-xs"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href="/notifications">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setFilter(category as typeof filter)}
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      filter === category
                        ? "bg-[var(--color-brand-primary)] text-white"
                        : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    )}
                  >
                    {category === 'all' && <Filter className="h-3 w-3 mr-1" />}
                    {getCategoryLabel(category)}
                    {category === 'unread' && unreadCountCalculated > 0 && (
                      <span className="ml-1.5 bg-[var(--color-danger)] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {unreadCountCalculated}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {isBulkMode && selectedIds.size > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-[var(--color-border-default)] px-4 py-2 bg-[var(--color-surface-subtle)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {selectedIds.size} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkSelectedAsRead}
                      className="h-7 text-xs"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Mark read
                    </Button>
                    {onArchiveNotifications && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleArchiveSelected}
                        className="h-7 text-xs"
                      >
                        <Archive className="h-3.5 w-3.5 mr-1" />
                        Archive
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAll}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mx-auto h-12 w-12 text-[var(--color-text-tertiary)]"
                  >
                    <BellOff className="h-12 w-12" />
                  </motion.div>
                  <h3 className="mt-3 text-sm font-medium text-[var(--color-text-primary)]">
                    No notifications
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {searchQuery
                      ? "No matches found"
                      : filter === 'unread'
                      ? "No unread notifications"
                      : filter !== 'all'
                      ? `No ${getCategoryLabel(filter)} notifications`
                      : "You're all caught up!"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border-default)]">
                  <AnimatePresence>
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "px-4 py-3 hover:bg-[var(--color-surface-subtle)] cursor-pointer transition-colors",
                          getPriorityClass(notification.priority),
                          !notification.isRead && !notification.isSnoozed && 'bg-[var(--color-brand-primary)]/5',
                          selectedIds.has(notification.id) && 'bg-[var(--color-brand-primary)]/10',
                          notification.isBatched && 'bg-[var(--color-surface-raised)] border-l-4 border-l-blue-500'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox in bulk mode */}
                          {isBulkMode && (
                            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(notification.id)}
                                onCheckedChange={() => toggleSelection(notification.id)}
                              />
                            </div>
                          )}

                          {getIcon(notification.icon, notification.type)}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                "text-sm truncate",
                                notification.isRead || notification.isSnoozed
                                  ? 'text-[var(--color-text-primary)]'
                                  : 'text-[var(--color-text-primary)] font-semibold'
                              )}>
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
                              </p>

                              {!isBulkMode && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {!notification.isRead && !notification.isSnoozed && !notification.isBatched && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                        </svg>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {!notification.isRead && !notification.isSnoozed && !notification.isBatched && (
                                        <DropdownMenuItem onClick={(e) => handleMarkAsRead(notification.id, e)}>
                                          <Check className="h-4 w-4 mr-2" />
                                          Mark as read
                                        </DropdownMenuItem>
                                      )}
                                      {onSnoozeNotification && !notification.isSnoozed && !notification.isBatched && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={(e) => handleSnoozeNotification(notification.id, snoozeOptions[0].duration, e)}
                                          >
                                            <Clock className="h-4 w-4 mr-2" />
                                            Snooze for {snoozeOptions[0].label}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={(e) => handleSnoozeNotification(notification.id, snoozeOptions[1].duration, e)}
                                          >
                                            <Clock className="h-4 w-4 mr-2" />
                                            Snooze for {snoozeOptions[1].label}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={(e) => handleSnoozeNotification(notification.id, snoozeOptions[2].duration, e)}
                                          >
                                            <Clock className="h-4 w-4 mr-2" />
                                            Snooze for {snoozeOptions[2].label}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={(e) => handleSnoozeNotification(notification.id, snoozeOptions[3].duration, e)}
                                          >
                                            <Clock className="h-4 w-4 mr-2" />
                                            Snooze for {snoozeOptions[3].label}
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      <DropdownMenuItem
                                        onClick={(e) => handleRemoveNotification?.(notification.id, e)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>

                            {notification.body && (
                              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)] line-clamp-2">
                                {notification.body}
                              </p>
                            )}

                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="text-xs text-[var(--color-text-tertiary)]">
                                {formatDate(notification.createdAt)}
                              </span>
                              {notification.category && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)] capitalize">
                                  {getCategoryLabel(notification.category)}
                                </span>
                              )}
                              {!notification.isRead && !notification.isSnoozed && !notification.isBatched && (
                                <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)]" />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--color-border-default)] px-4 py-2.5 bg-[var(--color-surface-subtle)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsBulkMode(!isBulkMode)}
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isBulkMode
                        ? "text-[var(--color-brand-primary)]"
                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                    )}
                  >
                    {isBulkMode ? 'Done' : 'Select'}
                  </button>

                  {isBulkMode && selectedIds.size === 0 && (
                    <button
                      onClick={selectAll}
                      className="text-xs font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)]"
                    >
                      Select all
                    </button>
                  )}
                </div>

                <Link
                  href="/notifications"
                  className="flex items-center text-xs font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] transition-colors"
                >
                  View all notifications
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}