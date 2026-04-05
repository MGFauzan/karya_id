const { PrismaClient }  = require('@prisma/client')
const { asyncHandler }   = require('../middleware/error')
const { scoreMatch }     = require('../../../ai/scoring')
const { generateRecommendations } = require('../../../ai/recommendation')

const prisma = new PrismaClient()

const getRecommendations = asyncHandler(async (req, res) => {
  const { limit = 10, refresh = false } = req.query

  const user = await prisma.user.findUnique({
    where:   { id: req.user.id },
    include: { profile: true },
  })

  if (!user.profile) {
    return res.status(400).json({
      error:   'Profil belum dilengkapi',
      message: 'Lengkapi profil Anda (skills, lokasi, pengalaman) untuk mendapatkan rekomendasi AI.',
    })
  }

  if (!user.profile.skills?.length) {
    return res.status(400).json({
      error:   'Skills belum diisi',
      message: 'Tambahkan skills Anda di profil untuk mendapatkan rekomendasi yang akurat.',
    })
  }

  if (refresh !== 'true') {
    const cached = await prisma.recommendation.findMany({
      where:   { userId: user.id },
      include: { job: { include: { company: { select: { name: true, logo: true, city: true, isInclusiveEmployer: true } } } } },
      orderBy: { totalScore: 'desc' },
      take:    Number(limit),
    })

    if (cached.length > 0) {
      await prisma.recommendation.updateMany({
        where: { userId: user.id, isViewed: false },
        data:  { isViewed: true, viewedAt: new Date() },
      })
      return res.json({ recommendations: cached, cached: true })
    }
  }

  const jobs = await prisma.job.findMany({
    where: { status: 'OPEN' },
    include: { company: { select: { name: true, logo: true, city: true, province: true, isInclusiveEmployer: true } } },
  })

  if (!jobs.length) {
    return res.json({ recommendations: [], cached: false, message: 'Belum ada lowongan tersedia' })
  }

  const scored = generateRecommendations(user.profile, user.segment, jobs)
  const topN = scored.slice(0, Number(limit))

  await prisma.recommendation.deleteMany({ where: { userId: user.id } })
  
  if (topN.length > 0) {
    await prisma.recommendation.createMany({
      data: topN.map(r => ({
        userId:           user.id,
        jobId:            r.job.id,
        totalScore:       r.totalScore,
        skillScore:       r.scores.skill,
        locationScore:    r.scores.location,
        experienceScore:  r.scores.experience,
        preferenceScore:  r.scores.preference,
        segmentScore:     r.scores.segment,
        reasons:          r.reasons,
      }))
    })
  }

  const recs = await prisma.recommendation.findMany({
    where:   { userId: user.id },
    include: { job: { include: { company: { select: { name: true, logo: true, city: true, isInclusiveEmployer: true } } } } },
    orderBy: { totalScore: 'desc' },
    take:    Number(limit),
  })

  res.json({ recommendations: recs, cached: false, total: recs.length })
})

const quickMatch = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where:   { id: req.user.id },
    include: { profile: true },
  })

  if (!user.profile?.skills?.length) {
    return res.status(400).json({ error: 'Profil dengan skills diperlukan' })
  }

  const jobs = await prisma.job.findMany({
    where:   { status: 'OPEN' },
    include: { company: { select: { name: true, logo: true, city: true } } },
  })

  const scored = generateRecommendations(user.profile, user.segment, jobs)
  
  res.json({
    topMatches: scored.slice(0, 5),
    totalJobs:  jobs.length,
  })
})

const scoreJobMatch = asyncHandler(async (req, res) => {
  const { jobId } = req.body

  const [user, job] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user.id }, include: { profile: true } }),
    prisma.job.findUnique({ where: { id: jobId }, include: { company: true } }),
  ])

  if (!job)        return res.status(404).json({ error: 'Lowongan tidak ditemukan' })
  if (!user.profile) return res.status(400).json({ error: 'Profil belum dilengkapi' })

  const result = scoreMatch(user.profile, user.segment, job)

  res.json({
    jobId,
    jobTitle:  job.title,
    company:   job.company.name,
    ...result,
  })
})

const smkBridge = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where:   { id: req.user.id },
    include: { profile: true },
  })

  if (user.segment !== 'SMK') {
    return res.status(400).json({ error: 'Fitur ini khusus untuk pengguna segmen SMK' })
  }

  const { city, province } = user.profile || {}
  const nearbyJobs = await prisma.job.findMany({
    where: {
      status:  'OPEN',
      preferredSegments: { hasSome: ['SMK'] },
      OR: [
        ...(city     ? [{ city:     { contains: city,     mode: 'insensitive' } }] : []),
        ...(province ? [{ province: { contains: province, mode: 'insensitive' } }] : []),
        { isRemote: true },
      ]
    },
    include: { company: { select: { name: true, logo: true, city: true, province: true } } },
    take: 20,
  })

  const profile = user.profile
  const scored  = generateRecommendations(profile, 'SMK', nearbyJobs)
  const allRequiredSkills = [...new Set(nearbyJobs.flatMap(j => j.requiredSkills))]
  const userSkills        = (profile?.skills || []).map(s => s.toLowerCase())
  const missingSkills     = allRequiredSkills.filter(s => !userSkills.includes(s.toLowerCase()))
  const trainings = await prisma.training.findMany({
    where:   { skills: { hasSome: missingSkills }, segments: { hasSome: ['SMK'] } },
    take:    5,
  })

  res.json({
    segment:       'SMK',
    jurusan:       profile?.smkJurusan,
    nearbyJobs:    scored.slice(0, 10),
    skillGap: {
      currentSkills:  profile?.skills || [],
      missingSkills,
      trainings,
    },
    totalNearby:   nearbyJobs.length,
  })
})

module.exports = { getRecommendations, quickMatch, scoreJobMatch, smkBridge }
