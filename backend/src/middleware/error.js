'use strict'

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const notFound = (req, res) => {
  res.status(404).json({
    error:  'Endpoint tidak ditemukan.',
    path:   req.originalUrl,
    method: req.method,
  })
}

const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${err.message}`, err.stack?.split('\n')[1] || '')
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field'
    return res.status(409).json({ error: `Nilai ${field} sudah digunakan.` })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Data tidak ditemukan.' })
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Referensi data tidak valid.' })
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token tidak valid.' })
  }

  const status = err.statusCode || err.status || 500
  res.status(status).json({
    error:   err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = { asyncHandler, notFound, errorHandler }
