// backend/controllers/aiController.js
const { pool } = require('../config/database');
const { chatWithAI } = require('../utils/aiService');
const { v4: uuidv4 } = require('uuid');

// POST /api/ai/chat
const chat = async (req, res, next) => {
  try {
    const { message, session_id } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const sessionId = session_id || uuidv4();

    // Fetch chat history for context
    const [history] = await pool.query(
      `SELECT role, message FROM chat_history
       WHERE user_id = ? AND session_id = ?
       ORDER BY created_at DESC LIMIT 10`,
      [req.user.id, sessionId]
    );

    // Fetch portfolio for context
    const [portfolio] = await pool.query(
      'SELECT symbol, quantity, purchase_price FROM portfolio WHERE user_id = ? LIMIT 10',
      [req.user.id]
    );

    // Save user message
    await pool.query(
      'INSERT INTO chat_history (user_id, session_id, role, message) VALUES (?, ?, ?, ?)',
      [req.user.id, sessionId, 'user', message.slice(0, 5000)]
    );

    // Get AI response
    const aiResponse = await chatWithAI(message, portfolio, history.reverse());

    // Save AI response
    await pool.query(
      'INSERT INTO chat_history (user_id, session_id, role, message) VALUES (?, ?, ?, ?)',
      [req.user.id, sessionId, 'assistant', aiResponse.slice(0, 5000)]
    );

    res.json({
      success: true,
      data: {
        message: aiResponse,
        session_id: sessionId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/chat/history
const getChatHistory = async (req, res, next) => {
  try {
    const { session_id } = req.query;

    let query = `SELECT * FROM chat_history WHERE user_id = ?`;
    const params = [req.user.id];

    if (session_id) {
      query += ` AND session_id = ?`;
      params.push(session_id);
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const [history] = await pool.query(query, params);
    res.json({ success: true, data: { history: history.reverse() } });
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/chat/sessions
const getChatSessions = async (req, res, next) => {
  try {
    const [sessions] = await pool.query(
      `SELECT session_id,
              MIN(created_at) as started_at,
              MAX(created_at) as last_message_at,
              COUNT(*) as message_count,
              (SELECT message FROM chat_history ch2
               WHERE ch2.session_id = ch1.session_id AND ch2.role = 'user'
               ORDER BY ch2.created_at ASC LIMIT 1) as first_message
       FROM chat_history ch1
       WHERE user_id = ?
       GROUP BY session_id
       ORDER BY last_message_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    res.json({ success: true, data: { sessions } });
  } catch (err) {
    next(err);
  }
};

module.exports = { chat, getChatHistory, getChatSessions };
