'use client'

import { useOnboarding } from './OnboardingContext'
import { useState } from 'react'

export default function NotificationPrefsStep() {
  const { completeStep, skipStep } = useOnboarding()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)

  const handleContinue = () => {
    completeStep('notification_prefs')
  }

  const handleSkip = () => {
    skipStep('notification_prefs')
  }

  const toggleStyle = (active: boolean) => ({
    background: active ? 'var(--color-brand-primary)' : 'var(--color-surface-inset)',
  })

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Notification Preferences</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Choose how you'd like to receive alerts about drilling permits.
        </p>
      </div>

      <div className="rounded-xl border p-6 mb-6" style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-default)' }}>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md p-2" style={{ background: 'color-mix(in srgb, var(--color-info) 12%, transparent)' }}>
                    <svg className="h-5 w-5" style={{ color: 'var(--color-info)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Email Notifications</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Receive alerts via email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotifications(!emailNotifications)}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={toggleStyle(emailNotifications)}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md p-2" style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)' }}>
                    <svg className="h-5 w-5" style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>SMS Notifications</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Receive alerts via text message</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSmsNotifications(!smsNotifications)}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={toggleStyle(smsNotifications)}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    smsNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>Notification Frequency</h3>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full p-4 border-2 rounded-lg text-left transition-all"
              style={{
                borderColor: 'var(--color-brand-primary)',
                background: 'color-mix(in srgb, var(--color-brand-primary) 6%, transparent)',
              }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md p-2" style={{ background: 'color-mix(in srgb, var(--color-brand-primary) 12%, transparent)' }}>
                    <svg className="h-5 w-5" style={{ color: 'var(--color-brand-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Immediate</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Get notified as soon as a new permit is filed</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              className="w-full p-4 border rounded-lg text-left transition-all"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md p-2" style={{ background: 'var(--color-surface-subtle)' }}>
                    <svg className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Daily Digest</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Receive a daily summary of new permits</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg focus:outline-none transition-colors"
            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', background: 'transparent' }}
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            className="inline-flex items-center px-4 py-2 border-0 text-sm font-medium rounded-lg shadow-sm text-white focus:outline-none"
            style={{ background: 'var(--color-brand-primary)' }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}