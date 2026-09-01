// src/pages/orders/OrderHistory.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePaystackPayment } from 'react-paystack'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '@/store/AuthContext'
import { useMyOrders, updateOrderStatus } from '@/hooks/useOrders'
import OrderProgressBar from '@/components/orders/OrderProgressBar'

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string

const ACTIVE_STATUSES = ['pending', 'confirmed', 'seen', 'packaged', 'shipped', 'delivered'] as const
const COMPLETED_STATUSES = ['received', 'failed'] as const

interface OrderHistoryProps {
  mode?: 'active' | 'completed'
}

export default function OrderHistory({ mode = 'active' }: OrderHistoryProps) {
  const { user, isFarmer } = useAuthContext()
  const { orders, loading, refetch } = useMyOrders(user?.id, isFarmer ? 'farmer' : 'buyer')
  const [updating, setUpdating] = useState<string | null>(null)
  const initializePayment = usePaystackPayment({ publicKey: PAYSTACK_PUBLIC_KEY } as any)

  async function handleAdvance(orderId: string, nextStatus: 'seen' | 'packaged' | 'shipped' | 'delivered' | 'received') {
    setUpdating(orderId)
    try {
      await updateOrderStatus(orderId, nextStatus)
      toast.success(
        nextStatus === 'seen'
          ? 'Marked as seen'
          : nextStatus === 'packaged'
            ? 'Marked as packaged'
            : nextStatus === 'shipped'
              ? 'Marked as sent'
              : nextStatus === 'delivered'
                ? 'Marked as delivered'
                : 'Marked as received'
      )
      refetch()
    } catch {
      toast.error('Failed to update order')
    } finally {
      setUpdating(null)
    }
  }

  function handleResumePayment(order: (typeof orders)[number]) {
    if (!user?.email || !order.paystack_ref) {
      toast.error('Unable to continue payment right now')
      return
    }

    initializePayment({
      config: {
        reference: order.paystack_ref,
        email: user.email,
        amount: order.amount_kobo,
        label: order.listing?.crop ?? 'AgriConnect order',
      },
      onSuccess: () => {
        toast.success('Payment submitted — confirming…')
        refetch()
      },
      onClose: () => {
        toast('Payment not completed yet', { icon: '⏳' })
      },
    } as any)
  }

  const visibleOrders = orders.filter(o => {
    const isCompleted = COMPLETED_STATUSES.includes(o.status as typeof COMPLETED_STATUSES[number])
    return mode === 'completed' ? isCompleted : !isCompleted
  })

  const completedSummary = mode === 'completed'
    ? {
        total: visibleOrders.length,
        received: visibleOrders.filter(o => o.status === 'received').length,
        failed: visibleOrders.filter(o => o.status === 'failed').length,
      }
    : null

  if (loading) return <div className="py-24 text-center text-gray-400">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'completed'
            ? (isFarmer ? 'Completed sales' : 'Completed orders')
            : (isFarmer ? 'Sales' : 'My Orders')}
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/orders"
            className={`px-3 py-1.5 rounded-full border ${mode === 'active' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            Active
          </Link>
          <Link
            to="/orders/completed"
            className={`px-3 py-1.5 rounded-full border ${mode === 'completed' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            Completed
          </Link>
        </div>
      </div>

      {mode === 'completed' && completedSummary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">Total</div>
            <div className="mt-1 text-xl font-bold text-gray-900">{completedSummary.total}</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-3">
            <div className="text-[11px] uppercase tracking-wide text-emerald-600">Received</div>
            <div className="mt-1 text-xl font-bold text-emerald-700">{completedSummary.received}</div>
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-100 p-3">
            <div className="text-[11px] uppercase tracking-wide text-red-600">Failed</div>
            <div className="mt-1 text-xl font-bold text-red-700">{completedSummary.failed}</div>
          </div>
        </div>
      )}

      {visibleOrders.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📦</p>
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'completed' ? 'No completed orders yet' : 'No orders yet'}
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleOrders.map(o => (
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

              {!isFarmer && o.status === 'pending' && (
                <button onClick={() => handleResumePayment(o)} disabled={updating === o.id}
                  className="w-full mt-3 text-xs font-semibold py-2.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors">
                  {updating === o.id ? 'Preparing payment…' : '💳 Complete payment'}
                </button>
              )}

              {isFarmer && o.status === 'confirmed' && (
                <button onClick={() => handleAdvance(o.id, 'seen')} disabled={updating === o.id}
                  className="w-full mt-3 text-xs font-semibold py-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors">
                  {updating === o.id ? 'Updating…' : '✅ Mark as seen'}
                </button>
              )}
              {isFarmer && o.status === 'seen' && (
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
              {isFarmer && o.status === 'shipped' && (
                <button onClick={() => handleAdvance(o.id, 'delivered')} disabled={updating === o.id}
                  className="w-full mt-3 text-xs font-semibold py-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                  {updating === o.id ? 'Updating…' : '✅ Mark as delivered'}
                </button>
              )}
              {!isFarmer && o.status === 'delivered' && (
                <button onClick={() => handleAdvance(o.id, 'received')} disabled={updating === o.id}
                  className="w-full mt-3 text-xs font-semibold py-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                  {updating === o.id ? 'Updating…' : '✅ Confirm received'}
                </button>
              )}
              {(o.status === 'received' || o.status === 'failed') && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-gray-100 text-gray-700">
                    {o.status === 'received' ? 'Order completed' : 'Payment failed'}
                  </div>
                  <Link
                    to={`/listings/${o.listing_id}`}
                    className="text-xs font-semibold text-green-700 hover:text-green-800 transition-colors">
                    View listing
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}