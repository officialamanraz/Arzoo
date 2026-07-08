const jwt = require('jsonwebtoken');

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
const handleJwtError = (err, res) => {
  console.error(`[Auth Error]: ${err.name} - ${err.message}`);

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
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required. No valid token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return handleJwtError(err, res);
  }
};

/**
 * Middleware: Verify Admin Role
 */
const verifyAdmin = (req, res, next) => {
  const token = extractToken(req.headers['authorization']);

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required. No valid token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Admin privileges required.'
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return handleJwtError(err, res);
  }
};

module.exports = { verifyToken, verifyAdmin };