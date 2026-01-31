'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type UUID = string

interface OnboardingState {
  currentStep: number
  completedSteps: string[]
  skippedSteps: string[]
  firstAoiId?: UUID
  firstAlertId?: UUID
  isOnboardingComplete: boolean
}

interface OnboardingContextType {
  state: OnboardingState
  goToStep: (step: number) => void
  completeStep: (stepName: string) => void
  skipStep: (stepName: string) => void
  setFirstAoiId: (id: UUID) => void
  setFirstAlertId: (id: UUID) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
}

const ONBOARDING_STEPS = [
  'welcome',
  'create_aoi',
  'create_alert',
  'notification_prefs',
  'complete'
]

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('onboardingState')
        if (savedState) {
          const parsed = JSON.parse(savedState)
          // Validate parsed data has required fields
          if (parsed && typeof parsed === 'object' &&
              'currentStep' in parsed &&
              'completedSteps' in parsed &&
              Array.isArray(parsed.completedSteps)) {
            return parsed
          }
        }
      } catch (error) {
        console.error('Failed to parse onboarding state from localStorage:', error)
        // Clear corrupted data
        localStorage.removeItem('onboardingState')
      }
    }
    return {
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      isOnboardingComplete: false
    }
  })

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingState', JSON.stringify(state))
    }
  }, [state])

  const goToStep = (step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step
    }))
  }

  const completeStep = (stepName: string) => {
    setState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, stepName],
      currentStep: Math.min(prev.currentStep + 1, ONBOARDING_STEPS.length - 1)
    }))
  }

  const skipStep = (stepName: string) => {
    setState(prev => ({
      ...prev,
      skippedSteps: [...prev.skippedSteps, stepName],
      currentStep: Math.min(prev.currentStep + 1, ONBOARDING_STEPS.length - 1)
    }))
  }

  const setFirstAoiId = (id: UUID) => {
    setState(prev => ({
      ...prev,
      firstAoiId: id
    }))
  }

  const setFirstAlertId = (id: UUID) => {
    setState(prev => ({
      ...prev,
      firstAlertId: id
    }))
  }

  const completeOnboarding = () => {
    setState(prev => ({
      ...prev,
      isOnboardingComplete: true,
      currentStep: ONBOARDING_STEPS.length - 1
    }))
  }

  const resetOnboarding = () => {
    setState({
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      isOnboardingComplete: false
    })
  }

  return (
    <OnboardingContext.Provider
      value={{
        state,
        goToStep,
        completeStep,
        skipStep,
        setFirstAoiId,
        setFirstAlertId,
        completeOnboarding,
        resetOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}