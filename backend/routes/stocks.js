const express = require('express');
const router = express.Router();

const { searchStocks, getStockPrice } = require('../utils/stockService');

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;

    if (!q) {
      return res.json([]);
    }

    const stocks = await searchStocks(q);

    res.json(stocks);
  } catch (err) {
    res.status(500).json({
      error: 'Search failed',
    });
  }
});

router.get('/:symbol', async (req, res) => {
  try {
    const stock = await getStockPrice(req.params.symbol);

    res.json(stock);
  } catch (err) {
    res.status(500).json({
      error: 'Failed',
    });
  }
});

module.exports = router;