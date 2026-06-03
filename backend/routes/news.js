// backend/routes/news.js
const router = require('express').Router();
const { getNews, fetchAndStoreNews, analyzeNews, getSentimentStats } = require('../controllers/newsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getNews);
router.post('/fetch', fetchAndStoreNews);
router.post('/:id/analyze', analyzeNews);
router.get('/stats/sentiment', getSentimentStats);

module.exports = router;
