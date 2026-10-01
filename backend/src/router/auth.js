const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authmiddleware');
const multer = require('multer');
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  updateUserProfile 
} = require('../controllers/auth');

// Memory storage setup for multer stream processing
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 1. Forgot Password Route
router.post('/forgot-password', (req, res, next) => {
  console.log(`[AUTH-ROUTE] 📥 POST /forgot-password hit with body email:`, req.body?.email);
  next();
}, forgotPassword);

// 2. Reset Password Route
router.post('/reset-password/:token', (req, res, next) => {
  console.log(`[AUTH-ROUTE] 📥 POST /reset-password/:token hit with token:`, req.params.token);
  next();
}, resetPassword);

// 3. Register Route
router.post('/register', upload.single('profile_image'), (req, res, next) => {
  console.log(`[AUTH-ROUTE] 📥 POST /register hit with email:`, req.body?.email, `| File attached:`, !!req.file);
  next();
}, registerUser);

// 4. Login Route
router.post('/login', (req, res, next) => {
  console.log(`[AUTH-ROUTE] 📥 POST /login hit with email:`, req.body?.email);
  next();
}, loginUser);

// 5. Get User Profile Route (🌟 Fixes the 404 profile error & fetches user address)
router.get('/profile', verifyToken, async (req, res) => {
  console.log(`[AUTH-ROUTE] 📥 GET /profile hit for authenticated user_id:`, req.user?.user_id);
  try {
    const { getUserById } = require('../services/authservice');
    const user = await getUserById(req.user.user_id);
    console.log(`[AUTH-ROUTE] 📤 GET /profile successful for user_id:`, req.user.user_id);
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error(`[AUTH-ROUTE] ❌ Error in GET /profile:`, err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Update Profile Route
router.put('/profile', verifyToken, upload.single('profile_image'), (req, res, next) => {
  console.log(`[AUTH-ROUTE] 📥 PUT /profile hit for authenticated user_id:`, req.user?.user_id, `| File attached:`, !!req.file);
  next();
}, updateUserProfile);

module.exports = router;