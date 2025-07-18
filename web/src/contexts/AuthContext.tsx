import React, { useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import toast from 'react-hot-toast'
import { AuthContext, AuthContextType } from './AuthContextType'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user profile from database
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading user profile:', error)
        return null
      }

      // If no profile exists, create one
      if (!data) {
        const newUser: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
          email: supabaseUser.email!,
          full_name: supabaseUser.user_metadata?.full_name || '',
          avatar_url: supabaseUser.user_metadata?.avatar_url || '',
          subscription_tier: 'spark',
          subscription_status: 'active',
          confidence_score: 50.0,
          onboarding_completed: false,
          usage_count: 0,
          monthly_limit: 5
        }

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single()

        if (createError) {
          console.error('Error creating user profile:', createError)
          return null
        }

        return createdUser
      }

      return data
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        if (initialSession?.user) {
          setSession(initialSession)
          setSupabaseUser(initialSession.user)
          
          const userProfile = await loadUserProfile(initialSession.user)
          setUser(userProfile)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        setSession(session)
        setSupabaseUser(session?.user || null)

        if (session?.user) {
          const userProfile = await loadUserProfile(session.user)
          setUser(userProfile)
        } else {
          setUser(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        throw error
      }
      
      toast.success('Successfully signed in!')
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        throw error
      }
      
      toast.success('Sign up successful! Please check your email to verify your account.')
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast.error(error.message || 'Failed to sign up')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      setUser(null)
      setSupabaseUser(null)
      setSession(null)
      toast.success('Successfully signed out!')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error(error.message || 'Failed to sign out')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setUser(data)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Update profile error:', error)
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  }

  const refreshUser = async () => {
    if (!supabaseUser) return

    try {
      const userProfile = await loadUserProfile(supabaseUser)
      setUser(userProfile)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const value: AuthContextType = {
    user,
    supabaseUser,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
