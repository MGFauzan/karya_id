'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

const SEGMENTS = [
  { value: 'SMK',    label: '🎓 Lulusan SMK',              desc: 'Lulusan Sekolah Menengah Kejuruan' },
  { value: 'TKI',    label: '✈️ Pekerja Migran (TKI)',     desc: 'Tenaga Kerja Indonesia di luar negeri' },
  { value: 'PETANI', label: '🌱 Petani Muda',              desc: 'Petani atau pelaku agribisnis' },
  { value: 'DIFABEL',label: '🤝 Penyandang Disabilitas',   desc: 'Tenaga kerja dengan disabilitas' },
  { value: 'UMUM',   label: '👤 Umum',                     desc: 'Pencari kerja umum' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState({ name: '', email: '', password: '', segment: '', role: 'USER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.segment) { setError('Pilih segmen Anda terlebih dahulu'); return }
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.register(form)
      saveAuth(res.token, res.user)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">K</div>
            <span className="text-2xl font-bold text-gray-900">KARYA.ID</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Buat Akun Gratis</h1>
          <p className="text-gray-500 mt-1">Mulai perjalanan karir inklusif Anda</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${step >= s ? 'bg-indigo-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="card p-8 animate-slide-up">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">⚠️ {error}</div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Informasi Dasar</h2>
              <p className="text-sm text-gray-500 mb-6">Isi data diri Anda untuk membuat akun</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                  <input type="text" required placeholder="Nama Lengkap Anda" className="input-field"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" required placeholder="nama@email.com" className="input-field"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input type="password" required placeholder="Min. 8 karakter" className="input-field" minLength={8}
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Daftar Sebagai</label>
                  <select className="input-field" value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="USER">Pencari Kerja</option>
                    <option value="COMPANY">Perusahaan / Perekrut</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (!form.name || !form.email || !form.password) { setError('Lengkapi semua field'); return }
                    setError(''); setStep(2)
                  }}
                  className="btn-primary w-full py-3"
                >
                  Lanjut →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Pilih Segmen Anda</h2>
              <p className="text-sm text-gray-500 mb-6">AI matching akan disesuaikan dengan segmen pilihan Anda</p>
              <div className="space-y-3 mb-6">
                {SEGMENTS.map(seg => (
                  <label key={seg.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${form.segment === seg.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <input type="radio" name="segment" value={seg.value} className="hidden"
                      checked={form.segment === seg.value}
                      onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{seg.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{seg.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${form.segment === seg.value ? 'border-indigo-500' : 'border-gray-300'}`}>
                      {form.segment === seg.value && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
                  ← Kembali
                </button>
                <button type="submit" disabled={loading || !form.segment} className="btn-primary flex-1 py-3">
                  {loading ? '⏳ Mendaftar...' : '✅ Daftar Sekarang'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            Sudah punya akun?{' '}
            <button onClick={() => router.push('/auth/login')} className="text-indigo-600 font-semibold hover:underline">
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
