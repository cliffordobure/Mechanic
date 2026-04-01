/**
 * Create missing Seller / Mechanic documents for users who only exist in `users`.
 *
 * Design: everyone signs in as a User (role: seller | mechanic | user). Shop /
 * services live in separate collections linked by userId — they are not a
 * replacement for the users collection.
 *
 * Usage (from backend folder, with MONGODB_URI in .env or env):
 *   node scripts/backfill-role-profiles.js
 *
 * Safe to run multiple times (skips when profile already exists).
 */
const path = require('path');
const { loadBackendEnv } = require('../src/config/loadEnv');

loadBackendEnv();

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Seller = require('../src/models/Seller');
const Mechanic = require('../src/models/Mechanic');
const { defaultShopName } = require('../src/utils/roleProfileDefaults');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGODB_URI (e.g. in backend/.env)');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected. Scanning users…');

  let sellersCreated = 0;
  let mechanicsCreated = 0;

  const sellerUsers = await User.find({ role: 'seller' }).select('_id name email');
  for (const u of sellerUsers) {
    const has = await Seller.exists({ userId: u._id });
    if (!has) {
      await Seller.create({
        userId: u._id,
        shopName: defaultShopName(u.name),
        inventory: [],
      });
      sellersCreated += 1;
      console.log(`  + seller profile for ${u.email} (${u._id})`);
    }
  }

  const mechanicUsers = await User.find({ role: 'mechanic' }).select('_id name email');
  for (const u of mechanicUsers) {
    const has = await Mechanic.exists({ userId: u._id });
    if (!has) {
      await Mechanic.create({
        userId: u._id,
        services: [],
        carBrands: [],
      });
      mechanicsCreated += 1;
      console.log(`  + mechanic profile for ${u.email} (${u._id})`);
    }
  }

  console.log(`Done. Created ${sellersCreated} seller row(s), ${mechanicsCreated} mechanic row(s).`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
