'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getUser } from '@/lib/auth'

export default function RecommendationsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push('/auth/login'); return }
    setUser(u)
    if (u.segment === 'SMK') loadSMKBridge()
    else loadRecs()
  }, [])

  const loadRecs = async () => {
    setLoading(true)
    try {
      const res = await api.recommendations.get(10, true)
      setData({ type: 'general', recs: res.recommendations || [] })
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const loadSMKBridge = async () => {
    setLoading(true)
    try {
      const res = await api.recommendations.smkBridge()
      setData({ type: 'smk', ...res })
    } catch (err) {
      // Fallback to general
      setError(err.message)
      await loadRecs()
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">🤖 AI sedang memproses profil Anda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            ← Dashboard
          </button>
          <h1 className="font-bold text-gray-900">
            {user?.segment === 'SMK' ? '🎓 SMK Bridge' : '🎯 Rekomendasi AI'}
          </h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* SMK Bridge View */}
        {data?.type === 'smk' && (
          <div className="space-y-6 animate-fade-in">
            <div className="card p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h2 className="text-xl font-bold mb-1">🎓 SMK Bridge Dashboard</h2>
              <p className="text-blue-200 text-sm">Jurusan: {data.jurusan || 'Belum diisi'}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold">{data.summary?.totalNearbyJobs || 0}</div>
                  <div className="text-blue-200 text-xs">Lowongan Lokal</div>
                </div>
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold">{Math.round((data.summary?.topMatchScore || 0) * 100)}%</div>
                  <div className="text-blue-200 text-xs">Skor Tertinggi</div>
                </div>
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold">{data.summary?.skillsToLearn || 0}</div>
                  <div className="text-blue-200 text-xs">Skill Gap</div>
                </div>
              </div>
            </div>

            {/* Skill Gap */}
            {data.skillGap && (
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">🔍 Analisis Skill Gap</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-2">✅ Skill yang sudah dimiliki ({data.skillGap.currentSkills?.length || 0})</p>
                    <div className="flex flex-wrap gap-2">
                      {(data.skillGap.currentSkills || []).map(s => (
                        <span key={s} className="badge bg-green-100 text-green-700">{s}</span>
                      ))}
                      {!data.skillGap.currentSkills?.length && <p className="text-xs text-gray-400">Belum ada skill terdaftar</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-2">⚠️ Skill yang perlu dipelajari ({data.skillGap.missingSkills?.length || 0})</p>
                    <div className="flex flex-wrap gap-2">
                      {(data.skillGap.prioritySkills || []).map(s => (
                        <span key={s} className="badge bg-red-100 text-red-700">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Training recs */}
                {data.trainingRecommendations?.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <p className="text-sm font-bold text-gray-900 mb-3">📚 Rekomendasi Pelatihan</p>
                    <div className="space-y-2">
                      {data.trainingRecommendations.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.title}</p>
                            <p className="text-xs text-gray-500">{t.provider} • {t.duration}</p>
                            <div className="flex gap-1 mt-1">
                              {t.coveredMissingSkills?.map(s => (
                                <span key={s} className="badge bg-white text-blue-700 text-xs">{s}</span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <span className={`badge ${t.isFree ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {t.isFree ? 'GRATIS' : 'Berbayar'}
                            </span>
                            {t.url && (
                              <a href={t.url} target="_blank" rel="noreferrer"
                                className="block text-xs text-indigo-600 hover:underline mt-1">
                                Daftar →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Job Recs */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">💼 Lowongan Lokal (radius 50km)</h3>
              <div className="space-y-3">
                {(data.jobRecommendations || []).map((rec, i) => (
                  <RecItem key={rec.job?.id || i} rec={rec} rank={i + 1} />
                ))}
                {!data.jobRecommendations?.length && (
                  <div className="card p-8 text-center text-gray-400">Tidak ada lowongan lokal ditemukan</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* General Recs View */}
        {data?.type === 'general' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">🎯 Rekomendasi Kerja AI</h2>
              <p className="text-gray-500 text-sm mt-1">Hasil analisis multi-faktor profil Anda</p>
            </div>
            <div className="space-y-3">
              {(data.recs || []).map((rec, i) => (
                <RecItem key={rec.id} rec={rec} rank={i + 1} />
              ))}
              {!data.recs?.length && (
                <div className="card p-12 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-gray-500">Tidak ada rekomendasi. Coba lengkapi profil Anda.</p>
                  <button onClick={() => router.push('/profile')} className="mt-4 btn-primary text-sm">
                    Lengkapi Profil
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RecItem({ rec, rank }) {
  const [open, setOpen] = useState(false)
  const job = rec.job
  const score = Math.round((rec.totalScore || 0) * 100)
  const grade = rec.grade || 'C'
  const gradeColors = {
    A: 'border-green-400 bg-green-50 text-green-700',
    B: 'border-lime-400 bg-lime-50 text-lime-700',
    C: 'border-amber-400 bg-amber-50 text-amber-700',
    D: 'border-orange-400 bg-orange-50 text-orange-700',
    F: 'border-red-400 bg-red-50 text-red-700',
  }

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <span className="text-xl font-black text-gray-200 w-7 text-center shrink-0 mt-0.5">#{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h4 className="font-bold text-gray-900">{job?.title}</h4>
              <p className="text-sm text-gray-500 mt-0.5">{job?.company?.name} • {job?.city || job?.company?.city}</p>
            </div>
            <div className={`border-2 rounded-xl px-3 py-1.5 text-center min-w-[70px] ${gradeColors[grade]}`}>
              <div className="font-black text-lg">{grade}</div>
              <div className="text-xs font-medium">{score}%</div>
            </div>
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            {job?.isRemote && <span className="badge bg-green-100 text-green-700">🏠 Remote</span>}
            {job?.openForDifabel && <span className="badge bg-orange-100 text-orange-700">♿</span>}
            {job?.salaryMin && (
              <span className="badge bg-blue-100 text-blue-700">
                💰 Rp{(job.salaryMin/1e6).toFixed(0)}-{(job.salaryMax/1e6).toFixed(0)}jt
              </span>
            )}
          </div>

          <button onClick={() => setOpen(o => !o)}
            className="text-xs text-indigo-600 font-medium mt-2 hover:underline">
            {open ? '▼ Sembunyikan penjelasan AI' : '▶ Lihat penjelasan AI'}
          </button>
          {open && (
            <ul className="mt-2 space-y-1">
              {(rec.reasons || []).map((r, i) => (
                <li key={i} className="text-xs text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">{r}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
