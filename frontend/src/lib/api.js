'use client'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('karyaid_token')
}

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`)
    err.status = res.status
    err.data   = data
    throw err
  }
  return data
}

export const api = {
  auth: {
    register: (body) => request('POST', '/api/auth/register', body, false),
    login:    (body) => request('POST', '/api/auth/login',    body, false),
    me:       ()     => request('GET',  '/api/auth/me'),
  },
  users: {
    getProfile:    ()     => request('GET',  '/api/users/profile'),
    updateProfile: (body) => request('PUT',  '/api/users/profile', body),
    getStats:      ()     => request('GET',  '/api/users/stats'),
    getApplications: ()   => request('GET',  '/api/users/applications'),
  },
  jobs: {
    list:   (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request('GET', `/api/jobs${q ? '?' + q : ''}`)
    },
    get:    (id)   => request('GET',  `/api/jobs/${id}`),
    apply:  (id, body) => request('POST', `/api/jobs/${id}/apply`, body),
    create: (body) => request('POST', '/api/jobs', body),
    update: (id, body) => request('PUT', `/api/jobs/${id}`, body),
    delete: (id)   => request('DELETE', `/api/jobs/${id}`),
    myJobs: ()     => request('GET', '/api/jobs/company/my-jobs'),
    applicants:      (jobId)              => request('GET',   `/api/jobs/${jobId}/applicants`),
    updateAppStatus: (jobId, appId, body) => request('PATCH', `/api/jobs/${jobId}/applications/${appId}`, body),
  },
  recommendations: {
    get:       (limit = 10, refresh = false) =>
      request('GET', `/api/recommendations?limit=${limit}&refresh=${refresh}`),
    quickMatch: ()       => request('GET',  '/api/recommendations/quick-match'),
    score:      (jobId)  => request('POST', '/api/recommendations/score', { jobId }),
    smkBridge:  ()       => request('GET',  '/api/recommendations/smk-bridge'),
  },
  admin: {
    stats:          ()       => request('GET',   '/api/admin/stats'),
    users:          (p={})   => request('GET',   `/api/admin/users?${new URLSearchParams(p)}`),
    updateUser:     (id, body) => request('PATCH', `/api/admin/users/${id}`, body),
    toggleUser:     (id)     => request('PATCH', `/api/admin/users/${id}/toggle`),
    jobs:           (p={})   => request('GET',   `/api/admin/jobs?${new URLSearchParams(p)}`),
    deleteJob:      (id)     => request('DELETE', `/api/jobs/${id}`),
    companies:       ()          => request('GET',    '/api/admin/companies'),
    createCompany:   (body)      => request('POST',   '/api/admin/companies', body),
    updateCompany:   (id, body)  => request('PUT',    `/api/admin/companies/${id}`, body),
    verifyCompany:   (id)        => request('PATCH',  `/api/admin/companies/${id}/verify`),
    unverifyCompany: (id)        => request('PATCH',  `/api/admin/companies/${id}/unverify`),
    deleteCompany:   (id)        => request('DELETE', `/api/admin/companies/${id}`),
    placements:     ()       => request('GET',   '/api/admin/placements'),
  },
}

export default api
