# FinPulse — AI Finance Intelligence Platform

> A full-stack, production-ready finance dashboard that fetches live news, summarizes it with AI, and predicts market sentiment for your portfolio.

Built by an MCA student as a placement-ready showcase project.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Auth** | JWT + Refresh Token rotation, bcrypt hashing, protected routes |
| **Portfolio** | Add/remove stocks & crypto, live P&L, cost basis |
| **Watchlist** | Track assets without owning them |
| **News Fetching** | NewsAPI + Finnhub fallback, filtered by your holdings |
| **AI Analysis** | Gemini Pro summarizes each article → summary + impact + sentiment |
| **Sentiment Charts** | Pie chart (Bullish/Bearish/Neutral), Bar chart by asset |
| **AI Chatbot** | FinPulse AI advisor with portfolio context |
| **Dark Mode** | Bloomberg-inspired fintech dark UI |

---

## 🛠 Tech Stack

```
Frontend    React 18 + Vite + Tailwind CSS + Framer Motion + Chart.js
Backend     Node.js + Express.js (MVC architecture)
Database    MySQL 8 with full relational schema
AI          Google Gemini Pro (free tier at aistudio.google.com)
Auth        JWT access tokens + refresh tokens
News        NewsAPI.org + Finnhub.io (both free tiers)
Docker      docker-compose for one-command deployment
```

---

## 📁 Folder Structure

```
finpulse/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL pool
│   ├── controllers/
│   │   ├── authController.js    # Register, Login, Refresh, Logout
│   │   ├── portfolioController.js
│   │   ├── newsController.js
│   │   └── aiController.js      # Chatbot
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── portfolio.js
│   │   ├── news.js
│   │   └── ai.js
│   ├── utils/
│   │   ├── aiService.js         # Gemini integration
│   │   └── stockPrices.js       # Finnhub price fetching
│   ├── .env.example
│   ├── Dockerfile
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Layout, Sidebar, Navbar, Skeleton
│   │   │   └── charts/          # SentimentPieChart, PortfolioBarChart
│   │   ├── context/
│   │   │   └── authStore.js     # Zustand global auth state
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── PortfolioPage.jsx
│   │   │   ├── NewsPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   └── WatchlistPage.jsx
│   │   ├── services/
│   │   │   └── api.js           # Axios with auto-refresh interceptor
│   │   └── App.jsx
│   ├── Dockerfile
│   └── nginx.conf
│
├── database/
│   └── schema.sql               # Full MySQL schema
└── docker-compose.yml
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MySQL 8+
- Git

### Step 1 — Clone & Setup

```bash
git clone <your-repo-url>
cd finpulse
```

### Step 2 — Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run schema
mysql -u root -p < database/schema.sql
```

### Step 3 — Backend Setup

```bash
cd backend
npm install

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your API keys (see API Keys section below)

npm run dev
# API running at http://localhost:5000
```

### Step 4 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

---

## 🔑 Getting Free API Keys

### 1. Google Gemini (AI Analysis)
1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Free tier: 15 requests/minute, 1M tokens/day
4. Add to `.env`: `GEMINI_API_KEY=your_key`

### 2. NewsAPI (News Fetching)
1. Register at https://newsapi.org/register
2. Free tier: 100 requests/day
3. Add to `.env`: `NEWS_API_KEY=your_key`

### 3. Finnhub (Stock Prices + News Fallback)
1. Register at https://finnhub.io/register
2. Free tier: 60 requests/minute
3. Add to `.env`: `FINNHUB_API_KEY=your_key`

---

## 🌐 REST API Reference

### Auth Routes
```
POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
POST /api/auth/refresh    { refreshToken }
POST /api/auth/logout     [auth required]
GET  /api/auth/me         [auth required]
```

### Portfolio Routes  *(all require auth)*
```
GET    /api/portfolio              Get holdings + summary
POST   /api/portfolio              Add asset
PUT    /api/portfolio/:id          Update quantity/price
DELETE /api/portfolio/:id          Remove asset
GET    /api/portfolio/watchlist    Get watchlist
POST   /api/portfolio/watchlist    Add to watchlist
DELETE /api/portfolio/watchlist/:symbol
```

### News Routes  *(all require auth)*
```
GET  /api/news                     List news (paginated)
POST /api/news/fetch               Fetch fresh news for portfolio
POST /api/news/:id/analyze         AI analyze one article
GET  /api/news/stats/sentiment     Sentiment distribution
```

### AI Routes  *(all require auth)*
```
POST /api/ai/chat                  Chat with AI advisor
GET  /api/ai/chat/history          Get chat history
GET  /api/ai/chat/sessions         List sessions
```

---

## 🐳 Docker Deployment

```bash
# 1. Create .env file in project root
cat > .env << EOF
DB_PASSWORD=finpulse123
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
GEMINI_API_KEY=your_gemini_key
NEWS_API_KEY=your_newsapi_key
FINNHUB_API_KEY=your_finnhub_key
EOF

# 2. Build and start all services
docker-compose up --build -d

# 3. Access the app
# Frontend: http://localhost
# API:      http://localhost:5000
# Health:   http://localhost:5000/health

# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down
```

---

## 🌍 Cloud Deployment Options

### Option A — Railway (Recommended for free tier)
1. Push code to GitHub
2. Connect Railway to your repo at railway.app
3. Add environment variables in Railway dashboard
4. Deploy backend & add MySQL plugin
5. Deploy frontend separately

### Option B — Render
1. Create web service for backend (Node)
2. Create static site for frontend (Vite build)
3. Add MySQL database via PlanetScale or Aiven (free tiers)

### Option C — VPS (DigitalOcean / Hetzner)
```bash
# On your server
git clone <repo>
cd finpulse
docker-compose up -d
# Done!
```

---

## 🤖 AI Prompt Design

The system uses a carefully engineered prompt that ensures consistent JSON output:

```
Analyze this financial news article. Generate:
1. A concise summary in 3-4 lines
2. Explain impact on investors
3. Classify sentiment strictly as Bullish, Bearish, or Neutral
4. List key points as bullet points
5. Extract mentioned stock/crypto symbols
```

Output is validated and falls back to keyword-based sentiment if the AI call fails (offline mode).

---

## 🗄 Database Schema Overview

```sql
users        — Auth, preferences, refresh tokens
portfolio    — User holdings (symbol, quantity, purchase_price)
watchlist    — Tracked assets without ownership
news         — Fetched articles (deduplicated by URL)
summaries    — AI analysis per (news_id, user_id) pair
stock_prices — Live price cache (5-min TTL)
chat_history — AI chatbot sessions
audit_log    — User action tracking
```

---

## 📊 How Each Module Works

### Authentication Flow
```
Register → bcrypt(password) → INSERT user → issue JWT pair
Login    → compare hash → issue JWT pair (15min + 7day refresh)
Request  → Bearer token → middleware verifies → req.user attached
Expiry   → 401 received → frontend auto-calls /refresh → retry original request
```

### News Pipeline
```
User clicks "Fetch News"
  → Backend reads portfolio symbols
  → NewsAPI queried with symbol names
  → Articles stored in news table (deduped by URL)
  → User clicks article → POST /news/:id/analyze
  → Gemini Pro called with article content
  → JSON parsed → stored in summaries table
  → Sentiment chart updates automatically
```

### Portfolio Valuation
```
portfolio JOIN stock_prices
  → current_value = current_price × quantity
  → pnl = current_value - (purchase_price × quantity)
  → Cron job updates prices every 5min (market hours)
```

---

## 🎨 Design System

- **Theme**: Bloomberg Terminal × Zerodha dark mode
- **Font**: Space Grotesk (display) + DM Sans (body) + JetBrains Mono (numbers)
- **Colors**: `#00d4aa` accent, `#00c48c` bull, `#ff4b6e` bear, `#f0b429` gold
- **Style**: Glassmorphism cards, grid background, smooth Framer Motion animations

---

## 🧠 Skills Demonstrated

This project covers everything asked in MCA/placement interviews:

- **Full Stack**: React + Node.js + MySQL end-to-end
- **Auth**: JWT with refresh rotation, bcrypt, middleware
- **REST API**: MVC pattern, validation, error handling
- **Database**: Normalized schema, JOINs, indexes, foreign keys
- **AI Integration**: Prompt engineering, JSON output parsing, fallback handling
- **DevOps**: Docker, docker-compose, environment variables
- **Frontend**: State management (Zustand), React Query, protected routes
- **Charts**: Chart.js integration with custom theming

---

*Built with ❤ by Amit Awasthi — MCA, IET Lucknow*
