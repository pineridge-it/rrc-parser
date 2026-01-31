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
}

export interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onNotificationClick: (notification: Notification) => void
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
}