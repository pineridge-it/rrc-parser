'use client'

import { useOnboarding } from './OnboardingContext'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

export default function CreateAlertStep() {
  const { completeStep, skipStep, state } = useOnboarding()
  const [alertName, setAlertName] = useState('')
  const [alertType, setAlertType] = useState('new_permits')

  const handleContinue = () => {
    completeStep('create_alert')
  }

  const handleSkip = () => {
    skipStep('create_alert')
  }

  const alertOptions = [
    {
      id: 'new_permits',
      label: 'New Permits',
      description: 'Notify me when new permits are filed in my area',
      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      id: 'status_changes',
      label: 'Status Changes',
      description: 'Notify me when permit status changes (approved, denied, etc.)',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      id: 'all',
      label: 'All Activity',
      description: 'Notify me about all new permits and status changes',
      iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Set Up Your First Alert</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Get notified when new permits are filed in your area of interest.
        </p>
      </div>

      <div className="rounded-xl border p-6 mb-6" style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-default)' }}>
        <div className="mb-6">
          <Input
            id="alert-name"
            label="Alert Name"
            placeholder="e.g., New permits in my area"
            floatingLabel
            value={alertName}
            onChange={(e) => setAlertName(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            What would you like to be alerted about?
          </label>
          <div className="space-y-3">
            {alertOptions.map((option) => {
              const isSelected = alertType === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAlertType(option.id)}
                  className="w-full p-4 border-2 rounded-lg text-left transition-all"
                  style={{
                    borderColor: isSelected ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
                    background: isSelected ? 'color-mix(in srgb, var(--color-brand-primary) 6%, transparent)' : 'transparent',
                    outline: isSelected ? '2px solid color-mix(in srgb, var(--color-brand-primary) 30%, transparent)' : 'none',
                    outlineOffset: '2px',
                  }}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="rounded-md p-2" style={{ background: 'color-mix(in srgb, var(--color-brand-primary) 12%, transparent)' }}>
                        <svg className="h-5 w-5" style={{ color: 'var(--color-brand-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.iconPath} />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{option.label}</h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{option.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {state.firstAoiId && (
          <div className="mb-6 p-4 rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-brand-primary) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--color-brand-primary) 20%, transparent)', border: '1px solid' }}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" style={{ color: 'var(--color-brand-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium" style={{ color: 'var(--color-brand-primary)' }}>Area of Interest</h3>
                <div className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <p>This alert will monitor your area: {state.firstAoiId}</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
            disabled={!alertName.trim()}
            className="inline-flex items-center px-4 py-2 border-0 text-sm font-medium rounded-lg shadow-sm text-white transition-opacity focus:outline-none"
            style={{ background: 'var(--color-brand-primary)', opacity: alertName.trim() ? 1 : 0.5, cursor: alertName.trim() ? 'pointer' : 'not-allowed' }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}