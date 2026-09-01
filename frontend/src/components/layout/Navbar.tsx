import { useState } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="h-16 flex items-center justify-between gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-gray-900 min-w-0">
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

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${isFarmer ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {isFarmer ? '🌾 Farmer' : '🏪 Buyer'}
            </span>
            <Link to="/profile" className="hidden sm:inline text-sm font-medium text-gray-700 hover:text-green-700 truncate">
              {profile?.full_name?.split(' ')[0] ?? 'Account'}
            </Link>
            <button onClick={handleSignOut}
              className="hidden sm:inline text-sm text-gray-400 hover:text-red-500 transition-colors">
              Sign out
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-2 text-sm font-medium text-gray-600">
            <Link to="/listings" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-2 rounded-lg hover:bg-gray-50 hover:text-green-700 transition-colors">Browse</Link>
            {isFarmer && (
              <Link to="/listings/mine" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-2 rounded-lg hover:bg-gray-50 hover:text-green-700 transition-colors">
                My Listings
              </Link>
            )}
            <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 hover:text-green-700 transition-colors">
              <span>Orders</span>
              {actionableOrders > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {actionableOrders}
                </span>
              )}
            </Link>
            <Link to="/orders/completed" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-2 rounded-lg hover:bg-gray-50 hover:text-green-700 transition-colors">Completed</Link>
            <Link to="/messages" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 hover:text-green-700 transition-colors">
              <span>Messages</span>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalUnread}
                </span>
              )}
            </Link>
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-2 mt-2 px-2">
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-green-700">
                {profile?.full_name?.split(' ')[0] ?? 'Account'}
              </Link>
              <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
