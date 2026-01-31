export interface Notification {
  id: string
  title: string
  body?: string
  icon?: string
  actionUrl?: string
  isRead: boolean
  readAt?: Date
  createdAt: Date
}

export interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onNotificationClick: (notification: Notification) => void
}