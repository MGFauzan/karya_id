'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, isLoggedIn, SEGMENT_LABEL } from '@/lib/auth'

const SEGMENTS = [
  { key: 'SMK',    icon: '🎓', title: 'Lulusan SMK',      desc: '1.7 Juta/tahun menunggu pekerjaan yang layak', color: 'blue' },
  { key: 'TKI',    icon: '✈️', title: 'Pekerja Migran',   desc: '4.7 Juta TKI aktif tanpa skill terverifikasi', color: 'purple' },
  { key: 'PETANI', icon: '🌱', title: 'Petani Muda',      desc: '2.1 Juta/tahun membutuhkan jembatan ke agribisnis modern', color: 'green' },
  { key: 'DIFABEL',icon: '🤝', title: 'Penyandang Disabilitas', desc: '12 Juta jiwa produktif yang terabaikan sistem', color: 'orange' },
]

const STATS = [
  { value: '3 Juta+', label: 'Target Pengguna' },
  { value: 'Rp 35T',  label: 'Nilai Ekonomi 5 Tahun' },
  { value: '87%',     label: 'Akurasi AI Matching' },
  { value: '4',       label: 'Segmen Inklusif' },
]

const colorMap = {
  blue:   'from-blue-500 to-indigo-600',
  purple: 'from-purple-500 to-violet-600',
  green:  'from-green-500 to-emerald-600',
  orange: 'from-orange-500 to-amber-600',
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (isLoggedIn()) {
      const u = getUser()
      setUser(u)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">K</div>
            <span className="font-bold text-gray-900 text-lg">KARYA.ID</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:block">Halo, {user.name?.split(' ')[0]}</span>
                <button onClick={() => router.push('/dashboard')} className="btn-primary text-sm px-4 py-2">
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/auth/login')} className="btn-secondary text-sm px-4 py-2">Masuk</button>
                <button onClick={() => router.push('/auth/register')} className="btn-primary text-sm px-4 py-2">Daftar Gratis</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Platform Ekosistem Kerja Inklusif #1 Indonesia
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Setiap Talenta<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Layak Berkarir
            </span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            KARYA.ID menghubungkan lulusan SMK, TKI, Petani Muda, dan Penyandang Disabilitas
            ke lapangan kerja yang layak melalui teknologi <strong>AI Matching</strong> cerdas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/auth/register')}
              className="btn-primary text-base px-8 py-4 text-lg"
            >
              🚀 Mulai Cari Kerja — Gratis
            </button>
            <button
              onClick={() => router.push('/jobs')}
              className="btn-secondary text-base px-8 py-4 text-lg"
            >
              Lihat Lowongan
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-indigo-200 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Segments */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Untuk Semua Kalangan</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              KARYA.ID dirancang khusus untuk kelompok talenta yang selama ini terpinggirkan dari ekosistem kerja formal.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SEGMENTS.map(seg => (
              <div key={seg.key} className="card p-6 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => router.push('/auth/register')}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorMap[seg.color]} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {seg.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{seg.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{seg.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Bagaimana KARYA.ID Bekerja?</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Daftar & Isi Profil', desc: 'Buat akun gratis, pilih segmen, isi skill dan lokasi Anda.', icon: '📝' },
              { step: '02', title: 'AI Analisis Profil',   desc: 'Sistem AI kami menganalisis 5 faktor: skill, lokasi, pengalaman, preferensi, dan segmen.', icon: '🧠' },
              { step: '03', title: 'Dapat Rekomendasi',    desc: 'Terima rekomendasi kerja yang dipersonalisasi beserta penjelasan mengapa cocok.', icon: '🎯' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-indigo-600 tracking-widest mb-2">LANGKAH {item.step}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Siap Memulai Karir Impian Anda?</h2>
          <p className="text-indigo-200 text-lg mb-8">Bergabung dengan ribuan pencari kerja yang sudah menemukan pekerjaan layak lewat KARYA.ID</p>
          <button
            onClick={() => router.push('/auth/register')}
            className="bg-white text-indigo-600 font-bold px-10 py-4 rounded-xl text-lg hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Daftar Sekarang — 100% Gratis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">K</div>
            <span className="text-white font-semibold">KARYA.ID</span>
          </div>
          <p className="text-sm text-center">© 2025 KARYA.ID — Platform Ekosistem Kerja Inklusif Indonesia</p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">Tentang</a>
            <a href="#" className="hover:text-white transition-colors">Kontak</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
