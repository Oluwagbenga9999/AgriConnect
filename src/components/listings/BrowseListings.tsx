// src/pages/listings/BrowseListings.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useListings } from '@/hooks/useListings'
import ListingCard from '@/components/listings/ListingCard'
import { useAuthContext } from '@/store/AuthContext'

const CROP_FILTERS = [
  'All','Maize','Rice','Cassava','Yam','Tomatoes',
  'Pepper','Onions','Groundnuts','Sesame','Cashew','Ginger'
]

const STATES = ['All States','Lagos','Kano','Oyo','Kaduna','Rivers',
  'Ogun','Borno','Anambra','Enugu','Niger','Benue','Plateau','FCT']

export default function BrowseListings() {
  const { isFarmer } = useAuthContext()
  const [search, setSearch] = useState('')
  const [cropFilter, setCropFilter] = useState('All')
  const [stateFilter, setStateFilter] = useState('All States')

  const { listings, loading, error } = useListings({
    crop:   cropFilter !== 'All' ? cropFilter : undefined,
    state:  stateFilter !== 'All States' ? stateFilter : undefined,
    search: search || undefined,
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fresh Produce</h1>
          <p className="text-gray-500 text-sm mt-0.5">{listings.length} listing{listings.length !== 1 ? 's' : ''} available</p>
        </div>
        {isFarmer && (
          <Link to="/listings/create"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            + List produce
          </Link>
        )}
      </div>
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input type="text" placeholder="Search by crop name…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CROP_FILTERS.map(c => (
          <button key={c} onClick={() => setCropFilter(c)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              cropFilter === c
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'
            }`}>{c}</button>
        ))}
      </div>
      <div className="mb-6">
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
          {STATES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">⚠️</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Unable to load listings</h3>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🌱</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No listings found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map(listing => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      )}
    </div>
  )
}