const express = require("express");
const router = express.Router();
const path = require('path');

// 🚨 Added 'deleteReview' to the import list
const { addReview, getReviewsByProduct, deleteReview } = require(path.join(__dirname, '../controllers/review'));
const { verifyToken } = require("../middleware/authmiddleware"); 
const upload = require("../middleware/uploads"); 

// Get reviews and options for a product
router.get("/:product_id", getReviewsByProduct);

// Add a new review
router.post("/add", verifyToken, upload.single("image"), addReview);

// 🚨 ADDED THIS LINE: Required for the delete button in ReviewSection.jsx to work
router.delete("/:review_id", verifyToken, deleteReview);

module.exports = router;