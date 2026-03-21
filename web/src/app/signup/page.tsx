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
import { CheckCircle } from 'lucide-react'

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
  const { signUp, loading } = useAuth()
  const { resetOnboarding } = useOnboarding()
  const router = useRouter()
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [])

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (emailError && (!value || validateEmail(value))) setEmailError('')
  }

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) setEmailError('Please enter a valid email address')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFullName(value)
    if (nameError && value.length >= 2) setNameError('')
  }

  const handleNameBlur = () => {
    if (fullName && fullName.length < 2) setNameError('Name must be at least 2 characters')
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

    let hasError = false

    if (!fullName || fullName.length < 2) {
      setNameError('Name must be at least 2 characters')
      hasError = true
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      hasError = true
    }
    if (!validatePassword()) hasError = true
    if (!acceptTerms) {
      setTermsError('You must accept the Terms of Service and Privacy Policy')
      hasError = true
    }

    if (hasError) {
      toast.error('Please fix the errors below')
      return
    }

    const { error, data } = await signUp(email, password, fullName)

    if (!error && data?.user) {
      resetOnboarding()
      setSignupComplete(true)
      toast.success('Account created!', { description: 'Welcome to RRC Alerts.' })
      redirectTimeoutRef.current = setTimeout(() => router.push('/onboarding'), 2000)
    } else if (error) {
      toast.error('Failed to create account', {
        description: error.message || 'Please try again',
      })
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ background: 'var(--color-surface-subtle)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
              style={{ background: 'var(--color-brand-primary)' }}
            >
              R
            </div>
            <span
              className="text-xl font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              RRC Alerts
            </span>
          </Link>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Create your account
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Start tracking Texas drilling permits today
          </p>
        </div>

        <div
          className="rounded-2xl border p-8 shadow-sm"
          style={{
            background: 'var(--color-surface-raised)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <AnimatePresence mode="wait">
            {signupComplete ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-4"
                  style={{ background: 'var(--color-success-subtle)' }}
                >
                  <CheckCircle className="h-7 w-7" style={{ color: 'var(--color-success)' }} />
                </motion.div>
                <h3
                  className="text-base font-semibold mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Account created!
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Redirecting you to onboarding…
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
                onSubmit={handleSubmit}
              >
                <Input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  label="Full name"
                  placeholder="Jane Smith"
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
                  placeholder="you@example.com"
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
                    placeholder="At least 8 characters"
                    floatingLabel
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
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
                  label="Confirm password"
                  placeholder="Re-enter your password"
                  floatingLabel
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError('') }}
                  error={passwordError}
                  disabled={loading}
                />

                <div>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => {
                        setAcceptTerms(checked as boolean)
                        setTermsError('')
                      }}
                      disabled={loading}
                    />
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      I agree to the{' '}
                      <Link
                        href="/terms"
                        className="font-medium underline-offset-2 hover:underline"
                        style={{ color: 'var(--color-text-link)' }}
                        target="_blank"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/privacy"
                        className="font-medium underline-offset-2 hover:underline"
                        style={{ color: 'var(--color-text-link)' }}
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {termsError && (
                    <p className="mt-1.5 text-xs" style={{ color: 'var(--color-error)' }}>
                      {termsError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loading}
                >
                  Create account
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium transition-colors"
            style={{ color: 'var(--color-text-link)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
