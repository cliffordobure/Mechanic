const User = require('../models/User');
const Seller = require('../models/Seller');

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
  const lngNum = Number(lng);
  const latNum = Number(lat);
  const maxDistance = Number(radius);
  const skip = (Number(page) - 1) * Number(limit);

  const geoMatch = {
    role: 'seller',
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lngNum, latNum] },
        $maxDistance: maxDistance,
      },
    },
  };

  const users = await User.find(geoMatch).skip(skip).limit(Number(limit)).lean();
  const userIds = users.map((u) => u._id);

  let sellerQuery = { userId: { $in: userIds } };
  if (category) {
    const safe = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sellerQuery.inventory = { $elemMatch: { category: { $regex: new RegExp(safe, 'i') } } };
  }

  const sellers = await Seller.find(sellerQuery).populate('userId', '-password').lean();

  const order = new Map(users.map((u, i) => [u._id.toString(), i]));
  sellers.sort((a, b) => (order.get(a.userId._id.toString()) ?? 999) - (order.get(b.userId._id.toString()) ?? 999));

  const items = sellers.map((s) => ({
    ...s,
    user: s.userId,
    userId: s.userId?._id,
  }));

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
