'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
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
              expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined,
              snoozedUntil: notification.snoozedUntil ? new Date(notification.snoozedUntil) : undefined
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

  const unreadCount = notifications.filter(n => !n.isRead && !n.isSnoozed).length

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Convert Date objects to strings for JSON serialization
      const notificationsToSave = notifications.map(notification => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString(),
        expiresAt: notification.expiresAt?.toISOString(),
        snoozedUntil: notification.snoozedUntil?.toISOString()
      }))
      localStorage.setItem('notifications', JSON.stringify(notificationsToSave))
    }
  }, [notifications])

  // Clean up expired notifications periodically and handle snoozed notifications
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date()
      setNotifications(prev => {
        // Filter out expired notifications that are not snoozed
        const filtered = prev.filter(notification => {
          // Keep notifications that are either:
          // 1. Not expired, or
          // 2. Snoozed and the snooze period hasn't ended yet
          const isNotExpired = !notification.expiresAt || notification.expiresAt > now
          const isSnoozedAndActive = notification.isSnoozed && notification.snoozedUntil && notification.snoozedUntil > now

          return isNotExpired || isSnoozedAndActive
        })

        // Check if any snoozed notifications should be unsnoozed
        return filtered.map(notification => {
          if (notification.isSnoozed && notification.snoozedUntil && notification.snoozedUntil <= now) {
            // Unsnooze the notification
            return {
              ...notification,
              isSnoozed: false,
              snoozedUntil: undefined
            }
          }
          return notification
        })
      })
    }, 60000) // Check every minute

    return () => {
      clearInterval(cleanupInterval)
      // Clear any pending batching timeouts
      clearTimeout((window as any).__notificationBatchTimeout)
    }
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

  const batchSimilarNotifications = () => {
    setNotifications(prev => {
      const grouped: { [key: string]: Notification[] } = {}

      prev.forEach(notification => {
        const key = `${notification.category}-${notification.title}`
        if (!grouped[key]) {
          grouped[key] = []
        }
        grouped[key].push(notification)
      })

      const batched: Notification[] = []
      Object.values(grouped).forEach(group => {
        if (group.length > 1) {
          const first = group[0]
          batched.push({
            ...first,
            isBatched: true,
            batchCount: group.length
          })
        } else {
          batched.push(...group)
        }
      })

      return batched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    })
  }
  }

  const getUnreadCountByCategory = (category: Notification['category']) => {
    return notifications.filter(n => !n.isRead && !n.isSnoozed && n.category === category).length
  }

  // Snooze a notification for a specific duration
  const snoozeNotification = (id: string, duration: number) => {
    const snoozeUntil = new Date(Date.now() + duration)
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? {
              ...notification,
              isSnoozed: true,
              snoozedUntil: snoozeUntil,
              isRead: true, // Mark as read when snoozing
              readAt: notification.readAt || new Date()
            }
          : notification
      )
    )
  }

  // Batch similar notifications together
  const batchSimilarNotifications = useCallback(() => {
    setNotifications(prev => {
      // Group notifications by category and type
      const groups: Record<string, Notification[]> = {}

      prev.forEach(notification => {
        // Skip already batched notifications and snoozed notifications
        if (notification.isBatched || notification.isSnoozed) {
          return;
        }

        // Create a key based on category and type
        const key = `${notification.category || 'unknown'}-${notification.type || 'unknown'}`

        if (!groups[key]) {
          groups[key] = []
        }
        groups[key].push(notification)
      })

      // Process each group
      const updatedNotifications: Notification[] = []
      const processedIds = new Set<string>()

      Object.entries(groups).forEach(([key, group]) => {
        if (group.length > 1) {
          // Create a batch notification for groups with more than one notification
          const batchId = Math.random().toString(36).substr(2, 9)
          const firstNotification = group[0]

          // Create batch notification
          const batchNotification: Notification = {
            id: `batch-${batchId}`,
            title: `${firstNotification.title} (${group.length} similar)`,
            body: `You have ${group.length} similar notifications`,
            type: firstNotification.type,
            category: firstNotification.category,
            priority: firstNotification.priority,
            isRead: false,
            isBatched: true,
            batchId,
            batchCount: group.length,
            createdAt: new Date(Math.min(...group.map(n => n.createdAt.getTime()))),
            actions: [
              {
                label: 'View All',
                action: () => {
                  // This would typically navigate to a page showing all notifications in the batch
                  console.log('View all notifications in batch:', batchId)
                }
              }
            ]
          }

          updatedNotifications.push(batchNotification)
          group.forEach(notification => {
            processedIds.add(notification.id)
          })
        } else {
          // Keep single notifications as they are
          updatedNotifications.push(...group)
          group.forEach(notification => {
            processedIds.add(notification.id)
          })
        }
      })

      // Add any notifications that weren't processed (snoozed, already batched, etc.)
      const unprocessedNotifications = prev.filter(notification => !processedIds.has(notification.id))
      updatedNotifications.push(...unprocessedNotifications)

      return updatedNotifications
    })
  }, [])

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
        getUnreadCountByCategory,
        snoozeNotification,
        batchSimilarNotifications
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