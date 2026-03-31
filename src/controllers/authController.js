const User = require('../models/User');
const { signToken } = require('../utils/token');

async function register(req, res) {
  const { name, email, phone, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const user = await User.create({ name, email, phone: phone || '', password, role });
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
  const token = signToken(user._id);
  const publicUser = user.toObject();
  delete publicUser.password;
  return res.json({ token, user: publicUser });
}

module.exports = { register, login };
