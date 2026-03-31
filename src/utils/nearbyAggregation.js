const User = require('../models/User');

/**
 * Geo search for users with `role`, keeping only those with a linked profile doc in `profileCollection`.
 * Avoids empty results when nearest mechanic-role users have no Mechanic/Seller row yet.
 */
async function findNearbyWithProfile({
  role,
  profileCollection,
  foreignUserField,
  lat,
  lng,
  maxDistanceMeters,
  page,
  limit,
}) {
  const lngNum = Number(lng);
  const latNum = Number(lat);
  const skip = (Number(page) - 1) * Number(limit);
  const lim = Number(limit);
  const maxD = Number(maxDistanceMeters);

  const cap = Math.min(200, skip + lim * 25);

  const rows = await User.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lngNum, latNum] },
        key: 'location',
        distanceField: 'dist',
        spherical: true,
        query: { role },
        maxDistance: maxD,
      },
    },
    { $limit: cap },
    {
      $lookup: {
        from: profileCollection,
        localField: '_id',
        foreignField: foreignUserField,
        as: 'profile',
      },
    },
    { $match: { 'profile.0': { $exists: true } } },
    { $skip: skip },
    { $limit: lim },
  ]);

  return rows.map((row) => {
    const profile = row.profile[0];
    const user = { ...row };
    delete user.profile;
    delete user.dist;
    delete user.password;
    delete user.__v;
    return {
      ...profile,
      user,
      userId: user._id,
    };
  });
}

module.exports = { findNearbyWithProfile };
