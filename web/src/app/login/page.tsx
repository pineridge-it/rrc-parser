'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOnboarding } from '@/components/onboarding/OnboardingContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Inner component that uses search params
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showMagicLink, setShowMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [rememberEmail, setRememberEmail] = useState(false)
  const { signIn, sendMagicLink, loading, error } = useAuth()
  const { state } = useOnboarding()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rrc.rememberedEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberEmail(true)
    }
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      toast.error('Invalid email', {
        description: 'Please enter a valid email address',
      })
      return
    } else {
      setEmailError('')
    }

    // Handle remember email
    if (rememberEmail) {
      localStorage.setItem('rrc.rememberedEmail', email)
    } else {
      localStorage.removeItem('rrc.rememberedEmail')
    }

    if (showMagicLink) {
      const { error: magicLinkError } = await sendMagicLink(email)
      if (!magicLinkError) {
        setMagicLinkSent(true)
        toast.success('Magic link sent!', {
          description: 'Check your email for a link to sign in.',
        })
      } else {
        toast.error('Failed to send magic link', {
          description: magicLinkError.message || 'Please try again',
        })
      }
    } else {
      // Validate password
      if (!password) {
        toast.error('Password required', {
          description: 'Please enter your password',
        })
        return
      }

      const { error: signInError } = await signIn(email, password)
      if (!signInError) {
        toast.success('Welcome back!', {
          description: 'Signing you in...',
        })
        // Redirect to onboarding if not complete, otherwise go to dashboard
        if (!state.isOnboardingComplete) {
          router.push('/onboarding')
        } else {
          router.push(redirect)
        }
      } else {
        toast.error('Sign in failed', {
          description: signInError.message || 'Please check your credentials and try again',
        })
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>

        <AnimatePresence mode="wait">
          {magicLinkSent ? (
            <motion.div
              key="magic-link-success"
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
                Magic link sent!
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Check your email for a link to sign in.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setMagicLinkSent(false)
                  setShowMagicLink(false)
                }}
              >
                Back to sign in
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="login-form"
              onSubmit={handleSubmit}
            >
              <div className="space-y-4">
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

                {!showMagicLink && (
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required={!showMagicLink}
                    label="Password"
                    placeholder="Enter your password"
                    floatingLabel
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                    }}
                    disabled={loading}
                  />
                )}
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="magic-link"
                    checked={showMagicLink}
                    onCheckedChange={(checked) => {
                      setShowMagicLink(checked as boolean)
                      setPassword('')
                    }}
                    disabled={loading}
                  />
                  <label
                    htmlFor="magic-link"
                    className="text-sm text-gray-900 cursor-pointer"
                  >
                    Use magic link
                  </label>
                </div>

                {!showMagicLink && (
                  <div className="text-sm">
                    <Link
                      href="/forgot-password"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                )}
              </div>

              {!showMagicLink && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberEmail}
                    onCheckedChange={(checked) => setRememberEmail(checked as boolean)}
                    disabled={loading}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Remember my email
                  </label>
                </div>
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
                    {showMagicLink ? 'Sending...' : 'Signing in...'}
                  </>
                ) : (
                  showMagicLink ? 'Send Magic Link' : 'Sign in'
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
