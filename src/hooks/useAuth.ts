// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile, Role, SignUpArgs, SignInArgs } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  async function fetchProfile(userId: string): Promise<void> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single<Profile>()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else setProfile(null)
      })
    return () => subscription.unsubscribe()
  }, [])

  async function signUp({ email, password, role, fullName, phone }: SignUpArgs): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { role, full_name: fullName, phone } },
    })
    if (error) throw error
  }

  async function signIn({ email, password }: SignInArgs): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user, profile,
    role: profile?.role as Role | null,
    isFarmer: profile?.role === 'farmer',
    isBuyer:  profile?.role === 'buyer',
    isLoggedIn: !!user,
    loading, signUp, signIn, signOut,
  }
}
