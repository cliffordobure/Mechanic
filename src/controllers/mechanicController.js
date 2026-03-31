const Mechanic = require('../models/Mechanic');
const { findNearbyWithProfile } = require('../utils/nearbyAggregation');

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
  const maxDistance = Number(radius);

  let items = await findNearbyWithProfile({
    role: 'mechanic',
    profileCollection: Mechanic.collection.name,
    foreignUserField: 'userId',
    lat,
    lng,
    maxDistanceMeters: maxDistance,
    page,
    limit,
  });

  if (service) {
    const re = new RegExp(service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    items = items.filter((m) => (m.services || []).some((s) => re.test(s)));
  }
  if (brand) {
    const re = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    items = items.filter((m) => (m.carBrands || []).some((b) => re.test(b)));
  }

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
