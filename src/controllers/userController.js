const User = require('../models/User');

async function getProfile(req, res) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: user.toPublicJSON() });
}

async function updateProfile(req, res) {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: user.toPublicJSON() });
}

async function updateLocation(req, res) {
  const { lat, lng } = req.body;
  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      $set: {
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      },
    },
    { new: true, runValidators: true }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: user.toPublicJSON() });
}

module.exports = { getProfile, updateProfile, updateLocation };
