// src/pages/listings/CreateListing.tsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '@/store/AuthContext'
import { createListing, uploadListingPhotos } from '@/hooks/useListings'

const CROPS = [
  'Maize','Rice','Cassava','Yam','Tomatoes','Pepper','Onions',
  'Groundnuts','Sesame','Cashew','Shea','Ginger','Cocoa',
  'Plantain','Soybean','Sorghum','Other'
]

const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa',
  'Benue','Borno','Cross River','Delta','Ebonyi','Edo',
  'Ekiti','Enugu','FCT','Gombe','Imo','Jigawa',
  'Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara',
  'Lagos','Nasarawa','Niger','Ogun','Ondo','Osun',
  'Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'
]

export default function CreateListing() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [form, setForm] = useState({
    crop: '', customCrop: '', quantity_kg: '', price_per_kg: '',
    location: '', state: '', description: ''
  })

  const total = form.quantity_kg && form.price_per_kg
    ? (parseFloat(form.quantity_kg) * parseFloat(form.price_per_kg)).toLocaleString('en-NG')
    : null

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 5 - photos.length
    const toAdd = files.slice(0, remaining)
    if (files.length > remaining) toast.error('Max 5 photos per listing')
    setPhotos(p => [...p, ...toAdd])
    setPreviews(p => [...p, ...toAdd.map(f => URL.createObjectURL(f))])
  }

  function removePhoto(i: number) {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!form.crop) { toast.error('Select a crop type'); return }
    if (!form.state) { toast.error('Select your state'); return }
    setSaving(true)
    try {
      const photoUrls = photos.length ? await uploadListingPhotos(user.id, photos) : []
      const crop = form.crop === 'Other' ? form.customCrop : form.crop
      await createListing({
        farmer_id:    user.id,
        crop,
        quantity_kg:  parseFloat(form.quantity_kg),
        price_per_kg: parseFloat(form.price_per_kg),
        location:     form.location,
        state:        form.state,
        description:  form.description,
        photos:       photoUrls,
      })
      toast.success('Listing published!')
      navigate('/listings/mine')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish listing')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">List Your Produce</h1>
      <p className="text-gray-500 text-sm mb-8">Buyers across Nigeria will see your listing instantly.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Photos <span className="text-gray-400 font-normal text-sm">(up to 5)</span></h2>
          <div className="flex gap-3 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
              </div>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-green-600 transition-colors">
                <span className="text-2xl">+</span>
                <span className="text-xs">Add photo</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Produce Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
            <div className="flex flex-wrap gap-2">
              {CROPS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, crop: c }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.crop === c
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                  }`}>{c}</button>
              ))}
            </div>
            {form.crop === 'Other' && (
              <input type="text" placeholder="Enter crop name" value={form.customCrop}
                onChange={e => setForm(f => ({ ...f, customCrop: e.target.value }))} required
                className="mt-3 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'quantity_kg', label: 'Quantity (kg)', placeholder: 'e.g. 500' },
              { key: 'price_per_kg', label: 'Price per kg (₦)', placeholder: 'e.g. 350' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="number" min="1" step="0.01" required placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            ))}
          </div>
          {total && (
            <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-800">
              Total listing value: <span className="font-bold">₦{total}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LGA / Town</label>
              <input type="text" required placeholder="e.g. Ibadan North" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select required value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="">Select state</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea rows={3} placeholder="Harvest date, quality grade, storage conditions..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors">
          {saving ? 'Uploading & publishing…' : 'Publish listing'}
        </button>
      </form>
    </div>
  )
}