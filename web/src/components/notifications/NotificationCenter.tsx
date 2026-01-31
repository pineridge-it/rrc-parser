'use client'

import { useState, useRef, useEffect } from 'react'
import { Notification } from './types'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Trash2, Bell, BellOff, Filter } from 'lucide-react'

interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onNotificationClick: (notification: Notification) => void
  onRemoveNotification?: (id: string) => void
}

export default function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onRemoveNotification
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | Notification['category']>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkAsRead(id)
  }

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkAllAsRead()
  }

  const handleRemoveNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemoveNotification) {
      onRemoveNotification(id)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    onNotificationClick(notification)
    setIsOpen(false)
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
    } else {
      return `${diffDays}d ago`
    }
  }

  // Get icon based on notification type
  const getIcon = (iconType?: string, notificationType?: string) => {
    // Priority: notification.type > iconType > default
    const type = notificationType || iconType || 'default'

    switch (type) {
      case 'permit':
      case 'success':
        return (
          <div className="flex-shrink-0">
            <div className="bg-green-100 rounded-full p-2">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )
      case 'alert':
      case 'warning':
        return (
          <div className="flex-shrink-0">
            <div className="bg-yellow-100 rounded-full p-2">
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        )
      case 'error':
        return (
          <div className="flex-shrink-0">
            <div className="bg-red-100 rounded-full p-2">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )
      case 'system':
        return (
          <div className="flex-shrink-0">
            <div className="bg-gray-100 rounded-full p-2">
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        )
      case 'export':
        return (
          <div className="flex-shrink-0">
            <div className="bg-blue-100 rounded-full p-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        )
      case 'usage':
        return (
          <div className="flex-shrink-0">
            <div className="bg-purple-100 rounded-full p-2">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex-shrink-0">
            <div className="bg-gray-100 rounded-full p-2">
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )
    }
  }

  // Get category label
  const getCategoryLabel = (category?: string) => {
    switch (category) {
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

  // Filter notifications based on selected filter
  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.category === filter)

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(notifications.map(n => n.category))).filter(Boolean)] as const

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
        aria-label="Notifications"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-400"></span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          >
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Controls */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    filter === 'all'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  All
                </button>

                {categories.slice(1).map(category => (
                  <button
                    key={category}
                    onClick={() => setFilter(category as Notification['category'])}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      filter === category
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {getCategoryLabel(category)}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mx-auto h-12 w-12 text-gray-400"
                  >
                    <BellOff className="h-12 w-12" />
                  </motion.div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filter === 'all'
                      ? "You're all caught up!"
                      : `No ${getCategoryLabel(filter)} notifications.`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${getPriorityClass(notification.priority)} ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex">
                          {getIcon(notification.icon, notification.type)}
                          <div className="ml-3 flex-1">
                            <div className="flex items-start justify-between">
                              <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                                {notification.title}
                              </p>
                              <div className="flex space-x-1">
                                {!notification.isRead && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                    className="text-gray-400 hover:text-gray-500"
                                    aria-label="Mark as read"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleRemoveNotification?.(notification.id, e)}
                                  className="text-gray-400 hover:text-red-500"
                                  aria-label="Remove notification"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            {notification.body && (
                              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                {notification.body}
                              </p>
                            )}
                            <div className="mt-1 flex items-center justify-between">
                              <p className="text-xs text-gray-500">
                                {formatDate(notification.createdAt)}
                                {notification.category && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                    {getCategoryLabel(notification.category)}
                                  </span>
                                )}
                              </p>
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
            <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
              <div className="flex justify-between items-center">
                <span>
                  {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
                </span>
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    View all
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}