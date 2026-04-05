'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getUser, clearAuth } from '@/lib/auth'

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats]         = useState(null)
  const [users, setUsers]         = useState([])
  const [jobs, setJobs]           = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [toast, setToast]         = useState(null)
  const [searchUser, setSearchUser] = useState('')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const u = getUser()
    if (!u || u.role !== 'ADMIN') { router.push('/auth/login'); return }
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, jobsRes, companiesRes] = await Promise.allSettled([
        api.admin.stats(),
        api.admin.users({ limit: 50 }),
        api.admin.jobs({ limit: 50 }),
        api.admin.companies(),
      ])
      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value
        const overview = d.overview || d.stats || d
        const bySegment = d.usersBySegment || d.bySegment || {}
        setStats({ ...overview, bySegment })
      }
      if (usersRes.status === 'fulfilled')     setUsers(usersRes.value.users || [])
      if (jobsRes.status === 'fulfilled')      setJobs(jobsRes.value.jobs   || [])
      if (companiesRes.status === 'fulfilled') setCompanies(companiesRes.value.companies || [])
    } catch {}
    setLoading(false)
  }

  const toggleUser = async (id) => {
    try {
      await api.admin.toggleUser(id)
      showToast('✅ Status user diupdate')
      loadAll()
    } catch (err) {
      showToast(err.message || 'Gagal', 'error')
    }
  }

  const verifyCompany = async (id) => {
    try {
      await api.admin.verifyCompany(id)
      showToast('✅ Perusahaan berhasil diverifikasi')
      loadAll()
    } catch (err) {
      showToast(err.message || 'Gagal', 'error')
    }
  }

  const deleteJob = async (job) => {
    if (!confirm(`Hapus lowongan "${job.title}"?`)) return
    try {
      await api.admin.deleteJob(job.id)
      showToast('🗑️ Lowongan dihapus')
      loadAll()
    } catch (err) {
      showToast(err.message || 'Gagal', 'error')
    }
  }

  const filteredUsers = searchUser
    ? users.filter(u =>
        u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchUser.toLowerCase())
      )
    : users

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const TABS = [
    { key: 'overview',   label: '📊 Overview' },
    { key: 'users',      label: '👥 Users' },
    { key: 'companies',  label: '🏢 Perusahaan' },
    { key: 'jobs',       label: '💼 Jobs' },
    { key: 'placements', label: '🏆 Penempatan' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium animate-slide-up
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav className="bg-gray-900 text-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">K</div>
              <span className="font-bold">KARYA.ID Admin</span>
            </div>
            <div className="flex gap-1 ml-4">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors
                    ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => { clearAuth(); router.push('/') }}
            className="text-gray-400 hover:text-white text-sm transition-colors">
            Keluar
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <p className="text-gray-500 text-sm mt-1">Monitoring platform KARYA.ID secara real-time</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: '👥', label: 'Total Users',    value: stats?.totalUsers    || 0, color: 'indigo' },
                { icon: '🏢', label: 'Total Perusahaan', value: stats?.totalCompanies || 0, color: 'blue' },
                { icon: '💼', label: 'Lowongan Aktif',  value: stats?.activeJobs ?? stats?.openJobs ?? 0, color: 'green' },
                { icon: '📋', label: 'Total Lamaran',   value: stats?.totalApplications || 0, color: 'purple' },
              ].map(s => (
                <div key={s.label} className="card p-5">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-3xl font-extrabold text-gray-900">{s.value.toLocaleString()}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Segment Breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">📊 User per Segmen</h2>
                <div className="space-y-3">
                  {[
                    { seg: 'SMK',    icon: '🎓', color: 'bg-blue-500',   count: stats?.bySegment?.SMK    || 0 },
                    { seg: 'TKI',    icon: '✈️', color: 'bg-purple-500', count: stats?.bySegment?.TKI    || 0 },
                    { seg: 'PETANI', icon: '🌱', color: 'bg-green-500',  count: stats?.bySegment?.PETANI || 0 },
                    { seg: 'DIFABEL',icon: '🤝', color: 'bg-orange-500', count: stats?.bySegment?.DIFABEL|| 0 },
                    { seg: 'UMUM',   icon: '👤', color: 'bg-gray-500',   count: stats?.bySegment?.UMUM   || 0 },
                  ].map(({ seg, icon, color, count }) => {
                    const total = stats?.totalUsers || 1
                    const pct = Math.round((count / total) * 100)
                    return (
                      <div key={seg}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{icon} {seg}</span>
                          <span className="font-semibold text-gray-900">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Statistik Penempatan</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Total Hired',      value: stats?.totalHired      || 0, icon: '✅' },
                    { label: 'Dalam Interview',  value: stats?.inInterview     || 0, icon: '🗣️' },
                    { label: 'Shortlisted',      value: stats?.shortlisted     || 0, icon: '⭐' },
                    { label: 'Placement Rate',   value: `${stats?.placementRate || 0}%`, icon: '📈' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">{item.icon} {item.label}</span>
                      <span className="font-bold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🕐 Aktivitas Terbaru</h2>
              <div className="space-y-2">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {u.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`badge badge-${(u.segment || 'UMUM').toLowerCase()}`}>{u.segment}</span>
                      <span className={`text-xs ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>
                        {u.isActive ? '●' : '○'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-gray-900">👥 Manajemen User</h2>
              <div className="flex items-center gap-3">
                <input
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  placeholder="Cari nama / email..."
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none w-52" />
                <span className="text-sm text-gray-500">{filteredUsers.length} user</span>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Nama', 'Email', 'Role', 'Segmen', 'Terdaftar', 'Status', 'Aksi'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {u.name?.[0]}
                            </div>
                            <span className="font-medium text-gray-900 truncate max-w-[120px]">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-[160px]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'COMPANY' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge badge-${(u.segment || 'UMUM').toLowerCase()}`}>{u.segment}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleUser(u.id)}
                            className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors
                              ${u.isActive
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                            {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* JOBS */}
        {activeTab === 'jobs' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">💼 Manajemen Lowongan</h2>
              <span className="text-sm text-gray-500">{jobs.length} lowongan ditampilkan</span>
            </div>
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="card p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{job.company?.name} • {job.city}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className={`badge ${job.status === 'OPEN' ? 'badge-open' : 'badge-closed'}`}>{job.status}</span>
                      {(job.preferredSegments || []).map(s => (
                        <span key={s} className={`badge badge-${s.toLowerCase()}`}>{s}</span>
                      ))}
                      {job.openForDifabel && <span className="badge bg-orange-100 text-orange-700">♿</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{job._count?.applications || 0} pelamar</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(job.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    <button onClick={() => deleteJob(job)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors">
                      🗑 Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPANIES */}
        {activeTab === 'companies' && (
          <CompaniesTab
            companies={companies}
            onReload={loadAll}
            showToast={showToast}
            toggleUser={toggleUser}
          />
        )}

        {activeTab === 'placements' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-6">🏆 Data Penempatan Kerja</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">Penempatan per Segmen</h3>
                <div className="space-y-4">
                  {[
                    { seg: 'SMK', icon: '🎓', hired: stats?.hiredBySegment?.SMK || 0, color: 'bg-blue-500' },
                    { seg: 'TKI', icon: '✈️', hired: stats?.hiredBySegment?.TKI || 0, color: 'bg-purple-500' },
                    { seg: 'PETANI', icon: '🌱', hired: stats?.hiredBySegment?.PETANI || 0, color: 'bg-green-500' },
                    { seg: 'DIFABEL', icon: '🤝', hired: stats?.hiredBySegment?.DIFABEL || 0, color: 'bg-orange-500' },
                  ].map(({ seg, icon, hired, color }) => (
                    <div key={seg} className="flex items-center gap-4">
                      <span className="text-2xl">{icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{seg}</span>
                          <span className="text-gray-600">{hired} diterima</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div className={`h-full ${color} rounded-full`}
                            style={{ width: `${Math.min(100, (hired / Math.max(1, stats?.totalHired || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">Ringkasan Impact</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Total Placement',   value: stats?.totalHired || 0,           unit: 'orang' },
                    { label: 'Rate Hiring',        value: `${stats?.placementRate || 0}%`,   unit: '' },
                    { label: 'Perusahaan Inklusif',value: stats?.inclusiveCompanies || 0,    unit: 'perusahaan' },
                    { label: 'AI Recommendations',value: stats?.totalRecommendations || 0,  unit: 'total' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="font-bold text-gray-900">{item.value} <span className="text-xs font-normal text-gray-500">{item.unit}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const EMPTY_COMPANY = {
  name: '', description: '', industry: '', size: '',
  website: '', province: '', city: '', address: '',
  isInclusiveEmployer: false, difabelQuota: 0, isVerified: false,
}
const EMPTY_CREATE = {
  ...EMPTY_COMPANY,
  contactName: '', email: '', password: 'company123',
}

function CompaniesTab({ companies, onReload, showToast, toggleUser }) {
  const [modal, setModal]   = useState(null)   
  const [form, setForm]     = useState(EMPTY_COMPANY)
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setForm(EMPTY_CREATE)
    setModal({ mode: 'create' })
  }

  const openEdit = (company) => {
    setForm({
      name:               company.name               || '',
      description:        company.description        || '',
      industry:           company.industry           || '',
      size:               company.size               || '',
      website:            company.website            || '',
      province:           company.province           || '',
      city:               company.city               || '',
      address:            company.address            || '',
      isInclusiveEmployer: company.isInclusiveEmployer || false,
      difabelQuota:       company.difabelQuota       || 0,
      isVerified:         company.isVerified         || false,
    })
    setModal({ mode: 'edit', company })
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Nama perusahaan wajib diisi', 'error'); return }
    if (modal.mode === 'create' && (!form.email?.trim() || !form.contactName?.trim())) {
      showToast('Email dan nama kontak wajib diisi', 'error'); return
    }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await api.admin.createCompany(form)
        showToast('✅ Perusahaan berhasil ditambahkan')
      } else {
        await api.admin.updateCompany(modal.company.id, form)
        showToast('✅ Perusahaan berhasil diperbarui')
      }
      setModal(null)
      onReload()
    } catch (e) { showToast(e.message || 'Gagal menyimpan', 'error') }
    setSaving(false)
  }

  const handleDelete = async (company) => {
    if (!confirm(`Hapus perusahaan "${company.name}"?\n\nSemua lowongan dan lamaran terkait juga akan dihapus.`)) return
    try {
      await api.admin.deleteCompany(company.id)
      showToast('🗑️ Perusahaan berhasil dihapus')
      onReload()
    } catch (e) { showToast(e.message || 'Gagal', 'error') }
  }

  const handleVerifyToggle = async (company) => {
    try {
      if (company.isVerified) { await api.admin.unverifyCompany(company.id); showToast('Verifikasi dicabut') }
      else                    { await api.admin.verifyCompany(company.id);   showToast('✅ Perusahaan diverifikasi') }
      onReload()
    } catch (e) { showToast(e.message || 'Gagal', 'error') }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none'
  const F = ({ label, children, span2 }) => (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">🏢 Manajemen Perusahaan</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{companies.length} perusahaan</span>
          <button onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
            + Tambah Perusahaan
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Perusahaan', 'Industri & Lokasi', 'Lowongan', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Belum ada data perusahaan</td></tr>
              )}
              {companies.map(company => (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {company.name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[150px]">{company.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[150px]">{company.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <p className="text-sm">{company.industry || '—'}</p>
                    <p className="text-xs text-gray-400">{company.city || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">{company._count?.jobs || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`badge w-fit text-xs ${company.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {company.isVerified ? '✅ Verified' : '⏳ Unverified'}
                      </span>
                      {company.isInclusiveEmployer && <span className="badge w-fit text-xs bg-orange-100 text-orange-700">♿ Inklusif</span>}
                      <span className={`badge w-fit text-xs ${company.user?.isActive !== false ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {company.user?.isActive !== false ? '● Aktif' : '○ Nonaktif'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => openEdit(company)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleVerifyToggle(company)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors
                          ${company.isVerified ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' : 'bg-green-600 hover:bg-green-700 text-white border-transparent'}`}>
                        {company.isVerified ? '↩ Unverif' : '✅ Verif'}
                      </button>
                      <button onClick={() => toggleUser(company.userId)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors
                          ${company.user?.isActive !== false ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                        {company.user?.isActive !== false ? '🚫 Nonaktif' : '✔ Aktifkan'}
                      </button>
                      <button onClick={() => handleDelete(company)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-medium transition-colors">
                        🗑 Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal (Create / Edit) ─────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {modal.mode === 'create' ? '➕ Tambah Perusahaan' : '✏️ Edit Perusahaan'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="px-6 py-5 grid sm:grid-cols-2 gap-4 max-h-[68vh] overflow-y-auto">

              {/* ── Create-only fields: account info ── */}
              {modal.mode === 'create' && (
                <>
                  <div className="sm:col-span-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-0.5">Info Akun Login Company</p>
                    <p className="text-xs text-indigo-500">Kredensial ini digunakan oleh HR/Company untuk login ke portal perusahaan</p>
                  </div>
                  <F label="Nama Kontak / HR *">
                    <input value={form.contactName || ''} onChange={e => setForm(p=>({...p,contactName:e.target.value}))}
                      placeholder="cth: HR Tokopedia" className={inp} />
                  </F>
                  <F label="Email Login *">
                    <input type="email" value={form.email || ''} onChange={e => setForm(p=>({...p,email:e.target.value}))}
                      placeholder="hr@perusahaan.com" className={inp} />
                  </F>
                  <F label="Password Login" span2>
                    <input value={form.password || 'company123'} onChange={e => setForm(p=>({...p,password:e.target.value}))}
                      placeholder="Min 6 karakter" className={inp} />
                    <p className="text-xs text-gray-400 mt-1">Default: company123 — perusahaan bisa ganti setelah login</p>
                  </F>
                  <div className="sm:col-span-2 border-t border-gray-100 pt-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data Perusahaan</p>
                  </div>
                </>
              )}

              {/* ── Shared fields ── */}
              <F label="Nama Perusahaan *" span2>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))}
                  placeholder="PT ..." className={inp} />
              </F>
              <F label="Industri">
                <input value={form.industry} onChange={e => setForm(p=>({...p,industry:e.target.value}))}
                  placeholder="Technology, Agriculture..." className={inp} />
              </F>
              <F label="Ukuran">
                <select value={form.size} onChange={e => setForm(p=>({...p,size:e.target.value}))} className={inp+' bg-white'}>
                  <option value="">— Pilih —</option>
                  {['1-10','11-50','51-200','201-500','500+','1000+','5000+'].map(s=>(
                    <option key={s} value={s}>{s} karyawan</option>
                  ))}
                </select>
              </F>
              <F label="Website">
                <input value={form.website} onChange={e => setForm(p=>({...p,website:e.target.value}))}
                  placeholder="https://..." className={inp} />
              </F>
              <F label="Provinsi">
                <input value={form.province} onChange={e => setForm(p=>({...p,province:e.target.value}))}
                  placeholder="Jawa Barat" className={inp} />
              </F>
              <F label="Kota">
                <input value={form.city} onChange={e => setForm(p=>({...p,city:e.target.value}))}
                  placeholder="Bandung" className={inp} />
              </F>
              <F label="Alamat" span2>
                <input value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))}
                  placeholder="Jl. ..." className={inp} />
              </F>
              <F label="Deskripsi" span2>
                <textarea value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}
                  rows={3} placeholder="Deskripsi singkat perusahaan..." className={inp+' resize-none'} />
              </F>
              <div className="sm:col-span-2 flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.isVerified}
                    onChange={e=>setForm(p=>({...p,isVerified:e.target.checked}))} className="w-4 h-4 accent-indigo-600" />
                  ✅ Langsung Terverifikasi
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.isInclusiveEmployer}
                    onChange={e=>setForm(p=>({...p,isInclusiveEmployer:e.target.checked}))} className="w-4 h-4 accent-indigo-600" />
                  ♿ Employer Inklusif
                </label>
                {form.isInclusiveEmployer && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Kuota Difabel:</label>
                    <input type="number" min="0" value={form.difabelQuota}
                      onChange={e=>setForm(p=>({...p,difabelQuota:e.target.value}))}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors">
                {saving ? 'Menyimpan...' : modal.mode === 'create' ? 'Tambah Perusahaan' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
