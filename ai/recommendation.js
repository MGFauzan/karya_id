'use strict'

const { scoreMatch } = require('./scoring')
const DEFAULT_MIN_SCORE  = 0.20 
const DEFAULT_MAX_RESULTS = 20

//  Main Function 

/**
 * @param {Object} userProfile 
 * @param {string} userSegment 
 * @param {Object[]} jobs 
 * @param {Object} [options]
 * @param {number} [options.minScore=0.20] 
 * @param {number} [options.maxResults=20] 
 * @param {boolean} [options.includeReasons=true] 
 * @returns {RecommendationResult[]}
 *
 * @typedef {Object} RecommendationResult
 * @property {Object} job 
 * @property {number} totalScore 
 * @property {string} grade 
 * @property {string} gradeLabel
 * @property {Object} scores 
 * @property {string[]} reasons 
 * @property {Object} details 
 */
function generateRecommendations(userProfile, userSegment, jobs, options = {}) {
  const {
    minScore    = DEFAULT_MIN_SCORE,
    maxResults  = DEFAULT_MAX_RESULTS,
    includeReasons = true,
  } = options

  if (!jobs || !jobs.length) return []
  const scored = jobs.map(job => {
    const result = scoreMatch(userProfile, userSegment, job)
    return {
      job,
      ...result,
      reasons: includeReasons ? result.reasons : [],
    }
  })

    const filtered = scored.filter(r => r.totalScore >= minScore)

    filtered.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        return (b.scores.segment - a.scores.segment)
  })

  return filtered.slice(0, maxResults)
}

//  Skill Gap Analysis 

/**
 * @param {string[]} userSkills 
 * @param {Object[]} jobs 
 * @param {string} segment 
 * @returns {SkillGapResult}
 *
 * @typedef {Object} SkillGapResult
 * @property {string[]} currentSkills
 * @property {string[]} missingSkills 
 * @property {Object[]} skillFrequency 
 * @property {string[]} prioritySkills
 */
function analyzeSkillGap(userSkills, jobs, segment = 'UMUM') {
  const userNorm = (userSkills || []).map(s => s.toLowerCase().trim())
  const skillCount = {}

  jobs.forEach(job => {
    const reqSkills = job.requiredSkills || []
    reqSkills.forEach(skill => {
      const skillLow = skill.toLowerCase().trim()
      if (!userNorm.includes(skillLow)) {
        skillCount[skill] = (skillCount[skill] || 0) + 1
      }
    })
  })

  const skillFrequency = Object.entries(skillCount)
    .map(([skill, count]) => ({ skill, count, frequency: count / jobs.length }))
    .sort((a, b) => b.count - a.count)

  const missingSkills   = skillFrequency.map(s => s.skill)
  const prioritySkills  = missingSkills.slice(0, 5)

  return {
    currentSkills: userSkills,
    missingSkills,
    skillFrequency,
    prioritySkills,
    totalJobsAnalyzed: jobs.length,
  }
}

//  SMK Bridge 

/**
 * @param {Object} userProfile
 * @param {Object[]} jobs 
 * @param {Object[]} trainings 
 * @returns {SMKBridgeResult}
 */
function smkBridgeRecommendations(userProfile, jobs, trainings = []) {
    const jobRecs = generateRecommendations(userProfile, 'SMK', jobs, {
    minScore:   0.15,
    maxResults: 15,
  })

    const gapAnalysis = analyzeSkillGap(userProfile.skills || [], jobs, 'SMK')
    const trainingRecs = matchTrainings(gapAnalysis.prioritySkills, trainings)

  return {
    segment:         'SMK',
    jurusan:         userProfile.smkJurusan,
    jobRecommendations: jobRecs,
    skillGap:        gapAnalysis,
    trainingRecommendations: trainingRecs,
    summary: {
      totalNearbyJobs: jobs.length,
      topMatchScore:   jobRecs[0]?.totalScore || 0,
      skillsToLearn:   gapAnalysis.prioritySkills.length,
    },
  }
}

function matchTrainings(missingSkills, trainings) {
  if (!trainings || !trainings.length) return []

  const missingNorm = missingSkills.map(s => s.toLowerCase())

  return trainings
    .map(training => {
      const trainingSkills = (training.skills || []).map(s => s.toLowerCase())
      const coveredSkills  = missingNorm.filter(s =>
        trainingSkills.some(ts => ts.includes(s) || s.includes(ts))
      )
      return {
        ...training,
        coveredMissingSkills: coveredSkills,
        relevanceScore: coveredSkills.length / Math.max(1, missingSkills.length),
      }
    })
    .filter(t => t.coveredMissingSkills.length > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5)
}

//  Quick Stats 

function getRecommendationStats(recommendations) {
  if (!recommendations.length) {
    return { total: 0, averageScore: 0, gradeDistribution: {} }
  }

  const total = recommendations.length
  const averageScore = recommendations.reduce((sum, r) => sum + r.totalScore, 0) / total

  const gradeDistribution = recommendations.reduce((dist, r) => {
    const g = r.grade || 'F'
    dist[g] = (dist[g] || 0) + 1
    return dist
  }, {})

  return {
    total,
    averageScore: Math.round(averageScore * 100) / 100,
    gradeDistribution,
    topScore: recommendations[0]?.totalScore || 0,
  }
}

module.exports = {
  generateRecommendations,
  analyzeSkillGap,
  smkBridgeRecommendations,
  matchTrainings,
  getRecommendationStats,
}
