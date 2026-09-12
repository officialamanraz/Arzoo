const express = require('express');
const router = express.Router();

// 1. Import Middlewares
const { verifyToken, verifyAdmin } = require('../middleware/authmiddleware');

// 2. Import Controllers (Sabhi controllers ko ek jagah se import kiya gaya hai)
const { 
    getBasicDealerList,
    getAdminDealerDetail, 
    createNewDealer,
    updateExistingDealer
} = require('../controllers/dealer'); // Apne controller file ka exact naam check kar lena (e.g., dealerController.js)
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage});
// ============================================================================
// 🌐 GLOBAL ROUTER-LEVEL LOGGING MIDDLEWARE
// ============================================================================
router.use((req, res, next) => {
    console.log(`[DEALER_ROUTER] 🌐 Incoming Request -> Method: ${req.method} | URL: ${req.originalUrl}`);
    next();
});


// ============================================================================
// 🛡️ ADMIN ROUTES (Strictly protected by Token & Admin Role)
// ============================================================================

// Route 1: Get Master Dealer Report (List of all dealers with stats)
// Matches frontend fetch: /api/dealers/admin/all
router.get('/admin/all', verifyToken, verifyAdmin, (req, res, next) => {
    console.log(`[DEALER_ROUTER] 🛡️ Admin route triggered: Fetching Master Dealer Report.`);
    next();
}, getBasicDealerList);

// Route 2: Get specific dealer profile and product inventory breakdown
// Matches frontend fetch: /api/dealers/admin/dealer/:id
router.get('/admin/dealer/:id', verifyToken, verifyAdmin, (req, res, next) => {
    console.log(`[DEALER_ROUTER] 🛡️ Admin route triggered for Dealer ID: ${req.params.id}`);
    next(); 
}, getAdminDealerDetail);


// ============================================================================
// 🤝 DEALER PORTAL ROUTES (Protected by Token)
// ============================================================================

// Route 3: Get assigned orders and masked payouts for the logged-in dealer
// Matches frontend fetch: /api/dealers/dealer/orders
router.post('/admin/add', verifyToken, verifyAdmin, upload.single('image'), (req, res, next) => {
    console.log(`[DEALER_ROUTER] 🛡️ Admin route triggered: Add New Dealer with Image`);
    next();
}, createNewDealer);
router.put('/admin/update/:id', verifyToken, verifyAdmin, upload.single('image'), (req, res, next) => {
    console.log(`[DEALER_ROUTER] 🛡️ Admin route triggered: Update Dealer ID: ${req.params.id}`);
    next();
}, updateExistingDealer);
module.exports = router;