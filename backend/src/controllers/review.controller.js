// backend/src/controllers/product.controller.js -- line 1
const db = require('../../config/db'); // reverted -- this was correct all along
// ==========================================
// GET ALL REVIEWS FOR A PRODUCT + STATS
// ==========================================
const getReviewsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    console.log("[REVIEW] Fetching reviews -- product_id:", product_id);

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

    // Dynamically pulls the ENUM column options instead of a hardcoded array
    const reviewOptionQuery = `
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Reviews' 
        AND COLUMN_NAME = 'rating_type' 
        AND TABLE_SCHEMA = DATABASE()
    `;

    console.log("[REVIEW] Running reviewsQuery...");
    const [reviews] = await db.execute(reviewsQuery, [product_id]);
    console.log(`[REVIEW] reviewsQuery success -- ${reviews.length} row(s)`);

    console.log("[REVIEW] Running statsQuery...");
    const [stats] = await db.execute(statsQuery, [product_id]);
    console.log(`[REVIEW] statsQuery success -- ${stats.length} row(s)`);

    console.log("[REVIEW] Running rating_type schema query...");
    const [schemaResult] = await db.execute(reviewOptionQuery);

    const reviewStats = {};

    // Fallback options if schema lookup fails for any reason
    const FALLBACK_RATING_OPTIONS = process.env.FALLBACK_RATING_OPTIONS
      ? process.env.FALLBACK_RATING_OPTIONS.split(',')
      : ['skip', 'timepass', 'go_for_it', 'perfection'];

    let dynamicOptions = FALLBACK_RATING_OPTIONS;

    if (schemaResult.length > 0) {
      const columnType = schemaResult[0].COLUMN_TYPE; // e.g. "enum('skip','timepass','go_for_it','perfection')"
      const matches = columnType.match(/'([^']+)'/g);
      if (matches) {
        dynamicOptions = matches.map(option => option.replace(/'/g, ''));
      }
    } else {
      console.warn('[REVIEW] Could not read rating_type ENUM from schema -- using fallback options');
    }

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

    console.log(`[REVIEW] Response ready -- product_id: ${product_id}, totalReviews: ${totalReviews}`);

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
// ADD A REVIEW (verified-buyer image restriction)
// ==========================================
const addReview = async (req, res) => {
  try {
    const { product_id, rating_type, comment } = req.body;
    const user_id = req.user.id;

    console.log("[REVIEW] Add review -- body:", { product_id, rating_type, comment });
    console.log("[REVIEW] user_id:", user_id, "| file:", req.file ? req.file.filename : 'none');

    if (!product_id || !rating_type) {
      console.warn("[REVIEW] Add failed -- missing product_id or rating_type");
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

    console.log("[REVIEW] Verifying purchase -- user_id:", user_id, "product_id:", product_id);
    const [result] = await db.execute(verifyPurchaseQuery, [user_id, product_id]);

    const is_verified_buyer = result.length > 0 ? 1 : 0;
    const image_url = req.file ? req.file.filename : null;

    console.log("[REVIEW] is_verified_buyer:", is_verified_buyer, "| image_url:", image_url);

    if (!is_verified_buyer && image_url) {
      console.warn("[REVIEW] Blocked -- non-verified buyer tried to upload image");
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
    console.log("[REVIEW] Inserting review...");

    const [insertResult] = await db.execute(insertReviewQuery, values);
    console.log(`[REVIEW] Insert success -- review_id: ${insertResult.insertId}`);

    return res.status(201).json({
      success: true,
      message: "Review added successfully!",
      review_id: insertResult.insertId
    });

  } catch (error) {
    console.error("[REVIEW] addReview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add review: " + error.message
    });
  }
};

module.exports = {
  getReviewsByProduct, addReview
};