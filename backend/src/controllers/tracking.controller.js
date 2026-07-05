const db = require('../DATABASE/mysql'); // mysql2/promise pool

// ==========================================
// CUSTOMER: Get full tracking timeline for an order
// ==========================================
const getOrderTracking = async (req, res) => {
    const { orderId } = req.params; // this is the payment_id, e.g. ORD-1719999999999

    try {
        const [orderRow] = await db.execute(
            'SELECT order_id, status, ordered_at FROM orders WHERE payment_id = ?',
            [orderId]
        );

        if (orderRow.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const internalId = orderRow[0].order_id;

        const [trackingHistory] = await db.execute(
            'SELECT status, status_message, updated_at FROM order_tracking WHERE order_id = ? ORDER BY updated_at ASC',
            [internalId]
        );

        return res.status(200).json({
            success: true,
            currentStatus: orderRow[0].status,
            orderedAt: orderRow[0].ordered_at,
            history: trackingHistory
        });

    } catch (error) {
        console.error('Error fetching tracking metrics:', error);
        return res.status(500).json({ success: false, error: 'Failed to load tracking data.' });
    }
};

// ==========================================
// ADMIN: Update order status + add a new timeline milestone
// ==========================================
const updateOrderStatus = async (req, res) => {
    const { orderId, newStatus, adminNote } = req.body;

    if (!orderId || !newStatus) {
        return res.status(400).json({ success: false, message: 'orderId and newStatus are required' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [updateResult] = await connection.execute(
            'UPDATE orders SET status = ? WHERE payment_id = ?',
            [newStatus, orderId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Target order record missing.' });
        }

        // FIX: use the same connection here, not the pool -- keeps the read inside the transaction
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
        return res.status(200).json({ success: true, message: 'Order tracking status updated successfully!' });

    } catch (error) {
        await connection.rollback();
        console.error('Admin status update exception:', error);
        return res.status(500).json({ success: false, error: 'Failed to update order tracking status.' });
    } finally {
        connection.release();
    }
};

module.exports = { getOrderTracking, updateOrderStatus };