-- ============================================
-- FinPulse Database Schema
-- Run: mysql -u root -p < schema.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS finpulse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE finpulse_db;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255) DEFAULT NULL,
  refresh_token TEXT DEFAULT NULL,
  preferences JSON DEFAULT ('{"theme":"dark","emailAlerts":false,"currency":"USD"}'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_uuid (uuid)
);

-- ============================================
-- PORTFOLIO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  asset_type ENUM('stock', 'crypto', 'etf', 'forex') DEFAULT 'stock',
  quantity DECIMAL(18, 8) NOT NULL DEFAULT 1,
  purchase_price DECIMAL(18, 4) NOT NULL DEFAULT 0,
  purchase_date DATE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_symbol (user_id, symbol),
  INDEX idx_user_id (user_id),
  INDEX idx_symbol (symbol)
);

-- ============================================
-- WATCHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS watchlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  asset_type ENUM('stock', 'crypto', 'etf', 'forex') DEFAULT 'stock',
  alert_price_above DECIMAL(18, 4) DEFAULT NULL,
  alert_price_below DECIMAL(18, 4) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_watchlist (user_id, symbol),
  INDEX idx_user_watchlist (user_id)
);

-- ============================================
-- NEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(500) NOT NULL,
  title VARCHAR(1000) NOT NULL,
  description TEXT,
  content TEXT,
  url VARCHAR(1000) NOT NULL,
  image_url VARCHAR(1000) DEFAULT NULL,
  source VARCHAR(255) NOT NULL,
  author VARCHAR(255) DEFAULT NULL,
  published_at TIMESTAMP NOT NULL,
  symbols JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_external_id (external_id(250)),
  INDEX idx_published_at (published_at),
  INDEX idx_source (source)
);

-- ============================================
-- AI SUMMARIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS summaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  news_id INT NOT NULL,
  user_id INT NOT NULL,
  summary TEXT NOT NULL,
  impact TEXT NOT NULL,
  sentiment ENUM('Bullish', 'Bearish', 'Neutral') NOT NULL DEFAULT 'Neutral',
  confidence_score DECIMAL(3, 2) DEFAULT 0.75,
  key_points JSON DEFAULT NULL,
  related_symbols JSON DEFAULT NULL,
  model_used VARCHAR(100) DEFAULT 'gemini-pro',
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_news_user (news_id, user_id),
  INDEX idx_user_sentiment (user_id, sentiment),
  INDEX idx_news_id (news_id)
);

-- ============================================
-- STOCK PRICES CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  current_price DECIMAL(18, 4) NOT NULL,
  change_amount DECIMAL(18, 4) DEFAULT 0,
  change_percent DECIMAL(8, 4) DEFAULT 0,
  high_52w DECIMAL(18, 4) DEFAULT NULL,
  low_52w DECIMAL(18, 4) DEFAULT NULL,
  market_cap BIGINT DEFAULT NULL,
  volume BIGINT DEFAULT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_symbol (symbol),
  INDEX idx_last_updated (last_updated)
);

-- ============================================
-- CHAT HISTORY TABLE (AI Chatbot)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_session (user_id, session_id),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) DEFAULT NULL,
  entity_id INT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- SEED: Popular Assets Reference
-- ============================================
INSERT IGNORE INTO stock_prices (symbol, current_price, change_amount, change_percent) VALUES
  ('AAPL', 189.50, 2.30, 1.23),
  ('TSLA', 248.30, -5.20, -2.05),
  ('NVDA', 875.20, 15.60, 1.82),
  ('MSFT', 415.80, 3.10, 0.75),
  ('GOOGL', 178.90, 1.20, 0.68),
  ('AMZN', 225.40, 4.50, 2.04),
  ('META', 582.30, 8.90, 1.55),
  ('BTC', 67500.00, 1200.00, 1.81),
  ('ETH', 3450.00, 85.00, 2.52),
  ('SOL', 185.30, -3.20, -1.70);

SELECT 'FinPulse database schema created successfully!' AS message;
