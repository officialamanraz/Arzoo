const express = require('express');
const router = express.Router();

const { processCheckout } = require('../controllers/checkout');
const { getOrderTracking } = require('../controllers/tracking'); // Removed updateOrderStatus from here
const { getadminorder, getmyorders, updateOrderStatus,orderCreate,cancelOrder } = require('../controllers/order'); // ADDED IT HERE!
const { getCart } = require('../controllers/cart');
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
router.post('/create-order', verifyToken, orderCreate);
router.put('/:id/cancel', verifyToken,cancelOrder);
// Status update route (Admin Only)
router.put('/:id/status', verifyToken, verifyAdmin,updateOrderStatus);
module.exports = router;