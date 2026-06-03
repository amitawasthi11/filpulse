// backend/utils/stockPrices.js
const axios = require('axios');
const { pool } = require('../config/database');

// Fetch price from Finnhub
const fetchFromFinnhub = async (symbol) => {
  const response = await axios.get('https://finnhub.io/api/v1/quote', {
    params: { symbol, token: process.env.FINNHUB_API_KEY },
    timeout: 5000,
  });

  const data = response.data;
  if (!data || data.c === 0) throw new Error('No price data');

  return {
    current_price: data.c,
    change_amount: data.d,
    change_percent: data.dp,
    high_52w: data.h,
    low_52w: data.l,
  };
};

// Fetch price from Alpha Vantage (fallback)
const fetchFromAlphaVantage = async (symbol) => {
  const response = await axios.get('https://www.alphavantage.co/query', {
    params: {
      function: 'GLOBAL_QUOTE',
      symbol,
      apikey: process.env.ALPHA_VANTAGE_KEY || 'demo',
    },
    timeout: 8000,
  });

  const quote = response.data?.['Global Quote'];
  if (!quote || !quote['05. price']) throw new Error('No AV data');

  return {
    current_price: parseFloat(quote['05. price']),
    change_amount: parseFloat(quote['09. change']),
    change_percent: parseFloat(quote['10. change percent']),
  };
};

// Upsert price in DB
const upsertPrice = async (symbol, priceData) => {
  await pool.query(
    `INSERT INTO stock_prices (symbol, current_price, change_amount, change_percent, high_52w, low_52w)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     current_price = VALUES(current_price),
     change_amount = VALUES(change_amount),
     change_percent = VALUES(change_percent),
     high_52w = COALESCE(VALUES(high_52w), high_52w),
     low_52w = COALESCE(VALUES(low_52w), low_52w),
     last_updated = NOW()`,
    [
      symbol,
      priceData.current_price,
      priceData.change_amount || 0,
      priceData.change_percent || 0,
      priceData.high_52w || null,
      priceData.low_52w || null,
    ]
  );
};

// Main function: get price (with DB cache)
const getStockPrice = async (symbol) => {
  // Check cache (fresh within 5 minutes)
  const [cached] = await pool.query(
    `SELECT * FROM stock_prices
     WHERE symbol = ? AND last_updated > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
    [symbol]
  );

  if (cached.length > 0) return cached[0];

  // Fetch live price
  try {
    const priceData = await fetchFromFinnhub(symbol);
    await upsertPrice(symbol, priceData);
    return priceData;
  } catch (finnhubErr) {
    try {
      const priceData = await fetchFromAlphaVantage(symbol);
      await upsertPrice(symbol, priceData);
      return priceData;
    } catch (avErr) {
      // Return stale data if available
      const [stale] = await pool.query('SELECT * FROM stock_prices WHERE symbol = ?', [symbol]);
      if (stale.length > 0) return stale[0];
      throw new Error(`Unable to fetch price for ${symbol}`);
    }
  }
};

// Batch update all portfolio prices
const updateAllPrices = async () => {
  try {
    const [symbols] = await pool.query('SELECT DISTINCT symbol FROM portfolio');
    console.log(`🔄 Updating prices for ${symbols.length} symbols...`);

    for (const { symbol } of symbols) {
      try {
        await getStockPrice(symbol);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limiting
      } catch (e) {
        console.warn(`Price update failed for ${symbol}`);
      }
    }

    console.log('✅ Price update complete');
  } catch (err) {
    console.error('Batch price update error:', err.message);
  }
};

module.exports = { getStockPrice, updateAllPrices };
