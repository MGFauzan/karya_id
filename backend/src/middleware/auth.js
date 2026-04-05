'use strict'

const jwt     = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const prisma  = new PrismaClient()

const authenticate = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login.' })
  }

  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user    = await prisma.user.findUnique({
      where:  { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, segment: true, isActive: true },
    })

    if (!user)          return res.status(401).json({ error: 'User tidak ditemukan.' })
    if (!user.isActive) return res.status(403).json({ error: 'Akun Anda dinonaktifkan.' })

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesi habis. Silakan login kembali.' })
    }
    return res.status(401).json({ error: 'Token tidak valid.' })
  }
}

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      error: `Akses ditolak. Role '${req.user?.role}' tidak diizinkan.`,
    })
  }
  next()
}

const optionalAuth = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return next()
  const token = auth.split(' ')[1]
  try {
    const jwt  = require('jsonwebtoken')
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where:  { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, segment: true, isActive: true },
    })
    if (user?.isActive) req.user = user
  } catch {}
  next()
}

module.exports = { authenticate, authorize, optionalAuth }
