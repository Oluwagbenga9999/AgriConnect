// src/pages/auth/Register.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '@/store/AuthContext'
import { Role } from '@/types'

export default function Register() {
  const { signUp } = useAuthContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role>('farmer')
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirm: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match'); return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters'); return
    }
    setLoading(true)
    try {
      await signUp({ ...form, role, fullName: form.fullName, phone: form.phone })
      toast.success('Account created! Check your email to verify.')
      navigate('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="text-3xl mb-1">🌱</div>
          <h1 className="text-2xl font-bold text-gray-900">Join AgriConnect</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['farmer', 'buyer'] as Role[]).map((r) => (
            <button key={r} onClick={() => setRole(r)} type="button"
              className={`py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                role === r
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {r === 'farmer' ? '🌾 I am a Farmer' : '🏪 I am a Buyer'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Emeka Obi' },
            { name: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com' },
            { name: 'phone', label: 'Phone number', type: 'tel', placeholder: '080xxxxxxxx' },
            { name: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters' },
            { name: 'confirm', label: 'Confirm password', type: 'password', placeholder: 'Repeat password' },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} placeholder={placeholder} required value={form[name as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
