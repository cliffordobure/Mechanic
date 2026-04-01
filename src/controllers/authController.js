const User = require('../models/User');
const Seller = require('../models/Seller');
const Mechanic = require('../models/Mechanic');
const { signToken } = require('../utils/token');
const { defaultShopName } = require('../utils/roleProfileDefaults');

async function ensureRoleProfile(user) {
  if (user.role === 'seller') {
    const has = await Seller.exists({ userId: user._id });
    if (!has) {
      await Seller.create({
        userId: user._id,
        shopName: defaultShopName(user.name),
        inventory: [],
      });
    }
  } else if (user.role === 'mechanic') {
    const has = await Mechanic.exists({ userId: user._id });
    if (!has) {
      await Mechanic.create({
        userId: user._id,
        services: [],
        carBrands: [],
      });
    }
  }
}

async function register(req, res) {
  const { name, email, phone, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const user = await User.create({ name, email, phone: phone || '', password, role });
  try {
    await ensureRoleProfile(user);
  } catch (e) {
    console.error('ensureRoleProfile after register:', e.message);
  }
  const token = signToken(user._id);
  return res.status(201).json({
    token,
    user: user.toPublicJSON(),
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  try {
    await ensureRoleProfile(user);
  } catch (e) {
    console.error('ensureRoleProfile after login:', e.message);
  }
  const token = signToken(user._id);
  const publicUser = user.toObject();
  delete publicUser.password;
  return res.json({ token, user: publicUser });
}

module.exports = { register, login };
