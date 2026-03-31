const express = require('express');
const { register, login } = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { register: registerSchema, login: loginSchema } = require('../validators/schemas');

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [user, mechanic, seller] }
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Email already registered
 */
router.post('/register', validate(registerSchema), register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 */
router.post('/login', validate(loginSchema), login);

module.exports = router;
