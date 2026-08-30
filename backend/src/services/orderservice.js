const db = require('../DATABASE/mysql');
const { getFullImageUrl } = require('../utils/imageUtils');
const razorpayInstance = require('../../config/razorpay');
const adminorder = async() =>{
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
        const formattedItems = itemsData.map(item => ({
        ...item,
        image_url: getFullImageUrl(item.image_url)
    }));
        return{
            orders:ordersData,
            items:formattedItems
        };
};
const updatestatusinDB = async (orderId, status) => {
    const updateQuery = "UPDATE orders SET status = ? WHERE order_id = ?";
    const [result] = await db.execute(updateQuery, [status, orderId]);
    
    // Yahan consistency maintain karenge
    if (result.affectedRows === 0) {
        throw new Error('ORDER_NOT_FOUND');
    }
    
    return true;
};

const getmyorderfromdb = async(user_id) =>{
      const [ordersData] = await db.execute(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC',
            [user_id]
        );
        if (ordersData.length === 0) {
            console.log(`[ORDER] No orders found -- user_id: ${user_id}`);
return { orders: [], items: [] };        }
         const [itemsData] = await db.execute(
            `SELECT oi.*, p.name, p.image_url
             FROM orderitems oi
             INNER JOIN products p ON oi.product_id = p.product_id
             INNER JOIN orders o ON oi.order_id = o.order_id
             WHERE o.user_id = ?`,
            [user_id]
        );
        const formattedItems = itemsData.map(item => ({
        ...item,
        image_url: getFullImageUrl(item.image_url)
    }));
        return{
            orders:ordersData,
            items:formattedItems 
        };
};

const createorders = async(order_id, user_id, tracking_ref) =>{
    const sourcevisiter = (tracking_ref && tracking_ref !== 'undefined') ? tracking_ref : null;
    let orderRows;

    if (sourcevisiter) {
        [orderRows] = await db.execute(
            'SELECT total_amount FROM orders WHERE order_id = ? AND user_id = ? AND tracking_ref = ?',
            [order_id, user_id, sourcevisiter]
        );
    } else {
        [orderRows] = await db.execute(
            'SELECT total_amount, tracking_ref FROM orders WHERE order_id = ? AND user_id = ?',
            [order_id, user_id]
        );
    }
    if (orderRows.length === 0) {
        throw new Error('ORDER_NOT_FOUND');
    }

    const totalAmount = orderRows[0].total_amount;
    const options = {
        amount: Math.round(totalAmount * 100), // Paise mein convert kiya
        currency: "INR",
        receipt: `order_rcpt_${order_id}`,
    };
    const razorpayOrder = await razorpayInstance.orders.create(options);

    // 4. Update Database with new Razorpay Order ID
    await db.execute(
        'UPDATE orders SET razorpay_order_id = ? WHERE order_id = ?',
        [razorpayOrder.id, order_id]
    );

    // 5. Final ready-made data Controller ko bhej do
    return {
        razorpay_order_id: razorpayOrder.id,
        currency: razorpayOrder.currency,
        amount: razorpayOrder.amount
    };
};

// File: src/services/orderService.js

const ordercencel= async (orderId, userId) => {
    // 1. Pehle current status check karo
    const [orders] = await db.execute(
        "SELECT status FROM orders WHERE order_id = ? AND user_id = ?", 
        [orderId, userId]
    );

    // 2. Agar order nahi mila (ya kisi aur user ka hai)
    if (orders.length === 0) {
        throw new Error('ORDER_NOT_FOUND');
    }

    const currentStatus = orders[0].status;

    // 3. Validation: Check karo ki kya yeh cancel ho sakta hai?
    if (currentStatus === 'shipped' || currentStatus === 'delivered' || currentStatus === 'cancelled') {
        // Hum error ke sath current status bhi bhej rahe hain
        throw new Error(`UNCANCELLABLE_STATE:${currentStatus}`);
    }

    // 4. Agar sab theek hai, tab jaa kar UPDATE karo
    await db.execute(
        "UPDATE orders SET status = 'cancelled' WHERE order_id = ?", 
        [orderId]
    );

    return true;
};

module.exports={
    adminorder,
    updatestatusinDB,
    getmyorderfromdb,
    createorders,
    ordercencel
}