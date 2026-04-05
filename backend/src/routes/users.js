const express = require('express')
const { authenticate } = require('../middleware/auth')
const {
  getProfile, updateProfile, getPublicProfile,
  getMyApplications, getSkillGap,
} = require('../controllers/users.controller')

const router = express.Router()

router.get('/profile',      authenticate, getProfile)
router.put('/profile',      authenticate, updateProfile)
router.get('/stats',        authenticate, async (req, res) => {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  const [total, pending, hired] = await Promise.all([
    prisma.application.count({ where: { userId: req.user.id } }),
    prisma.application.count({ where: { userId: req.user.id, status: 'PENDING' } }),
    prisma.application.count({ where: { userId: req.user.id, status: 'HIRED' } }),
  ])
  res.json({ stats: { totalApplications: total, pendingApplications: pending, hiredApplications: hired } })
})
router.get('/applications', authenticate, getMyApplications)
router.get('/skill-gap',    authenticate, getSkillGap)
router.get('/:id',          getPublicProfile)

module.exports = router
