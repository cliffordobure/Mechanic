const jwt = require('jsonwebtoken');
const User = require('../models/User');

function auth(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : requiredRoles ? [requiredRoles] : null;

  return async function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (roles && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = user;
      req.userId = user._id.toString();
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

module.exports = { auth };
