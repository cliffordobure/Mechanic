const express = require('express');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { getProfile, updateProfile, updateLocation } = require('../controllers/userController');
const { locationUpdate, profileUpdate } = require('../validators/schemas');

const router = express.Router();

router.use(auth());

/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     summary: Current user profile
 */
router.get('/profile', getProfile);

/**
 * @openapi
 * /api/users/profile:
 *   put:
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     summary: Update profile fields
 */
router.put('/profile', validate(profileUpdate), updateProfile);

/**
 * @openapi
 * /api/users/location:
 *   put:
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     summary: Set GeoJSON location (lng, lat)
 */
router.put('/location', validate(locationUpdate), updateLocation);

module.exports = router;
