import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '@/store/AuthContext'

export default function Navbar() {
  const { profile, isFarmer, signOut } = useAuthContext()
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-gray-900">
          <span className="text-2xl">🌱</span>
          <span className="text-green-700">Agri</span>Connect
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link to="/listings" className="hover:text-green-700 transition-colors">Browse</Link>
          {isFarmer && (
            <Link to="/listings/create" className="hover:text-green-700 transition-colors">
              My Listings
            </Link>
          )}
          <Link to="/messages" className="hover:text-green-700 transition-colors">Messages</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isFarmer ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isFarmer ? '🌾 Farmer' : '🏪 Buyer'}
          </span>
          <Link to="/profile" className="text-sm font-medium text-gray-700 hover:text-green-700">
            {profile?.full_name?.split(' ')[0] ?? 'Account'}
          </Link>
          <button onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}