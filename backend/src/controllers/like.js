// 🚨 Apni service file ka sahi path yahan daal dena 
// (Maan lo aapne use 'services' folder me 'likeService.js' naam se save kiya hai)
const { toggleLikeService, getLikeStatusService } = require('../services/Likes.service'); 

// ==========================================
// 1. TOGGLE LIKE FUNCTION (Controller)
// ==========================================
const toggleLike = async (req, res) => {
    try {
        const { product_id } = req.params;
        const user_id = req.user.user_id || req.user.id;

        // DB ka saara kaam ab Service karegi
        const result = await toggleLikeService(product_id, user_id);

        return res.status(200).json({ 
            success: true, 
            message: result.liked ? 'Liked' : 'Unliked', 
            isLiked: result.liked,
            totalLikes: result.totalLikes 
        });
    } catch (error) {
        console.error('[LIKE CONTROLLER] Error toggling like:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==========================================
// 2. GET LIKE STATUS FUNCTION (Controller)
// ==========================================
const getLikeStatus = async (req, res) => {
    try {
        const { product_id } = req.params;
        
        // Agar user login nahi hai, toh user_id ko 0 bhejenge taaki query fail na ho
        const user_id = req.user ? (req.user.user_id || req.user.id) : 0;

        // DB ka saara kaam ab Service karegi
        const result = await getLikeStatusService(product_id, user_id);

        return res.status(200).json({ 
            success: true, 
            isLiked: result.liked, 
            totalLikes: result.totalLikes 
        });
    } catch (error) {
        console.error('[LIKE CONTROLLER] Error fetching status:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 🚨 CORRECT EXPORT
module.exports = { toggleLike, getLikeStatus };