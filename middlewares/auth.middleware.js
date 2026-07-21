const jwt = require('jsonwebtoken');
const { response } = require('../helpers/response.formatter');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json(response(401, 'Unauthorized: Missing Authorization header'));
  }

  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sekolah_absensi_super_secret_jwt_2026');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json(response(401, 'Unauthorized: Invalid or expired token'));
  }
};

module.exports = authMiddleware;
