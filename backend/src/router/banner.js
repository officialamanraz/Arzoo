const express = require("express");
const router = express.Router();
const multer = require('multer');
const bannercontroller = require('../controllers/banner');

const storage = multer.memoryStorage(); // Memory storage for ImageKit buffer upload
const upload = multer({ storage });

// 🌟 Multer configuration to accept both desktop and mobile banner assets
const uploadBannerFiles = upload.fields([
    { name: 'image', maxCount: 1 },          // Desktop Banner Image
    { name: 'mobile_image', maxCount: 1 }   // Mobile Banner Image
]);

// 1. GET: Fetch active banners for frontend
router.get('/', (req, res, next) => {
    console.log("[BANNER_ROUTER] 📥 GET /api/banners -- Request received for active banners");
    next();
}, bannercontroller.getALLbanners);

// 2. GET: Fetch all banners for admin panel
router.get('/all', (req, res, next) => {
    console.log("[BANNER_ROUTER] 📥 GET /api/banners/all -- Request received for admin banners");
    next();
}, bannercontroller.getALLbannersAdmin);

// 3. POST: Create a new banner (Supports multi-file upload & logs)
router.post('/', (req, res, next) => {
    console.log("[BANNER_ROUTER] 📥 POST /api/banners -- Request received to create a new banner");
    next();
}, uploadBannerFiles, bannercontroller.createbanner);

// 4. PUT: Update an existing banner by ID (Supports multi-file upload & logs)
router.put('/:id', (req, res, next) => {
    console.log(`[BANNER_ROUTER] 📥 PUT /api/banners/${req.params.id} -- Request received to update banner`);
    next();
}, uploadBannerFiles, bannercontroller.updatebanner);

// 5. DELETE: Remove a banner by ID
router.delete('/:id', (req, res, next) => {
    console.log(`[BANNER_ROUTER] 📥 DELETE /api/banners/${req.params.id} -- Request received to delete banner`);
    next();
}, bannercontroller.deleteBanner);

module.exports = router;