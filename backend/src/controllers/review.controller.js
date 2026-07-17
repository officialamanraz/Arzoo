const db = require("../../config/db");

// Force the path to be correct based on your specific directory
const getReviewsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    console.log("[getReviewsByProduct] Incoming request, product_id:", product_id);

    const reviewsQuery = `
      SELECT
          r.review_id,
          r.product_id,
          r.user_id,
          u.name AS user_name,
          r.rating_type,
          r.comment,
          r.image_url,
          r.is_verified_buyer,
          r.created_at
      FROM Reviews r
      JOIN Users u ON r.user_id = u.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `;

    const statsQuery = `
      SELECT rating_type, COUNT(*) AS total
      FROM Reviews
      WHERE product_id = ?
      GROUP BY rating_type
    `;

    // FIXED: Dynamically pulls the ENUM column options instead of hardcoded array or selecting matching rows
    const reviewoption = `
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Reviews' 
        AND COLUMN_NAME = 'rating_type' 
        AND TABLE_SCHEMA = DATABASE()
    `;

    console.log("[getReviewsByProduct] Running reviewsQuery...");
    // mysql2/promise returns an array where the first element is the rows
    const [reviews] = await db.execute(reviewsQuery, [product_id]);
    console.log("[getReviewsByProduct] reviewsQuery SUCCESS, rows found:", reviews.length);

    console.log("[getReviewsByProduct] Running statsQuery...");
    const [stats] = await db.execute(statsQuery, [product_id]);
    console.log("[getReviewsByProduct] statsQuery SUCCESS, rows found:", stats.length);
    
    console.log("[getReviewsByProduct] Running reviewoption schema query...");
    const [schemaResult] = await db.execute(reviewoption);

    // Create stats object dynamically
    const reviewStats = {};

    // Default options if schema mapping fails
    let dynamicOptions = ['skip', 'timepass', 'go_for_it', 'perfection'];

    if (schemaResult.length > 0) {
      const columnType = schemaResult[0].COLUMN_TYPE; // e.g. "enum('skip','timepass','go_for_it','perfection')"
      const matches = columnType.match(/'([^']+)'/g);
      if (matches) {
        dynamicOptions = matches.map(option => option.replace(/'/g, ''));
      }
    }

    // FIXED: Dynamic keys initialization based on your dynamicOptions variable
    dynamicOptions.forEach((optId) => {
      reviewStats[optId] = 0;
    });

    stats.forEach((row) => {
      reviewStats[row.rating_type] = row.total;
    });

    const totalReviews = Object.values(reviewStats).reduce(
      (sum, value) => sum + value,
      0
    );

    console.log("[getReviewsByProduct] Final response -> totalReviews:", totalReviews, "stats:", reviewStats);

    return res.status(200).json({
      success: true,
      totalReviews,
      stats: reviewStats,
      reviews,
    });

  } catch (error) {
    console.error("[getReviewsByProduct] CATCH BLOCK ERROR:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addReview = async (req, res) => {
  try {
    const { product_id, rating_type, comment } = req.body;
    const user_id = req.user.id;  // ✅ Changed from req.user.user_id

    console.log("[addReview] Incoming body:", { product_id, rating_type, comment });
    console.log("[addReview] user_id from req.user:", user_id);
    console.log("[addReview] req.file:", req.file);

    if (!product_id || !rating_type) {
      console.warn("[addReview] Missing required fields! product_id:", product_id, "rating_type:", rating_type);
      return res.status(400).json({
        success: false,
        message: "Product ID and rating type are required"
      });
    }

    const verifyPurchaseQuery = `
      SELECT 1
      FROM orders o
      JOIN orderitems oi ON o.order_id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ?
      LIMIT 1
    `;

    console.log("[addReview] Running verifyPurchaseQuery with:", [user_id, product_id]);
    const [result] = await db.execute(verifyPurchaseQuery, [user_id, product_id]);
    console.log("[addReview] verifyPurchaseQuery result:", result);

    const is_verified_buyer = result.length > 0 ? 1 : 0;
    const image_url = req.file ? req.file.filename : null;

    console.log("[addReview] is_verified_buyer:", is_verified_buyer, "image_url:", image_url);

    if (!is_verified_buyer && image_url) {
      console.warn("[addReview] Blocked: non-verified buyer tried to upload image");
      return res.status(403).json({
        success: false,
        message: "Only verified buyers can upload images with their review."
      });
    }

    const insertReviewQuery = `
      INSERT INTO Reviews (
          product_id,
          user_id,
          rating_type,
          comment,
          image_url,
          is_verified_buyer
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [product_id, user_id, rating_type, comment, image_url, is_verified_buyer];
    console.log("[addReview] Running insertReviewQuery with values:", values);

    const [insertResult] = await db.execute(insertReviewQuery, values);
    console.log("[addReview] Insert SUCCESS, review_id:", insertResult.insertId);

    return res.status(201).json({
      success: true,
      message: "Review added successfully!",
      review_id: insertResult.insertId
    });

  } catch (error) {
    console.error("[addReview] CATCH BLOCK ERROR:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add review: " + error.message
    });
  }
};

module.exports = {
  getReviewsByProduct, addReview
};