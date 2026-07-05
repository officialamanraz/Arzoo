const db = require("../../config/db");
// Force the path to be correct based on your specific directory
const { REVIEW_OPTIONS } = require("../../config/reviewOptions");
const getReviewsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
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

    db.query(reviewsQuery, [product_id], (err, reviews) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      db.query(statsQuery, [product_id], (err, stats) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message,
          });
        }

        // Create stats object dynamically
        const reviewStats = {};

            REVIEW_OPTIONS.forEach((opt) => {
          reviewStats[opt.id] = 0;
         }     );

        stats.forEach((row) => {
          reviewStats[row.rating_type] = row.total;
        });

        const totalReviews = Object.values(reviewStats).reduce(
          (sum, value) => sum + value,
          0
        );

        res.status(200).json({
          success: true,
          totalReviews,
          stats: reviewStats,
          reviews,
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const addReview = async (req, res) => {
    const { product_id, rating_type, comment } = req.body;
    const user_id = req.user.id;  // ✅ Changed from req.user.user_id

    if (!product_id || !rating_type) {
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

    db.query(verifyPurchaseQuery, [user_id, product_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }

        const is_verified_buyer = result.length > 0 ? 1 : 0;
        const image_url = req.file ? req.file.filename : null;

        if (!is_verified_buyer && image_url) {
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

        db.query(insertReviewQuery, values, (err, insertResult) => {
            if (err) {
                console.error("Insert Error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to add review: " + err.message
                });
            }
            
            return res.status(201).json({
                success: true,
                message: "Review added successfully!",
                review_id: insertResult.insertId
            });
        });
    });
};
module.exports = {
  getReviewsByProduct,addReview 
};