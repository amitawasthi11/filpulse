// backend/routes/auth.js
const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, refresh, logout, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', [
  body('name').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;
