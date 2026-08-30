const db = require('../DATABASE/mysql');
const imagekit = require('../../config/imagekit'); 
// 🚨 FIX 1: GLOBAL CACHE - Server isko yaad rakhega, baar-baar DB se nahi mangega
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

    // 🚨 FIX 2: PARALLEL EXECUTION - Dono queries ek sath chalengi (Time bachega)
    const reviewsPromise = db.execute(reviewsQuery, [product_id]);
    const statsPromise = db.execute(statsQuery, [product_id]);

    let dynamicOptions = [];

    // 🚨 FIX 3: CACHE CHECK - Agar pehle se yaad hai, toh seedha use karo
    if (cachedRatingOptions) {
        dynamicOptions = cachedRatingOptions;
    } else {
        // Agar yaad nahi hai, tabhi ek baar database se poochho
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
                // Save it to memory for all future users!
                cachedRatingOptions = matches.map(option => option.replace(/'/g, ''));
                dynamicOptions = cachedRatingOptions;
            }
        } else {
            dynamicOptions = ['skip', 'timepass', 'go_for_it', 'perfection']; // Fallback
        }
    }

    // Dono parallel queries ka result aane ka wait karo
    const [[reviews], [stats]] = await Promise.all([reviewsPromise, statsPromise]);

    const reviewStats = {};
    
    // Stats Object Ready karna
    dynamicOptions.forEach((optId) => {
        reviewStats[optId] = 0;
    });
    stats.forEach((row) => {
        reviewStats[row.rating_type] = row.total;
    });

    const totalReviews = Object.values(reviewStats).reduce((sum, value) => sum + value, 0);

    // 🚨 Naya Addition: Frontend ko available options bhi bhej do taaki form turant render ho
    return { reviews, reviewStats, totalReviews, availableOptions: dynamicOptions };
};

// ... baaki addReviewindb wala function waise hi rahega jaisa pehle tha ...
const addReviewindb = async (product_id, rating_type, comment, user_id, fileBase64) => {
    
    // 1. Purchase Check
    const verifyPurchaseQuery = `
      SELECT 1 FROM orders o
      JOIN orderitems oi ON o.order_id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ?
      LIMIT 1
    `;
    const [result] = await db.execute(verifyPurchaseQuery, [user_id, product_id]);
    const is_verified_buyer = result.length > 0 ? 1 : 0;

    // 2. Block Logic BEFORE uploading anything
    if (!is_verified_buyer && fileBase64) {
        console.warn("[REVIEW] Blocked -- non-verified buyer tried to upload image");
        return {
            success: false,
            message: "Only verified buyers can upload images with their review."
        };
    }

    // 3. 🚨 IMAGEKIT UPLOAD LOGIC 
    let finalImageUrl = null;
    
    if (fileBase64) {
        const uploadResponse = await imagekit.files.upload({
            file: fileBase64,
            fileName: `review_${product_id}_${user_id}_${Date.now()}`,
            // Harcode hatane ke liye .env se folder lenge, default "/arzoo-saree/reviews" rakhenge
            folder: process.env.IMAGEKIT_REVIEW_FOLDER || "/arzoo-saree/reviews" 
        });
        finalImageUrl = uploadResponse.url; // Use .url to save in database
    }

    // 4. Insert into Database
    const insertReviewQuery = `
      INSERT INTO reviews (product_id, user_id, rating_type, comment, image_url, is_verified_buyer)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [product_id, user_id, rating_type, comment, finalImageUrl, is_verified_buyer];
    const [insertResult] = await db.execute(insertReviewQuery, values);

    return {
        success: true,
        review_id: insertResult.insertId
    };
};
// reviewservice.js me yeh add karo
const deleteReviewInDb = async (review_id, userId, userRole) => {
    // Check karo review kiska hai
    const [reviews] = await db.execute('SELECT user_id FROM reviews WHERE review_id = ?', [review_id]);
    if (reviews.length === 0) {
        return { success: false, message: "Review not found." };
    }

    const reviewOwnerId = reviews[0].user_id;

    // Agar user owner nahi hai aur admin bhi nahi hai, toh block kar do
    if (reviewOwnerId !== userId && userRole !== 'admin') {
        return { success: false, message: "Unauthorized to delete this review." };
    }

    await db.execute('DELETE FROM reviews WHERE review_id = ?', [review_id]);
    return { success: true };
};

module.exports = { getReviewsByProductbydb, addReviewindb,deleteReviewInDb };