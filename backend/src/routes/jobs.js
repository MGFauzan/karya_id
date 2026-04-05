const express = require('express')
const { authenticate, authorize, optionalAuth } = require('../middleware/auth')
const {
  getJobs, getJobById, createJob, updateJob, deleteJob,
  applyJob, getMyJobs, getApplicants, updateApplicationStatus,
} = require('../controllers/jobs.controller')

const router = express.Router()

router.get('/',    optionalAuth, getJobs)
router.get('/:id', optionalAuth, getJobById)

router.post('/:id/apply', authenticate, authorize('USER'), applyJob)
router.post('/',                      authenticate, authorize('COMPANY','ADMIN'), createJob)
router.put('/:id',                    authenticate, authorize('COMPANY','ADMIN'), updateJob)
router.delete('/:id',                 authenticate, authorize('COMPANY','ADMIN'), deleteJob)
router.get('/company/my-jobs',        authenticate, authorize('COMPANY','ADMIN'), getMyJobs)
router.get('/:id/applicants',         authenticate, authorize('COMPANY','ADMIN'), getApplicants)
router.patch('/:jobId/applications/:appId', authenticate, authorize('COMPANY','ADMIN'), updateApplicationStatus)

module.exports = router
