// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { updateAllPrices } = require('./utils/stockPrices');



// Routes
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');
const stockRoutes = require('./routes/stocks');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================

// Security & Middleware
// ============================================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later' },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ============================================
// Routes
// ============================================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FinPulse API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// ============================================
// Scheduled Jobs
// ============================================
// Update stock prices every 5 minutes during market hours
cron.schedule('*/5 9-16 * * 1-5', () => {
  console.log('⏰ Scheduled: Updating stock prices...');
  updateAllPrices();
}, { timezone: 'America/New_York' });

// ============================================
// Start Server
// ============================================
const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 FinPulse API running at http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health\n`);
  });
};

start();

module.exports = app;
