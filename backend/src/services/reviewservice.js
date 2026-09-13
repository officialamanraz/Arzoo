const db = require('../DATABASE/mysql');
const imagekit = require('../../config/imagekit'); 

let cachedRatingOptions = null; 

const getReviewsByProductbydb = async (product_id) => {
    const reviewsQuery = `
      SELECT r.review_id, r.product_id, r.user_id, u.name AS user_name, r.rating_type, 
             r.comment, r.image_url, r.is_verified_buyer, r.created_at
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `;

    const statsQuery = `
      SELECT rating_type, COUNT(*) AS total
      FROM reviews
      WHERE product_id = ?
      GROUP BY rating_type
    `;

    const reviewsPromise = db.execute(reviewsQuery, [product_id]);
    const statsPromise = db.execute(statsQuery, [product_id]);

    let dynamicOptions = [];

    if (cachedRatingOptions) {
        dynamicOptions = cachedRatingOptions;
    } else {
        const reviewOptionQuery = `
          SELECT COLUMN_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'reviews' 
            AND COLUMN_NAME = 'rating_type' 
            AND TABLE_SCHEMA = DATABASE()
        `;
        const [schemaResult] = await db.execute(reviewOptionQuery);
        
        if (schemaResult.length > 0) {
            const columnType = schemaResult[0].COLUMN_TYPE; 
            const matches = columnType.match(/'([^']+)'/g);
            if (matches) {
                cachedRatingOptions = matches.map(option => option.replace(/'/g, ''));
                dynamicOptions = cachedRatingOptions;
            }
        } else {
            dynamicOptions = ['skip', 'timepass', 'go_for_it', 'perfection']; 
        }
    }

    const [[reviews], [stats]] = await Promise.all([reviewsPromise, statsPromise]);

    const reviewStats = {};
    
    dynamicOptions.forEach((optId) => {
        reviewStats[optId] = 0;
    });
    stats.forEach((row) => {
        reviewStats[row.rating_type] = row.total;
    });

    const totalReviews = Object.values(reviewStats).reduce((sum, value) => sum + value, 0);

    return { reviews, reviewStats, totalReviews, availableOptions: dynamicOptions };
};

const addReviewindb = async (product_id, rating_type, comment, user_id, fileBase64) => {
    
    // 1. Purchase Check (Verified Buyer Status)
    const verifyPurchaseQuery = `
      SELECT 1 FROM orders o
      JOIN orderitems oi ON o.order_id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ?
      LIMIT 1
    `;
    const [purchaseResult] = await db.execute(verifyPurchaseQuery, [user_id, product_id]);
    const is_verified_buyer = purchaseResult.length > 0 ? 1 : 0;

    // 2. Block Image Upload for Non-Verified Buyers
    if (!is_verified_buyer && fileBase64) {
        console.warn("[REVIEW] Blocked -- non-verified buyer tried to upload image");
        return {
            success: false,
            message: "Only verified buyers can upload images with their review."
        };
    }

    // 3. Check if user has ALREADY reviewed this product
    const checkExistingQuery = `
        SELECT review_id, image_url FROM reviews WHERE user_id = ? AND product_id = ?
    `;
    const [existingReviews] = await db.execute(checkExistingQuery, [user_id, product_id]);

    // 4. IMAGEKIT UPLOAD LOGIC 
    let finalImageUrl = null;
    
    if (fileBase64) {
        const uploadResponse = await imagekit.files.upload({
            file: fileBase64,
            fileName: `review_${product_id}_${user_id}_${Date.now()}`,
            folder: process.env.IMAGEKIT_REVIEW_FOLDER || "/arzoo-saree/reviews" 
        });
        finalImageUrl = uploadResponse.url; 
    }

    let review_id;

    if (existingReviews.length > 0) {
        // 🔄 UPDATE EXISTING REVIEW (User already reviewed, so update rating/comment/image instead of inserting a duplicate)
        const currentReview = existingReviews[0];
        const imageUrlToSave = finalImageUrl !== null ? finalImageUrl : currentReview.image_url; // Agar nayi image nahi di toh purani retain karo

        const updateQuery = `
            UPDATE reviews 
            SET rating_type = ?, comment = ?, image_url = ?, is_verified_buyer = ?
            WHERE review_id = ?
        `;
        await db.execute(updateQuery, [rating_type, comment, imageUrlToSave, is_verified_buyer, currentReview.review_id]);
        review_id = currentReview.review_id;

        return {
            success: true,
            message: "Review updated successfully!",
            review_id
        };
    } else {
        // ➕ INSERT NEW REVIEW (First time review)
        const insertReviewQuery = `
          INSERT INTO reviews (product_id, user_id, rating_type, comment, image_url, is_verified_buyer)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [product_id, user_id, rating_type, comment, finalImageUrl, is_verified_buyer];
        const [insertResult] = await db.execute(insertReviewQuery, values);
        review_id = insertResult.insertId;

        return {
            success: true,
            message: "Review added successfully!",
            review_id
        };
    }
};

const deleteReviewInDb = async (review_id, userId, userRole) => {
    const [reviews] = await db.execute('SELECT user_id FROM reviews WHERE review_id = ?', [review_id]);
    if (reviews.length === 0) {
        return { success: false, message: "Review not found." };
    }

    const reviewOwnerId = reviews[0].user_id;

    if (reviewOwnerId !== userId && userRole !== 'admin') {
        return { success: false, message: "Unauthorized to delete this review." };
    }

    await db.execute('DELETE FROM reviews WHERE review_id = ?', [review_id]);
    return { success: true };
};

module.exports = { getReviewsByProductbydb, addReviewindb, deleteReviewInDb };