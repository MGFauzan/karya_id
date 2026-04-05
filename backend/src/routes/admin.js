const express = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const {
  getStats, getAllUsers, updateUser,
  getAllCompanies, createCompany, verifyCompany, unverifyCompany, updateCompany, deleteCompany,
  getAllJobs, getPlacementReport,
} = require('../controllers/admin.controller')

const router = express.Router()
const isAdmin = [authenticate, authorize('ADMIN')]

router.get('/stats',                        ...isAdmin, getStats)
router.get('/users',                        ...isAdmin, getAllUsers)
router.patch('/users/:id',                  ...isAdmin, updateUser)
router.patch('/users/:id/toggle',           ...isAdmin, async (req, res, next) => {
  req.body = { _toggle: true }
  updateUser(req, res, next)
})
router.get('/companies',                    ...isAdmin, getAllCompanies)
router.post('/companies',                   ...isAdmin, createCompany)
router.put('/companies/:id',                ...isAdmin, updateCompany)
router.patch('/companies/:id/verify',       ...isAdmin, verifyCompany)
router.patch('/companies/:id/unverify',     ...isAdmin, unverifyCompany)
router.delete('/companies/:id',             ...isAdmin, deleteCompany)
router.get('/jobs',                         ...isAdmin, getAllJobs)
router.get('/placement-report',             ...isAdmin, getPlacementReport)
router.get('/placements',                   ...isAdmin, getPlacementReport)

module.exports = router
