// src/pages/messages/Conversation.tsx
import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/store/AuthContext'
import { useConversation, sendMessage } from '@/hooks/useMessages'
import { usePublicProfile } from '@/hooks/useProfile'
import { Listing } from '@/types'

export default function Conversation() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const otherUserId = id ?? searchParams.get('to') ?? undefined
  const listingId = searchParams.get('listing') ?? undefined
  const { user } = useAuthContext()
  const { profile: otherUser } = usePublicProfile(otherUserId)
  const { messages, loading } = useConversation(user?.id, otherUserId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [contextListing, setContextListing] = useState<Listing | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (!listingId) { setContextListing(null); return }
    supabase.from('listings').select('*').eq('id', listingId).single<Listing>()
      .then(({ data }) => setContextListing(data))
  }, [listingId])

  async function handleSend() {
    if (!text.trim() || !user || !otherUserId) return
    setSending(true)
    try {
      await sendMessage(user.id, otherUserId, text, listingId)
      setText('')
    } catch {
      toast.error('Failed to send message')
    } finally { setSending(false) }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!otherUserId) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">Select a conversation</div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <Link to="/messages" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="w-10 h-10 rounded-full bg-green-100 overflow-hidden flex-shrink-0">
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">{otherUser?.role === 'farmer' ? '🌾' : '🏪'}</div>
          )}
        </div>
        <Link to={\`/profile/\${otherUserId}\`} className="font-semibold text-gray-900 hover:text-green-700">
          {otherUser?.full_name ?? 'AgriConnect User'}
        </Link>
      </div>
      {contextListing && (
        <Link to={\`/listings/\${contextListing.id}\`}
          className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 mt-3 text-xs text-green-800 hover:bg-green-100 transition-colors">
          🌾 <span className="font-medium">About: {contextListing.crop}</span>
          <span className="text-green-600 ml-auto">View listing →</span>
        </Link>
      )}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-10">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-10">
            Say hello to start the conversation 👋
          </div>
        ) : (
          messages.map(m => {
            const isMine = m.sender_id === user?.id
            return (
              <div key={m.id} className={\`flex \${isMine ? 'justify-end' : 'justify-start'}\`}>
                <div className={\`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm \${
                  isMine
                    ? 'bg-green-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }\`}>
                  {m.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-end gap-2 pt-3 border-t border-gray-100">
        <textarea rows={1} value={text} placeholder="Type a message…"
          onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
          className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 max-h-24" />
        <button onClick={handleSend} disabled={sending || !text.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors">
          Send
        </button>
      </div>
    </div>
  )
}
