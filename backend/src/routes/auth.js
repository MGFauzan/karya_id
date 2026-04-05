const express = require('express')
const { body }  = require('express-validator')
const { register, login, getMe, changePassword } = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth')
const { validate }     = require('../middleware/validate')

const router = express.Router()

router.post('/register',
  [
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    body('name').trim().notEmpty().withMessage('Nama wajib diisi'),
    body('role').optional().isIn(['USER', 'COMPANY']).withMessage('Role tidak valid'),
    body('segment').optional().isIn(['SMK','TKI','PETANI','DIFABEL','UMUM']),
  ],
  validate,
  register
)

router.post('/login',
  [
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').notEmpty().withMessage('Password wajib diisi'),
  ],
  validate,
  login
)

router.get('/me', authenticate, getMe)

router.post('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  changePassword
)

module.exports = router
