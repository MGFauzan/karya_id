'use strict'

const { validationResult } = require('express-validator')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error:  'Validasi gagal.',
      fields: errors.array().map(e => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}

module.exports = { validate }
