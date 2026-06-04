// backend/controllers/portfolioController.js
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { getStockPrice } = require('../utils/stockService');

// GET /api/portfolio
const getPortfolio = async (req, res, next) => {

  try {

    const [assets] = await pool.query(
      `
      SELECT *
      FROM portfolio
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    let totalValue = 0;
    let totalCost = 0;

    const enriched = await Promise.all(

      assets.map(async (asset) => {

        let live = null;

        try {

          live = await getStockPrice(
            asset.symbol
          );

        } catch (err) {
          console.log(err);
        }

        const currentPrice =
          live?.current_price ||
          parseFloat(asset.purchase_price);

        const quantity =
          parseFloat(asset.quantity);

        const value =
          currentPrice * quantity;

        const cost =
          parseFloat(asset.purchase_price) *
          quantity;

        const pnl =
          value - cost;

        const pnlPercent =
          cost > 0
            ? ((pnl / cost) * 100)
            : 0;

        totalValue += value;
        totalCost += cost;

        return {

          ...asset,

          current_price:
            Number(currentPrice.toFixed(2)),

          current_value:
            Number(value.toFixed(2)),

          cost_basis:
            Number(cost.toFixed(2)),

          pnl:
            Number(pnl.toFixed(2)),

          pnl_percent:
            Number(pnlPercent.toFixed(2)),

          change_percent:
            live?.change_percent || 0,

        };

      })

    );

    const totalPnl =
      totalValue - totalCost;

    const totalPnlPercent =
      totalCost > 0
        ? ((totalPnl / totalCost) * 100)
        : 0;

    res.json({

      success: true,

      data: {

        assets: enriched,

        summary: {

          total_value:
            Number(totalValue.toFixed(2)),

          total_cost:
            Number(totalCost.toFixed(2)),

          total_pnl:
            Number(totalPnl.toFixed(2)),

          total_pnl_percent:
            Number(totalPnlPercent.toFixed(2)),

          asset_count:
            assets.length,

        },

      },

    });

  } catch (err) {

    next(err);

  }
};

// POST /api/portfolio
const addAsset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { symbol, name, asset_type, quantity, purchase_price, purchase_date, notes } = req.body;
    const upperSymbol = symbol.toUpperCase();

    // Check duplicate
    const [existing] = await pool.query(
      'SELECT id FROM portfolio WHERE user_id = ? AND symbol = ?',
      [req.user.id, upperSymbol]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `${upperSymbol} already in portfolio` });
    }

    const [result] = await pool.query(
      `INSERT INTO portfolio (user_id, symbol, name, asset_type, quantity, purchase_price, purchase_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, upperSymbol, name, asset_type || 'stock', quantity, purchase_price, purchase_date || null, notes || null]
    );

    // Try to fetch/update live price
    try {
      await getStockPrice(upperSymbol);
    } catch (e) {
      // Non-fatal if price fetch fails
    }

    const [newAsset] = await pool.query(
      `SELECT p.*, sp.current_price, sp.change_percent
       FROM portfolio p LEFT JOIN stock_prices sp ON p.symbol = sp.symbol
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: `${upperSymbol} added to portfolio`,
      data: { asset: newAsset[0] },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/portfolio/:id
const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, purchase_price, notes } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM portfolio WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    await pool.query(
      'UPDATE portfolio SET quantity = ?, purchase_price = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [quantity, purchase_price, notes, id]
    );

    res.json({ success: true, message: 'Asset updated successfully' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/portfolio/:id
const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT id, symbol FROM portfolio WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    await pool.query('DELETE FROM portfolio WHERE id = ?', [id]);

    res.json({ success: true, message: `${existing[0].symbol} removed from portfolio` });
  } catch (err) {
    next(err);
  }
};

// GET /api/portfolio/watchlist
const getWatchlist = async (req, res, next) => {
  try {
    console.log("WATCHLIST API HIT");
    const [items] = await pool.query(
      `SELECT *
       FROM watchlist
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    // Fetch LIVE prices
    const enriched = await Promise.all(
      items.map(async (item) => {

        try {

          const live = await getStockPrice(item.symbol);

          return {
            ...item,
           current_price: live?.current_price ?? item.current_price ?? null,
           change_amount: live?.change_amount ?? 0,
           change_percent: live?.change_percent ?? 0,
          };

        } catch (err) {

          return {
            ...item,
            current_price: 0,
            change_amount: 0,
            change_percent: 0,
          };

        }

      })
    );

    res.json({
      success: true,
      data: {
        watchlist: enriched,
      },
    });

  } catch (err) {
    next(err);
  }
};

// POST /api/portfolio/watchlist
const addToWatchlist = async (req, res, next) => {
  try {
    const { symbol, name, asset_type } = req.body;
    const upperSymbol = symbol.toUpperCase();

    await pool.query(
      'INSERT IGNORE INTO watchlist (user_id, symbol, name, asset_type) VALUES (?, ?, ?, ?)',
      [req.user.id, upperSymbol, name, asset_type || 'stock']
    );

    res.status(201).json({ success: true, message: `${upperSymbol} added to watchlist` });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/portfolio/watchlist/:symbol
const removeFromWatchlist = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM watchlist WHERE user_id = ? AND symbol = ?', [
      req.user.id,
      req.params.symbol.toUpperCase(),
    ]);
    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPortfolio,
  addAsset,
  updateAsset,
  deleteAsset,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};
