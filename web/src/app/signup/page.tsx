'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOnboarding } from '@/components/onboarding/OnboardingContext'
import { Input } from '@/components/ui/input'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [nameError, setNameError] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [termsError, setTermsError] = useState('')
  const [signupComplete, setSignupComplete] = useState(false)
  const { signUp, loading, error } = useAuth()
  const { resetOnboarding } = useOnboarding()
  const router = useRouter()

  // Email validation with real-time feedback
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (emailError) {
      if (value && !validateEmail(value)) {
        setEmailError('Please enter a valid email address')
      } else {
        setEmailError('')
      }
    }
  }

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address')
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFullName(value)
    if (nameError) {
      if (value.length < 2) {
        setNameError('Name must be at least 2 characters')
      } else {
        setNameError('')
      }
    }
  }

  const handleNameBlur = () => {
    if (fullName && fullName.length < 2) {
      setNameError('Name must be at least 2 characters')
    }
  }

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return false
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return false
    }
    setPasswordError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    let hasError = false

    if (!fullName || fullName.length < 2) {
      setNameError('Name must be at least 2 characters')
      hasError = true
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      hasError = true
    }

    if (!validatePassword()) {
      hasError = true
    }

    if (!acceptTerms) {
      setTermsError('You must accept the Terms of Service and Privacy Policy')
      hasError = true
    }

    if (hasError) {
      toast.error('Please fix the errors below', {
        description: 'Some fields need your attention',
      })
      return
    }

    const { error: signupError, data } = await signUp(email, password, fullName)

    if (!signupError && data?.user) {
      // Reset onboarding state for new user
      resetOnboarding()
      setSignupComplete(true)
      toast.success('Account created successfully!', {
        description: 'Welcome to RRC. Redirecting to onboarding...',
      })
      // Redirect to onboarding flow after a brief delay
      setTimeout(() => {
        router.push('/onboarding')
      }, 2000)
    } else if (signupError) {
      toast.error('Failed to create account', {
        description: signupError.message || 'Please try again',
      })
    }
  }

  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to existing account
            </Link>
          </p>
        </div>

        <AnimatePresence mode="wait">
          {signupComplete ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="rounded-lg bg-green-50 p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4"
              >
                <CheckCircle className="h-8 w-8 text-green-600" />
              </motion.div>
              <h3 className="text-lg font-medium text-green-900 mb-2">
                Account created successfully!
              </h3>
              <p className="text-sm text-green-700">
                Welcome to RRC. Redirecting you to onboarding...
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-6"
              onSubmit={handleSubmit}
            >
              <div className="space-y-4">
                <Input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  label="Full Name"
                  placeholder="Enter your full name"
                  floatingLabel
                  value={fullName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  error={nameError}
                  disabled={loading}
                />

                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  label="Email address"
                  placeholder="your.email@example.com"
                  floatingLabel
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  error={emailError}
                  disabled={loading}
                />

                <div className="space-y-2">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    label="Password"
                    placeholder="Enter your password"
                    floatingLabel
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setPasswordError('')
                    }}
                    disabled={loading}
                  />

                  <PasswordStrengthIndicator password={password} />
                </div>

                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  floatingLabel
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError('')
                  }}
                  error={passwordError}
                  disabled={loading}
                />

                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => {
                        setAcceptTerms(checked as boolean)
                        setTermsError('')
                      }}
                      disabled={loading}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm text-gray-600 leading-relaxed cursor-pointer"
                    >
                      I agree to the{' '}
                      <Link
                        href="/terms"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        target="_blank"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/privacy"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  {termsError && (
                    <p className="text-sm text-red-600">{termsError}</p>
                  )}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-md bg-red-50 p-4"
                >
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error.message}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
