'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const DEMO = [
    { label: '🎓 SMK Demo',     email: 'budi.smk@gmail.com',    password: 'user123', color: 'blue' },
    { label: '✈️ TKI Demo',     email: 'sari.tki@gmail.com',    password: 'user123', color: 'purple' },
    { label: '🌱 Petani Demo',  email: 'petani.andi@gmail.com', password: 'user123', color: 'green' },
    { label: '🤝 Difabel Demo', email: 'difabel.rini@gmail.com',password: 'user123', color: 'orange' },
    { label: '🏢 Company Demo', email: 'hr@tokopedia.id',        password: 'company123', color: 'gray' },
    { label: '⚙️ Admin Demo',   email: 'admin@karya.id',         password: 'admin123', color: 'red' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.login(form)
      saveAuth(res.token, res.user)
      const role = res.user.role
      if (role === 'ADMIN')   router.push('/admin')
      else if (role === 'COMPANY') router.push('/company')
      else router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (email, password) => setForm({ email, password })

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">K</div>
            <span className="text-2xl font-bold text-gray-900">KARYA.ID</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Selamat Datang Kembali</h1>
          <p className="text-gray-500 mt-1">Masuk ke akun KARYA.ID Anda</p>
        </div>

        {/* Card */}
        <div className="card p-8 animate-slide-up">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" required
                placeholder="nama@email.com"
                className="input-field"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" required
                placeholder="••••••••"
                className="input-field"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? '⏳ Sedang masuk...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-3 font-medium">🎭 Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map(d => (
                <button key={d.email}
                  onClick={() => quickLogin(d.email, d.password)}
                  className="text-xs px-3 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 transition-all"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Belum punya akun?{' '}
            <button onClick={() => router.push('/auth/register')} className="text-indigo-600 font-semibold hover:underline">
              Daftar gratis
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2025 KARYA.ID — Platform Kerja Inklusif
        </p>
      </div>
    </div>
  )
}
