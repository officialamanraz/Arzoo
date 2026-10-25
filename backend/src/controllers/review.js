// Import all database services we created earlier
const { 
    addReviewInDB, 
    getReviewsFromDB, 
    incrementHelpfulCount, 
    getPaginatedReviewsFromDB,updateReviewInDB, deleteReviewFromDB
} = require('../services/reviewservice');

// 1. POST: Add a new review (Secured)
const addReview = async (req, res) => {
    try {
        const product_id = req.params.product_id;
        const user_id = req.user.id; // Comes from verifyToken middleware
        const { rating, title, comment, attributes } = req.body;
        const mediaFiles = req.files || []; // Comes from Multer middleware

        console.log(`[REVIEW_CONTROLLER] 📝 User ID ${user_id} adding review for Product ID ${product_id}`);

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Valid rating (1-5) is required." });
        }

        // Send data to service layer
        const review_id = await addReviewInDB(product_id, user_id, rating, title, comment, attributes, mediaFiles);
        
        res.status(201).json({ success: true, message: "Review posted successfully!", review_id });
    } catch (error) {
        console.error("[REVIEW_CONTROLLER] ❌ Error adding review:", error.message);
        res.status(500).json({ success: false, message: "Failed to post review." });
    }
};

// 2. GET: Fetch Summary + Recent Reviews for Product Detail Page
const getProductReviews = async (req, res) => {
    try {
        const { product_id } = req.params;
        console.log(`[REVIEW_CONTROLLER] 📊 Fetching summary reviews for Product ID ${product_id}`);
        
        const result = await getReviewsFromDB(product_id);
        
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("[REVIEW_CONTROLLER] ❌ Error fetching summary reviews:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch reviews." });
    }
};

// 3. GET: Fetch All Reviews with Pagination, Sort & Filters (Flipkart Style)
const getAllProductReviews = async (req, res) => {
    try {
        const { product_id } = req.params;
        // Parse Query Params with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'recent'; 
        const filterRating = req.query.filterRating || null; 
        const withMedia = req.query.withMedia === 'true'; 

        console.log(`[REVIEW_CONTROLLER] 📜 Fetching paginated reviews (Page: ${page}) for Product ID ${product_id}`);

        const result = await getPaginatedReviewsFromDB(product_id, page, limit, sortBy, filterRating, withMedia);

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("[REVIEW_CONTROLLER] ❌ Error fetching paginated reviews:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch paginated reviews." });
    }
};

// 4. PUT: Upvote a review as Helpful
const markHelpful = async (req, res) => {
    try {
        const { review_id } = req.params;
        console.log(`[REVIEW_CONTROLLER] 👍 Marking review ID ${review_id} as helpful`);
        
        await incrementHelpfulCount(review_id);
        
        res.status(200).json({ success: true, message: "Review marked as helpful." });
    } catch (error) {
        console.error("[REVIEW_CONTROLLER] ❌ Error voting helpful:", error.message);
        res.status(500).json({ success: false, message: "Failed to update helpful votes." });
    }
};
const editReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const user_id = req.user.id; // From verifyToken security middleware
        const { rating, title, comment, attributes } = req.body;
        const mediaFiles = req.files || []; // New uploaded files if any

        console.log(`[REVIEW_CONTROLLER] ✏️ User ID ${user_id} attempting to edit Review ID ${review_id}`);

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Valid rating (1-5) is required." });
        }

        await updateReviewInDB(review_id, user_id, rating, title, comment, attributes, mediaFiles);
        
        res.status(200).json({ success: true, message: "Review updated successfully!" });
    } catch (error) {
        console.error("[REVIEW_CONTROLLER] ❌ Error editing review:", error.message);
        if (error.message === "UNAUTHORIZED_OR_NOT_FOUND") {
            return res.status(403).json({ success: false, message: "You are not authorized to edit this review." });
        }
        res.status(500).json({ success: false, message: "Failed to update review." });
    }
};

// 🗑️ CONTROLLER: Delete Review
const deleteReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const user_id = req.user.id; // From verifyToken security middleware

        console.log(`[REVIEW_CONTROLLER] 🗑️ User ID ${user_id} attempting to delete Review ID ${review_id}`);

        await deleteReviewFromDB(review_id, user_id);
        
        res.status(200).json({ success: true, message: "Review deleted successfully!" });
    } catch (error) {
        console.error("[REVIEW_CONTROLLER] ❌ Error deleting review:", error.message);
        if (error.message === "UNAUTHORIZED_OR_NOT_FOUND") {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this review." });
        }
        res.status(500).json({ success: false, message: "Failed to delete review." });
    }
};
module.exports = { 
    addReview, 
    getProductReviews, 
    getAllProductReviews, 
    markHelpful,
    editReview,
    deleteReview
};