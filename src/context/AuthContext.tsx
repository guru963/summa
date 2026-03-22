import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as AppUser } from '@/types'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: AppUser | null
  session: Session | null
  loading: boolean
  profileMissing: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  createMissingProfile: (fullName: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileMissing, setProfileMissing] = useState(false)
  const fetchingRef = useRef(false)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        if (session?.user) fetchProfile(session.user)
        else setLoading(false)
      })
      .catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user)
      else {
        setUser(null)
        setProfileMissing(false)
        setLoading(false)
        fetchingRef.current = false
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Uses maybeSingle() — returns null instead of 406 when no row exists
  const fetchProfile = async (authUser: { id: string; email?: string }) => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (error) {
        console.error('fetchProfile error:', error.message, error.code)
        setProfileMissing(true)
        return
      }

      if (!data) {
        // No profile row — try to create it now (user IS authenticated here)
        console.warn('No profile found for', authUser.id, '— creating...')
        const ok = await upsertProfile(authUser.id, authUser.email ?? '', 'Member')
        if (ok) {
          // Re-fetch the created row
          const { data: fresh } = await supabase
            .from('profiles').select('*').eq('id', authUser.id).maybeSingle()
          if (fresh) { setUser(fresh as AppUser); setProfileMissing(false) }
          else setProfileMissing(true)
        } else {
          setProfileMissing(true)
        }
        return
      }

      setUser(data as AppUser)
      setProfileMissing(false)
    } finally {
      fetchingRef.current = false
      setLoading(false)
    }
  }

  // Insert or update a profile row — safe to call when authenticated
  const upsertProfile = async (id: string, email: string, fullName: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('profiles').upsert(
        { id, email, full_name: fullName, subscription_status: 'inactive', charity_percentage: 10, role: 'user' },
        { onConflict: 'id' }
      )
      if (error) { console.error('upsertProfile error:', error.message); return false }
      return true
    } catch { return false }
  }

  const createMissingProfile = async (fullName: string): Promise<{ error: string | null }> => {
    if (!session?.user) return { error: 'Not authenticated' }
    const ok = await upsertProfile(session.user.id, session.user.email ?? '', fullName)
    if (!ok) return { error: 'Could not create profile. Please try again.' }
    fetchingRef.current = false
    await fetchProfile(session.user)
    return { error: null }
  }

  const refreshUser = async () => {
    if (session?.user) {
      fetchingRef.current = false
      await fetchProfile(session.user)
    }
  }

  // ── SIGN UP ────────────────────────────────────────────────
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      })

      if (error) return { error: error.message }

      // If the user got a session immediately (email confirm disabled),
      // manually upsert the profile as a guaranteed fallback.
      // The trigger should have done this, but we do it again to be safe.
      if (data.session && data.user) {
        await upsertProfile(data.user.id, data.user.email ?? email.trim(), fullName.trim())
      }

      return { error: null }
    } catch (err: any) {
      return { error: err?.message || 'Sign up failed. Please try again.' }
    }
  }

  // ── SIGN IN ────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return { error: 'Incorrect email or password.' }
        }
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return { error: 'Please confirm your email address first. Check your inbox.' }
        }
        return { error: error.message }
      }
      return { error: null }
    } catch (err: any) {
      return { error: err?.message || 'Sign in failed. Please try again.' }
    }
  }

  // ── SIGN OUT ───────────────────────────────────────────────
  const signOut = async () => {
    setUser(null)
    setSession(null)
    setProfileMissing(false)
    fetchingRef.current = false
    await supabase.auth.signOut().catch(() => {})
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading, profileMissing,
      signUp, signIn, signOut, refreshUser, createMissingProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
