const Seller = require('../models/Seller');
const { findNearbyWithAutoProfile, findBrowseWithAutoProfile } = require('../utils/nearbyAggregation');
const { defaultShopName } = require('../utils/roleProfileDefaults');
const { formatSellerForClient } = require('../utils/sellerResponse');

async function upsertSeller(req, res) {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Only sellers can create or update seller profile' });
  }
  const { shopName, inventory } = req.body;
  const $set = {};
  if (shopName !== undefined) $set.shopName = shopName;
  if (inventory !== undefined) $set.inventory = inventory;
  // MongoDB forbids the same path in both $set and $setOnInsert (ConflictingUpdateOperators).
  const $setOnInsert = { userId: req.userId };
  if (shopName === undefined) {
    $setOnInsert.shopName = defaultShopName(req.user.name);
  }
  if (inventory === undefined) {
    $setOnInsert.inventory = [];
  }
  const doc = await Seller.findOneAndUpdate(
    { userId: req.userId },
    { $set, $setOnInsert },
    { new: true, upsert: true, runValidators: true }
  );
  const populated = await Seller.findById(doc._id).populate('userId', '-password');
  return res.json({ seller: formatSellerForClient(populated) });
}

async function getMine(req, res) {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Only sellers have a parts shop profile' });
  }
  let seller = await Seller.findOne({ userId: req.userId }).populate('userId', '-password');
  if (!seller) {
    await Seller.create({
      userId: req.userId,
      shopName: defaultShopName(req.user.name),
      inventory: [],
    });
    seller = await Seller.findOne({ userId: req.userId }).populate('userId', '-password');
  }
  return res.json({ seller: formatSellerForClient(seller) });
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
  return res.json({ seller: formatSellerForClient(seller) });
}

module.exports = { upsertSeller, getNearby, getById, getMine };
