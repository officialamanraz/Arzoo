const express = require("express");
const router = express.Router();
const path = require('path');

// 🚨 Added 'deleteReview' to the import list
const { addReview, 
    getProductReviews, 
    getAllProductReviews,
    markHelpful,
    editReview,     // 👈 Imported new controller
    deleteReview } = require(path.join(__dirname, '../controllers/review'));
const { verifyToken } = require("../middleware/authmiddleware"); 
const upload = require("../middleware/uploads"); 

// Get reviews and options for a product
router.use((req, res, next) => {
    console.log(`[REVIEW_ROUTE] 🚦 [${req.method}] ${req.originalUrl}`);
    next();
});

// ==========================================
// 📖 PUBLIC ROUTES
// ==========================================
router.get('/product/:product_id', getProductReviews);
router.get('/product/:product_id/all', getAllProductReviews);
router.put('/:review_id/helpful', markHelpful);


// ==========================================
// 🔒 SECURED ROUTES (Must be Logged In)
// ==========================================

// Create a new review
router.post('/product/:product_id', verifyToken, upload.array('review_media', 5), addReview);

// ✏️ Edit an existing review (Can optionally accept new media files)
router.put('/:review_id', verifyToken, upload.array('review_media', 5), editReview);

// 🗑️ Delete an existing review
router.delete('/:review_id', verifyToken, deleteReview);

module.exports = router;