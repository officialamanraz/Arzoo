// File: src/controllers/orderController.js
const { 
    adminorder,
    updatestatusinDB,
    getmyorderfromdb,
    createorders,
    ordercencel,
    getDetailedOrderById,
    getOrderSummaryData,
    // markOutForDelivery,
    // markDeliveryAttemptFailed,
    // verifyDeliveryOtp
    getDeliveredOrderHistory
} = require('../services/orderservice'); 

// ==========================================
// 1. ADMIN: Get all orders with items
// ==========================================
const getadminorder = async (req, res) => {
    console.log('[ORDER_CONTROLLER] 📡 Admin requested all orders list.');
    try {
        const { orders, items } = await adminorder();
        
        const finalOrdersWithItems = orders.map((order) => ({
            ...order,
            items: items.filter((item) => item.order_id === order.order_id)
        }));
        
        console.log(`[ORDER_CONTROLLER] ✅ Successfully compiled ${finalOrdersWithItems.length} orders for Admin.`);
        return res.status(200).json({ success: true, data: finalOrdersWithItems });
    } catch (error) {
        console.error('[ORDER_CONTROLLER] ❌ Error in getadminorder:', error.message);
        return res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
    }
};

// ==========================================
// 2. ADMIN: Update order status
// ==========================================
const updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    
    console.log(`[ORDER_CONTROLLER] 📡 Admin request received to change Order ID: ${orderId} status to '${status}'`);
    
    try {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            console.warn(`[ORDER_CONTROLLER] ⚠️ Invalid status value rejected: ${status}`);
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        await updatestatusinDB(orderId, status);

        console.log(`[ORDER_CONTROLLER] ✅ Status successfully updated in DB for Order ID: ${orderId}`);
        return res.status(200).json({ success: true, message: `Order status updated to ${status}` });

    } catch (error) {
        console.error("[ORDER_CONTROLLER] ❌ Error in updateOrderStatus:", error.message);
        
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        return res.status(500).json({ success: false, message: "Failed to update order status" });
    }
};

// ==========================================
// 3. CUSTOMER: Get my orders with items
// ==========================================
const getmyorders = async (req, res) => {
    const user_id = req.user.id; 
    console.log(`[ORDER_CONTROLLER] 📡 Customer requested their orders -- User ID: ${user_id}`);

    try {
        const { orders, items } = await getmyorderfromdb(user_id);

        if (orders.length === 0) {
            console.log(`[ORDER_CONTROLLER] ℹ️ Zero orders found for User ID: ${user_id}`);
            return res.status(200).json({ success: true, message: 'No orders found', data: [] });
        }

        // 🔍 DEBUG LOG: Check karein terminal me MRP print ho raha hai ya nahi
        console.log("[DEBUG_MRP] Pehla item DB se:", items[0]?.mrp, items[0]);

        const finalOrdersWithItems = orders.map((order) => ({
            ...order,
            items: items.filter((item) => item.order_id === order.order_id)
        }));

        console.log(`[ORDER_CONTROLLER] ✅ Successfully fetched ${finalOrdersWithItems.length} orders for User ID: ${user_id}`);
        return res.status(200).json({ success: true, data: finalOrdersWithItems });

    } catch (error) {
        console.error(`[ORDER_CONTROLLER] ❌ Error in getmyorders for User ID ${user_id}:`, error.message);
        return res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
    }
};
// ==========================================
// 4. CUSTOMER: Create Razorpay Order
// ==========================================
const orderCreate = async (req, res) => {
    const { order_id, tracking_ref } = req.body;
    const user_id = req.user.id; 
    
    console.log(`[ORDER_CONTROLLER] 📡 Request to initialize Razorpay payment -- Internal Order ID: ${order_id}, User ID: ${user_id}`);

    try {
        if (!order_id) {
            console.warn("[ORDER_CONTROLLER] ⚠️ Bad Request: order_id is missing.");
            return res.status(400).json({ success: false, message: "order_id is required" });
        }

        const razorpayData = await createorders(order_id, user_id, tracking_ref);

        console.log(`[ORDER_CONTROLLER] ✅ Razorpay payment object generated -- Razorpay ID: ${razorpayData.razorpay_order_id}`);
        return res.status(200).json({
            success: true,
            razorpay_order_id: razorpayData.razorpay_order_id,
            currency: razorpayData.currency,
            amount: razorpayData.amount
        });

    } catch (error) {
        console.error("[ORDER_CONTROLLER] ❌ Error in orderCreate:", error.message);
        
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: "Order not found or access denied" });
        }
        return res.status(500).json({ success: false, message: "Failed to create razorpay order", error: error.message });
    }
};

// ==========================================
// 5. CUSTOMER: Cancel Order
// ==========================================
const cancelOrder = async (req, res) => {
    const orderId = req.params.id;
    const userId = req.userId || (req.user && req.user.userId) || (req.user && req.user.id);

    console.log(`[ORDER_CONTROLLER] 📡 Customer requested cancellation for Order ID: ${orderId} | User ID: ${userId}`);

    try {
        if (!userId) {
            console.error("[ORDER_CONTROLLER] ❌ Auth Error: User ID could not be extracted from token.");
            return res.status(401).json({ success: false, message: "Authentication Error: User ID missing" });
        }

        await ordercencel(orderId, userId);

        console.log(`[ORDER_CONTROLLER] ✅ Order ID ${orderId} successfully cancelled.`);
        return res.status(200).json({ success: true, message: "Order cancelled successfully" });

    } catch (error) {
        console.error("[ORDER_CONTROLLER] ❌ Error in cancelOrder:", error.message);

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: "Order not found or access denied" });
        }

        if (error.message.startsWith('UNCANCELLABLE_STATE')) {
            const status = error.message.split(':')[1];
            console.warn(`[ORDER_CONTROLLER] ⚠️ Cancellation blocked. Current order state is already: ${status}`);
            return res.status(400).json({ success: false, message: `Order cannot be cancelled because it is already ${status}` });
        }

        return res.status(500).json({ success: false, message: "Failed to cancel order" });
    }
};

// ==========================================
// 6. ADMIN: Get SINGLE Order Deep Details
// ==========================================
const getSingleOrderAdmin = async (req, res) => {
    const orderId = req.params.id;
    console.log(`[ORDER_CONTROLLER] 📡 Admin requested financial deep-dive for Order ID: ${orderId}`);

    try {
        const orderDetails = await getDetailedOrderById(orderId);

        if (!orderDetails) {
            console.warn(`[ORDER_CONTROLLER] ⚠️ Order not found for ID: ${orderId}`);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        console.log(`[ORDER_CONTROLLER] ✅ Deep details and financials compiled successfully for Order ID: ${orderId}`);
        return res.status(200).json({ success: true, data: orderDetails });

    } catch (error) {
        console.error(`[ORDER_CONTROLLER] ❌ Error in getSingleOrderAdmin:`, error.message);
        return res.status(500).json({ success: false, message: 'Server error while fetching order details', error: error.message });
    }
};
const getOrderSummary = async (req, res, next) => {
    try {
        const userId = req.user?.user_id || req.user?.id; 
        const addressId = req.query.address_id;
        
        // 🌟 FIX: Extract Buy Now parameters from the request URL
        const buyNowProductId = req.query.buy_now_product_id;
        const buyNowQty = req.query.buy_now_qty || 1;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        console.log(`[CONTROLLER] 📋 Fetching Order Summary for User: ${userId}`);
        
        // 🌟 FIX: Pass the Buy Now parameters to the service function
        const summaryData = await getOrderSummaryData(userId, addressId, buyNowProductId, buyNowQty);

        res.status(200).json({
            success: true,
            data: summaryData
        });
    } catch (error) {
        console.error('[CONTROLLER] ❌ Error fetching order summary:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch order summary' });
    }
};

// const markOutForDeliveryController = async (req, res) => {
//   try {
//     const orderId = req.body.orderId || req.body.order_id;

//     if (!orderId) {
//       console.error('[ORDER_CONTROLLER] ❌ Order ID not provided in request body');
//       return res.status(400).json({ success: false, message: 'Order ID is required' });
//     }

//     console.log(`[ORDER_CONTROLLER] 🚚 Marking Order ID ${orderId} as Out for Delivery`);

//     // Direct assignment (no array brackets)
//     const result = await markOutForDelivery(orderId);

//     console.log(`[ORDER_CONTROLLER] ✅ Successfully updated Order ID: ${orderId}`);
//     return res.status(200).json({
//       success: true,
//       message: 'Order marked out for delivery',
//       data: result
//     });
//   } catch (err) {
//     console.error('[ORDER_CONTROLLER_ERROR] ❌', err);
//     return res.status(400).json({ success: false, message: err.message });
//   }
// };
// const verifyDeliveryOtpController = async (req, res) => {
//   try {
//     // Frontend alag-alag keys bhej sakta hai, isliye fallback options rakhe hain
//     const orderId = req.body.orderId || req.body.order_id;
//     const enteredOtp = req.body.otp || req.body.enteredOtp;

//     if (!orderId || !enteredOtp) {
//       console.error('[ORDER_CONTROLLER] ❌ Order ID and OTP are required for verification');
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Order ID and OTP are required' 
//       });
//     }

//     console.log(`[ORDER_CONTROLLER] 🔐 Verifying OTP for Order ID: ${orderId}`);

//     // Call the service function
//     const result = await verifyDeliveryOtp(orderId, enteredOtp);

//     console.log(`[ORDER_CONTROLLER] ✅ Order ID: ${orderId} successfully verified and delivered.`);
//     return res.status(200).json({
//       success: true,
//       message: result.message,
//       data: result
//     });

//   } catch (err) {
//     console.error('[ORDER_CONTROLLER_ERROR] ❌', err.message);
//     // Service se aane wale errors (Lockout, Expired, Incorrect) yahan catch honge
//     return res.status(400).json({ 
//       success: false, 
//       message: err.message 
//     });
//   }
// };
// const markDeliveryAttemptFailedController = async (req, res) => {
//   try {
//     const orderId = req.body.orderId || req.body.order_id;
//     const { failureReason, agentNotes } = req.body;

//     if (!orderId || !failureReason) {
//       console.error('[ORDER_CONTROLLER] ❌ Order ID and Failure Reason are required');
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Order ID and Failure Reason are required' 
//       });
//     }

//     console.log(`[ORDER_CONTROLLER] ⚠️ Processing Failed Attempt for Order ID: ${orderId} | Reason: ${failureReason}`);

//     // Call the service function
//     const result = await markDeliveryAttemptFailed(orderId, failureReason, agentNotes);

//     console.log(`[ORDER_CONTROLLER] 📝 Failed attempt logged for Order ID: ${orderId}. Current Status: ${result.newStatus}`);
//     return res.status(200).json({
//       success: true,
//       message: result.message,
//       data: result
//     });

//   } catch (err) {
//     console.error('[ORDER_CONTROLLER_ERROR] ❌', err.message);
//     return res.status(400).json({ 
//       success: false, 
//       message: err.message 
//     });
//   }
// };
const getDeliveredOrderHistoryController = async (req, res) => {
    try {
        // Extract user ID from auth token
        const userId = req.user?.user_id || req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        console.log(`[CONTROLLER] 📦 Fetching Delivered History for User: ${userId}`);
        
        const result = await getDeliveredOrderHistory(userId);

        return res.status(200).json({
            success: true,
            message: 'Delivered orders fetched successfully',
            data: result
        });
    } catch (error) {
        console.error('[CONTROLLER] ❌ Error fetching delivered history:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch order history' });
    }
};
module.exports = { 
    getadminorder, 
    updateOrderStatus, 
    getmyorders, 
    orderCreate, 
    cancelOrder,
    getSingleOrderAdmin,
    getOrderSummary,
    // markOutForDeliveryController,
    // markDeliveryAttemptFailedController,
    // verifyDeliveryOtpController
     getDeliveredOrderHistoryController 
};