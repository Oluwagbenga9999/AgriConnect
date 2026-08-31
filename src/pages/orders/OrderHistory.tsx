// src/pages/orders/OrderHistory.tsx
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '@/store/AuthContext'
import { useMyOrders, updateOrderStatus, markSeenIfNeeded } from '@/hooks/useOrders'
import OrderProgressBar from '@/components/orders/OrderProgressBar'

export default function OrderHistory() {
  const { user, isFarmer } = useAuthContext()
  const { orders, loading, refetch } = useMyOrders(user?.id, isFarmer ? 'farmer' : 'buyer')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!isFarmer || orders.length === 0) return
    const newlyConfirmed = orders.filter(o => o.status === 'confirmed')
    if (newlyConfirmed.length === 0) return
    Promise.all(newlyConfirmed.map(o => markSeenIfNeeded(o))).then(() => refetch())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFarmer, orders.length])

  async function handleAdvance(orderId: string, nextStatus: 'packaged' | 'shipped') {
    setUpdating(orderId)
    try {
      await updateOrderStatus(orderId, nextStatus)
      toast.success(nextStatus === 'packaged' ? 'Marked as packaged' : 'Marked as sent')
      refetch()
    } catch {
      toast.error('Failed to update order')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="py-24 text-center text-gray-400">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isFarmer ? 'Sales' : 'My Orders'}
      </h1>
      {orders.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📦</p>
          <h3 className="text-lg font-semibold text-gray-900">No orders yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                  {o.listing?.photos?.[0]
                    ? <img src={o.listing.photos[0]} alt="" className="w-full h-full object-cover" />
                    : '🌾'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900">{o.listing?.crop ?? 'Listing removed'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 text-sm">₦{(o.amount_kobo / 100).toLocaleString()}</div>
                </div>
              </div>

              <OrderProgressBar status={o.status} />

              {isFarmer && (o.status === 'confirmed' || o.status === 'seen') && (
                <button onClick={() => handleAdvance(o.id, 'packaged')} disabled={updating === o.id}
                  className="w-full mt-3 text-xs font-semibold py-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors">
                  {updating === o.id ? 'Updating…' : '📦 Mark as packaged'}
                </button>
              )}
              {isFarmer && o.status === 'packaged' && (
                <button onClick={() => handleAdvance(o.id, 'shipped')} disabled={updating === o.id}
                  className="w-full mt-3 text-xs font-semibold py-2.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors">
                  {updating === o.id ? 'Updating…' : '🚚 Mark as sent'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}