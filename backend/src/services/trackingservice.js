const db = require('../DATABASE/mysql'); // confirm this matches your actual path

const getOrderTrackingbydb = async (orderId) => {
    const [orderRow] = await db.execute(
        'SELECT order_id, status, ordered_at FROM orders WHERE payment_id = ?',
        [orderId]
    );

    if (orderRow.length === 0) {
        console.warn(`[TRACKING] Not found -- payment_id: ${orderId}`);
        return { success: false, message: 'Order not found.' };
    }

    const internalId = orderRow[0].order_id;

    const [trackingHistory] = await db.execute(
        'SELECT status, status_message, updated_at FROM order_tracking WHERE order_id = ? ORDER BY updated_at ASC',
        [internalId]
    );

    console.log(`[TRACKING] Fetch success -- order_id: ${internalId}, ${trackingHistory.length} milestone(s)`);
    return {
        success: true,
        currentStatus: orderRow[0].status,
        orderedAt: orderRow[0].ordered_at,
        history: trackingHistory
    };
};

// The ENTIRE transaction lifecycle (get connection -> begin -> commit/rollback
// -> release) lives in here. The controller never touches `connection` --
// it only ever sees the final plain-object result or a thrown error.
const updateOrderStatusindb = async (orderId, newStatus, adminNote) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [updateResult] = await connection.execute(
            'UPDATE orders SET status = ? WHERE payment_id = ?',
            [newStatus, orderId]
        );

        if (updateResult.affectedRows === 0) {
            console.warn(`[TRACKING] Update failed -- payment_id ${orderId} not found`);
            await connection.rollback();
            return { success: false, message: 'Target order record missing.' };
        }

        // same connection, not the pool -- keeps the read inside the transaction
        const [orderRow] = await connection.execute(
            'SELECT order_id FROM orders WHERE payment_id = ?',
            [orderId]
        );
        const internalId = orderRow[0].order_id;

        await connection.execute(
            'INSERT INTO order_tracking (order_id, status, status_message) VALUES (?, ?, ?)',
            [internalId, newStatus, adminNote || null]
        );

        await connection.commit();
        console.log(`[TRACKING] Update success -- order_id: ${internalId} -> ${newStatus}`);
        return { success: true, message: 'Order tracking status updated successfully!' };

    } catch (error) {
        await connection.rollback();
        throw error; // let the controller's catch block build the error response
    } finally {
        connection.release(); // ALWAYS runs -- success, handled failure, or thrown error
    }
};

module.exports = { getOrderTrackingbydb, updateOrderStatusindb };