// File: routes/trackingRoutes.js
const express = require('express');
const router = express.Router();
const {getOrderTracking,
    updateOrderStatus} = require('../controllers/tracking.controller');

// Route for the user's frontend UI progress tracking bar
router.get('/:orderId',getOrderTracking);

// Route for your hidden admin panel control dashboard
router.post('/update',updateOrderStatus);

module.exports = router;