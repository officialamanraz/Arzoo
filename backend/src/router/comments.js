const express = require('express');
const router = express.Router();

// 🚨 CHECK 1: Controller import (Dhyan rahe ki brackets { } lage ho)
// Yahan apne asli functions ka naam likhna jo aapne controller me banaye hain (e.g., addComment, getComments)
const { addComment, getComments } = require('../controllers/comments'); 

// 🚨 CHECK 2: Middleware import (Isme bhi { } hona zaroori hai)
const { verifyToken } = require('../middleware/authmiddleware'); // Apna actual middleware name likhna

// Routes
router.post('/:product_id/comments', verifyToken, addComment);
router.get('/:product_id/comments', getComments); // Get comments me usually token nahi lagta taaki sab padh sakein

module.exports = router;