const db = require('../DATABASE/mysql'); // adjust path

const toggleLikeService = async (product_id, user_id) => {
    const [existing] = await db.execute(
        'SELECT like_id FROM product_likes WHERE product_id = ? AND user_id = ?',
        [product_id, user_id]
    );

    let liked;

    if (existing.length > 0) {
        await db.execute(
            'DELETE FROM product_likes WHERE product_id = ? AND user_id = ?',
            [product_id, user_id]
        );
        liked = false;
        console.log(`[LIKES] Unliked -- product_id: ${product_id}, user_id: ${user_id}`);
    } else {
        await db.execute(
            'INSERT INTO product_likes (product_id, user_id) VALUES (?, ?)',
            [product_id, user_id]
        );
        liked = true;
        console.log(`[LIKES] Liked -- product_id: ${product_id}, user_id: ${user_id}`);
    }

    const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM product_likes WHERE product_id = ?',
        [product_id]
    );

    return { liked, totalLikes: countResult[0].total };
};

// Used when a product page loads -- tells the frontend whether THIS user
// has already liked it (for the heart icon's initial state) plus the count.
const getLikeStatusService = async (product_id, user_id) => {
    const [existing] = await db.execute(
        'SELECT like_id FROM product_likes WHERE product_id = ? AND user_id = ?',
        [product_id, user_id]
    );

    const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM product_likes WHERE product_id = ?',
        [product_id]
    );

    return { liked: existing.length > 0, totalLikes: countResult[0].total };
};

module.exports = { toggleLikeService, getLikeStatusService };