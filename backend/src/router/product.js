const express = require('express');
const upload = require('../middleware/uploads');
const { verifyToken, verifyAdmin } = require('../middleware/authmiddleware');
const router = express.Router();

// 1. Controller Functions Import
const {
  searchproduct,
  getProductById,
  addproducts,
  updateproduct,
  deleteproduct,
  getallproduct,
  bugdutfilter,
  product,
  addNewImagesToProduct,
  deleteSingleImage,
  getRecommendedProducts
} = require('../controllers/product');

// =========================================================================
// 🌟 CUSTOM LOGGING MIDDLEWARE FOR PRODUCT ROUTES 🌟
// =========================================================================
const routeLogger = (req, res, next) => {
    console.log(`\n[ROUTER LOG] -----------------------------------------`);
    console.log(`[ROUTER LOG] 📥 ${req.method} Request received on: ${req.originalUrl}`);
    console.log(`[ROUTER LOG] 🕒 Time: ${new Date().toISOString()}`);
    console.log(`[ROUTER LOG] -----------------------------------------\n`);
    next();
};

// Yeh logger is router ke har request par automatically chalega
router.use(routeLogger); 

// =========================================================================
// 🌟 UPLOAD UPGRADE: Amazon/Flipkart Style Separation 🌟
// =========================================================================
// Main photo 'image' field mein aayegi, baaki angles 'extraImages' mein
const productUploads = upload.fields([
    { name: 'image', maxCount: 1 },        // Single Main Cover Photo
    { name: 'extraImages', maxCount: 10 }  // Gallery Multiple Angles
]);

// 2. GET Routes
router.get("/recommendations", getRecommendedProducts);
router.get('/search', searchproduct);
router.get('/product/:id', getProductById);
router.get('/all', getallproduct); 


// 3. POST / PUT / DELETE Routes (Protected)
router.post('/product', verifyToken, verifyAdmin, productUploads, (req, res, next) => {
    console.log(`[ROUTER LOG] 🚀 POST /product API Triggered by Admin.`);
    if (req.files) {
        console.log(`[ROUTER LOG] 📁 Files received:`, Object.keys(req.files));
        if (req.files['image']) console.log(`[ROUTER LOG] - Main Image: ${req.files['image'].length} file(s)`);
        if (req.files['extraImages']) console.log(`[ROUTER LOG] - Extra Images: ${req.files['extraImages'].length} file(s)`);
    } else {
        console.log(`[ROUTER LOG] ⚠️ No files received in request.`);
    }
    next();
}, addproducts);

router.put('/product/:id', verifyToken, verifyAdmin, productUploads, (req, res, next) => {
    console.log(`[ROUTER LOG] 🔄 PUT /product/${req.params.id} API Triggered by Admin.`);
    if (req.files) console.log(`[ROUTER LOG] 📁 Files received for update:`, Object.keys(req.files));
    next();
}, updateproduct);

router.delete('/product/:id', verifyToken, verifyAdmin, (req, res, next) => {
    console.log(`[ROUTER LOG] ❌ DELETE /product/${req.params.id} API Triggered.`);
    next();
}, deleteproduct);


// 4. Extra Images Endpoints
router.post('/product/:id/images', verifyToken, verifyAdmin, upload.array('extraImages', 10), (req, res, next) => {
    console.log(`[ROUTER LOG] 📸 POST extra images for product ID: ${req.params.id}`);
    console.log(`[ROUTER LOG] 📁 Files count: ${req.files ? req.files.length : 0}`);
    next();
}, addNewImagesToProduct); 

router.delete('/product/image/:image_id', verifyToken, verifyAdmin, (req, res, next) => {
    console.log(`[ROUTER LOG] 🗑️ DELETE single image ID: ${req.params.image_id}`);
    next();
}, deleteSingleImage);

module.exports = router;