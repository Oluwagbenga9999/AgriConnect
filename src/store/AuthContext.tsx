import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AuthContextValue {
  isLoggedIn: boolean
  role: string | null
  loading: boolean
  user: unknown
  profile: unknown
  isFarmer: boolean
  isBuyer: boolean
  signUp: (args: {
    email: string
    password: string
    role: string
    fullName: string
    phone: string
  }) => Promise<unknown>
  signIn: (args: { email: string; password: string }) => Promise<unknown>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider')
  }
  return context
}