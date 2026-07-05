const db = require('../DATABASE/mysql'); // mysql2/promise pool

// ==========================================
// ADMIN: Get all orders with their items
// ==========================================
const getadminorder = async (req, res) => {
    try {
        const [ordersData] = await db.execute('SELECT * FROM orders ORDER BY order_id DESC');

        const [itemsData] = await db.execute(
            `SELECT oi.*, p.name, p.image_url
             FROM orderitems oi
             INNER JOIN products p ON oi.product_id = p.product_id`
        );

        const finalOrdersWithItems = ordersData.map((order) => ({
            ...order,
            items: itemsData.filter((item) => item.order_id === order.order_id)
        }));

        return res.status(200).json({ success: true, data: finalOrdersWithItems });
    } catch (error) {
        console.error('Error fetching admin orders:', error.message);
        return res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
    }
};

// ==========================================
// ADMIN: Update order status
// ==========================================
const updateOrderStatus = async (req, res) => {
    // 1. We extract EXACTLY what the frontend sends
    const { orderId, newStatus, adminNote } = req.body;

    if (!orderId || !newStatus) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing orderId or newStatus in request body' 
        });
    }

    try {
        // 2. Update the main orders table
        const [updateResult] = await db.execute(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            [newStatus, orderId]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found or no changes made' 
            });
        }

        // 3. Update the tracking table (Wrapped in a safe try-catch so it doesn't crash your server if the table is missing)
        try {
            await db.execute(
                'INSERT INTO order_tracking (order_id, status, status_message) VALUES (?, ?, ?)',
                [orderId, newStatus, adminNote || `Status updated to ${newStatus}`]
            );
        } catch (trackingErr) {
            console.log("Note: order_tracking update skipped. If you want tracking, ensure the table exists. Error:", trackingErr.message);
        }

        // 4. Return the happy JSON response!
        return res.status(200).json({ 
            success: true, 
            message: 'Status updated successfully' 
        });

    } catch (error) {
        // 5. This prints the REAL error in your VS Code terminal if something goes wrong
        console.error('CRITICAL BACKEND ERROR updating status:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to update order status on the server.' 
        });
    }
};

// ==========================================
// CUSTOMER: Get my orders with items (now includes product image)
// ==========================================
const getmyorders = async (req, res) => {
    const user_id = req.user.id;

    try {
        const [ordersData] = await db.execute(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC',
            [user_id]
        );

        if (ordersData.length === 0) {
            return res.status(200).json({ success: true, message: 'No orders found for this user', data: [] });
        }

        const [itemsData] = await db.execute(
            `SELECT oi.*, p.name, p.image_url
             FROM orderitems oi
             INNER JOIN products p ON oi.product_id = p.product_id
             INNER JOIN orders o ON oi.order_id = o.order_id
             WHERE o.user_id = ?`,
            [user_id]
        );

        const finalOrdersWithItems = ordersData.map((order) => ({
            ...order,
            items: itemsData.filter((item) => item.order_id === order.order_id)
        }));

        return res.status(200).json({ success: true, data: finalOrdersWithItems });
    } catch (error) {
        console.error('Error fetching my orders:', error.message);
        return res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
    }
};

// Export all three functions in one clean statement
module.exports = { getadminorder, updateOrderStatus, getmyorders };