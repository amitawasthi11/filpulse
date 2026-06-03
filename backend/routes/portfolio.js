// backend/routes/portfolio.js
const router = require('express').Router();
const { body } = require('express-validator');
const {
  getPortfolio, addAsset, updateAsset, deleteAsset,
  getWatchlist, addToWatchlist, removeFromWatchlist,
} = require('../controllers/portfolioController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getPortfolio);
router.post('/', [
  body('symbol').notEmpty().isLength({ min: 1, max: 20 }),
  body('name').notEmpty().isLength({ min: 1, max: 100 }),
  body('quantity').isFloat({ min: 0.00000001 }),
  body('purchase_price').isFloat({ min: 0 }),
], addAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

// Watchlist
router.get('/watchlist', getWatchlist);
router.post('/watchlist', addToWatchlist);
router.delete('/watchlist/:symbol', removeFromWatchlist);

module.exports = router;
