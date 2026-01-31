'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'

interface NotificationPreferences {
  email: boolean
  sms: boolean
  push: boolean
  permitAlerts: boolean
  statusChanges: boolean
  systemUpdates: boolean
  weeklyDigest: boolean
  immediate: boolean
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    sms: false,
    push: true,
    permitAlerts: true,
    statusChanges: true,
    systemUpdates: true,
    weeklyDigest: false,
    immediate: true
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem('notificationPreferences')
        if (saved) {
          const parsed = JSON.parse(saved)
          setPreferences(prev => ({ ...prev, ...parsed }))
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error)
        toast.error('Failed to load notification preferences')
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences))
    }
  }, [preferences, isLoading])

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // In a real implementation, this would save to a backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Notification preferences saved successfully!')
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      toast.error('Failed to save notification preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setPreferences({
      email: true,
      sms: false,
      push: true,
      permitAlerts: true,
      statusChanges: true,
      systemUpdates: true,
      weeklyDigest: false,
      immediate: true
    })
    toast.info('Preferences reset to default values')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how you receive notifications and what types of alerts you want to receive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Email Notifications</label>
                <p className="text-sm text-gray-500">Receive alerts via email</p>
              </div>
              <Switch
                checked={preferences.email}
                onChange={(e) => handlePreferenceChange('email', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">SMS Notifications</label>
                <p className="text-sm text-gray-500">Receive alerts via text message</p>
              </div>
              <Switch
                checked={preferences.sms}
                onChange={(e) => handlePreferenceChange('sms', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Push Notifications</label>
                <p className="text-sm text-gray-500">Receive alerts via browser notifications</p>
              </div>
              <Switch
                checked={preferences.push}
                onChange={(e) => handlePreferenceChange('push', e.target.checked)}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">New Permit Alerts</label>
                <p className="text-sm text-gray-500">Notifications when new permits are filed</p>
              </div>
              <Switch
                checked={preferences.permitAlerts}
                onChange={(e) => handlePreferenceChange('permitAlerts', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Status Change Alerts</label>
                <p className="text-sm text-gray-500">Notifications when permit status changes</p>
              </div>
              <Switch
                checked={preferences.statusChanges}
                onChange={(e) => handlePreferenceChange('statusChanges', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">System Updates</label>
                <p className="text-sm text-gray-500">Notifications about system maintenance and updates</p>
              </div>
              <Switch
                checked={preferences.systemUpdates}
                onChange={(e) => handlePreferenceChange('systemUpdates', e.target.checked)}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Frequency</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Immediate Notifications</label>
                <p className="text-sm text-gray-500">Get notified as soon as an event occurs</p>
              </div>
              <Switch
                checked={preferences.immediate}
                onChange={(e) => handlePreferenceChange('immediate', e.target.checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Weekly Digest</label>
                <p className="text-sm text-gray-500">Receive a weekly summary of activities</p>
              </div>
              <Switch
                checked={preferences.weeklyDigest}
                onChange={(e) => handlePreferenceChange('weeklyDigest', e.target.checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-3">
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardFooter>
    </Card>
  )
}