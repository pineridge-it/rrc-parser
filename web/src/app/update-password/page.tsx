'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [updateComplete, setUpdateComplete] = useState(false)
  const { updatePassword, loading } = useAuth()
  const router = useRouter()
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [])

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

    if (!validatePassword()) return

    const { error } = await updatePassword(password)

    if (!error) {
      setUpdateComplete(true)
      toast.success('Password updated!', {
        description: 'Your password has been successfully updated.',
      })
      redirectTimeoutRef.current = setTimeout(() => router.push('/login'), 3000)
    } else {
      toast.error('Failed to update password', {
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
            Set a new password
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Your new password must be at least 8 characters
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
            {updateComplete ? (
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
                  Password updated!
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Redirecting you to sign in…
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
                <div className="space-y-2">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    label="New password"
                    placeholder="At least 8 characters"
                    floatingLabel
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
                  />
                  <PasswordStrengthIndicator password={password} />
                </div>

                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  label="Confirm new password"
                  placeholder="Re-enter your password"
                  floatingLabel
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError('') }}
                  error={passwordError}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loading}
                >
                  Update password
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
