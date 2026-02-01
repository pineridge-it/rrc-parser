export interface Notification {
  id: string
  title: string
  body?: string
  icon?: string
  actionUrl?: string
  isRead: boolean
  readAt?: Date
  createdAt: Date
  // New fields for enhanced notification system
  type?: 'info' | 'success' | 'warning' | 'error' | 'alert'
  category?: 'permit' | 'alert' | 'system' | 'export' | 'usage' | 'account'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  expiresAt?: Date
  actions?: Array<{
    label: string
    action: () => void
  }>
  // Snooze functionality fields
  isSnoozed?: boolean
  snoozedUntil?: Date
  snoozeOptions?: Array<{
    label: string
    duration: number // in milliseconds
  }>
  // Batching functionality fields
  batchId?: string
  isBatched?: boolean
  batchCount?: number
}

export interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onNotificationClick: (notification: Notification) => void
  onRemoveNotification?: (id: string) => void
  onArchiveNotifications?: (ids: string[]) => void
  onSnoozeNotification?: (id: string, duration: number) => void
}

// Notification context type
export interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  removeNotification: (id: string) => void
  getUnreadCountByCategory: (category: Notification['category']) => number
  // Snooze functionality
  snoozeNotification: (id: string, duration: number) => void
  // Batch functionality
  batchSimilarNotifications: () => void
}