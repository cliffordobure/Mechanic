const User = require('../models/User');

/**
 * Upsert profile rows and build API-shaped list (same order as `candidates`).
 */
async function ensureProfilesAndMerge(candidates, ProfileModel, setOnInsertForUser) {
  if (!candidates.length) return [];

  await ProfileModel.bulkWrite(
    candidates.map((u) => ({
      updateOne: {
        filter: { userId: u._id },
        update: {
          $setOnInsert: {
            userId: u._id,
            ...setOnInsertForUser(u),
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  const ids = candidates.map((c) => c._id);
  const profiles = await ProfileModel.find({ userId: { $in: ids } }).lean();
  const profileByUserId = new Map(profiles.map((p) => [String(p.userId), p]));

  const merged = [];
  for (const row of candidates) {
    const profile = profileByUserId.get(String(row._id));
    if (!profile) continue;
    const user = { ...row };
    delete user.dist;
    delete user.password;
    delete user.__v;
    merged.push({
      ...profile,
      user,
      userId: row._id,
    });
  }
  return merged;
}

/**
 * Geo search for users with `role`, then ensure each has a ProfileModel row (upsert).
 * Users without a valid indexed `location` never appear in $geoNear — use browse fallback for that.
 */
async function findNearbyWithAutoProfile({
  role,
  ProfileModel,
  setOnInsertForUser,
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

  if (!Number.isFinite(lngNum) || !Number.isFinite(latNum) || !Number.isFinite(maxD) || maxD <= 0) {
    return [];
  }

  const candidates = await User.aggregate([
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
  ]);

  if (candidates.length === 0) return [];

  const merged = await ensureProfilesAndMerge(candidates, ProfileModel, setOnInsertForUser);
  return merged.slice(skip, skip + lim);
}

/**
 * List users by role (newest first), ensure profile rows, paginate — no geo required.
 * Used when nearby geo returns nobody (missing/wrong location or outside radius).
 */
async function findBrowseWithAutoProfile({
  role,
  ProfileModel,
  setOnInsertForUser,
  page,
  limit,
}) {
  const skip = Math.max(0, (Number(page) - 1) * Number(limit));
  const lim = Number(limit);
  if (!Number.isFinite(skip) || !Number.isFinite(lim) || lim <= 0) return [];

  const cap = Math.min(500, skip + lim);
  const candidates = await User.find({ role })
    .select('-password')
    .sort({ updatedAt: -1 })
    .limit(cap)
    .lean();

  if (candidates.length === 0) return [];

  const merged = await ensureProfilesAndMerge(candidates, ProfileModel, setOnInsertForUser);
  return merged.slice(skip, skip + lim);
}

/**
 * Geo search for users with `role`, keeping only those with a linked profile doc in `profileCollection`.
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

module.exports = {
  findNearbyWithProfile,
  findNearbyWithAutoProfile,
  findBrowseWithAutoProfile,
};
