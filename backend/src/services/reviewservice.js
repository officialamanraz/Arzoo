const db = require('../DATABASE/mysql');

const addReviewInDB = async (product_id, user_id, rating, title, comment, attributes, mediaFiles) => {
    console.log(`[REVIEW_SERVICE] Adding review for Product ID: ${product_id} by User ID: ${user_id}`);
    try {
        // 🌟 Verified buyer check with corrected table name 'orderitems'
        const verifyQuery = `
            SELECT o.order_id 
            FROM orders o
            JOIN orderitems oi ON o.order_id = oi.order_id
            WHERE o.user_id = ? AND oi.product_id = ? 
            LIMIT 1
        `;
        const [orderCheck] = await db.execute(verifyQuery, [user_id, product_id]);
        const is_verified_buyer = orderCheck.length > 0 ? 1 : 0;
        const order_id = orderCheck.length > 0 ? orderCheck[0].order_id : null;

        // 2. Insert main review
        const insertQuery = `
            INSERT INTO product_reviews 
            (product_id, user_id, order_id, rating, title, comment, attributes_json, is_verified_buyer) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [reviewResult] = await db.execute(insertQuery, [
            product_id, user_id, order_id, Number(rating), 
            title || null, comment || null, attributes || null, is_verified_buyer
        ]);

        const review_id = reviewResult.insertId;

        // 3. Insert media if uploaded
        // 3. Insert media if uploaded (🛡️ FIXED & SAFE)
        if (mediaFiles && mediaFiles.length > 0) {
            const mediaValues = [];
            
            for (const file of mediaFiles) {
                // Multer storage ke mutabiq sahi property pick karein
                const mediaUrl = file.location || file.path || file.filename;
                
                if (mediaUrl) {
                    const isVideo = file.mimetype && file.mimetype.startsWith('video/') ? 'video' : 'image';
                    // Agar path absolute nahi hai ya relative storage path hai toh adjust kar sakte hain
                    mediaValues.push([review_id, isVideo, mediaUrl]);
                }
            }

            if (mediaValues.length > 0) {
                const insertMediaQuery = `INSERT INTO review_media (review_id, media_type, media_url) VALUES ?`;
                await db.query(insertMediaQuery, [mediaValues]);
            }
        }
        console.log(`[REVIEW_SERVICE] ✅ Review added successfully with ID: ${review_id}`);
        return review_id;
    } catch (err) {
        console.error('[REVIEW_SERVICE] ❌ Error in addReviewInDB:', err.message);
        throw err;
    }
};

const getReviewsFromDB = async (product_id) => {
    console.log(`[REVIEW_SERVICE] Fetching reviews for Product ID: ${product_id}`);
    try {
        // 1. Get Summary Stats
        const statsQuery = `
            SELECT 
                COUNT(*) as totalReviews,
                ROUND(AVG(rating), 1) as avgRating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars1
            FROM product_reviews WHERE product_id = ?
        `;
        const [statsResult] = await db.execute(statsQuery, [product_id]);

        // 2. Get Detailed Reviews with Media
        const reviewsQuery = `
            SELECT 
                pr.review_id, pr.rating, pr.title, pr.comment, pr.attributes_json, 
                pr.is_verified_buyer, pr.helpful_votes, pr.created_at,
                u.name as user_name,
                (
                    SELECT JSON_ARRAYAGG(JSON_OBJECT('type', rm.media_type, 'url', rm.media_url))
                    FROM review_media rm WHERE rm.review_id = pr.review_id
                ) as media
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u.user_id 
            WHERE pr.product_id = ?
            ORDER BY pr.created_at DESC
        `;
        const [reviews] = await db.execute(reviewsQuery, [product_id]);

        return {
            stats: statsResult[0] || {},
            reviews: reviews.map(rev => {
                let safeAttributes = [];
                try {
                    safeAttributes = rev.attributes_json ? JSON.parse(rev.attributes_json) : [];
                    if (!Array.isArray(safeAttributes)) safeAttributes = [safeAttributes]; // Convert to array if string
                } catch (e) {
                    // Agar JSON parse fail ho, toh raw text ko array mein daal do
                    safeAttributes = rev.attributes_json ? [rev.attributes_json] : [];
                }

                let safeMedia = [];
                try { safeMedia = rev.media ? JSON.parse(rev.media) : []; } catch (e) {}

                return {
                    ...rev,
                    attributes: safeAttributes,
                    media: safeMedia
                };
            })
        };
    } catch (err) {
        console.error('[REVIEW_SERVICE] ❌ Error in getReviewsFromDB:', err.message);
        throw err;
    }
};

const incrementHelpfulCount = async (review_id) => {
    console.log(`[REVIEW_SERVICE] Upvoting review ID: ${review_id}`);
    try {
        const updateQuery = `UPDATE product_reviews SET helpful_votes = helpful_votes + 1 WHERE review_id = ?`;
        await db.execute(updateQuery, [review_id]);
        return true;
    } catch (err) {
        console.error('[REVIEW_SERVICE] ❌ Error in incrementHelpfulCount:', err.message);
        throw err;
    }
};

const getPaginatedReviewsFromDB = async (product_id, page = 1, limit = 10, sortBy = 'recent', filterRating = null, withMedia = false) => {
    console.log(`[REVIEW_SERVICE] Fetching paginated reviews for Product ID: ${product_id} | Page: ${page}`);
    try {
        const offset = (page - 1) * limit;
        let queryParams = [product_id];
        
        let baseCondition = `WHERE pr.product_id = ?`;

        if (filterRating) {
            baseCondition += ` AND pr.rating = ?`;
            queryParams.push(Number(filterRating));
        }

        if (withMedia === 'true' || withMedia === true) {
            baseCondition += ` AND EXISTS (SELECT 1 FROM review_media rm WHERE rm.review_id = pr.review_id)`;
        }

        const countQuery = `SELECT COUNT(*) as total FROM product_reviews pr ${baseCondition}`;
        const [countResult] = await db.execute(countQuery, queryParams);
        const totalReviews = countResult[0].total;

        let dataQuery = `
            SELECT 
                pr.review_id, pr.rating, pr.title, pr.comment, pr.attributes_json, 
                pr.is_verified_buyer, pr.helpful_votes, pr.created_at,
                u.name as user_name,
                (
                    SELECT JSON_ARRAYAGG(JSON_OBJECT('type', rm.media_type, 'url', rm.media_url))
                    FROM review_media rm WHERE rm.review_id = pr.review_id
                ) as media
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u.user_id
            ${baseCondition}
        `;
        if (sortBy === 'helpful') {
            dataQuery += ` ORDER BY pr.helpful_votes DESC, pr.created_at DESC`;
        } else {
            dataQuery += ` ORDER BY pr.created_at DESC`;
        }

        dataQuery += ` LIMIT ? OFFSET ?`;
        queryParams.push(Number(limit), Number(offset));

        const [reviews] = await db.execute(dataQuery, queryParams);

        return {
            totalReviews,
            currentPage: Number(page),
            totalPages: Math.ceil(totalReviews / limit),
            reviews: reviews.map(rev => {
                let safeAttributes = [];
                try {
                    safeAttributes = rev.attributes_json ? JSON.parse(rev.attributes_json) : [];
                    if (!Array.isArray(safeAttributes)) safeAttributes = [safeAttributes]; 
                } catch (e) {
                    safeAttributes = rev.attributes_json ? [rev.attributes_json] : [];
                }

                let safeMedia = [];
                try { safeMedia = rev.media ? JSON.parse(rev.media) : []; } catch (e) {}

                return {
                    ...rev,
                    attributes: safeAttributes,
                    media: safeMedia
                };
            })
        };

    } catch (err) {
        console.error('[REVIEW_SERVICE] ❌ Error in getPaginatedReviewsFromDB:', err.message);
        throw err;
    }
};

const updateReviewInDB = async (review_id, user_id, rating, title, comment, attributes, mediaFiles) => {
    console.log(`[REVIEW_SERVICE] Updating Review ID: ${review_id} by User ID: ${user_id}`);
    try {
        const checkQuery = `SELECT review_id FROM product_reviews WHERE review_id = ? AND user_id = ?`;
        const [checkRes] = await db.execute(checkQuery, [review_id, user_id]);
        
        if (checkRes.length === 0) {
            throw new Error("UNAUTHORIZED_OR_NOT_FOUND");
        }

        const updateQuery = `
            UPDATE product_reviews 
            SET rating = ?, title = ?, comment = ?, attributes_json = ? 
            WHERE review_id = ?
        `;
        await db.execute(updateQuery, [Number(rating), title || null, comment || null, attributes || null, review_id]);

       // 3. Insert media if uploaded (🛡️ FIXED & SAFE)
        if (mediaFiles && mediaFiles.length > 0) {
            const mediaValues = [];
            
            for (const file of mediaFiles) {
                // Multer storage ke mutabiq sahi property pick karein
                const mediaUrl = file.location || file.path || file.filename;
                
                if (mediaUrl) {
                    const isVideo = file.mimetype && file.mimetype.startsWith('video/') ? 'video' : 'image';
                    // Agar path absolute nahi hai ya relative storage path hai toh adjust kar sakte hain
                    mediaValues.push([review_id, isVideo, mediaUrl]);
                }
            }

            if (mediaValues.length > 0) {
                const insertMediaQuery = `INSERT INTO review_media (review_id, media_type, media_url) VALUES ?`;
                await db.query(insertMediaQuery, [mediaValues]);
            }
        }

        console.log(`[REVIEW_SERVICE] ✅ Review ID: ${review_id} updated successfully.`);
        return true;
    } catch (err) {
        console.error('[REVIEW_SERVICE] ❌ Error in updateReviewInDB:', err.message);
        throw err;
    }
};

const deleteReviewFromDB = async (review_id, user_id) => {
    console.log(`[REVIEW_SERVICE] Deleting Review ID: ${review_id} by User ID: ${user_id}`);
    try {
        const checkQuery = `SELECT review_id FROM product_reviews WHERE review_id = ? AND user_id = ?`;
        const [checkRes] = await db.execute(checkQuery, [review_id, user_id]);
        
        if (checkRes.length === 0) {
            throw new Error("UNAUTHORIZED_OR_NOT_FOUND");
        }

        const deleteQuery = `DELETE FROM product_reviews WHERE review_id = ?`;
        await db.execute(deleteQuery, [review_id]);

        console.log(`[REVIEW_SERVICE] ✅ Review ID: ${review_id} deleted successfully.`);
        return true;
    } catch (err) {
        console.error('[REVIEW_SERVICE] ❌ Error in deleteReviewFromDB:', err.message);
        throw err;
    }
};

module.exports = { 
    addReviewInDB, 
    getReviewsFromDB, 
    incrementHelpfulCount, 
    getPaginatedReviewsFromDB, 
    updateReviewInDB, 
    deleteReviewFromDB 
};