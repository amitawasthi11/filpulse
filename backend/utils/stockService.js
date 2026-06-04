const axios = require('axios');

// SEARCH STOCKS
const searchStocks = async (query) => {

  try {

    const url =
      `https://query1.finance.yahoo.com/v1/finance/search?q=${query}`;

    const response = await axios.get(url);

    const quotes = response.data.quotes || [];

    return quotes
      .filter((stock) => {

  // remove invalid entries
  if (!stock.symbol) {
    return false;
  }

  // allow only real tradable assets
  const allowedTypes = [
    'EQUITY',
    'ETF',
    'CRYPTOCURRENCY',
  ];

  if (
    !allowedTypes.includes(stock.quoteType)
  ) {
    return false;
  }

  // remove weird mutual fund symbols
  if (
    stock.symbol.startsWith('0P')
  ) {
    return false;
  }

  // prioritize proper stock names
  if (
    !stock.shortname &&
    !stock.longname
  ) {
    return false;
  }

  return true;
})
      .map((stock) => ({

        symbol: stock.symbol,

        name:
          stock.shortname ||
          stock.longname ||
          stock.symbol,

        exchange: stock.exchange || '',

        type:
          stock.quoteType ||
          'stock',

      }));

  } catch (err) {

    console.log('SEARCH ERROR:', err.message);

    return [];
  }
};

// LIVE PRICE
const getStockPrice = async (symbol) => {
  // console.log("Fetching price for:", symbol);
console.log("🔥 FETCHING:", symbol);
  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

    const response = await axios.get(url);
    // console.log("Yahoo response:", response.data);

if (
  !response.data?.chart?.result ||
  !response.data.chart.result.length
) {
  throw new Error(
    `No market data for ${symbol}`
  );
}

    const result =
      response.data.chart.result[0];

    const meta = result.meta;

    // LIVE USD → INR rate
const forexUrl =
  `https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X`;

const forexResponse =
  await axios.get(forexUrl);

const usdInrRate =
  forexResponse.data.chart.result[0]
    .meta.regularMarketPrice || 83;

// Original USD/INR price
let currentPrice =
  meta.regularMarketPrice;

let previousClose =
  meta.previousClose;

// Convert non-Indian assets to INR
if (!symbol.endsWith('.NS')) {

  currentPrice =
    currentPrice * usdInrRate;

  previousClose =
    previousClose * usdInrRate;
}

return {

  symbol: meta.symbol,

  current_price:
    currentPrice,

  change_amount:
    currentPrice -
    previousClose,

  change_percent:
    (
      (
        (currentPrice -
          previousClose) /
        previousClose
      ) * 100
    ),

  name: meta.symbol,
};


  } catch (err) {

  console.log(
    "🔥 PRICE ERROR:",
    symbol,
    err.response?.status,
    err.response?.data,
    err.message
  );

  return null;
}
};

module.exports = {
  searchStocks,
  getStockPrice,
};