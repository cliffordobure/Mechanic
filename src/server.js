const { loadBackendEnv } = require('./config/loadEnv');
loadBackendEnv();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { connectDb } = require('./config/db');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const mechanicsRoutes = require('./routes/mechanics.routes');
const sellersRoutes = require('./routes/sellers.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/mechanics', mechanicsRoutes);
app.use('/api/sellers', sellersRoutes);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/** One-time demo reload: set SEED_HTTP_KEY on the server, then GET .../seed-demo?key=YOUR_KEY */
app.get('/api/setup/seed-demo', async (req, res) => {
  const expected = process.env.SEED_HTTP_KEY;
  if (!expected) {
    return res.status(404).json({ message: 'Not found' });
  }
  if (req.query.key !== expected) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { clearDemoAccounts, insertDemoRecords } = require('./seed/runDemoSeed');
    await clearDemoAccounts();
    await insertDemoRecords({ clearFirst: false, verbose: false });
    return res.json({ ok: true, message: 'Demo mechanics & sellers inserted.' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 */
app.get('/health', async (req, res) => {
  const payload = { ok: true, database: mongoose.connection.name };
  if (mongoose.connection.readyState === 1) {
    try {
      const User = require('./models/User');
      const Mechanic = require('./models/Mechanic');
      const Seller = require('./models/Seller');
      payload.counts = {
        mechanics: await Mechanic.countDocuments(),
        sellers: await Seller.countDocuments(),
        demoUsers: await User.countDocuments({ email: /@marketplace\.demo$/ }),
      };
    } catch (e) {
      payload.countsError = e.message;
    }
  }
  res.json(payload);
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

async function maybeAutoSeedDemo() {
  if (process.env.AUTO_SEED_DEMO === 'false') {
    return;
  }
  try {
    const Mechanic = require('./models/Mechanic');
    const n = await Mechanic.countDocuments();
    if (n > 0) {
      return;
    }
    const { insertDemoRecords } = require('./seed/runDemoSeed');
    // eslint-disable-next-line no-console
    console.log(
      'No mechanics in DB — inserting demo listings (disable with AUTO_SEED_DEMO=false on Render).'
    );
    await insertDemoRecords({ clearFirst: false, verbose: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Demo auto-seed failed:', e.message);
  }
}

async function start() {
  if (!process.env.JWT_SECRET) {
    // eslint-disable-next-line no-console
    console.warn('Warning: JWT_SECRET is not set. Set it in .env for production.');
  }
  await connectDb();
  await maybeAutoSeedDemo();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
  });
}

start().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

module.exports = app;
