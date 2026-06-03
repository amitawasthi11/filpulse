// backend/routes/ai.js
const router = require('express').Router();
const { chat, getChatHistory, getChatSessions } = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limit AI chat: 30 messages per minute
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many AI requests, please slow down' },
});

router.use(authenticate);

router.post('/chat', chatLimiter, chat);
router.get('/chat/history', getChatHistory);
router.get('/chat/sessions', getChatSessions);

module.exports = router;
