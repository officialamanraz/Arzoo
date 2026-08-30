const db = require('../DATABASE/mysql'); // adjust path

const addCommentService = async (product_id, user_id, comment_text) => {
    const [result] = await db.execute(
        'INSERT INTO product_comments (product_id, user_id, comment_text) VALUES (?, ?, ?)',
        [product_id, user_id, comment_text]
    );

    console.log(`[COMMENTS] Added -- comment_id: ${result.insertId}, product_id: ${product_id}`);

    // fetch it back joined with the user's name, so the frontend can render
    // it immediately without a second round trip
    const [rows] = await db.execute(
        `SELECT c.comment_id, c.product_id, c.user_id, u.name AS user_name, c.comment_text, c.created_at
         FROM product_comments c
         JOIN users u ON c.user_id = u.user_id
         WHERE c.comment_id = ?`,
        [result.insertId]
    );

    return rows[0];
};

const getCommentsService = async (product_id) => {
    const [rows] = await db.execute(
        `SELECT c.comment_id, c.product_id, c.user_id, u.name AS user_name, c.comment_text, c.created_at
         FROM product_comments c
         JOIN users u ON c.user_id = u.user_id
         WHERE c.product_id = ?
         ORDER BY c.created_at DESC`,
        [product_id]
    );

    console.log(`[COMMENTS] Fetched ${rows.length} comment(s) -- product_id: ${product_id}`);
    return rows;
};// Naya function: Comment delete karne ke liye
const deleteCommentService = async (comment_id, userId, userRole) => {
    // 1. Pehle check karo comment kiska hai
    const [comments] = await db.execute(
        'SELECT user_id FROM product_comments WHERE comment_id = ?', 
        [comment_id]
    );

    if (comments.length === 0) {
        return { success: false, message: "Comment not found." };
    }

    const commentOwnerId = comments[0].user_id;

    // 2. Authorization Check (Owner ya Admin hi delete kar sakta hai)
    if (commentOwnerId !== userId && userRole !== 'admin') {
        return { success: false, message: "Unauthorized to delete this comment." };
    }

    // 3. Delete Query execute karo
    await db.execute('DELETE FROM product_comments WHERE comment_id = ?', [comment_id]);
    
    console.log(`[COMMENTS] Deleted -- comment_id: ${comment_id}`);
    return { success: true };
};

module.exports = { addCommentService, getCommentsService, deleteCommentService };