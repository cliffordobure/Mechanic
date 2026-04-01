/**
 * Inserts demo mechanics & sellers (Nairobi + NYC/London/Lagos).
 * Run: npm run seed
 *
 * Demo password: demo123456 (see src/seed/runDemoSeed.js)
 */
const path = require('path');
const backendRoot = path.resolve(__dirname, '..');
const { loadBackendEnv } = require('../src/config/loadEnv');
loadBackendEnv();

const mongoose = require('mongoose');
const { resolveDbName } = require('../src/config/db');
const { clearDemoAccounts, insertDemoRecords, DEMO_PASSWORD } = require('../src/seed/runDemoSeed');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }
  const dbName = resolveDbName(uri);
  await mongoose.connect(uri, { dbName });
  console.log('Connected to MongoDB, database:', dbName);

  const removed = await clearDemoAccounts();
  if (removed) console.log(`Removed ${removed} previous demo account(s).`);

  await insertDemoRecords({ clearFirst: false, verbose: true });
  console.log('\nDone. Password for all demo accounts:', DEMO_PASSWORD);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
