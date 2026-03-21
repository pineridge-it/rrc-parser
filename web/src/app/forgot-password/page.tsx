'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const { resetPassword, loading } = useAuth()

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    setEmailError('')

    const { error } = await resetPassword(email)

    if (!error) {
      setResetSent(true)
    } else {
      toast.error('Failed to send reset email', {
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
            Reset your password
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Enter your email and we'll send you a reset link
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
            {resetSent ? (
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
                  Check your inbox
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
                  We sent a password reset link to{' '}
                  <strong style={{ color: 'var(--color-text-secondary)' }}>{email}</strong>
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setResetSent(false)}
                >
                  Send again
                </Button>
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
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  label="Email address"
                  placeholder="you@example.com"
                  floatingLabel
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError('')
                  }}
                  error={emailError}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loading}
                >
                  Send reset link
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Remembered your password?{' '}
          <Link
            href="/login"
            className="font-medium transition-colors"
            style={{ color: 'var(--color-text-link)' }}
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
