'use client'

import { useOnboarding } from './OnboardingContext'
import { useState } from 'react'

export default function CreateAlertStep() {
  const { completeStep, skipStep, state } = useOnboarding()
  const [alertName, setAlertName] = useState('')
  const [alertType, setAlertType] = useState('new_permits')

  const handleContinue = () => {
    // In a real implementation, this would create an actual alert
    // For now, we'll just simulate it
    completeStep('create_alert')
  }

  const handleSkip = () => {
    skipStep('create_alert')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your First Alert</h1>
        <p className="text-gray-600">
          Get notified when new permits are filed in your area of interest.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <label htmlFor="alert-name" className="block text-sm font-medium text-gray-700 mb-1">
            Alert Name
          </label>
          <input
            type="text"
            id="alert-name"
            value={alertName}
            onChange={(e) => setAlertName(e.target.value)}
            placeholder="e.g., New permits in my area"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What would you like to be alerted about?
          </label>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setAlertType('new_permits')}
              className={`w-full p-4 border rounded-lg text-left ${
                alertType === 'new_permits'
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-indigo-100 rounded-md p-2">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">New Permits</h3>
                  <p className="text-xs text-gray-500">Notify me when new permits are filed in my area</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAlertType('status_changes')}
              className={`w-full p-4 border rounded-lg text-left ${
                alertType === 'status_changes'
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-green-100 rounded-md p-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Status Changes</h3>
                  <p className="text-xs text-gray-500">Notify me when permit status changes (approved, denied, etc.)</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAlertType('all')}
              className={`w-full p-4 border rounded-lg text-left ${
                alertType === 'all'
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-blue-100 rounded-md p-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">All Activity</h3>
                  <p className="text-xs text-gray-500">Notify me about all new permits and status changes</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {state.firstAoiId && (
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-indigo-800">Area of Interest</h3>
                <div className="mt-2 text-sm text-indigo-700">
                  <p>This alert will monitor your area: {state.firstAoiId}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            disabled={!alertName.trim()}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              alertName.trim()
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-indigo-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}