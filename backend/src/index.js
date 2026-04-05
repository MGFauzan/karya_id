'use strict'
require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const compression = require('compression')
const rateLimit  = require('express-rate-limit')
const { errorHandler, notFound } = require('./middleware/error')
const authRoutes            = require('./routes/auth')
const usersRoutes           = require('./routes/users')
const jobsRoutes            = require('./routes/jobs')
const recommendationsRoutes = require('./routes/recommendations')
const adminRoutes           = require('./routes/admin')

const app  = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      process.env.NODE_ENV === 'production' ? 100 : 1000,
  message:  { error: 'Terlalu banyak request, coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders:   false,
})
app.use('/api', limiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { error: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit.' },
})
app.use('/api/auth', authLimiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.json({
    name:    'KARYA.ID API',
    version: '1.0.0',
    status:  'running',
    env:     process.env.NODE_ENV || 'development',
    docs:    '/api',
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth',            authRoutes)
app.use('/api/users',           usersRoutes)
app.use('/api/jobs',            jobsRoutes)
app.use('/api/recommendations', recommendationsRoutes)
app.use('/api/admin',           adminRoutes)

app.get('/api', (req, res) => {
  res.json({
    name:      'KARYA.ID REST API',
    version:   '1.0.0',
    endpoints: {
      auth:            '/api/auth',
      users:           '/api/users',
      jobs:            '/api/jobs',
      recommendations: '/api/recommendations',
      admin:           '/api/admin',
    },
  })
})

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`\n🚀 KARYA.ID API running on port ${PORT}`)
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   URL: http://localhost:${PORT}`)
  console.log(`   API: http://localhost:${PORT}/api\n`)
})

module.exports = app
