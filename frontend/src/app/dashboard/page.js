'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getUser, clearAuth, SEGMENT_LABEL } from '@/lib/auth'

const SEGMENT_BG = {
  SMK: 'from-blue-500 to-indigo-600', TKI: 'from-purple-500 to-violet-600',
  PETANI: 'from-green-500 to-emerald-600', DIFABEL: 'from-orange-500 to-amber-600', UMUM: 'from-gray-500 to-slate-600',
}
const GRADE_CLASS = { A: 'score-a', B: 'score-b', C: 'score-c', D: 'score-d', F: 'score-f' }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]   = useState(null)
  const [profile, setProfile] = useState(null)
  const [recs, setRecs]   = useState([])
  const [stats, setStats] = useState(null)
  const [apps, setApps]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [recLoading, setRecLoading] = useState(false)
  const [activeTab, setActiveTab]   = useState('overview')

  const loadData = useCallback(async () => {
    const u = getUser()
    if (!u) { router.push('/auth/login'); return }
    setUser(u)
    setLoading(true)

    try {
      const [profileRes, statsRes, appsRes] = await Promise.allSettled([
        api.users.getProfile(),
        api.users.getStats(),
        api.users.getApplications(),
      ])
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.profile)
      if (statsRes.status === 'fulfilled')   setStats(statsRes.value.stats)
      if (appsRes.status === 'fulfilled')    setApps(appsRes.value.applications || [])
    } catch {}

    // Load recommendations
    setRecLoading(true)
    try {
      const recRes = await api.recommendations.get(6)
      setRecs(recRes.recommendations || [])
    } catch {}
    setRecLoading(false)
    setLoading(false)
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  const refreshRecs = async () => {
    setRecLoading(true)
    try {
      const res = await api.recommendations.get(6, true)
      setRecs(res.recommendations || [])
    } catch {}
    setRecLoading(false)
  }

  const logout = () => { clearAuth(); router.push('/') }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const seg = user?.segment || 'UMUM'
  const profileComplete = profile?.skills?.length > 0 && profile?.city

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">K</div>
              <span className="font-bold text-gray-900 hidden sm:block">KARYA.ID</span>
            </div>
            <div className="flex gap-1">
              {['overview', 'rekomendasi', 'lamaran'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors
                    ${activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {tab === 'overview' ? '🏠 Overview' : tab === 'rekomendasi' ? '🎯 Rekomendasi AI' : '📋 Lamaran'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/jobs')} className="text-sm text-gray-600 hover:text-indigo-600 font-medium hidden sm:block">Cari Kerja</button>
            <button onClick={() => router.push('/profile')} className="btn-secondary text-sm px-3 py-1.5">Profil</button>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-700 font-medium">Keluar</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Welcome Banner */}
        <div className={`rounded-2xl bg-gradient-to-r ${SEGMENT_BG[seg]} p-6 mb-8 text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 text-[120px] leading-none opacity-10 select-none">
            {seg === 'SMK' ? '🎓' : seg === 'TKI' ? '✈️' : seg === 'PETANI' ? '🌱' : seg === 'DIFABEL' ? '🤝' : '👤'}
          </div>
          <div className="relative">
            <p className="text-white/70 text-sm font-medium mb-1">{SEGMENT_LABEL[seg]}</p>
            <h1 className="text-2xl font-bold mb-2">Selamat datang, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-white/80 text-sm max-w-xl">
              {profileComplete
                ? 'AI KARYA.ID siap membantu Anda menemukan pekerjaan yang paling cocok.'
                : 'Lengkapi profil Anda untuk mendapatkan rekomendasi kerja yang akurat dari AI kami.'}
            </p>
            {!profileComplete && (
              <button onClick={() => router.push('/profile')}
                className="mt-4 bg-white text-indigo-600 font-semibold text-sm px-5 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
                Lengkapi Profil →
              </button>
            )}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Lamaran Aktif',      value: stats?.totalApplications || apps.length, icon: '📋', color: 'indigo' },
                { label: 'Rekomendasi AI',     value: recs.length,                              icon: '🎯', color: 'purple' },
                { label: 'Profil Lengkap',     value: profileComplete ? '✅' : '⚠️',            icon: '👤', color: 'green' },
                { label: 'Skill Terdaftar',    value: profile?.skills?.length || 0,             icon: '🛠️', color: 'amber' },
              ].map(card => (
                <div key={card.label} className="card p-5">
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Top Recommendations Preview */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">🤖 Top 3 Rekomendasi AI</h2>
                <button onClick={() => setActiveTab('rekomendasi')} className="text-sm text-indigo-600 font-medium hover:underline">
                  Lihat semua →
                </button>
              </div>
              {recLoading ? (
                <div className="text-center py-8 text-gray-400">🔄 AI sedang memproses...</div>
              ) : recs.length > 0 ? (
                <div className="space-y-3">
                  {recs.slice(0, 3).map(rec => (
                    <RecCard key={rec.id} rec={rec} onView={() => router.push(`/jobs?id=${rec.jobId}`)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-gray-500 text-sm">
                    {profileComplete ? 'Tidak ada rekomendasi saat ini' : 'Lengkapi profil untuk mendapatkan rekomendasi'}
                  </p>
                  {!profileComplete && (
                    <button onClick={() => router.push('/profile')} className="mt-3 btn-primary text-sm">
                      Lengkapi Profil
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: '🔍', title: 'Cari Lowongan', desc: 'Temukan 1000+ lowongan inklusif', action: () => router.push('/jobs'), color: 'indigo' },
                { icon: '👤', title: 'Update Profil', desc: 'Tingkatkan akurasi AI matching', action: () => router.push('/profile'), color: 'purple' },
                { icon: '🎓', title: 'SMK Bridge', desc: 'Cek lowongan lokal & skill gap', action: () => router.push('/recommendations'), color: 'green', hide: seg !== 'SMK' },
              ].filter(a => !a.hide).map(action => (
                <button key={action.title} onClick={action.action}
                  className="card p-5 text-left hover:shadow-md transition-shadow group">
                  <div className="text-3xl mb-3">{action.icon}</div>
                  <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{action.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{action.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* REKOMENDASI TAB */}
        {activeTab === 'rekomendasi' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">🎯 Rekomendasi Kerja AI</h2>
                <p className="text-sm text-gray-500 mt-1">Diurutkan berdasarkan kesesuaian profil Anda</p>
              </div>
              <button onClick={refreshRecs} disabled={recLoading}
                className="btn-secondary text-sm gap-2 disabled:opacity-50">
                {recLoading ? '⏳' : '🔄'} Refresh
              </button>
            </div>
            {!profileComplete && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Profil belum lengkap</p>
                  <p className="text-amber-600 text-xs mt-0.5">Tambahkan skill dan lokasi untuk hasil matching yang lebih akurat</p>
                  <button onClick={() => router.push('/profile')} className="mt-2 text-xs text-amber-700 font-semibold underline">Lengkapi sekarang →</button>
                </div>
              </div>
            )}
            {recLoading ? (
              <div className="text-center py-16 text-gray-400">
                <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                🤖 AI sedang menganalisis profil Anda...
              </div>
            ) : recs.length > 0 ? (
              <div className="space-y-4">
                {recs.map((rec, i) => (
                  <RecCardFull key={rec.id} rec={rec} rank={i + 1}
                    onApply={() => router.push(`/jobs`)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 card">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada rekomendasi</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Pastikan profil lengkap dengan skill dan lokasi, kemudian klik Refresh.
                </p>
              </div>
            )}
          </div>
        )}

        {/* LAMARAN TAB */}
        {activeTab === 'lamaran' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">📋 Riwayat Lamaran</h2>
              <button onClick={() => router.push('/jobs')} className="btn-primary text-sm">+ Lamar Baru</button>
            </div>
            {apps.length > 0 ? (
              <div className="space-y-3">
                {apps.map(app => (
                  <div key={app.id} className="card p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{app.job?.title}</p>
                      <p className="text-sm text-gray-500">{app.job?.company?.name} • {app.job?.city}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(app.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    <span className={`badge ${
                      app.status === 'HIRED'       ? 'bg-green-100 text-green-700'   :
                      app.status === 'INTERVIEW'   ? 'bg-blue-100 text-blue-700'     :
                      app.status === 'SHORTLISTED' ? 'bg-purple-100 text-purple-700' :
                      app.status === 'REJECTED'    ? 'bg-red-100 text-red-700'       :
                      app.status === 'REVIEWED'    ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 card">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada lamaran</h3>
                <button onClick={() => router.push('/jobs')} className="mt-4 btn-primary text-sm">Cari Lowongan Sekarang</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RecCard({ rec, onView }) {
  const job = rec.job
  const score = Math.round(rec.totalScore * 100)
  const grade = rec.grade || 'C'
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer" onClick={onView}>
      <div className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center font-bold
        ${grade === 'A' ? 'border-green-400 bg-green-50 text-green-700' :
          grade === 'B' ? 'border-lime-400 bg-lime-50 text-lime-700' :
          grade === 'C' ? 'border-amber-400 bg-amber-50 text-amber-700' :
          'border-red-400 bg-red-50 text-red-700'}`}>
        <span className="text-xs">{score}%</span>
        <span className="text-xs">{grade}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{job?.title}</p>
        <p className="text-sm text-gray-500 truncate">{job?.company?.name} • {job?.company?.city}</p>
      </div>
      {job?.isRemote && <span className="badge bg-green-100 text-green-700 text-xs">Remote</span>}
    </div>
  )
}

function RecCardFull({ rec, rank, onApply }) {
  const job   = rec.job
  const score = Math.round(rec.totalScore * 100)
  const grade = rec.grade || 'C'
  const [open, setOpen] = useState(false)

  return (
    <div className="card p-6">
      <div className="flex items-start gap-4">
        <div className="text-2xl font-black text-gray-200 w-8 text-right shrink-0">#{rank}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{job?.title}</h3>
              <p className="text-gray-600 text-sm mt-0.5">{job?.company?.name} • {job?.city || job?.company?.city}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl border-2 text-center min-w-[80px]
              ${grade === 'A' ? 'border-green-400 bg-green-50 text-green-700' :
                grade === 'B' ? 'border-lime-400 bg-lime-50 text-lime-700' :
                grade === 'C' ? 'border-amber-400 bg-amber-50 text-amber-700' :
                'border-red-400 bg-red-50 text-red-700'}`}>
              <div className="text-xl font-black">{grade}</div>
              <div className="text-xs font-medium">{score}% cocok</div>
            </div>
          </div>

          {/* Score bars */}
          <div className="mt-4 grid grid-cols-5 gap-2 text-center">
            {[
              { label: 'Skill',       val: rec.skillScore,      weight: '40%' },
              { label: 'Lokasi',      val: rec.locationScore,   weight: '20%' },
              { label: 'Pengalaman',  val: rec.experienceScore, weight: '15%' },
              { label: 'Preferensi', val: rec.preferenceScore, weight: '10%' },
              { label: 'Segmen',     val: rec.segmentScore,    weight: '15%' },
            ].map(s => (
              <div key={s.label}>
                <div className="h-1.5 bg-gray-100 rounded-full mb-1">
                  <div className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.round((s.val || 0) * 100)}%` }} />
                </div>
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="text-xs font-bold text-gray-900">{Math.round((s.val || 0) * 100)}%</div>
              </div>
            ))}
          </div>

          {/* Reasons */}
          <button onClick={() => setOpen(o => !o)} className="text-xs text-indigo-600 font-medium mt-3 hover:underline">
            {open ? '▼ Sembunyikan alasan AI' : '▶ Lihat alasan AI'}
          </button>
          {open && rec.reasons?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {rec.reasons.map((r, i) => (
                <li key={i} className="text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">{r}</li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex gap-2 flex-wrap">
            {job?.isRemote && <span className="badge bg-green-100 text-green-700">🏠 Remote</span>}
            {job?.openForDifabel && <span className="badge bg-orange-100 text-orange-700">♿ Ramah Difabel</span>}
            {job?.salaryMin && (
              <span className="badge bg-blue-100 text-blue-700">
                💰 Rp {(job.salaryMin / 1e6).toFixed(1)}–{(job.salaryMax / 1e6).toFixed(1)}jt
              </span>
            )}
            <button onClick={onApply} className="btn-primary text-xs px-3 py-1.5 ml-auto">Lamar →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
