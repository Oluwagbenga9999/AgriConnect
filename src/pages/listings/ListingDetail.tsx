// src/pages/listings/ListingDetail.tsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePaystackPayment } from 'react-paystack'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/store/AuthContext'
import { createPendingOrder, generateReference, useOrderStatus } from '@/hooks/useOrders'
import { usePublicProfile } from '@/hooks/useProfile'
import { Listing } from '@/types'

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, isBuyer } = useAuthContext()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [reference, setReference] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const orderStatus = useOrderStatus(reference)

  useEffect(() => {
    if (!id) return
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single<Listing>()
      .then(({ data }) => { setListing(data); setLoading(false) })
  }, [id])

  const { profile: farmerProfile } = usePublicProfile(listing?.farmer_id)

  useEffect(() => {
    if (orderStatus === 'confirmed') {
      toast.success('Payment confirmed! 🎉')
      navigate('/orders')
    }
  }, [orderStatus, navigate])

  const amountKobo = listing ? Math.round(listing.quantity_kg * listing.price_per_kg * 100) : 0

  const initializePayment = usePaystackPayment({
    publicKey: PAYSTACK_PUBLIC_KEY,
  } as any)

  async function handleBuyNow() {
    if (!user || !listing) return
    setPaying(true)

    const ref = generateReference()
    setReference(ref)

    try {
      await createPendingOrder(listing.id, user.id, listing.farmer_id, amountKobo, ref)

      initializePayment({
        config: {
          reference: ref,
          email: user.email,
          amount: amountKobo,
        },
        onSuccess: () => toast.success('Payment submitted — confirming…'),
        onClose: () => setPaying(false),
      } as any)

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout')
      setPaying(false)
    }
  }

  if (loading) return <div className="py-24 text-center text-gray-400">Loading…</div>
  if (!listing) return <div className="py-24 text-center text-gray-400">Listing not found</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="h-64 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden mb-5">
        {listing.photos?.[0]
          ? <img src={listing.photos[0]} alt={listing.crop} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-6xl">🌾</div>}
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{listing.crop}</h1>
      <p className="text-gray-500 text-sm mt-1">📍 {listing.location}, {listing.state}</p>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-5 space-y-3">
        <div className="flex justify-between text-sm"><span className="text-gray-500">Price per kg</span><span className="font-semibold">₦{listing.price_per_kg.toLocaleString()}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">Quantity</span><span className="font-semibold">{listing.quantity_kg.toLocaleString()}kg</span></div>
        <div className="flex justify-between text-base pt-3 border-t border-gray-100">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-green-700">₦{(amountKobo / 100).toLocaleString()}</span>
        </div>
      </div>
      {listing.description && <p className="text-sm text-gray-600 mt-5 leading-relaxed">{listing.description}</p>}
            {isBuyer && listing.status === 'available' && (
        <button onClick={handleBuyNow} disabled={paying}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors">
          {paying ? 'Waiting for confirmation…' : `Buy now — ₦${(amountKobo / 100).toLocaleString()}`}
        </button>
      )}
      {farmerProfile && user?.id !== farmerProfile.id && (
        <Link
          to={`/messages/${farmerProfile.id}?listing=${listing.id}`}
          className="w-full mt-3 flex items-center justify-center gap-2 border border-green-200 text-green-700 hover:bg-green-50 font-semibold py-3 rounded-xl transition-colors">
          💬 Message farmer
        </Link>
      )}
      {farmerProfile && (
        <Link to={`/profile/${farmerProfile.id}`} className="block mt-4 text-sm text-green-700 hover:underline text-center">
          View farmer profile →
        </Link>
      )}
    </div>
  )
}
