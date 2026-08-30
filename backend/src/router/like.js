const express = require('express');
const router = express.Router();

// 🚨 CHECK 1: Controller import (Naam aur path file jaisa rakho)
const { toggleLike, getLikeStatus } = require('../controllers/like'); 

// 🚨 CHECK 2: Middleware import me '{ }' lagao! (Maan lo aapke function ka naam 'verifyToken' hai)
const { verifyToken } = require('../middleware/authmiddleware'); // Apna asli function name likhna

// 🚨 CHECK 3: Yahan bhi wahi naam use karo
router.post('/:product_id/like', verifyToken, toggleLike);
router.get('/:product_id/like', verifyToken, getLikeStatus);

module.exports = router;