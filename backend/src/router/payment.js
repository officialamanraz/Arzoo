// File: src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();

const { verifyPayment } = require('../controllers/payment');
const { razorpayWebhook } = require('../controllers/webhook');
const { verifyToken } = require('../middleware/authmiddleware');

router.use((req, res, next) => {
    console.log(`[PAYMENT_ROUTES] 🛣️ API Traffic Hit: [${req.method}] ${req.originalUrl}`);
    next();
});

console.log('[PAYMENT_ROUTES] 💳 Webhook & Payment Verification Routes Initialized!');

// Webhook route (No verifyToken here because Razorpay server calls this directly)
router.post('/webhook', (req, res, next) => {
    console.log(`[PAYMENT_ROUTES] 🔔 Webhook Route Hit from Razorpay Servers.`);
    razorpayWebhook(req, res, next);
});

// Payment verification after user pays on frontend
router.post('/verify', verifyToken, (req, res, next) => {
    console.log(`[PAYMENT_ROUTES] 🔐 Payment Verification Route Hit by User.`);
    verifyPayment(req, res, next);
});

module.exports = router;