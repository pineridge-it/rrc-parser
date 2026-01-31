'use client'

import { useOnboarding } from './OnboardingContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

declare global {
  interface Window {
    confetti?: any
  }
}

export default function CompletionStep() {
  const { completeOnboarding } = useOnboarding()
  const router = useRouter()

  useEffect(() => {
    // Celebrate completion with confetti
    if (typeof window !== 'undefined' && window.confetti) {
      window.confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      })
    }
    
    // Mark onboarding as complete
    completeOnboarding()
  }, [completeOnboarding])

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">You're All Set!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Congratulations! You've successfully set up your Texas Drilling Permit Alerts account.
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What's Next?</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-gray-600">Monitor your areas of interest for new drilling permits</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-gray-600">Receive alerts based on your preferences</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-gray-600">Analyze permit trends and activity in your dashboard</p>
            </li>
          </ul>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={handleGoToDashboard}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Dashboard
            <svg className="-mr-1 ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}