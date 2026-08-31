export interface Order {
  id: string
  listing_id: string
  buyer_id: string
  farmer_id: string
  amount_kobo: number
  status: 'pending' | 'confirmed' | 'seen' | 'packaged' | 'shipped' | 'delivered' | 'received' | 'failed'
  paystack_ref: string
  created_at: string
  seen_at: string | null
  packaged_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  received_at: string | null
}