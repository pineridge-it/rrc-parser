'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: AuthError | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; data: { user: User | null } | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>
  sendMagicLink: (email: string) => Promise<{ error: AuthError | null }>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const { toast, error: toastError, success: toastSuccess } = useToast()
  // Use useMemo to prevent creating a new client on every render
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setUser(user)
      } catch (err) {
        setError(err as AuthError)
        // Only show toast for actual errors, not for expected "no session" cases
        if ((err as AuthError).message?.includes('Auth session missing')) {
          // This is expected when user is not logged in, don't show error toast
        } else {
          toastError('Authentication Error', {
            description: 'Failed to get user session. Please try refreshing the page.'
          })
        }
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error)
      toastError("Sign In Failed", {
        description: error.message || "Invalid email or password. Please try again."
      })
    } else {
      toastSuccess("Welcome Back!", {
        description: "You have been successfully signed in."
      })
    }

    setLoading(false)
    return { error }
  }, [supabase, toast])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error)
      toastError('Sign Up Failed', {
        description: error.message || 'Failed to create account. Please try again.'
      })
    } else {
      toastSuccess('Account Created!', {
        description: 'Please check your email to verify your account.'
      })
    }

    setLoading(false)
    return { data, error }
  }, [supabase, toast])

  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signOut()

    if (error) {
      setError(error)
      toastError('Sign Out Failed', {
        description: error.message || 'Failed to sign out. Please try again.'
      })
    } else {
      setUser(null)
      toastSuccess('Signed Out', {
        description: 'You have been successfully signed out.'
      })
    }

    setLoading(false)
    return { error }
  }, [supabase, toast])

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (error) {
      setError(error)
      toastError('Password Reset Failed', {
        description: error.message || 'Failed to send password reset email. Please try again.'
      })
    } else {
      toastSuccess('Password Reset Email Sent!', {
        description: 'Check your email for a link to reset your password.'
      })
    }

    setLoading(false)
    return { error }
  }, [supabase, toast])

  const updatePassword = useCallback(async (newPassword: string) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setError(error)
      toastError('Password Update Failed', {
        description: error.message || 'Failed to update password. Please try again.'
      })
    } else {
      toastSuccess('Password Updated!', {
        description: 'Your password has been successfully updated.'
      })
    }

    setLoading(false)
    return { error }
  }, [supabase, toast])

  const sendMagicLink = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error)
      toastError('Magic Link Failed', {
        description: error.message || 'Failed to send magic link. Please try again.'
      })
    } else {
      toastSuccess('Magic Link Sent!', {
        description: 'Check your email for a link to sign in.'
      })
    }

    setLoading(false)
    return { error }
  }, [supabase, toast])

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    sendMagicLink,
  }
}
