// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check existing user
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userUuid = uuidv4();

    const [result] = await pool.query(
      'INSERT INTO users (uuid, name, email, password) VALUES (?, ?, ?, ?)',
      [userUuid, name, email, hashedPassword]
    );

    const userId = result.insertId;
    const { accessToken, refreshToken } = generateTokens(userId);

    // Store refresh token
    await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, userId]);

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, ip_address) VALUES (?, ?, ?)',
      [userId, 'REGISTER', req.ip]
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: { id: userId, uuid: userUuid, name, email },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const [rows] = await pool.query(
      'SELECT id, uuid, name, email, password, preferences FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    await pool.query(
      'INSERT INTO audit_log (user_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'LOGIN', req.ip]
    );

    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: safeUser, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const [rows] = await pool.query(
      'SELECT id, uuid, name, email FROM users WHERE id = ? AND refresh_token = ?',
      [decoded.userId, refreshToken]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(rows[0].id);
    await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [newRefreshToken, rows[0].id]);

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token expired, please login again' });
    }
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const { password: _, refresh_token: __, ...safeUser } = req.user;
  res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, refresh, logout, getMe };
