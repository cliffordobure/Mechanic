const mongoose = require('mongoose');

/** Atlas URIs often end with `.net/` with no DB name → data lands in `test` and the API looks empty. */
function resolveDbName(uri) {
  const fromEnv = process.env.MONGODB_DB?.trim();
  if (fromEnv) return fromEnv;
  const base = uri.split('?')[0];
  const i = base.lastIndexOf('/');
  if (i === -1 || i === base.length - 1) return 'mechanic_marketplace';
  const segment = base.slice(i + 1);
  if (!segment || segment.includes('@')) return 'mechanic_marketplace';
  return segment;
}

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  mongoose.set('strictQuery', true);
  const dbName = resolveDbName(uri);
  await mongoose.connect(uri, { dbName });
  // eslint-disable-next-line no-console
  console.log('MongoDB using database:', dbName);
  try {
    await mongoose.connection.db.collection('users').createIndex({ location: '2dsphere' }, { sparse: true });
  } catch (e) {
    console.warn('Could not ensure users.location 2dsphere index:', e.message);
  }
}

module.exports = { connectDb, resolveDbName };
