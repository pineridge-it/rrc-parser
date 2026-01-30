'use client'

import { useEffect, useState, useCallback } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setUser(user)
      } catch (err) {
        setError(err as AuthError)
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
    }
    
    setLoading(false)
    return { error }
  }, [supabase])

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
    }
    
    setLoading(false)
    return { data, error }
  }, [supabase])

  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      setError(error)
    } else {
      setUser(null)
    }
    
    setLoading(false)
    return { error }
  }, [supabase])

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    
    if (error) {
      setError(error)
    }
    
    setLoading(false)
    return { error }
  }, [supabase])

  const updatePassword = useCallback(async (newPassword: string) => {
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    
    if (error) {
      setError(error)
    }
    
    setLoading(false)
    return { error }
  }, [supabase])

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
    }
    
    setLoading(false)
    return { error }
  }, [supabase])

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
