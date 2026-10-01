const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authmiddleware');
const multer = require('multer');
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  getUserProfile,
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

// 5. Get User Profile Route
router.get('/profile', verifyToken, (req, res, next) => {
  console.log(`[AUTH-ROUTE] 📥 GET /profile hit for authenticated user object:`, req.user);
  next();
}, getUserProfile);

// 6. Update Profile Route
router.put('/profile', verifyToken, upload.single('profile_image'), (req, res, next) => {
  console.log(`[AUTH-ROUTE] 📥 PUT /profile hit with File attached:`, !!req.file);
  next();
}, updateUserProfile);

module.exports = router;