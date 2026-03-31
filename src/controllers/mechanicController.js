const User = require('../models/User');
const Mechanic = require('../models/Mechanic');

async function upsertMechanic(req, res) {
  if (req.user.role !== 'mechanic') {
    return res.status(403).json({ message: 'Only mechanics can create or update mechanic profile' });
  }
  const { services, carBrands, pricingNote, availability } = req.body;
  const $set = {};
  if (services !== undefined) $set.services = services;
  if (carBrands !== undefined) $set.carBrands = carBrands;
  if (pricingNote !== undefined) $set.pricingNote = pricingNote;
  if (availability !== undefined) $set.availability = availability;
  const doc = await Mechanic.findOneAndUpdate(
    { userId: req.userId },
    { $set, $setOnInsert: { userId: req.userId } },
    { new: true, upsert: true, runValidators: true }
  );
  return res.json({ mechanic: doc });
}

async function getNearby(req, res) {
  const { lat, lng, radius, page, limit, service, brand } = req.query;
  const lngNum = Number(lng);
  const latNum = Number(lat);
  const maxDistance = Number(radius);
  const skip = (Number(page) - 1) * Number(limit);

  const geoMatch = {
    role: 'mechanic',
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lngNum, latNum] },
        $maxDistance: maxDistance,
      },
    },
  };

  const users = await User.find(geoMatch).skip(skip).limit(Number(limit)).lean();
  const userIds = users.map((u) => u._id);

  let mechanicQuery = { userId: { $in: userIds } };
  if (service) {
    mechanicQuery.services = { $regex: new RegExp(service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
  }
  if (brand) {
    mechanicQuery.carBrands = { $regex: new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
  }

  const mechanics = await Mechanic.find(mechanicQuery).populate('userId', '-password').lean();

  const order = new Map(users.map((u, i) => [u._id.toString(), i]));
  mechanics.sort((a, b) => (order.get(a.userId._id.toString()) ?? 999) - (order.get(b.userId._id.toString()) ?? 999));

  const items = mechanics.map((m) => ({
    ...m,
    user: m.userId,
    userId: m.userId?._id,
  }));

  return res.json({
    items,
    page: Number(page),
    limit: Number(limit),
  });
}

async function getById(req, res) {
  const mechanic = await Mechanic.findById(req.params.id).populate('userId', '-password');
  if (!mechanic) {
    return res.status(404).json({ message: 'Mechanic not found' });
  }
  const obj = mechanic.toObject();
  obj.user = obj.userId;
  return res.json({ mechanic: obj });
}

module.exports = { upsertMechanic, getNearby, getById };
