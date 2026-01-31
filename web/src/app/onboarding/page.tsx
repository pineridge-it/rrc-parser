'use client'

import { useOnboarding } from '@/components/onboarding/OnboardingContext'
import WelcomeStep from '@/components/onboarding/WelcomeStep'
import CreateAoiStep from '@/components/onboarding/CreateAoiStep'
import CreateAlertStep from '@/components/onboarding/CreateAlertStep'
import NotificationPrefsStep from '@/components/onboarding/NotificationPrefsStep'
import CompletionStep from '@/components/onboarding/CompletionStep'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const ONBOARDING_STEPS = [
  'welcome',
  'create_aoi',
  'create_alert',
  'notification_prefs',
  'complete'
]

export default function OnboardingPage() {
  const { state } = useOnboarding()
  const router = useRouter()

  // Redirect to dashboard if onboarding is already complete
  useEffect(() => {
    if (state.isOnboardingComplete) {
      router.push('/dashboard')
    }
  }, [state.isOnboardingComplete, router])

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <WelcomeStep />
      case 1:
        return <CreateAoiStep />
      case 2:
        return <CreateAlertStep />
      case 3:
        return <NotificationPrefsStep />
      case 4:
        return <CompletionStep />
      default:
        return <WelcomeStep />
    }
  }

  const progressPercentage = ((state.currentStep + 1) / ONBOARDING_STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Texas Drilling Permit Alerts
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Step {state.currentStep + 1} of {ONBOARDING_STEPS.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-8">
        {renderStep()}
      </main>
    </div>
  )
}