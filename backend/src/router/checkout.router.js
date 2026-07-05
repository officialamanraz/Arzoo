
const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');

// When a POST request hits this route, hand it over to the processCheckout function
router.post('/', checkoutController.processCheckout);

module.exports = router;