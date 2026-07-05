const express = require('express');
const router = express.Router();

const { processCheckout } = require('../controllers/checkout.controller');
const { getOrderTracking } = require('../controllers/tracking.controller'); // Removed updateOrderStatus from here
const { getadminorder, getmyorders, updateOrderStatus } = require('../controllers/order.controller'); // ADDED IT HERE!
const { getCart } = require('../controllers/cart.controller');
const { verifyToken, verifyAdmin } = require('../middleware/authmiddleware');

// Customer places a COD order
router.post('/checkout', verifyToken, processCheckout);

router.get('/cart', verifyToken, getCart);
router.get('/my-orders', verifyToken, getmyorders);

// Customer/anyone-with-link tracks an order by its payment_id 
router.get('/tracking/:orderId', verifyToken, getOrderTracking);

// Admin: view all orders
router.get('/admin/all', verifyToken, verifyAdmin, getadminorder);

// Admin: update status + add tracking milestone
router.patch('/admin/status', verifyToken, verifyAdmin, updateOrderStatus);

module.exports = router;