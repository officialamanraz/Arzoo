const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/authmiddleware');
const { getAdminDealerReport } = require('../controllers/dealer');

// Aur apna route define karein:
router.get('/dealers/report', verifyToken, verifyAdmin ,getAdminDealerReport);

module.exports=router