const express = require('express');
const router = express.Router();

const {
    orderCreate,
    verifyPayment
} = require('../controllers/payment');

const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/create-order', verifyToken, orderCreate);
router.post('/verify', verifyToken, verifyPayment);

module.exports = router;