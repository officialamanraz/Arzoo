// File: src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();

// ==========================================
// 📥 CONTROLLER IMPORTS
// ==========================================
const { processCheckout } = require('../controllers/checkout');
const { getOrderTracking } = require('../controllers/tracking'); 
const { courierWebhookController } = require('../controllers/webhook');
const { getCart } = require('../controllers/cart');
const { verifyToken, verifyAdmin } = require('../middleware/authmiddleware');
const {getInvoice} = require('../controllers/Email')
const { 
    getadminorder, 
    getmyorders, 
    updateOrderStatus,
    orderCreate,
    cancelOrder,
    getSingleOrderAdmin,
    getOrderSummary,
//     markOutForDeliveryController,
//   verifyDeliveryOtpController,
//   markDeliveryAttemptFailedController
getDeliveredOrderHistoryController,
} = require('../controllers/order'); 

// ==========================================
// 🔍 ROUTER-LEVEL LOGGING MIDDLEWARE
// ==========================================
router.get('/summary', verifyToken, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 📋 Route Triggered: GET /summary by User`);
    getOrderSummary(req, res, next);
});
router.use((req, res, next) => {
    console.log(`[ORDER_ROUTES] 🛣️ API Traffic Hit: [${req.method}] ${req.originalUrl}`);
    next();
});

console.log('[ORDER_ROUTES] 🚀 Order, Checkout & Admin Routes Initialized Successfully!');

// ==========================================
// 🛒 CUSTOMER ROUTES (Requires Login: verifyToken)
// ==========================================

// 1. Customer places a COD/Online order
router.post('/checkout', verifyToken, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 🛍️ Route Triggered: POST /checkout by User`);
    processCheckout(req, res, next);
});

// 2. Fetch User Cart
router.get('/cart', verifyToken, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 🛒 Route Triggered: GET /cart by User`);
    getCart(req, res, next);
});

// 3. Fetch My Orders (User Side)
router.get('/my-orders', verifyToken, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 📦 Route Triggered: GET /my-orders by User`);
    getmyorders(req, res, next);
});

// 4. Create Razorpay Order
router.post('/create-order', verifyToken, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 💳 Route Triggered: POST /create-order by User`);
    orderCreate(req, res, next);
});

// 5. Cancel Order by User
router.put('/:id/cancel', verifyToken, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 🚫 Route Triggered: PUT /${req.params.id}/cancel by User`);
    cancelOrder(req, res, next);
});

// 6. Track an order by its ID
router.get('/tracking/:orderId', verifyToken, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 🚚 Route Triggered: GET /tracking/${req.params.orderId}`);
    getOrderTracking(req, res, next);
});
router.get('/delivered-history', verifyToken, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 📦 Route Triggered: GET /delivered-history by User`);
    getDeliveredOrderHistoryController(req, res, next);
});

// 1. Admin: View all orders (List)
router.get('/admin/all', verifyToken, verifyAdmin, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 👑 Admin Route Triggered: GET /admin/all`);
    getadminorder(req, res, next);
});

// 2. Admin: View SINGLE order deep details (Financial Breakdown)
router.get('/admin/order/:id', verifyToken, verifyAdmin, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 👑 Admin Route Triggered: GET /admin/order/${req.params.id}`);
    getSingleOrderAdmin(req, res, next);
});

// 3. Admin: Update status (using body data)
router.patch('/admin/status', verifyToken, verifyAdmin, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 👑 Admin Route Triggered: PATCH /admin/status`);
    updateOrderStatus(req, res, next);
});

// 4. Admin: Alternative Status update route (using params ID)
router.put('/:id/status', verifyToken, verifyAdmin, (req, res, next) => {
    console.log(`[ORDER_ROUTES] 👑 Admin Route Triggered: PUT /${req.params.id}/status`);
    updateOrderStatus(req, res, next);
});
// router.post('/admin/out-for-delivery', verifyToken, verifyAdmin, (req, res, next) => {
//     console.log(`[ORDER_ROUTES] 🚚 Admin Route Triggered: POST /admin/out-for-delivery`);
//     markOutForDeliveryController(req, res, next);
// });

// // 6. Admin/Agent: Verify Delivery Boy's OTP at Doorstep
// router.post('/admin/verify-delivery-otp', verifyToken, verifyAdmin, (req, res, next) => {
//     console.log(`[ORDER_ROUTES] 🔐 Admin Route Triggered: POST /admin/verify-delivery-otp`);
//     verifyDeliveryOtpController(req, res, next);
// });

// // 7. Admin/Agent: Mark Attempt as Failed (Customer not found, etc.)
// router.post('/admin/delivery-attempt-failed', verifyToken, verifyAdmin, (req, res, next) => {
//     console.log(`[ORDER_ROUTES] ❌ Admin Route Triggered: POST /admin/delivery-attempt-failed`);
//     markDeliveryAttemptFailedController(req, res, next);
// });
// ==========================================
// 🚚 3PL COURIER WEBHOOK ROUTES (No Auth Middleware)
// ==========================================

// Webhook listener for automatic status updates from Shiprocket/Delhivery
router.post('/webhook/courier', (req, res, next) => {
    console.log(`[ORDER_ROUTES] 🚚 Webhook Route Triggered: POST /webhook/courier by 3PL`);
    courierWebhookController(req, res, next);
});

router.get(':/orderId/invoice',verifyToken,getInvoice)
module.exports = router;