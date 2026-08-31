import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '@/store/AuthContext'
import { useInbox } from '@/hooks/useMessages'
import { useActionableOrdersCount } from '@/hooks/useOrders'

export default function Navbar() {
  const { profile, isFarmer, signOut, user } = useAuthContext()
  const navigate = useNavigate()
  const { totalUnread } = useInbox(user?.id)
  const actionableOrders = useActionableOrdersCount(isFarmer ? user?.id : undefined)

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
            <Link to="/listings/mine" className="hover:text-green-700 transition-colors">
              My Listings
            </Link>
          )}
          <Link to="/orders" className="relative hover:text-green-700 transition-colors">
            Orders
            {actionableOrders > 0 && (
              <span className="absolute -top-2 -right-3 bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {actionableOrders}
              </span>
            )}
          </Link>
          <Link to="/orders/completed" className="hover:text-green-700 transition-colors">
            Completed
          </Link>
          <Link to="/messages" className="relative hover:text-green-700 transition-colors">
            Messages
            {totalUnread > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isFarmer ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
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
