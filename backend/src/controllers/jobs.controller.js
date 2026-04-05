const { PrismaClient } = require('@prisma/client')
const { asyncHandler }  = require('../middleware/error')

const prisma = new PrismaClient()

const getJobs = asyncHandler(async (req, res) => {
  const {
    search, category, type, province, city,
    segment, openForDifabel, isRemote,
    salaryMin, salaryMax,
    page = 1, limit = 12,
  } = req.query

  const skip = (Number(page) - 1) * Number(limit)

  const where = {
    status: 'OPEN',
    ...(search && {
      OR: [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category:    { contains: search, mode: 'insensitive' } },
        { requiredSkills: { hasSome: [search.toLowerCase()] } },
      ]
    }),
    ...(category       && { category:       { contains: category,  mode: 'insensitive' } }),
    ...(type           && { type }),
    ...(province       && { province:       { contains: province,  mode: 'insensitive' } }),
    ...(city           && { city:           { contains: city,      mode: 'insensitive' } }),
    ...(segment        && { preferredSegments: { hasSome: [segment] } }),
    ...(openForDifabel === 'true' && { openForDifabel: true }),
    ...(isRemote       === 'true' && { isRemote:       true }),
    ...(salaryMin      && { salaryMax: { gte: Number(salaryMin) } }),
    ...(salaryMax      && { salaryMin: { lte: Number(salaryMax) } }),
  }

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      include: {
        company: {
          select: { name: true, logo: true, city: true, province: true, isInclusiveEmployer: true, isVerified: true }
        },
        _count: { select: { applications: true } }
      },
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: Number(limit),
    })
  ])

  res.json({
    jobs,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    }
  })
})

const getJobById = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({
    where:   { id: req.params.id },
    include: {
      company: true,
      _count:  { select: { applications: true } },
    }
  })
  if (!job) return res.status(404).json({ error: 'Lowongan tidak ditemukan' })
  res.json({ job })
})

const createJob = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } })
  if (!company) {
    return res.status(400).json({ error: 'Profil perusahaan belum dibuat' })
  }

  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      ...req.body,
    },
    include: { company: true },
  })

  res.status(201).json({ message: 'Lowongan berhasil dibuat', job })
})

const updateJob = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { company: true } })
  if (!job) return res.status(404).json({ error: 'Lowongan tidak ditemukan' })

  if (req.user.role !== 'ADMIN' && job.company.userId !== req.user.id) {
    return res.status(403).json({ error: 'Tidak memiliki akses ke lowongan ini' })
  }

  const updated = await prisma.job.update({
    where: { id: req.params.id },
    data:  req.body,
  })

  res.json({ message: 'Lowongan berhasil diperbarui', job: updated })
})

const deleteJob = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { company: true } })
  if (!job) return res.status(404).json({ error: 'Lowongan tidak ditemukan' })

  if (req.user.role !== 'ADMIN' && job.company.userId !== req.user.id) {
    return res.status(403).json({ error: 'Tidak memiliki akses' })
  }

  await prisma.job.delete({ where: { id: req.params.id } })
  res.json({ message: 'Lowongan berhasil dihapus' })
})

const applyJob = asyncHandler(async (req, res) => {
  const { coverLetter } = req.body

  const job = await prisma.job.findUnique({ where: { id: req.params.id } })
  if (!job) return res.status(404).json({ error: 'Lowongan tidak ditemukan' })
  if (job.status !== 'OPEN') return res.status(400).json({ error: 'Lowongan sudah ditutup' })

  const existing = await prisma.application.findUnique({
    where: { userId_jobId: { userId: req.user.id, jobId: job.id } }
  })
  if (existing) return res.status(409).json({ error: 'Anda sudah melamar pekerjaan ini' })
  let aiScore = null
  try {
    const { scoreMatch } = require('../../../ai/scoring')
    const profile = req.user.profile
    if (profile) {
      const result = scoreMatch(profile, req.user.segment, job)
      aiScore = result.totalScore
    }
  } catch {}

  const application = await prisma.application.create({
    data: {
      userId:      req.user.id,
      jobId:       job.id,
      coverLetter,
      aiScore,
    },
    include: { job: { include: { company: { select: { name: true } } } } }
  })

  res.status(201).json({
    message:     'Lamaran berhasil dikirim! Tim HR akan menghubungi Anda.',
    application,
  })
})

const getMyJobs = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } })
  if (!company) return res.status(404).json({ error: 'Profil perusahaan tidak ditemukan' })

  const jobs = await prisma.job.findMany({
    where:   { companyId: company.id },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ jobs })
})

const getApplicants = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { company: true } })
  if (!job) return res.status(404).json({ error: 'Lowongan tidak ditemukan' })

  if (req.user.role !== 'ADMIN' && job.company.userId !== req.user.id) {
    return res.status(403).json({ error: 'Tidak memiliki akses' })
  }

  const applications = await prisma.application.findMany({
    where:   { jobId: req.params.id },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, segment: true,
          profile: {
            select: {
              phone: true, city: true, province: true, skills: true,
              yearsExperience: true, educationLevel: true, avatar: true,
            }
          }
        }
      }
    },
    orderBy: [{ aiScore: 'desc' }, { createdAt: 'desc' }],
  })

  res.json({ applications, total: applications.length })
})

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, notifyEmail = true, notifyWa = false } = req.body

  const app = await prisma.application.update({
    where:   { id: req.params.appId },
    data:    { status },
    include: {
      user: {
        select: {
          name: true, email: true,
          profile: { select: { phone: true } }
        }
      },
      job: {
        select: {
          title: true,
          company: { select: { name: true } }
        }
      }
    }
  })

  const applicantName  = app.user.name
  const applicantEmail = app.user.email
  const applicantPhone = app.user.profile?.phone || null
  const jobTitle       = app.job.title
  const companyName    = app.job.company.name

  const STATUS_MSG = {
    REVIEWED:    { label: 'sedang ditinjau',    emoji: '👀' },
    SHORTLISTED: { label: 'masuk shortlist',    emoji: '⭐' },
    INTERVIEW:   { label: 'dipanggil interview', emoji: '🗣️' },
    HIRED:       { label: 'DITERIMA',            emoji: '🎉' },
    REJECTED:    { label: 'tidak dilanjutkan',   emoji: '😔' },
  }
  const info = STATUS_MSG[status]

  const emailBody = info
    ? `Halo ${applicantName},\n\nLamaran Anda untuk posisi "${jobTitle}" di ${companyName} ${info.label} ${info.emoji}.\n\nTerima kasih,\nTim ${companyName}`
    : null

  let waLink = null
  if (notifyWa && applicantPhone && info) {
    const phone = applicantPhone.replace(/\D/g, '').replace(/^0/, '62')
    const msg   = encodeURIComponent(
      `Halo ${applicantName} ${info.emoji}\n\nLamaran Anda untuk posisi *${jobTitle}* di *${companyName}* ${info.label}.\n\nSalam,\nTim ${companyName}`
    )
    waLink = `https://wa.me/${phone}?text=${msg}`
  }

  let mailtoLink = null
  if (notifyEmail && info) {
    const subject = encodeURIComponent(`[KARYA.ID] Update Lamaran: ${jobTitle} — ${companyName}`)
    const body    = encodeURIComponent(emailBody)
    mailtoLink = `mailto:${applicantEmail}?subject=${subject}&body=${body}`
  }

  res.json({
    message: 'Status lamaran diperbarui',
    application: app,
    notification: {
      applicantName,
      applicantEmail,
      applicantPhone,
      waLink,
      mailtoLink,
      canNotify: !!info,
    }
  })
})

module.exports = {
  getJobs, getJobById, createJob, updateJob, deleteJob,
  applyJob, getMyJobs, getApplicants, updateApplicationStatus,
}
