const { PrismaClient } = require('@prisma/client')
const { asyncHandler }  = require('../middleware/error')

const prisma = new PrismaClient()

const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalCompanies, totalJobs, totalApplications,
    usersBySegment, jobsByStatus, recentApplications,
    placementRate,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.company.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.user.groupBy({ by: ['segment'], _count: true }),
    prisma.job.groupBy({ by: ['status'], _count: true }),
    prisma.application.findMany({
      take:    10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, segment: true } },
        job:  { include: { company: { select: { name: true } } } },
      }
    }),
    prisma.application.count({ where: { status: 'HIRED' } }),
  ])

  res.json({
    overview: {
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      placementRate: totalApplications > 0
        ? Math.round((placementRate / totalApplications) * 100)
        : 0,
      activeJobs: jobsByStatus.find(j => j.status === 'OPEN')?._count || 0,
    },
    usersBySegment: usersBySegment.reduce((acc, u) => {
      acc[u.segment] = u._count; return acc
    }, {}),
    jobsByStatus: jobsByStatus.reduce((acc, j) => {
      acc[j.status] = j._count; return acc
    }, {}),
    recentApplications,
  })
})

const USER_SELECT = {
  id: true, email: true, name: true, role: true, segment: true,
  isVerified: true, isActive: true, createdAt: true, updatedAt: true,
}

const getAllUsers = asyncHandler(async (req, res) => {
  const { segment, role, search, page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const where = {
    ...(segment && { segment }),
    ...(role    && { role }),
    ...(search  && {
      OR: [
        { name:  { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }),
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        ...USER_SELECT,
        profile: { select: { city: true, province: true, skills: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    })
  ])

  res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) })
})

const updateUser = asyncHandler(async (req, res) => {
  const { isVerified, isActive, role, _toggle } = req.body

  let data = {}
  if (_toggle) {
    // Toggle isActive: fetch current value and flip it
    const current = await prisma.user.findUnique({ where: { id: req.params.id }, select: { isActive: true } })
    data.isActive = !current.isActive
  } else {
    if (isVerified !== undefined) data.isVerified = isVerified
    if (isActive   !== undefined) data.isActive   = isActive
    if (role)                     data.role        = role
  }

  const rawUser = await prisma.user.update({
    where: { id: req.params.id },
    data,
  })
  const { password: _pw, ...user } = rawUser
  res.json({ message: 'User berhasil diperbarui', user })
})

const bcrypt = require('bcryptjs')

const createCompany = asyncHandler(async (req, res) => {
  const {
    // User account fields
    email, password = 'company123',
    contactName,
    // Company fields
    name, description, industry, size, website,
    province, city, address,
    isInclusiveEmployer = false, difabelQuota = 0,
    isVerified = false,
  } = req.body

  if (!email || !name || !contactName) {
    return res.status(400).json({ error: 'Email, nama perusahaan, dan nama kontak wajib diisi' })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'Email sudah terdaftar' })

  const hashedPw = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPw,
      name: contactName,
      role: 'COMPANY',
      segment: 'UMUM',
      isVerified: true,
      isActive: true,
      company: {
        create: {
          name, description, industry, size, website,
          province, city, address,
          isInclusiveEmployer,
          difabelQuota: Number(difabelQuota) || 0,
          isVerified,
        }
      }
    },
    include: {
      company: true,
    },
  })

  const { password: _pw, ...safeUser } = user
  res.status(201).json({ message: 'Perusahaan berhasil ditambahkan', user: safeUser })
})

const getAllCompanies = asyncHandler(async (req, res) => {
  const companies = await prisma.company.findMany({
    include: {
      user:  { select: { id: true, email: true, isActive: true } },
      _count: { select: { jobs: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ companies })
})

const verifyCompany = asyncHandler(async (req, res) => {
  const company = await prisma.company.update({
    where: { id: req.params.id },
    data:  { isVerified: true },
  })
  res.json({ message: 'Perusahaan berhasil diverifikasi', company })
})

const unverifyCompany = asyncHandler(async (req, res) => {
  const company = await prisma.company.update({
    where: { id: req.params.id },
    data:  { isVerified: false },
  })
  res.json({ message: 'Verifikasi perusahaan dicabut', company })
})

const updateCompany = asyncHandler(async (req, res) => {
  const {
    name, description, industry, size, website,
    province, city, address,
    isInclusiveEmployer, difabelQuota, isVerified,
  } = req.body

  const company = await prisma.company.update({
    where: { id: req.params.id },
    data: {
      ...(name               !== undefined && { name }),
      ...(description        !== undefined && { description }),
      ...(industry           !== undefined && { industry }),
      ...(size               !== undefined && { size }),
      ...(website            !== undefined && { website }),
      ...(province           !== undefined && { province }),
      ...(city               !== undefined && { city }),
      ...(address            !== undefined && { address }),
      ...(isInclusiveEmployer !== undefined && { isInclusiveEmployer }),
      ...(difabelQuota       !== undefined && { difabelQuota: Number(difabelQuota) }),
      ...(isVerified         !== undefined && { isVerified }),
    },
    include: {
      user:  { select: { email: true, isActive: true } },
      _count: { select: { jobs: true } },
    },
  })
  res.json({ message: 'Perusahaan berhasil diperbarui', company })
})

const deleteCompany = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: req.params.id },
    include: { jobs: { select: { id: true } } },
  })
  if (!company) return res.status(404).json({ error: 'Perusahaan tidak ditemukan' })

  const jobIds = company.jobs.map(j => j.id)
  await prisma.application.deleteMany({ where: { jobId: { in: jobIds } } })
  await prisma.job.deleteMany({ where: { companyId: company.id } })
  await prisma.company.delete({ where: { id: company.id } })
  await prisma.user.delete({ where: { id: company.userId } })

  res.json({ message: 'Perusahaan berhasil dihapus' })
})

const getAllJobs = asyncHandler(async (req, res) => {
  const jobs = await prisma.job.findMany({
    include: {
      company:  { select: { name: true, city: true } },
      _count:   { select: { applications: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ jobs })
})

const getPlacementReport = asyncHandler(async (req, res) => {
  const hired = await prisma.application.findMany({
    where:   { status: 'HIRED' },
    include: {
      user: { select: { segment: true, name: true } },
      job:  { include: { company: { select: { name: true, industry: true } } } },
    }
  })

  const bySegment = hired.reduce((acc, app) => {
    const seg = app.user.segment
    if (!acc[seg]) acc[seg] = { count: 0, jobs: [] }
    acc[seg].count++
    acc[seg].jobs.push({ title: app.job.title, company: app.job.company.name })
    return acc
  }, {})

  res.json({
    total:     hired.length,
    bySegment,
    recent:    hired.slice(0, 10),
  })
})

module.exports = { getStats, getAllUsers, updateUser, getAllCompanies, createCompany, verifyCompany, unverifyCompany, updateCompany, deleteCompany, getAllJobs, getPlacementReport }
