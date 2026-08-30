const db = require('../DATABASE/mysql'); // Apna DB path check kar lena

// ==========================================
// 1. TOGGLE LIKE FUNCTION (Like / Unlike)
// ==========================================
const toggleLike = async (req, res) => {
    try {
        const { product_id } = req.params;
        const user_id = req.user.user_id || req.user.id;

        // Check if already liked
        const [existingLike] = await db.execute(
            'SELECT * FROM likes WHERE product_id = ? AND user_id = ?',
            [product_id, user_id]
        );

        if (existingLike.length > 0) {
            // Already liked -> Remove it (Unlike)
            await db.execute('DELETE FROM likes WHERE product_id = ? AND user_id = ?', [product_id, user_id]);
            return res.status(200).json({ success: true, message: 'Unliked', isLiked: false });
        } else {
            // Not liked -> Add it (Like)
            await db.execute('INSERT INTO likes (product_id, user_id) VALUES (?, ?)', [product_id, user_id]);
            return res.status(200).json({ success: true, message: 'Liked', isLiked: true });
        }
    } catch (error) {
        console.error('[LIKE] Error toggling like:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}; // 👈 Function 1 properly closed here

// ==========================================
// 2. GET LIKE STATUS FUNCTION
// ==========================================
const getLikeStatus = async (req, res) => {
    try {
        const { product_id } = req.params;
        let isLiked = false;
        
        if (req.user) {
            const user_id = req.user.user_id || req.user.id;
            const [existingLike] = await db.execute(
                'SELECT * FROM likes WHERE product_id = ? AND user_id = ?',
                [product_id, user_id]
            );
            isLiked = existingLike.length > 0;
        }

        // Get total likes count for this product
        const [countResult] = await db.execute(
            'SELECT COUNT(*) as totalLikes FROM likes WHERE product_id = ?',
            [product_id]
        );

        return res.status(200).json({ 
            success: true, 
            isLiked, 
            totalLikes: countResult[0].totalLikes 
        });
    } catch (error) {
        console.error('[LIKE] Error fetching status:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}; // 👈 Function 2 properly closed here


// 🚨 CORRECT EXPORT: Sabse niche, sare brackets ke bahar!
module.exports = { toggleLike, getLikeStatus };