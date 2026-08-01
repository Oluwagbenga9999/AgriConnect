// src/pages/orders/OrderHistory.tsx
import { useAuthContext } from '@/store/AuthContext'
import { useMyOrders } from '@/hooks/useOrders'

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-600',
}

export default function OrderHistory() {
  const { user, isFarmer } = useAuthContext()
  const { orders, loading } = useMyOrders(user?.id, isFarmer ? 'farmer' : 'buyer')

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
            <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0">
                {o.listing?.photos?.[0]
                  ? <img src={o.listing.photos[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                  : '🌾'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900">{o.listing?.crop ?? 'Listing removed'}</div>
                <div className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900 text-sm">₦{(o.amount_kobo / 100).toLocaleString()}</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status]}`}>
                  {o.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
