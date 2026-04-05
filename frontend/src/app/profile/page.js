'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getUser, clearAuth, SEGMENT_LABEL } from '@/lib/auth'

const SKILLS_PRESETS = {
  SMK:    ['JavaScript','React','HTML','CSS','Python','PHP','Node.js','MySQL','Git','Figma','Microsoft Office','Customer Service','Networking','Linux'],
  TKI:    ['Bahasa Inggris','Bahasa Arab','Bahasa Jepang','Customer Service','Housekeeping','Administrasi','Microsoft Office','Komunikasi'],
  PETANI: ['Pertanian','Agribisnis','Hidroponik','Perkebunan','Peternakan','Pupuk Organik','Irigasi','Field Work','Komunikasi'],
  DIFABEL:['Administrasi','Microsoft Office','Data Entry','Customer Service','Desain Grafis','Pengetikan','Komunikasi'],
  UMUM:   ['Komunikasi','Microsoft Office','Administrasi','Sales','Marketing','Customer Service','Manajemen'],
}

const PROVINCES = ['DKI Jakarta','Jawa Barat','Jawa Tengah','Jawa Timur','Banten','Sumatera Utara','Sumatera Selatan','Sulawesi Selatan','Kalimantan Timur','Bali','Yogyakarta']
const EDU_LEVELS = ['SD','SMP','SMA','SMK','D3','S1','S2','S3']

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser]   = useState(null)
  const [form, setForm]   = useState({
    bio: '', phone: '', province: '', city: '', district: '',
    educationLevel: '', school: '', major: '', graduationYear: '',
    yearsExperience: 0, currentJob: '', expectedSalary: '',
    skills: [], certifications: [], languages: [], preferredJob: [],
    smkJurusan: '', tikiDestination: '', petaniCommodity: '', difabelType: '',
  })
  const [skillInput, setSkillInput] = useState('')
  const [prefInput, setPrefInput]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)
  const [activeTab, setActiveTab] = useState('personal')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push('/auth/login'); return }
    setUser(u)
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await api.users.getProfile()
      if (res.profile) {
        const p = res.profile
        setForm(f => ({
          ...f,
          bio:            p.bio            || '',
          phone:          p.phone          || '',
          province:       p.province       || '',
          city:           p.city           || '',
          district:       p.district       || '',
          educationLevel: p.educationLevel || '',
          school:         p.school         || '',
          major:          p.major          || '',
          graduationYear: p.graduationYear || '',
          yearsExperience: p.yearsExperience || 0,
          currentJob:     p.currentJob     || '',
          expectedSalary: p.expectedSalary || '',
          skills:         p.skills         || [],
          certifications: p.certifications || [],
          languages:      p.languages      || [],
          preferredJob:   p.preferredJob   || [],
          smkJurusan:     p.smkJurusan     || '',
          tikiDestination:p.tikiDestination|| '',
          petaniCommodity:p.petaniCommodity|| '',
          difabelType:    p.difabelType    || '',
        }))
      }
    } catch {}
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        ...form,
        yearsExperience: Number(form.yearsExperience),
        expectedSalary:  form.expectedSalary ? Number(form.expectedSalary) : null,
        graduationYear:  form.graduationYear ? Number(form.graduationYear) : null,
      }
      await api.users.updateProfile(body)
      showToast('✅ Profil berhasil disimpan!')
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan', 'error')
    }
    setSaving(false)
  }

  const addSkill = (skill) => {
    const s = skill.trim()
    if (!s || form.skills.includes(s)) return
    setForm(f => ({ ...f, skills: [...f.skills, s] }))
    setSkillInput('')
  }

  const removeSkill = (skill) => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))
  const addPref = (pref) => {
    const p = pref.trim()
    if (!p || form.preferredJob.includes(p)) return
    setForm(f => ({ ...f, preferredJob: [...f.preferredJob, p] }))
    setPrefInput('')
  }
  const removePref = (pref) => setForm(f => ({ ...f, preferredJob: f.preferredJob.filter(p => p !== pref) }))

  const seg = user?.segment || 'UMUM'
  const presetSkills = SKILLS_PRESETS[seg] || SKILLS_PRESETS.UMUM

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium animate-slide-up
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-gray-600 text-sm">Dashboard</span>
          </div>
          <h1 className="font-bold text-gray-900">Edit Profil</h1>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2">
            {saving ? '⏳' : '💾'} Simpan
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card p-6 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user?.name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`badge mt-1
              ${seg === 'SMK' ? 'badge-smk' : seg === 'TKI' ? 'badge-tki' : seg === 'PETANI' ? 'badge-petani' : seg === 'DIFABEL' ? 'badge-difabel' : 'badge-umum'}`}>
              {SEGMENT_LABEL[seg]}
            </span>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <div className="text-2xl font-bold text-indigo-600">{form.skills.length}</div>
            <div className="text-xs text-gray-500">Skills</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {[
            { key: 'personal', label: '👤 Personal' },
            { key: 'education', label: '🎓 Pendidikan' },
            { key: 'skills', label: '🛠️ Skill' },
            { key: 'segment', label: '🏷️ Segmen' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-sm py-2 px-3 rounded-lg font-medium transition-all
                ${activeTab === tab.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Personal */}
        {activeTab === 'personal' && (
          <div className="card p-6 space-y-4 animate-fade-in">
            <h3 className="font-bold text-gray-900">Informasi Personal</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
                <input className="input-field" placeholder="08xx-xxxx-xxxx"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pekerjaan Saat Ini</label>
                <input className="input-field" placeholder="Fresh Graduate / Nama Jabatan"
                  value={form.currentJob} onChange={e => setForm(f => ({ ...f, currentJob: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / Tentang Saya</label>
              <textarea rows={3} className="input-field resize-none" placeholder="Ceritakan singkat tentang diri Anda, keahlian, dan target karir..."
                value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Provinsi</label>
                <select className="input-field" value={form.province}
                  onChange={e => setForm(f => ({ ...f, province: e.target.value }))}>
                  <option value="">Pilih Provinsi</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kota</label>
                <input className="input-field" placeholder="Nama Kota"
                  value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kecamatan</label>
                <input className="input-field" placeholder="Kecamatan"
                  value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pengalaman Kerja</label>
                <select className="input-field" value={form.yearsExperience}
                  onChange={e => setForm(f => ({ ...f, yearsExperience: e.target.value }))}>
                  <option value={0}>Fresh Graduate (0 tahun)</option>
                  {[1,2,3,4,5,7,10].map(y => <option key={y} value={y}>{y} tahun</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ekspektasi Gaji (Rp)</label>
                <input type="number" className="input-field" placeholder="Contoh: 5000000"
                  value={form.expectedSalary}
                  onChange={e => setForm(f => ({ ...f, expectedSalary: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Education */}
        {activeTab === 'education' && (
          <div className="card p-6 space-y-4 animate-fade-in">
            <h3 className="font-bold text-gray-900">Pendidikan</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenjang Pendidikan</label>
                <select className="input-field" value={form.educationLevel}
                  onChange={e => setForm(f => ({ ...f, educationLevel: e.target.value }))}>
                  <option value="">Pilih Jenjang</option>
                  {EDU_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun Lulus</label>
                <input type="number" className="input-field" placeholder="2024"
                  value={form.graduationYear}
                  onChange={e => setForm(f => ({ ...f, graduationYear: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Sekolah / Universitas</label>
              <input className="input-field" placeholder="Contoh: SMKN 1 Bandung / Universitas Indonesia"
                value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jurusan / Program Studi</label>
              <input className="input-field" placeholder="Contoh: Rekayasa Perangkat Lunak / Teknik Informatika"
                value={form.major} onChange={e => setForm(f => ({ ...f, major: e.target.value }))} />
            </div>
          </div>
        )}

        {/* Tab: Skills */}
        {activeTab === 'skills' && (
          <div className="space-y-4 animate-fade-in">
            {/* Skill Input */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-1">Skill yang Dikuasai</h3>
              <p className="text-sm text-gray-500 mb-4">Tambahkan skill yang relevan dengan karir Anda</p>

              <div className="flex gap-2 mb-4">
                <input className="input-field flex-1" placeholder="Tambah skill..."
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                />
                <button onClick={() => addSkill(skillInput)} className="btn-primary px-4">Tambah</button>
              </div>

              {/* Preset skills */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 font-medium">💡 Saran skill untuk {SEGMENT_LABEL[seg]}:</p>
                <div className="flex flex-wrap gap-2">
                  {presetSkills.filter(s => !form.skills.includes(s)).map(s => (
                    <button key={s} onClick={() => addSkill(s)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Added skills */}
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.skills.map(s => (
                    <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                      {s}
                      <button onClick={() => removeSkill(s)} className="text-indigo-400 hover:text-indigo-700 font-bold leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preferred Jobs */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-1">Preferensi Pekerjaan</h3>
              <p className="text-sm text-gray-500 mb-4">Jenis pekerjaan yang Anda inginkan (meningkatkan akurasi AI matching)</p>

              <div className="flex gap-2 mb-3">
                <input className="input-field flex-1" placeholder="Contoh: Frontend Developer, Data Analyst..."
                  value={prefInput}
                  onChange={e => setPrefInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPref(prefInput) } }}
                />
                <button onClick={() => addPref(prefInput)} className="btn-primary px-4">Tambah</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.preferredJob.map(p => (
                  <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                    {p}
                    <button onClick={() => removePref(p)} className="text-purple-400 hover:text-purple-700 font-bold">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Segment */}
        {activeTab === 'segment' && (
          <div className="card p-6 animate-fade-in">
            <h3 className="font-bold text-gray-900 mb-4">Info Khusus Segmen: {SEGMENT_LABEL[seg]}</h3>
            {seg === 'SMK' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jurusan SMK</label>
                <input className="input-field" placeholder="Contoh: Rekayasa Perangkat Lunak, Teknik Kendaraan Ringan"
                  value={form.smkJurusan} onChange={e => setForm(f => ({ ...f, smkJurusan: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">Digunakan untuk SMK Bridge — pencocokan industri lokal</p>
              </div>
            )}
            {seg === 'TKI' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Negara Tujuan / Pernah Bekerja Di</label>
                <input className="input-field" placeholder="Contoh: Malaysia, Arab Saudi, Hongkong"
                  value={form.tikiDestination} onChange={e => setForm(f => ({ ...f, tikiDestination: e.target.value }))} />
              </div>
            )}
            {seg === 'PETANI' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Komoditas Pertanian Utama</label>
                <input className="input-field" placeholder="Contoh: Padi, Sayuran Organik, Kelapa Sawit"
                  value={form.petaniCommodity} onChange={e => setForm(f => ({ ...f, petaniCommodity: e.target.value }))} />
              </div>
            )}
            {seg === 'DIFABEL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Disabilitas (Opsional)</label>
                <input className="input-field" placeholder="Contoh: Fisik (pengguna kursi roda), Tuna Rungu"
                  value={form.difabelType} onChange={e => setForm(f => ({ ...f, difabelType: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">Informasi ini digunakan untuk mencocokkan lowongan yang ramah disabilitas</p>
              </div>
            )}
            {seg === 'UMUM' && (
              <p className="text-gray-500 text-sm">Tidak ada pengaturan khusus untuk segmen Umum.</p>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3 text-base">
            {saving ? '⏳ Menyimpan...' : '💾 Simpan Profil'}
          </button>
        </div>
      </div>
    </div>
  )
}
