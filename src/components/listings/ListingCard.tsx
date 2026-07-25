// src/components/listings/ListingCard.tsx
import { Link } from 'react-router-dom'
import { Listing } from '@/types'

interface ListingCardProps {
  listing:      Listing
  showActions?: boolean
  onMarkSold?:  () => void
  onDelete?:    () => void
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  sold:      'bg-gray-100 text-gray-500',
  expired:   'bg-red-100 text-red-600',
}

export default function ListingCard({ listing, showActions, onMarkSold, onDelete }: ListingCardProps) {
  const photo = listing.photos?.[0]
  const totalValue = (listing.quantity_kg * listing.price_per_kg).toLocaleString('en-NG')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/listings/${listing.id}`} className="block">
        <div className="h-44 bg-gradient-to-br from-green-50 to-emerald-100 relative overflow-hidden">
          {photo ? (
            <img src={photo} alt={listing.crop} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🌾</div>
          )}
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[listing.status]}`}>
            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
          </span>
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={`/listings/${listing.id}`}
            className="font-bold text-gray-900 text-lg leading-tight hover:text-green-700 transition-colors">
            {listing.crop}
          </Link>
          <div className="text-right flex-shrink-0">
            <div className="text-green-700 font-bold">₦{listing.price_per_kg.toLocaleString('en-NG')}</div>
            <div className="text-xs text-gray-400">per kg</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span>⚖️ {listing.quantity_kg.toLocaleString()}kg</span>
          <span>📍 {listing.location}, {listing.state}</span>
        </div>
        <div className="flex items-center justify-between">
          {listing.farmer && (
            <Link to={`/profile/${listing.farmer.id}`} className="flex items-center gap-2 group/farmer">
              <div className="w-7 h-7 rounded-full bg-green-100 overflow-hidden flex-shrink-0">
                {listing.farmer.avatar_url
                  ? <img src={listing.farmer.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="flex items-center justify-center h-full text-xs">🌾</span>}
              </div>
              <span className="text-xs text-gray-500 group-hover/farmer:text-green-700">
                {listing.farmer.full_name ?? 'Farmer'}
              </span>
            </Link>
          )}
          <span className="text-xs text-gray-400">Total ₦{totalValue}</span>
        </div>
        {showActions && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
            {listing.status === 'available' && (
              <button onClick={onMarkSold}
                className="flex-1 text-xs font-medium py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                Mark as sold
              </button>
            )}
            <button onClick={onDelete}
              className="flex-1 text-xs font-medium py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}