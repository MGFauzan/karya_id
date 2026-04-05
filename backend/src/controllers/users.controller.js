const { PrismaClient } = require('@prisma/client')
const { asyncHandler }  = require('../middleware/error')
const { generateJobEmbedding } = require('../../../ai/embedding')

const prisma = new PrismaClient()

const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where:   { id: req.user.id },
    include: { profile: true },
    select: {
      id: true, email: true, name: true, role: true, segment: true,
      isVerified: true, createdAt: true, profile: true,
    }
  })
  res.json({ user })
})

const updateProfile = asyncHandler(async (req, res) => {
  const {
    phone, bio, avatar, birthDate, gender,
    province, city, district, latitude, longitude,
    educationLevel, school, major, graduationYear,
    yearsExperience, currentJob, expectedSalary,
    skills, certifications, languages, preferredJob,
    smkJurusan, tikiDestination, petaniCommodity, difabelType,
  } = req.body

  let embeddingVector = undefined
  if (skills) {
    try {
      const { generateUserEmbedding } = require('../../../ai/embedding')
      embeddingVector = generateUserEmbedding({
        skills: skills || [],
        preferredJob: preferredJob || [],
        segment: req.user.segment,
      })
    } catch {}
  }

  const profile = await prisma.userProfile.upsert({
    where:  { userId: req.user.id },
    create: { userId: req.user.id, ...req.body, embeddingVector },
    update: {
      ...(phone !== undefined && { phone }),
      ...(bio !== undefined && { bio }),
      ...(avatar !== undefined && { avatar }),
      ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
      ...(gender !== undefined && { gender }),
      ...(province !== undefined && { province }),
      ...(city !== undefined && { city }),
      ...(district !== undefined && { district }),
      ...(latitude !== undefined && { latitude: Number(latitude) }),
      ...(longitude !== undefined && { longitude: Number(longitude) }),
      ...(educationLevel !== undefined && { educationLevel }),
      ...(school !== undefined && { school }),
      ...(major !== undefined && { major }),
      ...(graduationYear !== undefined && { graduationYear: Number(graduationYear) }),
      ...(yearsExperience !== undefined && { yearsExperience: Number(yearsExperience) }),
      ...(currentJob !== undefined && { currentJob }),
      ...(expectedSalary !== undefined && { expectedSalary: Number(expectedSalary) }),
      ...(skills !== undefined && { skills }),
      ...(certifications !== undefined && { certifications }),
      ...(languages !== undefined && { languages }),
      ...(preferredJob !== undefined && { preferredJob }),
      ...(smkJurusan !== undefined && { smkJurusan }),
      ...(tikiDestination !== undefined && { tikiDestination }),
      ...(petaniCommodity !== undefined && { petaniCommodity }),
      ...(difabelType !== undefined && { difabelType }),
      ...(embeddingVector !== undefined && { embeddingVector }),
    }
  })

  res.json({ message: 'Profil berhasil diperbarui', profile })
})

const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.params.id },
    select: {
      id: true, name: true, segment: true, createdAt: true,
      profile: {
        select: {
          bio: true, avatar: true, province: true, city: true,
          educationLevel: true, school: true, major: true,
          yearsExperience: true, skills: true, certifications: true,
          smkJurusan: true,
        }
      }
    }
  })
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' })
  res.json({ user })
})

const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await prisma.application.findMany({
    where:   { userId: req.user.id },
    include: {
      job: {
        include: { company: { select: { name: true, logo: true, city: true } } }
      }
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ applications })
})

const getSkillGap = asyncHandler(async (req, res) => {
  const { targetJobTitle } = req.query
  const profile = req.user.profile

  if (!profile) {
    return res.status(400).json({ error: 'Lengkapi profil Anda terlebih dahulu' })
  }

  const jobs = await prisma.job.findMany({
    where: targetJobTitle
      ? { title: { contains: targetJobTitle, mode: 'insensitive' }, status: 'OPEN' }
      : { status: 'OPEN' },
    take: 5,
  })

  if (!jobs.length) {
    return res.json({ missingSkills: [], recommendations: [], message: 'Tidak ada lowongan yang cocok ditemukan' })
  }

  const requiredSkills = [...new Set(jobs.flatMap(j => j.requiredSkills))]
  const userSkills     = (profile.skills || []).map(s => s.toLowerCase())
  const missingSkills  = requiredSkills.filter(s => !userSkills.includes(s.toLowerCase()))

  const trainings = await prisma.training.findMany({
    where: {
      skills: { hasSome: missingSkills },
      segments: { hasSome: [req.user.segment, 'UMUM'] },
    },
    take: 5,
  })

  if (missingSkills.length > 0) {
    await prisma.skillGap.create({
      data: {
        userId: req.user.id,
        targetJobTitle: targetJobTitle || 'General',
        missingSkills,
        recommendations: trainings.map(t => t.title),
      }
    })
  }

  res.json({
    currentSkills:  profile.skills || [],
    requiredSkills,
    missingSkills,
    matchedJobs:    jobs.map(j => ({ id: j.id, title: j.title, city: j.city })),
    trainings,
    completionRate: requiredSkills.length > 0
      ? Math.round(((requiredSkills.length - missingSkills.length) / requiredSkills.length) * 100)
      : 100,
  })
})

module.exports = { getProfile, updateProfile, getPublicProfile, getMyApplications, getSkillGap }
