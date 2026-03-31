const express = require('express');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upsertSeller, getNearby, getById } = require('../controllers/sellerController');
const { sellerUpsert, nearbyQuery } = require('../validators/schemas');

const router = express.Router();

/**
 * @openapi
 * /api/sellers/nearby:
 *   get:
 *     tags: [Sellers]
 *     summary: Nearby spare part sellers
 */
router.get('/nearby', validate(nearbyQuery, 'query'), getNearby);

router.get('/:id', getById);

router.post('/', auth(['seller']), validate(sellerUpsert), upsertSeller);

module.exports = router;
