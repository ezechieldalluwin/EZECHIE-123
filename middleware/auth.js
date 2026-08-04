const jwt = require('jsonwebtoken');

function verifyAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Access Denied: No authorization token provided' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  try {
    const secret = process.env.JWT_SECRET || 'cinestream_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret);
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token. Please log in again.' });
  }
}

module.exports = { verifyAdminToken };
