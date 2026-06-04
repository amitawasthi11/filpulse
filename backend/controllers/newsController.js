// backend/controllers/newsController.js
const axios = require('axios');
const { pool } = require('../config/database');
const { analyzeWithAI } = require('../utils/aiService');




// Fetch news from NewsAPI
const fetchNewsFromAPI = async (symbols) => {
  const query = symbols.join(' OR ');
  console.log('NEWS QUERY:', query);
  const url = `https://newsapi.org/v2/everything`;

  const response = await axios.get(url, {
    params: {
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: 20,
      apiKey: process.env.NEWS_API_KEY,
    },
    timeout: 10000,
  });
  console.log('FULL NEWS RESPONSE:', response.data);

  return response.data.articles || [];
};

// Fallback: Finnhub news
const fetchFinnhubNews = async (symbol) => {
  const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate = new Date().toISOString().split('T')[0];

  const response = await axios.get('https://finnhub.io/api/v1/company-news', {
    params: { symbol, from: fromDate, to: toDate, token: process.env.FINNHUB_API_KEY },
    timeout: 8000,
  });

  return (response.data || []).slice(0, 10).map((article) => ({
    external_id: String(article.id),
    title: article.headline,
    description: article.summary,
    content: article.summary,
    url: article.url,
    image_url: article.image,
    source: article.source,
    author: null,
    published_at: new Date(article.datetime * 1000),
    symbols: [symbol],
  }));
};

// GET /api/news
const getNews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, symbol, sentiment } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT n.*, s.summary, s.impact, s.sentiment, s.confidence_score, s.key_points
      FROM news n
      LEFT JOIN summaries s ON n.id = s.news_id AND s.user_id = ?
      WHERE 1=1
    `;
    const params = [req.user.id];

    if (symbol) {
      query += ` AND JSON_CONTAINS(n.symbols, JSON_QUOTE(?))`;
      params.push(symbol.toUpperCase());
    }
    if (sentiment) {
      query += ` AND s.sentiment = ?`;
      params.push(sentiment);
    }

    query += ` ORDER BY n.published_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [articles] = await pool.query(query, params);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM news', []);

    res.json({
      success: true,
      data: {
        articles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/news/fetch - Fetch fresh news for user's portfolio
const fetchAndStoreNews = async (req, res, next) => {
  try {
    // Get user's portfolio symbols
    const [portfolioAssets] = await pool.query(
      'SELECT symbol, name FROM portfolio WHERE user_id = ?',
      [req.user.id]
    );
    if (portfolioAssets.length === 0) {
  return res.status(400).json({
    success: false,
    message: 'Add assets to your portfolio first',
  });
}
  const [watchlistAssets] = await pool.query(
  'SELECT symbol, name FROM watchlist WHERE user_id = ?',
  [req.user.id]
);

let portfolioNews = [];
let watchlistNews = [];
let financeNews = [];
const portfolioQueries = portfolioAssets
  .slice(0, 3)
  .map(asset => `${asset.name} stock`);

const portfolioRaw = await fetchNewsFromAPI(portfolioQueries);

portfolioNews = portfolioRaw.map((a, i) => ({
  external_id: `portfolio_${a.url?.slice(-50) || i}`,
  title: a.title,
  description: a.description,
  content: a.content,
  url: a.url,
  image_url: a.urlToImage,
  source: a.source?.name || 'NewsAPI',
  author: a.author,
  published_at: new Date(a.publishedAt),
  symbols: portfolioAssets.map(a => a.symbol),
}));







if (watchlistAssets.length > 0) {
  const watchlistQueries = watchlistAssets
    .slice(0, 3)
    .map(asset => `${asset.name} stock`);

  const watchlistRaw = await fetchNewsFromAPI(watchlistQueries);

  watchlistNews = watchlistRaw.map((a, i) => ({
    external_id: `watchlist_${a.url?.slice(-50) || i}`,
    title: a.title,
    description: a.description,
    content: a.content,
    url: a.url,
    image_url: a.urlToImage,
    source: a.source?.name || 'NewsAPI',
    author: a.author,
    published_at: new Date(a.publishedAt),
    symbols: watchlistAssets.map(a => a.symbol),
  }));
}



const financeResponse = await axios.get(
  'https://newsapi.org/v2/top-headlines',
  {
    params: {
      category: 'business',
      country: 'us',
      pageSize: 10,
      apiKey: process.env.NEWS_API_KEY
    }
  }
);

financeNews = financeResponse.data.articles.map((a, i) => ({
  external_id: `finance_${i}`,
  title: a.title,
  description: a.description,
  content: a.content,
  url: a.url,
  image_url: a.urlToImage,
  source: a.source?.name || 'NewsAPI',
  author: a.author,
  published_at: new Date(a.publishedAt),
  symbols: [],
}));

   
    const symbols = portfolioAssets.map((a) => a.symbol);
  
    let articles = [
  ...portfolioNews,
  ...watchlistNews,
  ...financeNews
];
// Remove duplicate articles
articles = [...new Map(
  articles.map(article => [article.url, article])
).values()];


    // Try NewsAPI first
//     try {
//       const stockQueries = symbolNames
//   .slice(0, 3)
//   .map(name => `${name} stock`);

// const rawArticles = await fetchNewsFromAPI(stockQueries);
//       articles = rawArticles.map((a, i) => ({
//         external_id: `newsapi_${a.url?.slice(-50) || i}`,
//         title: a.title,
//         description: a.description,
//         content: a.content,
//         url: a.url,
//         image_url: a.urlToImage,
//         source: a.source?.name || 'NewsAPI',
//         author: a.author,
//         published_at: new Date(a.publishedAt),
//         // symbols: symbols.filter((s) =>
//         //   (a.title + ' ' + (a.description || '')).toUpperCase().includes(s)
//         // ),
//         symbols: symbols,
        
//       }));
//       console.log('PORTFOLIO SYMBOLS:', symbols);
//       console.log('PORTFOLIO NAMES:', symbolNames);
//       console.log('ARTICLES FETCHED:', articles.length);
//     } catch (newsApiErr) {
//       console.warn('NewsAPI failed, trying Finnhub:', newsApiErr.message);

//       // Fallback to Finnhub for each stock symbol
//       for (const symbol of symbols.filter((s) => !['BTC', 'ETH', 'SOL'].includes(s)).slice(0, 3)) {
//         try {
//           const finnhubArticles = await fetchFinnhubNews(symbol);
//           articles.push(...finnhubArticles);
//         } catch (e) {
//           console.warn(`Finnhub failed for ${symbol}:`, e.message);
//         }
//       }
//     }

    // Store in DB (upsert)
    let savedCount = 0;
    for (const article of articles) {
      if (!article.title || !article.url) continue;
      try {
        await pool.query(
          `INSERT IGNORE INTO news (external_id, title, description, content, url, image_url, source, author, published_at, symbols)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            article.external_id,
            article.title.slice(0, 900),
            article.description?.slice(0, 5000) || null,
            article.content?.slice(0, 10000) || null,
            article.url.slice(0, 900),
            article.image_url?.slice(0, 900) || null,
            article.source?.slice(0, 255) || 'Unknown',
            article.author?.slice(0, 255) || null,
            article.published_at,
            JSON.stringify(article.symbols || []),
          ]
        );
        savedCount++;
      } catch (dbErr) {
        // Skip duplicates
      }
    }

    res.json({
      success: true,
      message: `Fetched ${savedCount} new articles for your portfolio`,
      data: { fetched: savedCount, symbols },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/news/:id/analyze - AI analyze a news article
const analyzeNews = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if already analyzed for this user
    // const [existing] = await pool.query(
    //   'SELECT * FROM summaries WHERE news_id = ? AND user_id = ?',
    //   [id, req.user.id]
    // );

    // if (existing.length > 0 && !req.query.refresh) {
    //   return res.json({ success: true, data: { analysis: existing[0], cached: true } });
    // }

    // Fetch article
    const [articles] = await pool.query('SELECT * FROM news WHERE id = ?', [id]);
    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const article = articles[0];
    const content = `${article.title}\n\n${article.description || ''}\n\n${article.content || ''}`;

    // AI Analysis
    const analysis = await analyzeWithAI(content);

    // Store result
   
    await pool.query(
  `
  INSERT INTO summaries
  (
    news_id,
    user_id,
    sentiment,
    confidence_score
  )
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    sentiment = VALUES(sentiment),
    confidence_score = VALUES(confidence_score)
  `,
  [
    id,
    req.user.id,
    analysis.sentiment,
    analysis.confidence || 0.75
  ]

);

    res.json({ success: true, data: { analysis } });
  } catch (err) {
    next(err);
  }
};

// GET /api/news/sentiment-stats
const getSentimentStats = async (req, res, next) => {
  try {
    const [stats] = await pool.query(
      `SELECT sentiment, COUNT(*) as count
       FROM summaries
       WHERE user_id = ?
       GROUP BY sentiment`,
      [req.user.id]
    );

    const [bySymbol] = await pool.query(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(n.symbols, '$[0]')) as symbol,
              s.sentiment, COUNT(*) as count
       FROM summaries s
       JOIN news n ON s.news_id = n.id
       WHERE s.user_id = ?
       GROUP BY symbol, s.sentiment
       HAVING symbol IS NOT NULL
       LIMIT 50`,
      [req.user.id]
    );

    res.json({ success: true, data: { overall: stats, by_symbol: bySymbol } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNews, fetchAndStoreNews, analyzeNews, getSentimentStats };
