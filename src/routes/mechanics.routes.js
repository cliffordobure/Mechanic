const express = require('express');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upsertMechanic, getNearby, getById } = require('../controllers/mechanicController');
const { mechanicUpsert, nearbyQuery } = require('../validators/schemas');

const router = express.Router();

/**
 * @openapi
 * /api/mechanics/nearby:
 *   get:
 *     tags: [Mechanics]
 *     summary: Nearby mechanics (geospatial)
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *         required: true
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *         required: true
 *       - in: query
 *         name: radius
 *         schema: { type: integer, default: 5000 }
 *         description: Max distance in meters
 */
router.get('/nearby', validate(nearbyQuery, 'query'), getNearby);

router.get('/:id', getById);

router.post('/', auth(['mechanic']), validate(mechanicUpsert), upsertMechanic);

module.exports = router;
