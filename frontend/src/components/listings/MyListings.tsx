// src/pages/listings/MyListings.tsx
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '@/store/AuthContext'
import { useMyListings, updateListingStatus, deleteListing } from '@/hooks/useListings'
import ListingCard from '@/components/listings/ListingCard'

export default function MyListings() {
  const { user } = useAuthContext()
  const { listings, loading, refetch } = useMyListings(user?.id)

  async function handleMarkSold(id: string) {
    try {
      await updateListingStatus(id, 'sold')
      toast.success('Marked as sold')
      refetch()
    } catch { toast.error('Failed to update listing') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    try {
      await deleteListing(id)
      toast.success('Listing deleted')
      refetch()
    } catch { toast.error('Failed to delete listing') }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-500 text-sm mt-0.5">{listings.length} listing{listings.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/listings/create"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          + New listing
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🌾</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No listings yet</h3>
          <p className="text-gray-500 text-sm mb-6">Post your first listing and start connecting with buyers.</p>
          <Link to="/listings/create"
            className="inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors">
            Post your first listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} showActions
              onMarkSold={() => handleMarkSold(listing.id)}
              onDelete={() => handleDelete(listing.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}