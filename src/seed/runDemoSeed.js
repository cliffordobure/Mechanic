const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Seller = require('../models/Seller');
const { DEMO_PASSWORD, allMechanics, allSellers } = require('./demoCatalog');

async function clearDemoAccounts() {
  const users = await User.find({ email: { $regex: /@marketplace\.demo$/ } });
  const ids = users.map((u) => u._id);
  if (ids.length) {
    await Mechanic.deleteMany({ userId: { $in: ids } });
    await Seller.deleteMany({ userId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
  }
  return ids.length;
}

/**
 * @param {{ clearFirst?: boolean, verbose?: boolean }} opts
 */
async function insertDemoRecords(opts = {}) {
  const { clearFirst = false, verbose = false } = opts;
  if (clearFirst) {
    const n = await clearDemoAccounts();
    if (verbose && n) console.log(`Removed ${n} previous demo account(s).`);
  }

  let mIndex = 0;
  for (const m of allMechanics) {
    const user = await User.create({
      name: m.name,
      email: m.email,
      phone: m.phone,
      password: DEMO_PASSWORD,
      role: 'mechanic',
      businessDescription: 'Demo mechanic for marketplace testing.',
      location: m.location,
    });
    await Mechanic.create({
      userId: user._id,
      services: m.services,
      carBrands: m.carBrands,
      pricingNote: m.pricingNote,
      availability: true,
      rating: 4.2 + (mIndex % 3) * 0.2,
    });
    mIndex += 1;
    if (verbose) console.log('Mechanic:', m.name);
  }

  for (const s of allSellers) {
    const user = await User.create({
      name: s.name,
      email: s.email,
      phone: s.phone,
      password: DEMO_PASSWORD,
      role: 'seller',
      businessDescription: 'Demo parts seller for marketplace testing.',
      location: s.location,
    });
    await Seller.create({
      userId: user._id,
      shopName: s.shopName,
      inventory: s.inventory,
    });
    if (verbose) console.log('Seller:', s.shopName);
  }

  if (verbose) {
    console.log('Demo seed complete. Login password:', DEMO_PASSWORD);
  }
}

module.exports = { clearDemoAccounts, insertDemoRecords, DEMO_PASSWORD };
