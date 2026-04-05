'use strict'

const { generateUserEmbedding, generateJobEmbedding } = require('./embedding')
const {
  cosineSimilarity,
  skillMatchScore,
  locationScore,
  locationTextScore,
  experienceScore,
  segmentFitScore,
  salaryMatchScore,
} = require('./similarity')

const WEIGHTS = {
  skill:      0.40,
  location:   0.20,
  experience: 0.15,
  preference: 0.10,
  segment:    0.15,
}

function getGrade(score) {
  if (score >= 0.85) return { grade: 'A', label: 'Sangat Cocok', color: '#22c55e' }
  if (score >= 0.70) return { grade: 'B', label: 'Cocok',        color: '#84cc16' }
  if (score >= 0.55) return { grade: 'C', label: 'Cukup Cocok',  color: '#f59e0b' }
  if (score >= 0.40) return { grade: 'D', label: 'Kurang Cocok', color: '#f97316' }
  return { grade: 'F', label: 'Tidak Cocok', color: '#ef4444' }
}


/**
 * @param {Object} userProfile 
 * @param {string} userSegment 
 * @param {Object} job 
 * @returns {ScoringResult}
 *
 * @typedef {Object} ScoringResult
 * @property {number} totalScore 
 * @property {string} grade 
 * @property {string} gradeLabel 
 * @property {Object} scores 
 * @property {Object} weights 
 * @property {string[]} reasons 
 * @property {Object} details 
 */
function scoreMatch(userProfile, userSegment, job) {
  const profile = userProfile || {}
  const segment = userSegment || 'UMUM'

    const skillResult = skillMatchScore(
    profile.skills || [],
    job.requiredSkills || []
  )

    let semanticBoost = 0
  try {
    const userVec = generateUserEmbedding({
      skills:       profile.skills || [],
      preferredJob: profile.preferredJob || [],
      segment,
      major:        profile.major || profile.smkJurusan || '',
      bio:          profile.bio || '',
    })
    const jobVec = generateJobEmbedding({
      requiredSkills:   job.requiredSkills || [],
      title:            job.title || '',
      category:         job.category || '',
      description:      job.description || '',
      preferredSegments: job.preferredSegments || [],
    })
    const cosine = cosineSimilarity(userVec, jobVec)
        semanticBoost = cosine * 0.2
  } catch (_err) {
      }

  const rawSkillScore = Math.min(1, skillResult.score + semanticBoost)
   let locScore

  if (job.isRemote) {
    locScore = 1.0
  } else {
        const hasCoords = profile.latitude && profile.longitude && job.latitude && job.longitude
    if (hasCoords) {
      locScore = locationScore(
        { lat: profile.latitude, lng: profile.longitude },
        { lat: job.latitude,     lng: job.longitude }
      )
    } else {
            locScore = locationTextScore(
        profile.city, profile.province,
        job.city,     job.province,
        false
      )
    }
  }

  const expScore = experienceScore(
    profile.yearsExperience || 0,
    job.experienceMin || 0
  )

  const userPrefs   = (profile.preferredJob || []).map(s => s.toLowerCase())
  const jobTitleLow = (job.title || '').toLowerCase()
  const jobCatLow   = (job.category || '').toLowerCase()

  let prefScore = 0.5
  if (userPrefs.length > 0) {
    const titleMatches = userPrefs.filter(p =>
      jobTitleLow.includes(p) ||
      p.split(/\s+/).some(w => w.length > 2 && jobTitleLow.includes(w))
    )
    const catMatches = userPrefs.filter(p =>
      jobCatLow.includes(p) ||
      p.split(/\s+/).some(w => w.length > 2 && jobCatLow.includes(w))
    )
    const totalMatches = titleMatches.length + catMatches.length * 0.5
    prefScore = totalMatches > 0 ? Math.min(1, 0.5 + totalMatches * 0.25) : 0.3
  }

  const segScore    = segmentFitScore(segment, job.preferredSegments || [])
  const difabelBonus = (segment === 'DIFABEL' && job.openForDifabel) ? 0.15 : 0
  const finalSegScore = Math.min(1, segScore + difabelBonus)

  const rawTotal =
    rawSkillScore  * WEIGHTS.skill      +
    locScore       * WEIGHTS.location   +
    expScore       * WEIGHTS.experience +
    prefScore      * WEIGHTS.preference +
    finalSegScore  * WEIGHTS.segment

  const totalScore = Math.round(Math.min(1, rawTotal) * 100) / 100
  const { grade, label: gradeLabel, color: gradeColor } = getGrade(totalScore)
  const reasons = buildReasons({
    skillResult,
    rawSkillScore,
    semanticBoost,
    locScore,
    expScore,
    prefScore,
    finalSegScore,
    segment,
    job,
    profile,
    difabelBonus,
  })

  return {
    totalScore,
    grade,
    gradeLabel,
    gradeColor,
    scores: {
      skill:      Math.round(rawSkillScore  * 100) / 100,
      location:   Math.round(locScore       * 100) / 100,
      experience: Math.round(expScore       * 100) / 100,
      preference: Math.round(prefScore      * 100) / 100,
      segment:    Math.round(finalSegScore  * 100) / 100,
    },
    weights: WEIGHTS,
    reasons,
    details: {
      matchedSkills:  skillResult.matched,
      missingSkills:  skillResult.missing,
      skillCoverage:  `${skillResult.matched.length}/${(job.requiredSkills || []).length}`,
      semanticBoost:  Math.round(semanticBoost * 100) / 100,
      isRemote:       job.isRemote,
    },
  }
}

function buildReasons({ skillResult, rawSkillScore, semanticBoost, locScore, expScore, prefScore, finalSegScore, segment, job, profile, difabelBonus }) {
  const reasons = []

  if (skillResult.matched.length > 0) {
    const shown = skillResult.matched.slice(0, 3).join(', ')
    const more = skillResult.matched.length > 3 ? ` +${skillResult.matched.length - 3} lainnya` : ''
    reasons.push(`✅ Skill cocok: ${shown}${more}`)
  }

  if (rawSkillScore >= 0.85) {
    reasons.push('🎯 Profil skill sangat sesuai dengan kebutuhan posisi ini')
  } else if (rawSkillScore >= 0.70) {
    reasons.push('👍 Skill Anda sebagian besar memenuhi persyaratan')
  }

  if (semanticBoost >= 0.1) {
    reasons.push('🧠 AI mendeteksi kesamaan konteks keahlian yang relevan')
  }

  if (skillResult.missing.length > 0 && skillResult.missing.length <= 3) {
    const missing = skillResult.missing.join(', ')
    reasons.push(`⚠️ Skill yang perlu dikembangkan: ${missing}`)
  }

  if (job.isRemote) {
    reasons.push('🏠 Remote/WFH — bekerja dari mana saja di Indonesia')
  } else if (locScore >= 0.95) {
    reasons.push('📍 Lokasi sangat dekat — kota yang sama dengan domisili Anda')
  } else if (locScore >= 0.85) {
    reasons.push('📍 Lokasi sangat terjangkau (dalam 30km dari domisili)')
  } else if (locScore >= 0.70) {
    reasons.push('📍 Lokasi dalam radius yang masih terjangkau (30–50km)')
  } else if (locScore >= 0.50) {
    reasons.push('🚌 Lokasi memerlukan perjalanan, namun masih dalam provinsi')
  }

  const minExp = job.experienceMin || 0
  if (minExp === 0 && expScore >= 0.9) {
    reasons.push('🎓 Terbuka untuk fresh graduate — tidak memerlukan pengalaman sebelumnya')
  } else if (expScore >= 0.9) {
    reasons.push(`✅ Pengalaman Anda (${profile.yearsExperience || 0} tahun) memenuhi persyaratan (min. ${minExp} tahun)`)
  } else if (expScore >= 0.7) {
    reasons.push(`📈 Pengalaman Anda mendekati syarat minimum (${minExp} tahun)`)
  }

  if (finalSegScore >= 0.95) {
    const segLabel = { SMK: 'Lulusan SMK', TKI: 'Pekerja Migran', PETANI: 'Petani/Agribisnis', DIFABEL: 'Penyandang Disabilitas', UMUM: 'Umum' }
    reasons.push(`🏷️ Lowongan khusus diprioritaskan untuk ${segLabel[segment] || segment}`)
  }

  if (difabelBonus > 0) {
    reasons.push('♿ Perusahaan berkomitmen merekrut penyandang disabilitas (UU No. 8/2016)')
  }

  if (segment === 'SMK' && (job.city === profile?.city || job.province === profile?.province)) {
    reasons.push('🎓 SMK Bridge: Lowongan lokal — tidak perlu pindah kota')
  }

  if (prefScore >= 0.75) {
    reasons.push('⭐ Sesuai dengan preferensi jenis pekerjaan yang Anda inginkan')
  }

  if (reasons.length === 0) {
    reasons.push('📋 Ada beberapa kesesuaian dengan profil Anda')
  }

  return reasons
}

module.exports = { scoreMatch, WEIGHTS, getGrade }
