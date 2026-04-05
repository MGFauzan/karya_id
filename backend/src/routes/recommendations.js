const express = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const {
  getRecommendations, quickMatch, scoreJobMatch, smkBridge,
} = require('../controllers/recommendations.controller')

const router = express.Router()

router.get('/',           authenticate, getRecommendations)
router.get('/quick',      authenticate, quickMatch)
router.get('/smk-bridge', authenticate, authorize('USER'), smkBridge)
router.post('/score',     authenticate, scoreJobMatch)

module.exports = router
