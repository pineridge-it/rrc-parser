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
import { CheckCircle, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showMagicLink, setShowMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [rememberEmail, setRememberEmail] = useState(false)
  const { signIn, sendMagicLink, loading } = useAuth()
  const { state } = useOnboarding()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    const savedEmail = localStorage.getItem('rrc.rememberedEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberEmail(true)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    setEmailError('')

    if (rememberEmail) {
      localStorage.setItem('rrc.rememberedEmail', email)
    } else {
      localStorage.removeItem('rrc.rememberedEmail')
    }

    if (showMagicLink) {
      const { error } = await sendMagicLink(email)
      if (!error) {
        setMagicLinkSent(true)
      } else {
        toast.error('Failed to send magic link', {
          description: error.message || 'Please try again',
        })
      }
    } else {
      if (!password) {
        toast.error('Password required', { description: 'Please enter your password' })
        return
      }

      const { error } = await signIn(email, password)
      if (!error) {
        toast.success('Welcome back!')
        router.push(state.isOnboardingComplete ? redirect : '/onboarding')
      } else {
        toast.error('Sign in failed', {
          description: error.message || 'Please check your credentials and try again',
        })
      }
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
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Sign in to your account to continue
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
            {magicLinkSent ? (
              <motion.div
                key="magic-link-success"
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
                  Check your inbox
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
                  We sent a sign-in link to <strong style={{ color: 'var(--color-text-secondary)' }}>{email}</strong>
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setMagicLinkSent(false); setShowMagicLink(false) }}
                >
                  Back to sign in
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="login-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
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

                <AnimatePresence>
                  {!showMagicLink && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
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
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between gap-4">
                  <label
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <Checkbox
                      id="magic-link"
                      checked={showMagicLink}
                      onCheckedChange={(checked) => {
                        setShowMagicLink(checked as boolean)
                        setPassword('')
                      }}
                      disabled={loading}
                    />
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Use magic link
                    </span>
                  </label>

                  {!showMagicLink && (
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium transition-colors"
                      style={{ color: 'var(--color-text-link)' }}
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>

                {!showMagicLink && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      id="remember"
                      checked={rememberEmail}
                      onCheckedChange={(checked) => setRememberEmail(checked as boolean)}
                      disabled={loading}
                    />
                    <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      Remember my email
                    </span>
                  </label>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loading}
                >
                  {showMagicLink ? (
                    <><Mail className="mr-2 h-4 w-4" />Send Magic Link</>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="font-medium transition-colors"
            style={{ color: 'var(--color-text-link)' }}
          >
            Create one for free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--color-surface-subtle)' }}
        >
          <div
            className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-brand-primary)', borderTopColor: 'transparent' }}
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
