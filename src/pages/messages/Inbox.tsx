// src/pages/messages/Inbox.tsx
import { Link } from 'react-router-dom'
import { useAuthContext } from '@/store/AuthContext'
import { useInbox } from '@/hooks/useMessages'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function Inbox() {
  const { user } = useAuthContext()
  const { conversations, loading } = useInbox(user?.id)

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      {conversations.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">💬</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No conversations yet</h3>
          <p className="text-gray-500 text-sm">Messages with farmers and buyers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(c => (
            <Link key={c.otherUser.id} to={`/messages/${c.otherUser.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-full bg-green-100 overflow-hidden flex-shrink-0 relative">
                {c.otherUser.avatar_url ? (
                  <img src={c.otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">
                    {c.otherUser.role === 'farmer' ? '🌾' : '🏪'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-semibold text-sm truncate ${c.unreadCount ? 'text-gray-900' : 'text-gray-700'}`}>
                    {c.otherUser.full_name ?? 'AgriConnect User'}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(c.lastMessage.created_at)}</span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${c.unreadCount ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                  {c.lastMessage.sender_id === user?.id && 'You: '}{c.lastMessage.content}
                </p>
              </div>
              {c.unreadCount > 0 && (
                <span className="flex-shrink-0 bg-green-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}