const { getReviewsByProductbydb, addReviewindb,deleteReviewInDb } = require('../services/reviewservice');

// ==========================================
// GET ALL REVIEWS FOR A PRODUCT + STATS
// ==========================================
const getReviewsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    console.log("[REVIEW] Fetching reviews -- product_id:", product_id);

    const { reviews, reviewStats, totalReviews } = await getReviewsByProductbydb(product_id);

    return res.status(200).json({
      success: true,
      totalReviews,
      stats: reviewStats,
      reviews,
    });

  } catch (error) {
    console.error("[REVIEW] getReviewsByProduct error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADD A REVIEW (ImageKit + Verified Logic)
// ==========================================
const addReview = async (req, res) => {
  try {
    const { product_id, rating_type, comment } = req.body;
    
    // 🚨 FIX: Safe ID extraction (jaise profile me kiya tha)
    const user_id = req.user.user_id || req.user.id; 

    // 🚨 FIX: Sirf base64 format nikalenge, upload service karega verify hone ke baad
    const fileBase64 = req.file ? req.file.buffer.toString('base64') : null; 

    console.log("[REVIEW] Add review -- body:", { product_id, rating_type });

    if (!product_id || !rating_type) {
      return res.status(400).json({
        success: false,
        message: "Product ID and rating type are required"
      });
    }

    // Pass the base64 string instead of just the filename
    const result = await addReviewindb(product_id, rating_type, comment, user_id, fileBase64);

    if (!result.success) {
      return res.status(403).json(result); // Blocked non-verified image upload
    }

    return res.status(201).json({
      success: true,
      message: "Review added successfully!",
      review_id: result.review_id
    });

  } catch (error) {
    console.error("[REVIEW] addReview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add review: " + error.message
    });
  }
};
// reviewController.js me yeh add karo
const deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const userId = req.user.user_id || req.user.id;
    const userRole = req.user.role;

    const result = await deleteReviewInDb(review_id, userId, userRole);
    if (!result.success) {
      return res.status(403).json(result);
    }

    return res.status(200).json({ success: true, message: "Review deleted successfully." });
  } catch (error) {
    console.error("[REVIEW] deleteReview error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReviewsByProduct, addReview,deleteReview
};