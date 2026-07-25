// src/pages/profile/EditProfile.tsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '@/store/AuthContext'
import { updateProfile, uploadAvatar } from '@/hooks/useProfile'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa',
  'Benue','Borno','Cross River','Delta','Ebonyi','Edo',
  'Ekiti','Enugu','FCT','Gombe','Imo','Jigawa',
  'Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara',
  'Lagos','Nasarawa','Niger','Ogun','Ondo','Osun',
  'Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'
]

const COMMON_CROPS = [
  'Maize','Rice','Cassava','Yam','Tomatoes','Pepper',
  'Onions','Groundnuts','Sesame','Cashew','Shea',
  'Ginger','Cocoa','Plantain','Soybean','Sorghum'
]

export default function EditProfile() {
  const { user, profile, isFarmer } = useAuthContext()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [selectedCrops, setSelectedCrops] = useState<string[]>(profile?.crop_types ?? [])
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone:     profile?.phone ?? '',
    state:     profile?.state ?? '',
    location:  profile?.location ?? '',
    bio:       profile?.bio ?? '',
  })

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function toggleCrop(crop: string) {
    setSelectedCrops(prev =>
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      let avatar_url = profile?.avatar_url ?? null
      if (avatarFile) avatar_url = await uploadAvatar(user.id, avatarFile)
      await updateProfile(user.id, {
        ...form,
        avatar_url,
        ...(isFarmer && { crop_types: selectedCrops }),
      })
      toast.success('Profile updated!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-gray-200">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
              )}
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-sm font-medium text-green-600 hover:text-green-700 border border-green-200 rounded-lg px-4 py-2">
                Upload photo
              </button>
              <p className="text-xs text-gray-400 mt-1.5">JPG or PNG, max 2MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png"
              className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          {[
            { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Emeka Obi' },
            { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '080xxxxxxxx' },
            { key: 'location', label: 'LGA / Town', type: 'text', placeholder: 'e.g. Ibadan North' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
              <option value="">Select state</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isFarmer ? 'About your farm' : 'About your business'}
            </label>
            <textarea rows={3} value={form.bio}
              placeholder={isFarmer ? 'Tell buyers about your farm...' : 'Tell farmers what you buy...'}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
        </div>
        {isFarmer && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Crops You Grow</h2>
            <p className="text-xs text-gray-400 mb-4">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_CROPS.map(crop => (
                <button key={crop} type="button" onClick={() => toggleCrop(crop)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedCrops.includes(crop)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                  }`}>{crop}</button>
              ))}
            </div>
          </div>
        )}
        <button type="submit" disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}