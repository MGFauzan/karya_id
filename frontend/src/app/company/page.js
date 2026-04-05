'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getUser, clearAuth } from '@/lib/auth'

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'APPRENTICESHIP', 'INTERNSHIP']
const TYPE_LABEL = {
  FULL_TIME: 'Full Time', PART_TIME: 'Part Time', CONTRACT: 'Kontrak',
  FREELANCE: 'Freelance', APPRENTICESHIP: 'Magang', INTERNSHIP: 'Internship',
}
const SEGMENTS = ['SMK', 'TKI', 'PETANI', 'DIFABEL', 'UMUM']
const APP_STATUS = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED']
const STATUS_COLOR = {
  PENDING:     'bg-gray-100 text-gray-700',
  REVIEWED:    'bg-blue-100 text-blue-700',
  SHORTLISTED: 'bg-yellow-100 text-yellow-700',
  INTERVIEW:   'bg-purple-100 text-purple-700',
  HIRED:       'bg-green-100 text-green-700',
  REJECTED:    'bg-red-100 text-red-700',
}
const STATUS_LABEL = {
  PENDING: 'Menunggu', REVIEWED: 'Ditinjau', SHORTLISTED: 'Shortlist',
  INTERVIEW: 'Interview', HIRED: 'Diterima', REJECTED: 'Ditolak',
}
const EMPTY_JOB = {
  title: '', description: '', category: '', type: 'FULL_TIME',
  province: '', city: '', isRemote: false,
  salaryMin: '', salaryMax: '',
  requiredSkills: '', preferredSegments: [],
  openForDifabel: false, requirements: '', benefits: '',
  quota: 1, status: 'OPEN',
}

export default function CompanyPage() {
  const router = useRouter()
  const [user, setUser]         = useState(null)
  const [jobs, setJobs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('jobs')
  const [toast, setToast]       = useState(null)
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingJob, setEditingJob]     = useState(null)
  const [jobForm, setJobForm]           = useState(EMPTY_JOB)
  const [saving, setSaving]             = useState(false)
  const [selectedJob, setSelectedJob]   = useState(null)
  const [applicants, setApplicants]     = useState([])
  const [appsLoading, setAppsLoading]   = useState(false)
  const [notifModal, setNotifModal]     = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.jobs.myJobs()
      setJobs(res.jobs || [])
    } catch (err) { showToast(err.message || 'Gagal memuat data', 'error') }
    setLoading(false)
  }, [])

  useEffect(() => {
    const u = getUser()
    if (!u || (u.role !== 'COMPANY' && u.role !== 'ADMIN')) { router.push('/auth/login'); return }
    setUser(u)
    loadJobs()
  }, [loadJobs, router])

  const openCreate = () => { setEditingJob(null); setJobForm(EMPTY_JOB); setShowJobModal(true) }
  const openEdit = (job) => {
    setEditingJob(job)
    setJobForm({
      title: job.title || '', description: job.description || '',
      category: job.category || '', type: job.type || 'FULL_TIME',
      province: job.province || '', city: job.city || '',
      isRemote: job.isRemote || false,
      salaryMin: job.salaryMin || '', salaryMax: job.salaryMax || '',
      requiredSkills: (job.requiredSkills || []).join(', '),
      preferredSegments: job.preferredSegments || [],
      openForDifabel: job.openForDifabel || false,
      requirements: job.requirements || '', benefits: job.benefits || '',
      quota: job.quota || 1, status: job.status || 'OPEN',
    })
    setShowJobModal(true)
  }

  const handleSaveJob = async () => {
    if (!jobForm.title.trim() || !jobForm.description.trim() || !jobForm.city.trim()) {
      showToast('Judul, deskripsi, dan kota wajib diisi', 'error'); return
    }
    setSaving(true)
    try {
      const payload = {
        ...jobForm,
        requiredSkills: jobForm.requiredSkills
          ? jobForm.requiredSkills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [],
        salaryMin: jobForm.salaryMin ? Number(jobForm.salaryMin) : null,
        salaryMax: jobForm.salaryMax ? Number(jobForm.salaryMax) : null,
        quota: Number(jobForm.quota) || 1,
      }
      if (editingJob) { await api.jobs.update(editingJob.id, payload); showToast('✅ Lowongan diperbarui') }
      else            { await api.jobs.create(payload);                 showToast('✅ Lowongan dibuat') }
      setShowJobModal(false); loadJobs()
    } catch (err) { showToast(err.message || 'Gagal menyimpan', 'error') }
    setSaving(false)
  }

  const handleDeleteJob = async (job) => {
    if (!confirm(`Hapus lowongan "${job.title}"?`)) return
    try { await api.jobs.delete(job.id); showToast('🗑️ Dihapus'); loadJobs() }
    catch (err) { showToast(err.message || 'Gagal', 'error') }
  }

  const handleToggleStatus = async (job) => {
    const s = job.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    try { await api.jobs.update(job.id, { status: s }); showToast(`Status → ${s}`); loadJobs() }
    catch (err) { showToast(err.message || 'Gagal', 'error') }
  }

  const viewApplicants = async (job) => {
    setSelectedJob(job); setActiveTab('applicants'); setAppsLoading(true)
    try {
      const res = await api.jobs.applicants(job.id)
      setApplicants(res.applications || [])
    } catch (err) { showToast(err.message || 'Gagal memuat pelamar', 'error'); setApplicants([]) }
    setAppsLoading(false)
  }

  const updateAppStatus = async (jobId, app, newStatus) => {
    try {
      const res = await api.jobs.updateAppStatus(jobId, app.id, { status: newStatus, notifyEmail: true, notifyWa: true })
      setApplicants(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus } : a))
      showToast(`✅ Status → ${STATUS_LABEL[newStatus] || newStatus}`)
      if (res.notification?.canNotify) setNotifModal({ app: { ...app, status: newStatus }, notification: res.notification })
    } catch (err) { showToast(err.message || 'Gagal', 'error') }
  }

  const stats = {
    total: jobs.length, open: jobs.filter(j => j.status === 'OPEN').length,
    closed: jobs.filter(j => j.status === 'CLOSED').length,
    totalApplicants: jobs.reduce((s, j) => s + (j._count?.applications || 0), 0),
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium animate-slide-up
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>{toast.msg}</div>
      )}

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">K</div>
              <span className="font-bold text-gray-900 hidden sm:block">KARYA.ID</span>
              <span className="text-xs text-gray-400 hidden sm:block">— Company Portal</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setActiveTab('jobs')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${activeTab === 'jobs' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                💼 Lowongan
              </button>
              <button
                onClick={() => {
                  if (selectedJob) setActiveTab('applicants')
                  else showToast('Pilih lowongan dulu — klik tombol "Pelamar" pada salah satu lowongan', 'error')
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5
                  ${activeTab === 'applicants' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                👥 Pelamar
                {selectedJob && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                    {applicants.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block font-medium">{user?.name}</span>
            <button onClick={() => { clearAuth(); router.push('/') }}
              className="text-sm text-red-600 hover:text-red-700 font-medium">Keluar</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── JOBS TAB ────────────────────────────────────────────────────────── */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Perusahaan</h1>
                <p className="text-gray-500 text-sm mt-1">Kelola lowongan dan pelamar Anda</p>
              </div>
              <button onClick={openCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
                + Buat Lowongan
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: '💼', label: 'Total Lowongan',  value: stats.total },
                { icon: '🟢', label: 'Lowongan Aktif',  value: stats.open },
                { icon: '🔴', label: 'Ditutup',         value: stats.closed },
                { icon: '👥', label: 'Total Pelamar',   value: stats.totalApplicants },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <div className="text-5xl mb-4">💼</div>
                <p className="text-gray-500 mb-4">Belum ada lowongan. Buat yang pertama!</p>
                <button onClick={openCreate} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700">
                  Buat Lowongan
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {job.status === 'OPEN' ? '● Aktif' : '○ Tutup'}
                          </span>
                          {job.openForDifabel && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">♿ Difabel</span>}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {TYPE_LABEL[job.type] || job.type} • {job.city}{job.province ? `, ${job.province}` : ''}{job.isRemote ? ' • Remote' : ''}
                        </p>
                        {job.salaryMin && (
                          <p className="text-sm text-indigo-600 font-medium mt-1">
                            Rp {Number(job.salaryMin).toLocaleString('id')} — Rp {Number(job.salaryMax).toLocaleString('id')}
                          </p>
                        )}
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {(job.preferredSegments || []).map(s => (
                            <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button onClick={() => viewApplicants(job)}
                          className="text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          👥 {job._count?.applications || 0} Pelamar
                        </button>
                        <button onClick={() => openEdit(job)}
                          className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleToggleStatus(job)}
                          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors
                            ${job.status === 'OPEN' ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                          {job.status === 'OPEN' ? '⏸ Tutup' : '▶ Buka'}
                        </button>
                        <button onClick={() => handleDeleteJob(job)}
                          className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          🗑 Hapus
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
                      <span>Kuota: {job.quota || 1} orang</span>
                      <span>Dibuat: {new Date(job.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── APPLICANTS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'applicants' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab('jobs')} className="text-gray-500 hover:text-gray-700 font-medium text-sm">← Kembali</button>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">👥 Pelamar: {selectedJob?.title}</h2>
                <p className="text-sm text-gray-500">{applicants.length} pelamar ditemukan</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {APP_STATUS.map(s => {
                  const count = applicants.filter(a => a.status === s).length
                  if (!count) return null
                  return (
                    <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[s]}`}>
                      {STATUS_LABEL[s]} ({count})
                    </span>
                  )
                })}
              </div>
            </div>

            {appsLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : applicants.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-500">Belum ada pelamar untuk lowongan ini</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applicants.map(app => (
                  <ApplicantCard key={app.id} app={app} jobId={selectedJob.id} onStatusChange={updateAppStatus} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Job Form Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingJob ? '✏️ Edit Lowongan' : '➕ Buat Lowongan Baru'}</h2>
              <button onClick={() => setShowJobModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {[
                { label: 'Judul Posisi *', key: 'title', placeholder: 'cth: Frontend Developer' },
                { label: 'Kategori', key: 'category', placeholder: 'Teknologi, Pertanian...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input value={jobForm[f.key]} onChange={e => setJobForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                </div>
              ))}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Kerja</label>
                  <select value={jobForm.type} onChange={e => setJobForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white">
                    {JOB_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kota *</label>
                  <input value={jobForm.city} onChange={e => setJobForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="Bandung" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                <input value={jobForm.province} onChange={e => setJobForm(p => ({ ...p, province: e.target.value }))}
                  placeholder="Jawa Barat" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gaji Min (Rp)</label>
                  <input type="number" value={jobForm.salaryMin} onChange={e => setJobForm(p => ({ ...p, salaryMin: e.target.value }))}
                    placeholder="3000000" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gaji Max (Rp)</label>
                  <input type="number" value={jobForm.salaryMax} onChange={e => setJobForm(p => ({ ...p, salaryMax: e.target.value }))}
                    placeholder="7000000" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi *</label>
                <textarea value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))}
                  rows={4} placeholder="Tanggung jawab pekerjaan..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Persyaratan</label>
                <textarea value={jobForm.requirements} onChange={e => setJobForm(p => ({ ...p, requirements: e.target.value }))}
                  rows={3} placeholder="Kualifikasi yang dibutuhkan..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Benefit</label>
                <textarea value={jobForm.benefits} onChange={e => setJobForm(p => ({ ...p, benefits: e.target.value }))}
                  rows={2} placeholder="BPJS, THR, dll..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill (pisah koma)</label>
                <input value={jobForm.requiredSkills} onChange={e => setJobForm(p => ({ ...p, requiredSkills: e.target.value }))}
                  placeholder="javascript, react, sql..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segmen Prioritas</label>
                <div className="flex gap-2 flex-wrap">
                  {SEGMENTS.map(seg => (
                    <button key={seg} type="button"
                      onClick={() => setJobForm(p => ({
                        ...p, preferredSegments: p.preferredSegments.includes(seg)
                          ? p.preferredSegments.filter(s => s !== seg)
                          : [...p.preferredSegments, seg]
                      }))}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors
                        ${jobForm.preferredSegments.includes(seg) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                      {seg}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kuota</label>
                  <input type="number" min="1" value={jobForm.quota} onChange={e => setJobForm(p => ({ ...p, quota: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={jobForm.status} onChange={e => setJobForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white">
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 pt-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={jobForm.isRemote} onChange={e => setJobForm(p => ({ ...p, isRemote: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
                    Remote OK
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={jobForm.openForDifabel} onChange={e => setJobForm(p => ({ ...p, openForDifabel: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
                    ♿ Difabel OK
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowJobModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Batal</button>
              <button onClick={handleSaveJob} disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors">
                {saving ? 'Menyimpan...' : editingJob ? 'Simpan' : 'Buat Lowongan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notifModal && <NotifModal data={notifModal} onClose={() => setNotifModal(null)} />}
    </div>
  )
}

function ApplicantCard({ app, jobId, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const profile = app.user?.profile || {}

  const QUICK_ACTIONS = [
    { label: '⭐ Shortlist', status: 'SHORTLISTED', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' },
    { label: '🗣️ Interview', status: 'INTERVIEW',   cls: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
    { label: '✅ Terima',    status: 'HIRED',        cls: 'bg-green-50  text-green-700  border-green-200  hover:bg-green-100'  },
    { label: '❌ Tolak',     status: 'REJECTED',     cls: 'bg-red-50    text-red-600    border-red-200    hover:bg-red-100'    },
  ].filter(a => a.status !== app.status)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 flex items-start gap-4 flex-wrap">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {app.user?.name?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{app.user?.name}</p>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[app.status]}`}>
              {STATUS_LABEL[app.status] || app.status}
            </span>
            {app.user?.segment && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{app.user.segment}</span>}
            {app.aiScore != null && <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">AI: {Math.round(app.aiScore)}%</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-gray-500">
            <span>📧 {app.user?.email}</span>
            {profile.phone && <span>📱 {profile.phone}</span>}
            {profile.city && <span>📍 {profile.city}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-400">
            {profile.educationLevel && <span>🎓 {profile.educationLevel}</span>}
            {profile.yearsExperience > 0 && <span>💼 {profile.yearsExperience} thn</span>}
            {(profile.skills || []).slice(0, 5).map(s => (
              <span key={s} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-indigo-600 hover:underline font-medium shrink-0">
          {expanded ? 'Sembunyikan ↑' : 'Detail ↓'}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-50 pt-4 space-y-2">
          {app.coverLetter ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cover Letter</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 italic leading-relaxed">"{app.coverLetter}"</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Tidak ada cover letter</p>
          )}
          <p className="text-xs text-gray-400">
            Melamar: {new Date(app.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Action bar */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Ubah status:</span>
        {QUICK_ACTIONS.map(a => (
          <button key={a.status} onClick={() => onStatusChange(jobId, app, a.status)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${a.cls}`}>
            {a.label}
          </button>
        ))}
        <div className="ml-auto">
          <select value={app.status} onChange={e => onStatusChange(jobId, app, e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-300 outline-none text-gray-700">
            {APP_STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

function NotifModal({ data, onClose }) {
  const { app, notification } = data
  const STATUS_TEXT = {
    HIRED: 'DITERIMA 🎉', REJECTED: 'tidak dilanjutkan 😔',
    INTERVIEW: 'dipanggil Interview 🗣️', SHORTLISTED: 'masuk Shortlist ⭐',
    REVIEWED: 'sedang Ditinjau 👀',
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">📨 Kirim Notifikasi ke Pelamar</h3>
          <p className="text-sm text-gray-500 mt-1">
            <strong>{notification.applicantName}</strong> —{' '}
            <span className={`font-semibold ${app.status === 'HIRED' ? 'text-green-600' : app.status === 'REJECTED' ? 'text-red-600' : 'text-indigo-600'}`}>
              {STATUS_TEXT[app.status] || app.status}
            </span>
          </p>
        </div>
        <div className="px-6 py-5 space-y-3">
          {/* Email */}
          <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="text-2xl">📧</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Email</p>
              <p className="text-xs text-gray-500 truncate">{notification.applicantEmail}</p>
            </div>
            {notification.mailtoLink
              ? <a href={notification.mailtoLink} target="_blank" rel="noopener noreferrer"
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold shrink-0">
                  Kirim Email
                </a>
              : <span className="text-xs text-gray-400">Tidak tersedia</span>
            }
          </div>
          {/* WhatsApp */}
          <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="text-2xl">💬</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">WhatsApp</p>
              <p className="text-xs text-gray-500">{notification.applicantPhone || 'Nomor tidak tersedia di profil pelamar'}</p>
            </div>
            {notification.waLink
              ? <a href={notification.waLink} target="_blank" rel="noopener noreferrer"
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shrink-0">
                  Kirim WA
                </a>
              : <span className="text-xs text-gray-400">{notification.applicantPhone ? 'Error' : 'No HP kosong'}</span>
            }
          </div>
          <p className="text-xs text-gray-400 text-center">Pelamar juga bisa melihat status di akun mereka secara langsung</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm rounded-xl transition-colors">
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}
