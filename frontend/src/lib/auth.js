'use client'

export function saveAuth(token, user) {
  localStorage.setItem('karyaid_token', token)
  localStorage.setItem('karyaid_user',  JSON.stringify(user))
}

export function getUser() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('karyaid_user') || 'null') }
  catch { return null }
}

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('karyaid_token')
}

export function clearAuth() {
  localStorage.removeItem('karyaid_token')
  localStorage.removeItem('karyaid_user')
}

export function isLoggedIn() {
  return !!getToken()
}

export const SEGMENT_LABEL = {
  SMK:    '🎓 Lulusan SMK',
  TKI:    '✈️ Pekerja Migran',
  PETANI: '🌱 Petani Muda',
  DIFABEL:'🤝 Penyandang Disabilitas',
  UMUM:   '👤 Umum',
}

export const SEGMENT_COLOR = {
  SMK:    'blue',
  TKI:    'purple',
  PETANI: 'green',
  DIFABEL:'orange',
  UMUM:   'gray',
}
