import { Link } from 'react-router-dom'
import { useAuthContext } from '@/store/AuthContext'

interface QuickAction {
  icon:  string
  label: string
  desc:  string
  to:    string
  color: string
}

const FARMER_ACTIONS: QuickAction[] = [
  { icon: '➕', label: 'List Produce',  desc: 'Add a new crop listing',   to: '/listings/create', color: 'green'  },
  { icon: '📋', label: 'My Listings',   desc: 'Manage your produce',      to: '/listings/mine',   color: 'blue'   },
  { icon: '💬', label: 'Messages',      desc: 'Buyer inquiries',          to: '/messages',        color: 'purple' },
  { icon: '👤', label: 'My Profile',    desc: 'Update your details',      to: '/profile',         color: 'orange' },
]

const BUYER_ACTIONS: QuickAction[] = [
  { icon: '🔍', label: 'Browse Produce', desc: 'Find fresh listings',    to: '/listings',  color: 'green'  },
  { icon: '📦', label: 'My Orders',      desc: 'Track your purchases',   to: '/orders',    color: 'blue'   },
  { icon: '💬', label: 'Messages',       desc: 'Talk to farmers',        to: '/messages',  color: 'purple' },
  { icon: '👤', label: 'My Profile',     desc: 'Update your details',    to: '/profile',   color: 'orange' },
]

const COLOR_MAP: Record<string, string> = {
  green:  'bg-green-50 hover:bg-green-100 border-green-100 text-green-700',
  blue:   'bg-blue-50 hover:bg-blue-100 border-blue-100 text-blue-700',
  purple: 'bg-purple-50 hover:bg-purple-100 border-purple-100 text-purple-700',
  orange: 'bg-orange-50 hover:bg-orange-100 border-orange-100 text-orange-700',
}

export default function Dashboard() {
  const { profile, isFarmer } = useAuthContext()
  const actions = isFarmer ? FARMER_ACTIONS : BUYER_ACTIONS
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white mb-8">
        <p className="text-green-200 text-sm font-medium mb-1">
          {isFarmer ? '🌾 Farmer Dashboard' : '🏪 Buyer Dashboard'}
        </p>
        <h1 className="text-3xl font-bold">Welcome back, {firstName}!</h1>
        <p className="text-green-100 mt-2 text-sm">
          {isFarmer
            ? 'List your produce and connect with buyers across Nigeria.'
            : 'Discover fresh produce directly from Nigerian farmers.'}
        </p>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {actions.map((action) => (
          <Link key={action.label} to={action.to}
            className={`flex flex-col items-center text-center p-6 rounded-xl border-2 transition-colors ${COLOR_MAP[action.color]}`}>
            <span className="text-3xl mb-3">{action.icon}</span>
            <span className="font-semibold text-sm">{action.label}</span>
            <span className="text-xs opacity-70 mt-1">{action.desc}</span>
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Getting Started</h2>
        <div className="space-y-3">
          {(isFarmer ? [
            { done: true,  text: 'Create your account' },
            { done: false, text: 'Complete your profile', to: '/profile' },
            { done: false, text: 'Post your first listing', to: '/listings/create' },
            { done: false, text: 'Receive your first inquiry' },
          ] : [
            { done: true,  text: 'Create your account' },
            { done: false, text: 'Complete your profile', to: '/profile' },
            { done: false, text: 'Browse available produce', to: '/listings' },
            { done: false, text: 'Send your first inquiry' },
          ]).map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                step.done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>{step.done ? '✓' : i + 1}</div>
              {'to' in step ? (
                <Link to={step.to!} className="text-sm text-green-600 hover:underline font-medium">
                  {step.text}
                </Link>
              ) : (
                <span className="text-sm text-gray-500">{step.text}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}