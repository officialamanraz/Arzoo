const express = require('express');
const router = express.Router();

const {
    verifyPayment
} = require('../controllers/payment');
const{razorpayWebhook} = require('../controllers/webhook');
const { verifyToken, verifyAdmin } = require('../middleware/authmiddleware');
router.post('/webhook',razorpayWebhook)
router.post('/verify', verifyToken, verifyPayment);

module.exports = router;