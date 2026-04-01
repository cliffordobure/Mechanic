const express = require('express');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upsertSeller, getNearby, getById, getMine } = require('../controllers/sellerController');
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

router.get('/me', auth(['seller']), getMine);

router.get('/:id', getById);

router.post('/', auth(['seller']), validate(sellerUpsert), upsertSeller);

module.exports = router;
