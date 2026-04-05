'use strict'

const DOMAIN_VOCAB = [
  // Tech Skills
  'javascript','typescript','python','java','php','golang','rust','kotlin','swift',
  'react','nextjs','vuejs','angular','nodejs','express','fastapi','django','laravel',
  'mysql','postgresql','mongodb','redis','elasticsearch','firebase',
  'docker','kubernetes','aws','gcp','azure','terraform','ci/cd','devops',
  'html','css','tailwind','bootstrap','figma','ui','ux','design',
  'machine learning','deep learning','nlp','computer vision','tensorflow','pytorch',
  'data science','data analyst','sql','excel','tableau','powerbi',
  'android','ios','flutter','react native','mobile',
  'api','rest','graphql','microservices','backend','frontend','fullstack',
  'git','linux','bash','agile','scrum',

  // Manufacturing & Industrial
  'operator','mesin','cnc','las','welder','elektro','elektronika',
  'teknik','mekanik','otomotif','manufaktur','produksi','quality control','qc',
  'k3','keselamatan','logistik','gudang','warehouse','forklift',

  // Agriculture (Petani segment)
  'pertanian','agribisnis','hortikultura','perkebunan','peternakan','aquaculture',
  'pupuk','pestisida','irigasi','panen','tanam','cocok tanam','agro',
  'kelapa sawit','karet','kopi','kakao','padi','jagung','sayuran','buah',

  // Service & Hospitality
  'pelayanan','customer service','cs','barista','kasir','resepsionis',
  'hotel','restoran','pariwisata','travel','guide','tour','hospitality',
  'admin','administrasi','sekretaris','office','clerk',

  // Healthcare
  'perawat','nurse','bidan','dokter','apoteker','farmasi','kesehatan','medis',
  'laboratorium','radiologi','fisioterapi','gizi','nutrisi',

  // Education
  'guru','pengajar','tutor','trainer','instruktur','pendidikan','kurikulum',

  // Finance & Business
  'akuntan','accounting','keuangan','finance','audit','pajak','tax',
  'sales','marketing','digital marketing','seo','sosial media','content creator',
  'hrm','hrd','rekrutmen','recruitment','payroll','legal','hukum',

  // Construction
  'sipil','arsitek','drafter','autocad','konstruksi','bangunan',
  'listrik','plumbing','ac','hvac',

  // TKI-relevant
  'bahasa inggris','bahasa arab','bahasa jepang','bahasa korea','bahasa mandarin',
  'overseas','luar negeri','domestik','caregiver','housekeeper','fabrik',

  // Difabel-friendly roles
  'remote','wfh','work from home','online','telework','fleksibel',
  'data entry','pengetikan','call center','customer support','design grafis',

  // SMK Jurusan
  'akuntansi','tkj','tkr','tav','toi','dpib','animasi','multimedia',
  'perhotelan','kecantikan','tata boga','busana','farmasi klinis',

  // Soft Skills
  'komunikasi','teamwork','leadership','problem solving','kreatif','inovatif',
  'teliti','jujur','disiplin','bertanggung jawab','adaptif',

  // Location Keywords
  'jakarta','bandung','surabaya','medan','semarang','makassar','yogyakarta',
  'bali','bekasi','tangerang','depok','bogor','malang','palembang',
  'jawa barat','jawa tengah','jawa timur','sumatera','kalimantan','sulawesi',

  // Job Categories
  'teknologi','informasi','it','programmer','developer','engineer','analyst',
  'manajer','supervisor','koordinator','kepala','staff','junior','senior',
  'magang','internship','fresh graduate','entry level','mid level','senior level',
]

//  Skill Aliases 
const SKILL_ALIASES = {
  'js':           'javascript',
  'ts':           'typescript',
  'py':           'python',
  'node':         'nodejs',
  'next':         'nextjs',
  'vue':          'vuejs',
  'react js':     'react',
  'next js':      'nextjs',
  'node js':      'nodejs',
  'mongo':        'mongodb',
  'postgres':     'postgresql',
  'ml':           'machine learning',
  'dl':           'deep learning',
  'ai':           'machine learning',
  'k8s':          'kubernetes',
  'tf':           'tensorflow',
  'rn':           'react native',
  'ci cd':        'ci/cd',
  'ui/ux':        'ux',
  'ms excel':     'excel',
  'microsoft excel': 'excel',
}

const VOCAB_INDEX = {}
DOMAIN_VOCAB.forEach((term, idx) => { VOCAB_INDEX[term] = idx })
const VOCAB_SIZE = DOMAIN_VOCAB.length

const SEGMENT_BOOST = {
  SMK:    { 'fresh graduate': 2.0, 'entry level': 2.0, 'magang': 2.0, 'apprenticeship': 2.0 },
  TKI:    { 'overseas': 2.5, 'luar negeri': 2.5, 'bahasa inggris': 1.5, 'bahasa arab': 1.5, 'bahasa jepang': 1.5 },
  PETANI: { 'pertanian': 2.5, 'agribisnis': 2.5, 'kelapa sawit': 2.0, 'perkebunan': 2.0 },
  DIFABEL:{ 'remote': 2.0, 'wfh': 2.0, 'work from home': 2.0, 'fleksibel': 2.0, 'online': 1.5 },
  UMUM:   {},
}


function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim()
  return SKILL_ALIASES[lower] || lower
}

function tokenize(text) {
  const lower = text.toLowerCase()
  const found = []

  DOMAIN_VOCAB.filter(v => v.includes(' ')).forEach(term => {
    if (lower.includes(term)) found.push(term)
  })

  const words = lower.split(/[\s,;/|+\-]+/)
  words.forEach(word => {
    const norm = SKILL_ALIASES[word] || word
    if (VOCAB_INDEX[norm] !== undefined) found.push(norm)
  })

  return [...new Set(found)]
}

function buildVector(terms, segmentBoost = {}) {
  const vector = new Array(VOCAB_SIZE).fill(0)

  terms.forEach(term => {
    const normalized = normalizeSkill(term)
    const idx = VOCAB_INDEX[normalized]
    if (idx !== undefined) {
      const boost = segmentBoost[normalized] || 1.0
      vector[idx] += boost
    }
    const tokens = tokenize(term)
    tokens.forEach(token => {
      const tidx = VOCAB_INDEX[token]
      if (tidx !== undefined) {
        const tboost = segmentBoost[token] || 1.0
        vector[tidx] = Math.max(vector[tidx], tboost * 0.8)
      }
    })
  })

  return vector
}

function normalize(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
  if (magnitude === 0) return vector
  return vector.map(v => v / magnitude)
}

//  Public API 

/** 
 * @param {Object} params
 * @param {string[]} params.skills 
 * @param {string[]} params.preferredJob 
 * @param {string} params.segment 
 * @param {string} [params.major] 
 * @param {string} [params.bio] 
 * @returns {number[]} 
 */
function generateUserEmbedding({ skills = [], preferredJob = [], segment = 'UMUM', major = '', bio = '' }) {
  const boosts = SEGMENT_BOOST[segment] || {}
  const terms = [
    ...skills.map(normalizeSkill),
    ...preferredJob.map(normalizeSkill),
    ...tokenize(major),
    ...tokenize(bio),
  ]
  const vector = buildVector(terms, boosts)
  return normalize(vector)
}

/**
 * @param {Object} params
 * @param {string[]} params.requiredSkills 
 * @param {string} params.title 
 * @param {string} [params.category] 
 * @param {string} [params.description] 
 * @param {string[]} [params.preferredSegments] 
 * @returns {number[]} 
 */
function generateJobEmbedding({ requiredSkills = [], title = '', category = '', description = '', preferredSegments = [] }) {
    const boosts = {}
  preferredSegments.forEach(seg => {
    const segBoosts = SEGMENT_BOOST[seg] || {}
    Object.assign(boosts, segBoosts)
  })

  const terms = [
    ...requiredSkills.map(normalizeSkill),
    ...tokenize(title),
    ...tokenize(category),
    ...tokenize(description.slice(0, 500)), 
  ]

  const vector = buildVector(terms, boosts)
  return normalize(vector)
}

function getSegmentKeywords(segment) {
  return Object.keys(SEGMENT_BOOST[segment] || {})
}

module.exports = {
  generateUserEmbedding,
  generateJobEmbedding,
  normalizeSkill,
  tokenize,
  getSegmentKeywords,
  VOCAB_SIZE,
  DOMAIN_VOCAB,
}
