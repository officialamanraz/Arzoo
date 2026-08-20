const db = require('../DATABASE/mysql'); // mysql2/promise pool
const imagekit = require('../../config/imagekit');
const razorpayInstance = require('../../config/razorpay');
// ==========================================
// ADMIN: Get all orders with their items
// ==========================================
const getadminorder = async (req, res) => {
    console.log('[ORDER] Admin fetching all orders');
    try {
        const [ordersData] = await db.execute(
            `SELECT o.*, u.name AS user_name, u.phone AS customer_phone
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.user_id
             ORDER BY o.order_id DESC`
        );

        const [itemsData] = await db.execute(
            `SELECT oi.*, p.name, p.image_url
             FROM orderitems oi
             INNER JOIN products p ON oi.product_id = p.product_id`
        );

        const finalOrdersWithItems = ordersData.map((order) => ({
            ...order,
            items: itemsData.filter((item) => item.order_id === order.order_id)
        }));

        console.log(`[ORDER] Admin fetch success -- ${finalOrdersWithItems.length} order(s)`);
        return res.status(200).json({ success: true, data: finalOrdersWithItems });
    } catch (error) {
        console.error('[ORDER] Admin fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
    }
};

// ==========================================
// ADMIN: Update order status
// ==========================================
const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        // Valid status check
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        // Database update
        const [result] = await db.execute(
            "UPDATE orders SET status = ? WHERE order_id = ?",
            [status, orderId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({ success: true, message: `Order status updated to ${status}` });

    } catch (error) {
        console.error("Update Status Error:", error);
        return res.status(500).json({ success: false, message: "Failed to update order status" });
    }
};

// ==========================================
// CUSTOMER: Get my orders with items (now includes product image)
// ==========================================
const getmyorders = async (req, res) => {
    const user_id = req.user.id;
    console.log(`[ORDER] Fetching orders -- user_id: ${user_id}`);

    try {
        const [ordersData] = await db.execute(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC',
            [user_id]
        );

        if (ordersData.length === 0) {
            console.log(`[ORDER] No orders found -- user_id: ${user_id}`);
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

        console.log(`[ORDER] Fetch success -- user_id: ${user_id}, ${finalOrdersWithItems.length} order(s)`);
        return res.status(200).json({ success: true, data: finalOrdersWithItems });
    } catch (error) {
        console.error(`[ORDER] Fetch error (user_id: ${user_id}):`, error.message);
        return res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
    }
};const orderCreate = async (req, res) => {
    try {
        const { order_id } = req.body;
        const user_id = req.user.id;
        const { tracking_ref } = req.body;
        
        // Ensure tracking_ref is explicitly null if undefined or empty
        const sourcevisiter = (tracking_ref && tracking_ref !== 'undefined') ? tracking_ref : null;

        if (!order_id) {
            return res.status(400).json({
                success: false,
                message: "order_id is required"
            });
        }

        // Safe query handling for optional tracking_ref
        let orderRows;
        if (sourcevisiter) {
            [orderRows] = await db.execute(
                'SELECT total_amount FROM orders WHERE order_id = ? AND user_id = ? AND tracking_ref = ?',
                [order_id, user_id, sourcevisiter]
            );
        } else {
            [orderRows] = await db.execute(
                'SELECT total_amount,tracking_ref FROM orders WHERE order_id = ? AND user_id = ?',
                [order_id, user_id]
            );
        }

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const totalAmount = orderRows[0].total_amount;

        const options = {
            amount: Math.round(totalAmount * 100), 
            currency: "INR",
            receipt: `order_rcpt_${order_id}`,
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        await db.execute(
            'UPDATE orders SET razorpay_order_id = ? WHERE order_id = ?',
            [razorpayOrder.id, order_id]
        );

        return res.status(200).json({
            success: true,
            razorpay_order_id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount
        });

    } catch (error) {
        console.error("RAZORPAY ERROR DETAILS:", error);
        return res.status(500).json({
            success: false,
            message: "failed to create razorpay order",
            error: error.message
        });
    }
};
// User Cancels their own order
const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // FIX: Tumhara token middleware ID jahan bhi save karta ho, ye automatically dhundh lega
        const userId = req.userId || (req.user && req.user.userId) || (req.user && req.user.id);

        console.log(`[DEBUG] Attempting to cancel Order ID: ${orderId}, by User ID: ${userId}`);

        if (!userId) {
            console.error("🔥 Error: User ID is undefined. Token is not providing user info.");
            return res.status(401).json({ success: false, message: "Authentication Error: User ID missing" });
        }

        // Check if order belongs to user
        const [orders] = await db.execute(
            "SELECT status FROM orders WHERE order_id = ? AND user_id = ?", 
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found or access denied" });
        }

        const currentStatus = orders[0].status;
        if (currentStatus === 'shipped' || currentStatus === 'delivered' || currentStatus === 'cancelled') {
            return res.status(400).json({ 
                success: false, 
                message: `Order cannot be cancelled because it is already ${currentStatus}` 
            });
        }

        // Update status to cancelled
        await db.execute(
            "UPDATE orders SET status = 'cancelled' WHERE order_id = ?", 
            [orderId]
        );

        console.log(`✅ Order ${orderId} successfully cancelled by User ${userId}`);
        return res.status(200).json({ success: true, message: "Order cancelled successfully" });

    } catch (error) {
        // 🔥 Ye line Render logs mein EXACT error print karegi ki code kahan fata
        console.error("🔥 CRITICAL CRASH IN CANCEL ORDER:", error);
        return res.status(500).json({ success: false, message: "Failed to cancel order" });
    }
};
// Export all three functions in one clean statement
module.exports = { getadminorder, updateOrderStatus, getmyorders, orderCreate,cancelOrder  };