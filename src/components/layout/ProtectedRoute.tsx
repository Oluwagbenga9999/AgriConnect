import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '@/store/AuthContext'

interface ProtectedRouteProps {
  role?: string | null
}

export function ProtectedRoute({ role = null }: ProtectedRouteProps) {
  const { isLoggedIn, role: userRole, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to="/" replace />
  return <Outlet />
}