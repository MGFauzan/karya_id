'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getUser, isLoggedIn } from '@/lib/auth'

const JOB_TYPES  = ['FULL_TIME','PART_TIME','CONTRACT','FREELANCE','APPRENTICESHIP','INTERNSHIP']
const SEGMENTS   = ['SMK','TKI','PETANI','DIFABEL','UMUM']
const SEG_LABEL  = { SMK:'🎓 SMK', TKI:'✈️ TKI', PETANI:'🌱 Petani', DIFABEL:'🤝 Difabel', UMUM:'👤 Umum' }
const TYPE_LABEL = { FULL_TIME:'Full Time', PART_TIME:'Part Time', CONTRACT:'Kontrak', FREELANCE:'Freelance', APPRENTICESHIP:'Magang', INTERNSHIP:'Internship' }

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)
  const [applyModal, setApplyModal] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [toast, setToast]     = useState(null)
  const [filters, setFilters] = useState({
    search: '', segment: '', type: '', remote: '', city: '', page: 1,
  })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.search)  params.search  = filters.search
      if (filters.segment) params.segment = filters.segment
      if (filters.type)    params.type    = filters.type
      if (filters.remote)  params.remote  = filters.remote
      if (filters.city)    params.city    = filters.city
      params.page = filters.page
      params.limit = 12

      const res = await api.jobs.list(params)
      setJobs(res.jobs || [])
      setTotal(res.total || 0)
    } catch { setJobs([]) }
    setLoading(false)
  }, [filters])

  useEffect(() => { loadJobs() }, [loadJobs])

  const handleApply = async () => {
    if (!isLoggedIn()) { router.push('/auth/login'); return }
    setApplying(applyModal.id)
    try {
      await api.jobs.apply(applyModal.id, { coverLetter })
      showToast('✅ Lamaran berhasil dikirim!')
      setApplyModal(null)
      setCoverLetter('')
    } catch (err) {
      showToast(err.message || 'Gagal melamar', 'error')
    }
    setApplying(null)
  }

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium animate-slide-up
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Apply Modal */}
      {applyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Lamar Pekerjaan</h3>
            <p className="text-sm text-gray-500 mb-4">{applyModal.title} — {applyModal.company?.name}</p>
            <textarea
              rows={4} placeholder="Tulis cover letter singkat (opsional)..."
              className="input-field resize-none text-sm"
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setApplyModal(null)} className="btn-secondary flex-1">Batal</button>
              <button onClick={handleApply} disabled={!!applying} className="btn-primary flex-1">
                {applying ? '⏳ Mengirim...' : '📤 Kirim Lamaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">K</div>
            <span className="font-bold text-gray-900 hidden sm:block">KARYA.ID</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn()
              ? <button onClick={() => router.push('/dashboard')} className="btn-primary text-sm">Dashboard</button>
              : <><button onClick={() => router.push('/auth/login')} className="btn-secondary text-sm">Masuk</button>
                  <button onClick={() => router.push('/auth/register')} className="btn-primary text-sm">Daftar</button></>
            }
          </div>
        </div>
      </nav>

      {/* Hero Search */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Temukan Kerja yang Tepat</h1>
          <p className="text-indigo-200 text-sm mb-6">Ribuan lowongan inklusif menunggu Anda</p>
          <div className="flex gap-2">
            <input
              type="text" placeholder="🔍 Cari posisi, skill, perusahaan..."
              className="flex-1 px-4 py-3 rounded-xl border-0 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
            <button onClick={loadJobs} className="bg-white text-indigo-600 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shrink-0">
              Cari
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="w-56 shrink-0 hidden lg:block">
            <div className="card p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Filter Lowongan</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">Segmen</label>
                  <div className="space-y-1.5">
                    <button onClick={() => setFilter('segment', '')}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
                        ${!filters.segment ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                      Semua Segmen
                    </button>
                    {SEGMENTS.map(s => (
                      <button key={s} onClick={() => setFilter('segment', s)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
                          ${filters.segment === s ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                        {SEG_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">Tipe Kerja</label>
                  <div className="space-y-1.5">
                    <button onClick={() => setFilter('type', '')}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
                        ${!filters.type ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                      Semua Tipe
                    </button>
                    {JOB_TYPES.map(t => (
                      <button key={t} onClick={() => setFilter('type', t)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
                          ${filters.type === t ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                        {TYPE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">Lokasi</label>
                  <button onClick={() => setFilter('remote', filters.remote ? '' : 'true')}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
                      ${filters.remote ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    🏠 Remote / WFH
                  </button>
                </div>

                {(filters.segment || filters.type || filters.remote) && (
                  <button onClick={() => setFilters({ search: '', segment: '', type: '', remote: '', city: '', page: 1 })}
                    className="w-full text-xs text-red-500 hover:text-red-700 font-medium mt-2">
                    ✕ Hapus semua filter
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Job List */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading ? 'Memuat...' : `${total} lowongan ditemukan`}
              </p>
              {/* Mobile filters */}
              <div className="flex gap-2 lg:hidden">
                <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                  value={filters.segment} onChange={e => setFilter('segment', e.target.value)}>
                  <option value="">Semua Segmen</option>
                  {SEGMENTS.map(s => <option key={s} value={s}>{SEG_LABEL[s]}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {jobs.map(job => (
                  <JobCard key={job.id} job={job}
                    onApply={() => { setApplyModal(job); setCoverLetter('') }}
                    onView={() => router.push(`/jobs/${job.id}`)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 card">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada lowongan ditemukan</h3>
                <p className="text-gray-500 text-sm">Coba ubah filter atau kata kunci pencarian</p>
              </div>
            )}

            {/* Pagination */}
            {total > 12 && (
              <div className="flex justify-center gap-2 mt-8">
                <button disabled={filters.page <= 1}
                  onClick={() => setFilter('page', filters.page - 1)}
                  className="btn-secondary text-sm px-4 disabled:opacity-40">← Prev</button>
                <span className="px-4 py-2 text-sm text-gray-600 bg-white rounded-xl border border-gray-200">
                  {filters.page}
                </span>
                <button disabled={jobs.length < 12}
                  onClick={() => setFilter('page', filters.page + 1)}
                  className="btn-secondary text-sm px-4 disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function JobCard({ job, onApply, onView }) {
  const segs = job.preferredSegments || []
  return (
    <div className="card p-5 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 leading-tight truncate">{job.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{job.company?.name}</p>
        </div>
        {job.company?.isInclusiveEmployer && (
          <span title="Perusahaan Inklusif" className="text-lg shrink-0">🏆</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.isRemote && <span className="badge bg-green-100 text-green-700">🏠 Remote</span>}
        {job.openForDifabel && <span className="badge bg-orange-100 text-orange-700">♿ Difabel</span>}
        <span className="badge bg-gray-100 text-gray-600">{TYPE_LABEL[job.type] || job.type}</span>
        {segs.slice(0, 2).map(s => (
          <span key={s} className={`badge badge-${s.toLowerCase()}`}>{SEG_LABEL[s]}</span>
        ))}
      </div>

      <div className="text-xs text-gray-500 space-y-1 mb-3 flex-1">
        <p>📍 {job.city || 'Indonesia'}{job.province ? `, ${job.province}` : ''}</p>
        {job.salaryMin && (
          <p>💰 Rp {(job.salaryMin / 1e6).toFixed(1)}jt – {(job.salaryMax / 1e6).toFixed(1)}jt/bulan</p>
        )}
        <p>🎓 Min. {job.educationMin || 'Semua'} • {job.experienceMin === 0 ? 'Fresh Graduate' : `${job.experienceMin}+ tahun`}</p>
      </div>

      <div className="flex gap-2 mt-auto">
        <button onClick={onView} className="btn-secondary text-xs px-3 py-1.5 flex-1">Detail</button>
        <button onClick={onApply} className="btn-primary text-xs px-3 py-1.5 flex-1">Lamar</button>
      </div>
    </div>
  )
}
