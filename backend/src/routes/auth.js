const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

module.exports = router;
