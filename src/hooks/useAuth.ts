import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Profile {
  role?: string | null
}

interface AuthUser {
  id: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile((data as Profile | null) ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signUp({ email, password, role, fullName, phone }: {
    email: string
    password: string
    role: string
    fullName: string
    phone: string
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName, phone },
      },
    })
    if (error) throw error
    return data
  }

  async function signIn({ email, password }: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    profile,
    role: profile?.role ?? null,
    isFarmer: profile?.role === 'farmer',
    isBuyer: profile?.role === 'buyer',
    isLoggedIn: !!user,
    loading,
    signUp,
    signIn,
    signOut,
  }
}