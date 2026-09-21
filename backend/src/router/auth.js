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

// Public Authentication Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/register', upload.single('profile_image'), registerUser);
router.post('/login', loginUser);

// Protected Profile Routes
// Note: Ensure your frontend sends form-data with the key name matching 'profile_image' or 'image' depending on what multer expects here.
router.put('/profile', verifyToken, upload.single('profile_image'), updateUserProfile);

module.exports = router;