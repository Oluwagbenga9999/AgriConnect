// src/pages/profile/PublicProfile.tsx
import { useParams, Link } from 'react-router-dom'
import { useAuthContext } from '@/store/AuthContext'
import { usePublicProfile } from '@/hooks/useProfile'

export default function PublicProfile() {
  // In PublicProfile.tsx — update the first lines of the component body
  const { id } = useParams<{ id: string }>()

// If no :id in the URL, fall back to the logged-in user's own ID
  const { user } = useAuthContext()
  // const resolvedId = id ?? user?.id
  // const { profile, loading, error } = usePublicProfile(resolvedId)
  // const isOwnProfile = user?.id === resolvedId
  const resolvedId = id ?? user?.id
  const { profile, loading, error } = usePublicProfile(resolvedId)
  const isOwnProfile = user?.id === resolvedId

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !profile) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-4">🔍</p>
      <h2 className="text-xl font-semibold text-gray-900">Profile not found</h2>
      <Link to="/" className="text-green-600 text-sm mt-2 inline-block hover:underline">Back to home</Link>
    </div>
  )

  const isFarmer = profile.role === 'farmer'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-gray-200">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name ?? 'User'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                {isFarmer ? '🌾' : '🏪'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{profile.full_name ?? 'AgriConnect User'}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isFarmer ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>{isFarmer ? '🌾 Farmer' : '🏪 Buyer'}</span>
            </div>
            {(profile.location || profile.state) && (
              <p className="text-sm text-gray-500 mt-1">
                📍 {[profile.location, profile.state].filter(Boolean).join(', ')}
              </p>
            )}
            {profile.bio && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{profile.bio}</p>
            )}
            <div className="flex gap-3 mt-4">
              {isOwnProfile ? (
                <Link to="/profile/edit"
                  className="text-sm font-medium text-green-600 border border-green-200 rounded-lg px-4 py-2 hover:bg-green-50">
                  Edit profile
                </Link>
              ) : (
                <Link to={`/messages/${resolvedId}`}
                  className="text-sm font-medium text-white bg-green-600 rounded-lg px-4 py-2 hover:bg-green-700">
                  💬 Send message
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {isFarmer && profile.crop_types?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Crops Grown</h2>
          <div className="flex flex-wrap gap-2">
            {profile.crop_types.map(crop => (
              <span key={crop} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                {crop}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}