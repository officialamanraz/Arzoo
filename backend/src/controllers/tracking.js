const { getOrderTrackingbydb, updateOrderStatusindb } = require('../services/trackingservice'); // adjust path

// ==========================================
// CUSTOMER: Get full tracking timeline for an order
// ==========================================
const getOrderTracking = async (req, res) => {
    const { orderId } = req.params; // this is the payment_id, e.g. ORD-1719999999999
    console.log(`[TRACKING] Fetching tracking -- payment_id: ${orderId}`);

    try {
        const result = await getOrderTrackingbydb(orderId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error(`[TRACKING] Fetch error (payment_id: ${orderId}):`, error.message);
        return res.status(500).json({ success: false, error: 'Failed to load tracking data.' });
    }
};

// ==========================================
// ADMIN: Update order status + add a new timeline milestone
// ==========================================
const updateOrderStatus = async (req, res) => {
    const { orderId, newStatus, adminNote } = req.body;
    console.log(`[TRACKING] Admin update -- payment_id: ${orderId}, newStatus: ${newStatus}`);

    if (!orderId || !newStatus) {
        console.warn('[TRACKING] Update failed -- missing orderId or newStatus');
        return res.status(400).json({ success: false, message: 'orderId and newStatus are required' });
    }

    try {
        const result = await updateOrderStatusindb(orderId, newStatus, adminNote);

        if (!result.success) {
            return res.status(404).json(result);
        }

        return res.status(200).json(result);

    } catch (error) {
        // no `connection` here at all -- that's entirely the service's problem now
        console.error(`[TRACKING] Update error (payment_id: ${orderId}):`, error.message);
        return res.status(500).json({ success: false, error: 'Failed to update order tracking status.' });
    }
};

module.exports = { getOrderTracking, updateOrderStatus };