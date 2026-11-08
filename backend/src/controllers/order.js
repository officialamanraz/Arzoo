const { 
    adminorder,
    updatestatusinDB,
    getmyorderfromdb,
    createorders,
    ordercencel,
    getDetailedOrderById,
    getOrderSummaryData,
    getDeliveredOrderHistory,
    getAllUserOrdersListService, 
    getSingleOrderDetailService
} = require('../services/orderservice'); 

// ==========================================
// 🛡️ ROLE-BASED DATA SANITIZER (SECURITY SHIELD)
// ==========================================
const sanitizeOrderData = (orderData, role) => {
    if (!orderData) return null;

    // Admin sees everything (Profit, Gateway Fee, Dealer Payout)
    if (role === 'admin') {
        return orderData;
    }

    // Normal User / Hacker gets stripped data
    const safeOrder = { ...orderData };

    // Strip internal financial secrets from main order
    delete safeOrder.gateway_fee;
    delete safeOrder.net_admin_profit;
    delete safeOrder.financial_summary;
    delete safeOrder.dealer_transfers;
    delete safeOrder.tracking_ref;
    delete safeOrder.razorpay_order_id;
    
    // Check if nested user object exists and strip password if it slipped through
    if (safeOrder.user) {
        delete safeOrder.user.password_hash;
        delete safeOrder.user.reset_token;
    }

    // Strip internal pricing and dealer secrets from items
    if (safeOrder.items && Array.isArray(safeOrder.items)) {
        safeOrder.items = safeOrder.items.map(item => {
            const safeItem = { ...item };
            
            delete safeItem.dealer_base_price;
            delete safeItem.packaging_cost;
            delete safeItem.locked_dealer_payout;
            delete safeItem.financials;      
            delete safeItem.dealer_info;      
            delete safeItem.dealer_id;
            
            return safeItem;
        });
    }

    return safeOrder;
};

// ==========================================
// 1. ADMIN: Get all orders with items
// ==========================================
const getadminorder = async (req, res) => {
    try {
        // Admin authorization should be verified by router middleware
        const { orders, items } = await adminorder();
        
        const finalOrdersWithItems = orders.map((order) => ({
            ...order,
            items: items.filter((item) => item.order_id === order.order_id)
        }));
        
        // Pass 'admin' role to keep all data intact
        const safeData = finalOrdersWithItems.map(order => sanitizeOrderData(order, 'admin'));

        return res.status(200).json({ success: true, data: safeData });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
};

// ==========================================
// 2. ADMIN: Update order status
// ==========================================
const updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    
    try {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        await updatestatusinDB(orderId, status);
        return res.status(200).json({ success: true, message: `Order status updated to ${status}` });

    } catch (error) {
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
    const userRole = req.user.role || 'user';

    try {
        const { orders, items } = await getmyorderfromdb(user_id);

        if (orders.length === 0) {
            return res.status(200).json({ success: true, message: 'No orders found', data: [] });
        }

        const finalOrdersWithItems = orders.map((order) => {
            const fullOrder = {
                ...order,
                items: items.filter((item) => item.order_id === order.order_id)
            };
            // 🛡️ Apply Sanitizer dynamically
            return sanitizeOrderData(fullOrder, userRole);
        });

        return res.status(200).json({ success: true, data: finalOrdersWithItems });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
};

// ==========================================
// 4. CUSTOMER: Create Razorpay Order
// ==========================================
const orderCreate = async (req, res) => {
    const { order_id, tracking_ref } = req.body;
    const user_id = req.user.id; 

    try {
        if (!order_id) {
            return res.status(400).json({ success: false, message: "order_id is required" });
        }

        const razorpayData = await createorders(order_id, user_id, tracking_ref);

        return res.status(200).json({
            success: true,
            razorpay_order_id: razorpayData.razorpay_order_id,
            currency: razorpayData.currency,
            amount: razorpayData.amount
        });

    } catch (error) {
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: "Order not found or access denied" });
        }
        return res.status(500).json({ success: false, message: "Failed to create razorpay order" });
    }
};

// ==========================================
// 5. CUSTOMER: Cancel Order
// ==========================================
const cancelOrder = async (req, res) => {
    const orderId = req.params.id;
    const userId = req.userId || (req.user && req.user.userId) || (req.user && req.user.id);

    try {
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication Error: User ID missing" });
        }

        await ordercencel(orderId, userId);
        return res.status(200).json({ success: true, message: "Order cancelled successfully" });

    } catch (error) {
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: "Order not found or access denied" });
        }

        if (error.message.startsWith('UNCANCELLABLE_STATE')) {
            const status = error.message.split(':')[1];
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

    try {
        const orderDetails = await getDetailedOrderById(orderId);

        if (!orderDetails) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Pass 'admin' role to keep all business secrets intact
        const safeData = sanitizeOrderData(orderDetails, 'admin');

        return res.status(200).json({ success: true, data: safeData });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error while fetching order details' });
    }
};

// ==========================================
// 7. GET ORDER SUMMARY (CART & BUY NOW)
// ==========================================
const getOrderSummary = async (req, res, next) => {
    try {
        const userId = req.user?.user_id || req.user?.id; 
        const addressId = req.query.address_id;
        const buyNowProductId = req.query.buy_now_product_id;
        const buyNowQty = req.query.buy_now_qty || 1;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const summaryData = await getOrderSummaryData(userId, addressId, buyNowProductId, buyNowQty);
        
        // Ensure no internal dealer cost slips into checkout preview
        if (summaryData.items) {
             summaryData.items = summaryData.items.map(item => {
                 const safeItem = { ...item };
                 delete safeItem.dealer_base_price;
                 delete safeItem.packaging_cost;
                 return safeItem;
             });
        }

        res.status(200).json({
            success: true,
            data: summaryData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch order summary' });
    }
};

// ==========================================
// 8. CUSTOMER: GET DELIVERED ORDER HISTORY
// ==========================================
const getDeliveredOrderHistoryController = async (req, res) => {
    try {
        const userId = req.user?.user_id || req.user?.id;
        const userRole = req.user?.role || 'user';
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const result = await getDeliveredOrderHistory(userId);
        
        const finalOrdersWithItems = result.orders.map((order) => {
            const fullOrder = {
                ...order,
                items: result.items.filter((item) => item.order_id === order.order_id)
            };
            return sanitizeOrderData(fullOrder, userRole);
        });

        return res.status(200).json({
            success: true,
            message: 'Delivered orders fetched successfully',
            data: finalOrdersWithItems
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch order history' });
    }
};

// ==========================================
// 9. ADMIN: GET ALL ORDERS LIST
// ==========================================
const getAllUserOrdersController = async (req, res) => {
  try {
    const orders = await getAllUserOrdersListService();
    // This function returns a simplified list, safe to pass 'admin' logic if required
    const safeData = orders.map(order => sanitizeOrderData(order, 'admin'));

    return res.status(200).json({
      success: true,
      count: safeData.length,
      data: safeData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==========================================
// 10. CUSTOMER/ADMIN: SINGLE ORDER DETAILS
// ==========================================
const getSingleOrderController = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || 'user';
    
    const orderDetails = await getSingleOrderDetailService(id);
    
    if (!orderDetails) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 🛡️ Apply Sanitizer dynamically based on whoever is requesting
    const sanitizedData = sanitizeOrderData(orderDetails, userRole);

    return res.status(200).json({
      success: true,
      data: sanitizedData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
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
    getDeliveredOrderHistoryController,
    getAllUserOrdersController,
    getSingleOrderController
};