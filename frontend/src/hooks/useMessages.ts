// src/hooks/useMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Message, Profile } from '@/types'

export interface ConversationSummary {
  otherUser:   Profile
  lastMessage: Message
  unreadCount: number
}

export function useInbox(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInbox = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (!msgs || msgs.length === 0) {
      setConversations([]); setLoading(false); return
    }

    const latestByUser = new Map<string, Message>()
    const unreadCounts = new Map<string, number>()

    for (const m of msgs as Message[]) {
      const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id
      if (!latestByUser.has(otherId)) latestByUser.set(otherId, m)
      if (m.receiver_id === userId && !m.read) {
        unreadCounts.set(otherId, (unreadCounts.get(otherId) ?? 0) + 1)
      }
    }

    const otherIds = Array.from(latestByUser.keys())
    const { data: profiles } = await supabase
      .from('profiles').select('*').in('id', otherIds)

    const profileMap = new Map((profiles as Profile[] ?? []).map(p => [p.id, p]))

    const result: ConversationSummary[] = otherIds
      .filter(id => profileMap.has(id))
      .map(id => ({
        otherUser:   profileMap.get(id)!,
        lastMessage:  latestByUser.get(id)!,
        unreadCount:  unreadCounts.get(id) ?? 0,
      }))
      .sort((a, b) =>
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime()
      )

    setConversations(result)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchInbox()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchInbox])

  useEffect(() => {
  if (!userId) return

  let isActive = true
  const channel = supabase.channel(`inbox:${userId}:${crypto.randomUUID()}`)

  channel.on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    () => { if (isActive) fetchInbox() }
  )

  channel.subscribe()

  return () => {
    isActive = false
    supabase.removeChannel(channel)
  }
}, [userId, fetchInbox])

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)
  return { conversations, loading, totalUnread, refetch: fetchInbox }
}

export function useConversation(currentUserId: string | undefined, otherUserId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (!currentUserId || !otherUserId) { setLoading(false); return }

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),` +
          `and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true })
      setMessages((data as Message[]) ?? [])
      setLoading(false)

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', currentUserId)
        .eq('read', false)
    }
    load()

    let isActive = true
const channel = supabase.channel(`conversation:${[currentUserId, otherUserId].sort().join('-')}:${crypto.randomUUID()}`)

channel.on<Message>('postgres_changes',
  { event: 'INSERT', schema: 'public', table: 'messages' },
  (payload) => {
    if (!isActive) return
    const m = payload.new as Message
    const belongsHere =
      (m.sender_id === currentUserId && m.receiver_id === otherUserId) ||
      (m.sender_id === otherUserId && m.receiver_id === currentUserId)
    if (!belongsHere) return
    setMessages(prev => [...prev, m])
    if (m.receiver_id === currentUserId) {
      supabase.from('messages').update({ read: true }).eq('id', m.id).then(() => {})
    }
  }
)

channel.subscribe()
channelRef.current = channel
return () => {
  isActive = false
  supabase.removeChannel(channel)
}
  }, [currentUserId, otherUserId])

  return { messages, loading }
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  listingId?: string
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    sender_id:   senderId,
    receiver_id: receiverId,
    content:     content.trim(),
    listing_id:  listingId ?? null,
  })
  if (error) throw error
}