const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.error('[AUTH-MW] Missing JWT_SECRET environment variable -- all token verification will fail.');
}

/**
 * Helper function to extract and sanitize the token
 */
const extractToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  // Protects against frontend sending stringified "null" or "undefined"
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }

  return token;
};

/**
 * Centralized JWT Error Handler
 */
const handleJwtError = (err, res, path) => {
  console.error(`[AUTH-MW] ${err.name} on ${path}: ${err.message}`);

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false, 
      message: 'Session expired. Please log in again.' 
    });
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Invalid or malformed token.' 
  });
};

/**
 * Middleware: Verify Standard User
 */
const verifyToken = (req, res, next) => {
  const token = extractToken(req.headers['authorization']);

  if (!token) {
    console.warn(`[AUTH-MW] verifyToken -- no valid token on ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required. No valid token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(`[AUTH-MW] verifyToken success -- user_id: ${decoded.id}, role: ${decoded.role}, ${req.method} ${req.originalUrl}`);
    next();
  } catch (err) {
    return handleJwtError(err, res, req.originalUrl);
  }
};

/**
 * Middleware: Verify Admin Role
 */
const verifyAdmin = (req, res, next) => {
  const token = extractToken(req.headers['authorization']);

  if (!token) {
    console.warn(`[AUTH-MW] verifyAdmin -- no valid token on ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required. No valid token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      console.warn(`[AUTH-MW] verifyAdmin -- forbidden, user_id: ${decoded.id}, role: ${decoded.role}, ${req.method} ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Admin privileges required.'
      });
    }

    req.user = decoded;
    console.log(`[AUTH-MW] verifyAdmin success -- user_id: ${decoded.id}, ${req.method} ${req.originalUrl}`);
    next();
  } catch (err) {
    return handleJwtError(err, res, req.originalUrl);
  }
};

module.exports = { verifyToken, verifyAdmin };