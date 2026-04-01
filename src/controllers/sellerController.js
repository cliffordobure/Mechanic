const Seller = require('../models/Seller');
const { findNearbyWithAutoProfile, findBrowseWithAutoProfile } = require('../utils/nearbyAggregation');
const { defaultShopName } = require('../utils/roleProfileDefaults');

async function upsertSeller(req, res) {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Only sellers can create or update seller profile' });
  }
  const { shopName, inventory } = req.body;
  const $set = {};
  if (shopName !== undefined) $set.shopName = shopName;
  if (inventory !== undefined) $set.inventory = inventory;
  const doc = await Seller.findOneAndUpdate(
    { userId: req.userId },
    { $set, $setOnInsert: { userId: req.userId } },
    { new: true, upsert: true, runValidators: true }
  );
  return res.json({ seller: doc });
}

async function getNearby(req, res) {
  const { lat, lng, radius, page, limit, category } = req.query;
  const maxDistance = Number(radius);

  let items = await findNearbyWithAutoProfile({
    role: 'seller',
    ProfileModel: Seller,
    setOnInsertForUser: (u) => ({
      shopName: defaultShopName(u.name),
      inventory: [],
    }),
    lat,
    lng,
    maxDistanceMeters: maxDistance,
    page,
    limit,
  });

  if (items.length === 0) {
    items = await findBrowseWithAutoProfile({
      role: 'seller',
      ProfileModel: Seller,
      setOnInsertForUser: (u) => ({
        shopName: defaultShopName(u.name),
        inventory: [],
      }),
      page,
      limit,
    });
  }

  if (category) {
    const re = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    items = items.filter((s) =>
      (s.inventory || []).some((inv) => inv.category && re.test(inv.category))
    );
  }

  return res.json({
    items,
    page: Number(page),
    limit: Number(limit),
  });
}

async function getById(req, res) {
  const seller = await Seller.findById(req.params.id).populate('userId', '-password');
  if (!seller) {
    return res.status(404).json({ message: 'Seller not found' });
  }
  const obj = seller.toObject();
  obj.user = obj.userId;
  return res.json({ seller: obj });
}

module.exports = { upsertSeller, getNearby, getById };
