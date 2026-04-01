/**
 * Proves write + geospatial read path for mechanics/sellers.
 *
 * Usage:
 *   MONGODB_URI="your-uri" node scripts/verify-db-flow.js
 *   MONGODB_URI="..." node scripts/verify-db-flow.js --cleanup   # remove test rows only
 *
 * Creates users verify-mech-test@local.test / verify-sell-test@local.test (password: verify123456).
 */
const path = require('path');
const { loadBackendEnv, explainEnvLoadFailure } = require('../src/config/loadEnv');
const backendRoot = path.resolve(__dirname, '..');
loadBackendEnv();

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Mechanic = require('../src/models/Mechanic');
const Seller = require('../src/models/Seller');
const { findNearbyWithProfile } = require('../src/utils/nearbyAggregation');
const { resolveDbName } = require('../src/config/db');

const MECH_EMAIL = 'verify-mech-test@local.test';
const SELL_EMAIL = 'verify-sell-test@local.test';
const TEST_PASSWORD = 'verify123456';
// Same area as demo seed (Nairobi)
const NEAR_LAT = -1.29;
const NEAR_LNG = 36.82;
const MECH_POINT = { type: 'Point', coordinates: [36.806, -1.287] };
const SELL_POINT = { type: 'Point', coordinates: [36.824, -1.281] };

async function cleanup() {
  const users = await User.find({
    email: { $in: [MECH_EMAIL, SELL_EMAIL] },
  });
  const ids = users.map((u) => u._id);
  if (ids.length) {
    await Mechanic.deleteMany({ userId: { $in: ids } });
    await Seller.deleteMany({ userId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
  }
  return ids.length;
}

async function main() {
  const cleanupOnly = process.argv.includes('--cleanup');
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error('MONGODB_URI is not set.\n');
    console.error(explainEnvLoadFailure());
    console.error('\nOr pass once: $env:MONGODB_URI="mongodb+srv://..." ; npm run verify-db');
    process.exit(1);
  }

  const dbName = resolveDbName(uri);
  await mongoose.connect(uri, { dbName });
  console.log('Connected. Database:', mongoose.connection.name);

  if (cleanupOnly) {
    const n = await cleanup();
    console.log('Cleanup removed', n, 'test user(s) and linked profiles.');
    await mongoose.disconnect();
    return;
  }

  await cleanup();

  const mechUser = await User.create({
    name: 'Verify Test Mechanic',
    email: MECH_EMAIL,
    password: TEST_PASSWORD,
    role: 'mechanic',
    location: MECH_POINT,
  });
  await Mechanic.create({
    userId: mechUser._id,
    services: ['Oil change'],
    carBrands: ['Toyota'],
    availability: true,
  });

  const sellUser = await User.create({
    name: 'Verify Test Seller',
    email: SELL_EMAIL,
    password: TEST_PASSWORD,
    role: 'seller',
    location: SELL_POINT,
  });
  await Seller.create({
    userId: sellUser._id,
    shopName: 'Verify Parts Shop',
    inventory: [{ name: 'Test filter', category: 'Engine', price: 99, quantity: 1 }],
  });

  console.log('Inserted test mechanic userId:', mechUser._id.toString());
  console.log('Inserted test seller userId:', sellUser._id.toString());

  const mechNearby = await findNearbyWithProfile({
    role: 'mechanic',
    profileCollection: Mechanic.collection.name,
    foreignUserField: 'userId',
    lat: NEAR_LAT,
    lng: NEAR_LNG,
    maxDistanceMeters: 50000,
    page: 1,
    limit: 20,
  });

  const sellNearby = await findNearbyWithProfile({
    role: 'seller',
    profileCollection: Seller.collection.name,
    foreignUserField: 'userId',
    lat: NEAR_LAT,
    lng: NEAR_LNG,
    maxDistanceMeters: 50000,
    page: 1,
    limit: 20,
  });

  const mechHit = mechNearby.some((m) => m.userId?.toString() === mechUser._id.toString());
  const sellHit = sellNearby.some((s) => s.userId?.toString() === sellUser._id.toString());

  console.log('\n--- Results ---');
  console.log('Nearby mechanics count:', mechNearby.length, '| includes test row:', mechHit);
  console.log('Nearby sellers count:', sellNearby.length, '| includes test row:', sellHit);

  if (!mechHit || !sellHit) {
    console.error('\nFAIL: Geo lookup did not return the rows we just inserted.');
    console.error('Check users.location (GeoJSON Point), 2dsphere index, and role.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('\nOK: Database accepts writes and nearby aggregation returns them.');
  console.log('Remove test data: node scripts/verify-db-flow.js --cleanup');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
