const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { generateToken } = require('../utils/jwt')
const { asyncHandler } = require('../middleware/error')

const prisma = new PrismaClient()

const register = asyncHandler(async (req, res) => {
  const { email, password, name, role = 'USER', segment = 'UMUM' } = req.body
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return res.status(409).json({ error: 'Email sudah terdaftar' })
  }

  const hashedPw = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email, name, role, segment,
      password: hashedPw,
      profile: {
        create: {
          skills:       [],
          preferredJob: [],
        }
      }
    },
    include: { profile: true },
  })

  const token = generateToken(user.id, user.role)

  res.status(201).json({
    message: 'Registrasi berhasil! Selamat bergabung di KARYA.ID',
    token,
    user:    sanitizeUser(user),
  })
})

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({
    where:   { email },
    include: { profile: true, company: true },
  })

  if (!user) {
    return res.status(401).json({ error: 'Email atau password salah' })
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Akun Anda dinonaktifkan. Hubungi support.' })
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return res.status(401).json({ error: 'Email atau password salah' })
  }

  const token = generateToken(user.id, user.role)

  res.json({
    message: `Selamat datang kembali, ${user.name}!`,
    token,
    user:    sanitizeUser(user),
  })
})

const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where:   { id: req.user.id },
    include: { profile: true, company: true },
  })
  res.json({ user: sanitizeUser(user) })
})

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })

  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) {
    return res.status(400).json({ error: 'Password lama tidak sesuai' })
  }

  const hashedPw = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: req.user.id },
    data:  { password: hashedPw },
  })

  res.json({ message: 'Password berhasil diubah' })
})

function sanitizeUser(user) {
  const { password, ...rest } = user
  return rest
}

module.exports = { register, login, getMe, changePassword }
