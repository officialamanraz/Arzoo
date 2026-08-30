const express = require('express');
const router = express.Router();
const { verifyToken} = require('../middleware/authmiddleware');
const multer = require('multer');
const { registerUser, loginUser, forgotPassword, resetPassword,updateUserProfile} = require('../controllers/auth');
const storage = multer.memoryStorage(); // CHANGED: diskStorage se memoryStorage

const upload = multer({storage});
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/register', registerUser);
router.post('/login', loginUser);

// 🚨 UPDATED ONLY THIS LINE: verifyToken ko upload.single se pehle rakh diya
router.put('/profile', verifyToken, upload.single('image'), updateUserProfile);

module.exports = router;