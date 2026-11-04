const express = require('express');
const router = express.Router();
const { sendContactEmail,sendOrderStatusEmail } = require('../controllers/Email');

router.post('/', sendContactEmail);
router.post('/order-status', sendOrderStatusEmail);

module.exports = router;