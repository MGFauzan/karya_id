'use strict'

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
  if (magnitude === 0) return 0

  return Math.max(0, Math.min(1, dotProduct / magnitude))
}

/**
 * Jaccard similarity antara dua set (untuk exact skill matching)
 * |A ∩ B| / |A ∪ B|
 */
function jaccardSimilarity(setA, setB) {
  if (!setA.length && !setB.length) return 1
  if (!setA.length || !setB.length) return 0

  const a = new Set(setA.map(s => s.toLowerCase().trim()))
  const b = new Set(setB.map(s => s.toLowerCase().trim()))

  let intersection = 0
  a.forEach(item => { if (b.has(item)) intersection++ })

  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}


/**
 * Hitung skill match score antara user skills dan required skills.
 * Menggunakan kombinasi exact match + partial/fuzzy matching.
 *
 * @returns {{ score: number, matched: string[], missing: string[], coverage: number }}
 */
function skillMatchScore(userSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 0.8, matched: userSkills, missing: [], coverage: 1.0 }
  }

  const userNorm = userSkills.map(s => s.toLowerCase().trim())

  const matched = []
  const missing = []

  requiredSkills.forEach(req => {
    const reqLow = req.toLowerCase().trim()
    const reqWords = reqLow.split(/[\s/+]+/)
    const exactMatch = userNorm.some(u => u === reqLow)
    const partialMatch = !exactMatch && userNorm.some(u => {
      const uWords = u.split(/[\s/+]+/)
      return reqWords.some(rw => rw.length > 2 && uWords.some(uw => uw.includes(rw) || rw.includes(uw)))
    })

    if (exactMatch || partialMatch) {
      matched.push(req)
    } else {
      missing.push(req)
    }
  })

  const coverage = matched.length / requiredSkills.length
  const extraSkillBonus = Math.min(0.1, (userSkills.length - matched.length) * 0.01)
  const score = Math.min(1.0, coverage + extraSkillBonus)

  return {
    score,
    matched,
    missing,
    coverage,
    userSkillCount: userSkills.length,
  }
}

const EARTH_RADIUS_KM = 6371

function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = deg => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Konversi jarak ke location score.
 *
 * Scoring curve:
 *   0–10 km   → 1.00 (sangat dekat)
 *   10–30 km  → 0.85
 *   30–50 km  → 0.70 (batas SMK Bridge)
 *   50–100 km → 0.50
 *   100–200 km→ 0.30
 *   200+ km   → 0.10
 *
 * @param {{ lat: number, lng: number }} userLoc
 * @param {{ lat: number, lng: number }} jobLoc
 * @returns {number} Score 0.0–1.0
 */
function locationScore(userLoc, jobLoc) {
  const { lat: ulat, lng: ulng } = userLoc || {}
  const { lat: jlat, lng: jlng } = jobLoc || {}

  // Both coords available
  if (ulat && ulng && jlat && jlng) {
    const distKm = haversineDistance(ulat, ulng, jlat, jlng)

    if (distKm <= 10)  return 1.00
    if (distKm <= 30)  return 0.85
    if (distKm <= 50)  return 0.70
    if (distKm <= 100) return 0.50
    if (distKm <= 200) return 0.30
    return 0.10
  }
  return 0.50
}

function locationTextScore(userCity, userProvince, jobCity, jobProvince, isRemote) {
  if (isRemote) return 1.0

  if (userCity && jobCity && userCity.toLowerCase() === jobCity.toLowerCase()) {
    return 0.95
  }

  if (userProvince && jobProvince && userProvince.toLowerCase() === jobProvince.toLowerCase()) {
    return 0.75
  }

  return 0.30 
}

/**
 * @param {number} userExp 
 * @param {number} requiredExp 
 * @returns {number} 
 */
function experienceScore(userExp = 0, requiredExp = 0) {
  if (requiredExp === 0) return 1.0

  if (userExp >= requiredExp) {
    const extra = Math.min(2, userExp - requiredExp)
    return Math.min(1.0, 0.9 + extra * 0.05)
  }

  const ratio = userExp / requiredExp
  if (ratio >= 0.8) return 0.75 
  if (ratio >= 0.5) return 0.50
  if (ratio >= 0.2) return 0.30
  return 0.15
}

/**
 * @param {string} userSegment 
 * @param {string[]} jobPreferredSegments 
 * @returns {number} 
 */
function segmentFitScore(userSegment, jobPreferredSegments = []) {
  if (!jobPreferredSegments || jobPreferredSegments.length === 0) {
    return 0.6 
  }

  if (jobPreferredSegments.includes(userSegment)) {
    return 1.0 
  }

  if (jobPreferredSegments.includes('UMUM')) {
    return 0.7 
  }

  return 0.3 
}

/**
 * @param {number|null} expectedSalary 
 * @param {number|null} salaryMin
 * @param {number|null} salaryMax
 * @returns {number} 
 */
function salaryMatchScore(expectedSalary, salaryMin, salaryMax) {
  if (!expectedSalary || (!salaryMin && !salaryMax)) return 0.5

  const min = salaryMin || 0
  const max = salaryMax || salaryMin * 2

  if (expectedSalary >= min && expectedSalary <= max) return 1.0
  if (expectedSalary < min) {
      return 0.8
  }
  const overRatio = (expectedSalary - max) / max
  if (overRatio <= 0.2) return 0.6
  if (overRatio <= 0.5) return 0.4
  return 0.2
}

module.exports = {
  cosineSimilarity,
  jaccardSimilarity,
  skillMatchScore,
  locationScore,
  locationTextScore,
  experienceScore,
  segmentFitScore,
  salaryMatchScore,
  haversineDistance,
}
