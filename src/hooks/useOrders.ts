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
  return { orders, loading, refetch: fetch }
}
