// src/hooks/useOrders.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Order, Listing } from '@/types'

export interface OrderWithListing extends Order {
  listing: Listing | null
}

export async function createPendingOrder(
  listingId: string,
  buyerId: string,
  farmerId: string,
  amountKobo: number,
  reference: string
): Promise<void> {
  const { error } = await supabase.from('orders').insert({
    listing_id:   listingId,
    buyer_id:     buyerId,
    farmer_id:    farmerId,
    amount_kobo:  amountKobo,
    paystack_ref: reference,
    status:       'pending',
  })
  if (error) throw error
}

export function generateReference(): string {
  return `AGC-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
}

export function useOrderStatus(reference: string | null) {
  const [status, setStatus] = useState<Order['status'] | null>(null)

  useEffect(() => {
    if (!reference) return
    let isActive = true
    const channel = supabase
      .channel(`order:${reference}:${crypto.randomUUID()}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `paystack_ref=eq.${reference}` },
        (payload) => { if (isActive) setStatus((payload.new as Order).status) }
      )
      .subscribe()

    return () => { isActive = false; supabase.removeChannel(channel) }
  }, [reference])

  return status
}

export function useMyOrders(userId: string | undefined, role: 'buyer' | 'farmer') {
  const [orders, setOrders] = useState<OrderWithListing[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const column = role === 'buyer' ? 'buyer_id' : 'farmer_id'
    const { data } = await supabase
      .from('orders')
      .select('*, listing:listings(*)')
      .eq(column, userId)
      .order('created_at', { ascending: false })
    setOrders((data as OrderWithListing[]) ?? [])
    setLoading(false)
  }, [userId, role])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (!userId) return
    let isActive = true
    const column = role === 'buyer' ? 'buyer_id' : 'farmer_id'
    const channel = supabase
      .channel(`orders:${userId}:${crypto.randomUUID()}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `${column}=eq.${userId}` },
        () => { if (isActive) fetch() }
      )
      .subscribe()

    return () => { isActive = false; supabase.removeChannel(channel) }
  }, [userId, role, fetch])

  return { orders, loading, refetch: fetch }
}

const TIMESTAMP_COLUMN: Partial<Record<Order['status'], string>> = {
  seen:      'seen_at',
  packaged:  'packaged_at',
  shipped:   'shipped_at',
  delivered: 'delivered_at',
  received:  'received_at',
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<void> {
  const update: Record<string, unknown> = { status }
  const col = TIMESTAMP_COLUMN[status]
  if (col) update[col] = new Date().toISOString()

  const { error } = await supabase.from('orders').update(update).eq('id', orderId)
  if (error) throw error
}

export async function markSeenIfNeeded(order: Order): Promise<void> {
  if (order.status !== 'confirmed') return
  await updateOrderStatus(order.id, 'seen')
}

const NEEDS_ACTION: Order['status'][] = ['confirmed', 'seen', 'packaged']

export function useActionableOrdersCount(farmerId: string | undefined) {
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    if (!farmerId) { setCount(0); return }
    const { count: c } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', farmerId)
      .in('status', NEEDS_ACTION)
    setCount(c ?? 0)
  }, [farmerId])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (!farmerId) return
    let isActive = true
    const channel = supabase
      .channel(`actionable-orders:${farmerId}:${crypto.randomUUID()}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `farmer_id=eq.${farmerId}` },
        () => { if (isActive) fetch() }
      )
      .subscribe()

    return () => { isActive = false; supabase.removeChannel(channel) }
  }, [farmerId, fetch])

  return count
}

export function useNewOrdersCount(farmerId: string | undefined) {
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    if (!farmerId) { setCount(0); return }
    const { count: c } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', farmerId)
      .eq('status', 'confirmed')
    setCount(c ?? 0)
  }, [farmerId])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (!farmerId) return
    let isActive = true
    const channel = supabase
      .channel(`new-orders:${farmerId}:${crypto.randomUUID()}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `farmer_id=eq.${farmerId}` },
        () => { if (isActive) fetch() }
      )
      .subscribe()

    return () => { isActive = false; supabase.removeChannel(channel) }
  }, [farmerId, fetch])

  return count
}