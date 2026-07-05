
const express = require("express");
const router = express.Router();
// Use this TEMPORARILY to see if it fixes the crash
const path = require('path');
const { addReview, getReviewsByProduct } = require(path.join(__dirname, '../controllers/review.controller'));
const { verifyToken } = require("../middleware/authmiddleware"); 
const upload = require("../middleware/uploads"); 
router.get("/:product_id", getReviewsByProduct);
router.post("/add", verifyToken, upload.single("image"), addReview);

module.exports = router;