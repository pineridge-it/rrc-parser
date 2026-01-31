'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Notification, NotificationContextType } from './types'

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('notifications')
        if (saved) {
          const parsed = JSON.parse(saved)
          // Validate that parsed data is an array
          if (Array.isArray(parsed)) {
            // Convert date strings back to Date objects
            return parsed.map(notification => ({
              ...notification,
              createdAt: new Date(notification.createdAt),
              readAt: notification.readAt ? new Date(notification.readAt) : undefined,
              expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined
            }))
          }
        }
      } catch (error) {
        console.error('Failed to parse notifications from localStorage:', error)
        // Clear corrupted data
        localStorage.removeItem('notifications')
      }
    }
    return []
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Convert Date objects to strings for JSON serialization
      const notificationsToSave = notifications.map(notification => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString(),
        expiresAt: notification.expiresAt?.toISOString()
      }))
      localStorage.setItem('notifications', JSON.stringify(notificationsToSave))
    }
  }, [notifications])

  // Clean up expired notifications periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date()
      setNotifications(prev =>
        prev.filter(notification =>
          !notification.expiresAt || notification.expiresAt > now
        )
      )
    }, 60000) // Check every minute

    return () => clearInterval(cleanupInterval)
  }, [])

  const addNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      ...notification,
      isRead: false,
      createdAt: new Date()
    }

    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true, readAt: new Date() } : notification
      )
    )
  }

  const markAllAsRead = () => {
    const now = new Date()
    setNotifications(prev =>
      prev.map(notification =>
        notification.isRead ? notification : { ...notification, isRead: true, readAt: now }
      )
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const getUnreadCountByCategory = (category: Notification['category']) => {
    return notifications.filter(n => !n.isRead && n.category === category).length
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        removeNotification,
        getUnreadCountByCategory
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}