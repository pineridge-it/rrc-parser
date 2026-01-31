'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BannerNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  dismissible?: boolean
  duration?: number // in milliseconds, 0 for persistent
  action?: {
    label: string
    onClick: () => void
  }
}

interface BannerNotificationProps {
  notification: BannerNotification
  onDismiss: (id: string) => void
}

function BannerNotification({ notification, onDismiss }: BannerNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss(notification.id), 300)
      }, notification.duration)
      
      return () => clearTimeout(timer)
    }
  }, [notification.duration, notification.id, onDismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(notification.id), 300)
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`border rounded-lg p-4 ${getBackgroundColor()}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-green-800' :
                notification.type === 'warning' ? 'text-yellow-800' :
                notification.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {notification.title}
              </h3>
              <div className={`mt-1 text-sm ${
                notification.type === 'success' ? 'text-green-700' :
                notification.type === 'warning' ? 'text-yellow-700' :
                notification.type === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                <p>{notification.message}</p>
              </div>
              {notification.action && (
                <div className="mt-3">
                  <button
                    onClick={notification.action.onClick}
                    className={`text-sm font-medium ${
                      notification.type === 'success' ? 'text-green-800 hover:text-green-900' :
                      notification.type === 'warning' ? 'text-yellow-800 hover:text-yellow-900' :
                      notification.type === 'error' ? 'text-red-800 hover:text-red-900' :
                      'text-blue-800 hover:text-blue-900'
                    }`}
                  >
                    {notification.action.label}
                  </button>
                </div>
              )}
            </div>
            {notification.dismissible !== false && (
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={handleDismiss}
                  className={`${
                    notification.type === 'success' ? 'text-green-500 hover:text-green-700' :
                    notification.type === 'warning' ? 'text-yellow-500 hover:text-yellow-700' :
                    notification.type === 'error' ? 'text-red-500 hover:text-red-700' :
                    'text-blue-500 hover:text-blue-700'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface BannerNotificationContainerProps {
  notifications: BannerNotification[]
  onDismiss: (id: string) => void
}

export default function BannerNotificationContainer({ 
  notifications, 
  onDismiss 
}: BannerNotificationContainerProps) {
  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
      {notifications.map(notification => (
        <BannerNotification
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}

export type { BannerNotification }