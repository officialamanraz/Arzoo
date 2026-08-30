const {adminorder,
    updatestatusinDB,
    getmyorderfromdb,
    createorders,
    ordercencel
} = require('../services/orderservice');
// ==========================================
// ADMIN: Get all orders with their items
// ==========================================
const getadminorder = async (req, res) => {
    console.log('[ORDER] Admin fetching all orders');
    try {
        const {orders,items} = await adminorder();
        const finalOrdersWithItems = orders.map((order) => ({
            ...order,
            items: items.filter((item) => item.order_id === order.order_id)
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

        // 1. Validation BEFORE touching the database (Ekdum safe)
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            console.warn(`[ORDER] Invalid status update attempt: ${status}`);
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        // 2. Sab theek hai, ab Service ko call karo
        await updatestatusinDB(orderId, status);

        console.log(`[ORDER] Status updated -- order_id: ${orderId}, new_status: ${status}`);
        return res.status(200).json({ success: true, message: `Order status updated to ${status}` });

    } catch (error) {
        console.error("Update Status Error:", error.message);
        
        // 3. Service ka error handle kiya
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        
        return res.status(500).json({ success: false, message: "Failed to update order status" });
    }
};

// ==========================================
// CUSTOMER: Get my orders with items (now includes product image)
// ==========================================
// File: src/controllers/orderController.js

const getmyorders = async (req, res) => {
    const user_id = req.user.id; // Yeh auth middleware se aayega
    console.log(`[ORDER] Fetching orders -- user_id: ${user_id}`);

    try {
        // 1. Service se sahi naam ke saath data manga
        const { orders, items } = await getmyorderfromdb(user_id);

        // 2. Agar khali orders aaye hain (Naya user), toh aage badhne ki zaroorat nahi
        if (orders.length === 0) {
            return res.status(200).json({ success: true, message: 'No orders found', data: [] });
        }

        // 3. Tumhara awesome Map/Filter logic
        const finalOrdersWithItems = orders.map((order) => ({
            ...order,
            items: items.filter((item) => item.order_id === order.order_id)
        }));

        console.log(`[ORDER] Fetch success -- user_id: ${user_id}, ${finalOrdersWithItems.length} order(s)`);
        return res.status(200).json({ success: true, data: finalOrdersWithItems });

    } catch (error) {
        console.error(`[ORDER] Fetch error (user_id: ${user_id}):`, error.message);
        return res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
    }
};
// File: src/controllers/orderController.js
// Upar import zaroor karna: const { createRazorpayOrderInDB } = require('../services/orderService');

const orderCreate = async (req, res) => {
    try {
        const { order_id, tracking_ref } = req.body;
        const user_id = req.user.id; // Yeh auth middleware se aayega
        
        console.log(`[PAYMENT] Creating Razorpay order -- order_id: ${order_id}, user_id: ${user_id}`);

        // 1. Basic Validation (Controller ka main kaam)
        if (!order_id) {
            return res.status(400).json({ success: false, message: "order_id is required" });
        }

        // 2. YAHAN JADOO HAI - Service ne Razorpay call aur DB update dono khud kar liye
        const razorpayData = await  createorders (order_id, user_id, tracking_ref);

        console.log(`[PAYMENT] Success -- Razorpay ID: ${razorpayData.razorpay_order_id}`);
        
        // 3. Khushi-khushi frontend ko data bhej do
        return res.status(200).json({
            success: true,
            razorpay_order_id: razorpayData.razorpay_order_id,
            currency: razorpayData.currency,
            amount: razorpayData.amount
        });

    } catch (error) {
        console.error("[PAYMENT] Razorpay Error Details:", error.message);
        
        // 4. Professional Error Handling
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: "Order not found or access denied" });
        }

        return res.status(500).json({ 
            success: false, 
            message: "Failed to create razorpay order", 
            error: error.message 
        });
    }
};
// File: src/controllers/orderController.js
// Upar import zaroor karna: const { cancelOrderInDB } = require('../services/orderService');

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // Tumhara ekdum solid fallback logic user_id nikalne ke liye
        const userId = req.userId || (req.user && req.user.userId) || (req.user && req.user.id);

        console.log(`[ORDER] Attempting to cancel Order ID: ${orderId}, by User ID: ${userId}`);

        if (!userId) {
            console.error("🔥 Error: User ID is undefined. Token is not providing user info.");
            return res.status(401).json({ success: false, message: "Authentication Error: User ID missing" });
        }

        // YAHAN JADOO HAI - Service ko call kiya (validation wahi ho jayegi)
        await ordercencel(orderId, userId);

        console.log(`[ORDER] ✅ Order ${orderId} successfully cancelled by User ${userId}`);
        return res.status(200).json({ success: true, message: "Order cancelled successfully" });

    } catch (error) {
        console.error("🔥 CRITICAL CRASH IN CANCEL ORDER:", error.message);

        // Professional Error Handling
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: "Order not found or access denied" });
        }

        if (error.message.startsWith('UNCANCELLABLE_STATE')) {
            // Error string se status nikal rahe hain (e.g., 'UNCANCELLABLE_STATE:shipped')
            const status = error.message.split(':')[1];
            return res.status(400).json({ 
                success: false, 
                message: `Order cannot be cancelled because it is already ${status}` 
            });
        }

        return res.status(500).json({ success: false, message: "Failed to cancel order" });
    }
};
// Export all three functions in one clean statement
module.exports = { getadminorder, updateOrderStatus, getmyorders, orderCreate,cancelOrder  };