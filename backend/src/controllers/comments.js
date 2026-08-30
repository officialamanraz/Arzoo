const { addCommentService, getCommentsService } = require('../services/Comments.service'); // adjust path

const addComment = async (req, res) => {
    const { product_id } = req.params;
    const user_id = req.user.id;
    const { comment_text } = req.body;
    console.log(`[COMMENTS] Add -- product_id: ${product_id}, user_id: ${user_id}`);

    if (!comment_text || !comment_text.trim()) {
        console.warn('[COMMENTS] Add failed -- empty comment_text');
        return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    try {
        const comment = await addCommentService(product_id, user_id, comment_text.trim());
        return res.status(201).json({ success: true, comment });
    } catch (error) {
        console.error(`[COMMENTS] Add error (product_id: ${product_id}):`, error.message);
        return res.status(500).json({ success: false, message: 'Failed to add comment.', error: error.message });
    }
};

const getComments = async (req, res) => {
    const { product_id } = req.params;
    console.log(`[COMMENTS] Fetch -- product_id: ${product_id}`);

    try {
        const comments = await getCommentsService(product_id);
        return res.status(200).json({ success: true, comments });
    } catch (error) {
        console.error(`[COMMENTS] Fetch error (product_id: ${product_id}):`, error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch comments.', error: error.message });
    }
};

module.exports = { addComment, getComments };