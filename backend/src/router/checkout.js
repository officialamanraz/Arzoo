// File: src/routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout');
const { verifyToken } = require('../middleware/authmiddleware');

router.use((req, res, next) => {
    console.log(`[CHECKOUT_ROUTES] 🛣️ API Traffic Hit: [${req.method}] ${req.originalUrl}`);
    next();
});

console.log('[CHECKOUT_ROUTES] 🛒 Standalone Checkout Route Initialized!');

// When a POST request hits this route, hand it over to the processCheckout function
router.post('/', verifyToken, (req, res, next) => {
    console.log(`[CHECKOUT_ROUTES] 🚀 Standalone Checkout POST hit.`);
    checkoutController.processCheckout(req, res, next);
});

module.exports = router;