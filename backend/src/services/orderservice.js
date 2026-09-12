const db = require('../DATABASE/mysql');
const { getFullImageUrl } = require('../utils/imageUtils');
const razorpayInstance = require('../../config/razorpay');
const myCache = require('../../config/cache'); // ⚡ Shared Cache Import Added Here

// ==========================================
// 1. GET ALL ORDERS FOR ADMIN
// ==========================================
const adminorder = async () => {
    console.log('[ORDER_SERVICE] 🗄️ Fetching all orders for Admin panel...');
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
        
        const formattedItems = itemsData.map(item => ({
            ...item,
            image_url: getFullImageUrl(item.image_url)
        }));
        
        console.log(`[ORDER_SERVICE] ✅ Admin Orders fetched: ${ordersData.length} orders, ${formattedItems.length} items.`);
        return {
            orders: ordersData,
            items: formattedItems
        };
    } catch (err) {
        console.error('[ORDER_SERVICE] ❌ Error in adminorder:', err.message);
        throw err;
    }
};

// ==========================================
// 2. UPDATE ORDER STATUS
// ==========================================
const updatestatusinDB = async (orderId, status) => {
    console.log(`[ORDER_SERVICE] 🗄️ Updating status to '${status}' for Order ID: ${orderId}`);
    try {
        const updateQuery = "UPDATE orders SET status = ? WHERE order_id = ?";
        const [result] = await db.execute(updateQuery, [status, orderId]);
        
        if (result.affectedRows === 0) {
            console.warn(`[ORDER_SERVICE] ⚠️ Order ID ${orderId} not found for status update.`);
            throw new Error('ORDER_NOT_FOUND');
        }
        
        console.log(`[ORDER_SERVICE] ✅ Status successfully updated for Order ID: ${orderId}`);
        return true;
    } catch (err) {
        console.error(`[ORDER_SERVICE] ❌ Error in updatestatusinDB:`, err.message);
        throw err;
    }
};

// ==========================================
// 3. GET MY ORDERS (USER SIDE)
// ==========================================
const getmyorderfromdb = async (user_id) => {
    console.log(`[ORDER_SERVICE] 🗄️ Fetching orders for User ID: ${user_id}`);
    try {
        const [ordersData] = await db.execute(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC',
            [user_id]
        );
        
        if (ordersData.length === 0) {
            console.log(`[ORDER_SERVICE] ℹ️ No orders found for User ID: ${user_id}`);
            return { orders: [], items: [] };        
        }
        
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
        
        console.log(`[ORDER_SERVICE] ✅ User Orders fetched: ${ordersData.length} orders found.`);
        return {
            orders: ordersData,
            items: formattedItems 
        };
    } catch (err) {
        console.error(`[ORDER_SERVICE] ❌ Error in getmyorderfromdb:`, err.message);
        throw err;
    }
};

const createorders = async (order_id, user_id, tracking_ref) => {
    console.log(`[ORDER_SERVICE] 🗄️ Creating Razorpay payment for Order ID: ${order_id}`);
    try {
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
            console.warn(`[ORDER_SERVICE] ⚠️ Order not found for Razorpay creation (Order ID: ${order_id})`);
            throw new Error('ORDER_NOT_FOUND');
        }

        const totalAmount = orderRows[0].total_amount;
        
        const options = {
            amount: Math.round(Number(totalAmount) * 100), 
            currency: "INR",
            receipt: `order_rcpt_${order_id}`,
        };
        
        console.log(`[ORDER_SERVICE] Initiating Razorpay instance create order...`);
        const razorpayOrder = await razorpayInstance.orders.create(options);

        console.log(`[ORDER_SERVICE] Updating Razorpay Order ID in database...`);
        await db.execute(
            'UPDATE orders SET razorpay_order_id = ? WHERE order_id = ?',
            [razorpayOrder.id, order_id]
        );

        console.log(`[ORDER_SERVICE] ✅ Razorpay order created successfully: ${razorpayOrder.id}`);

        return {
            razorpay_order_id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount
        };
    } catch (err) {
        console.error(`[ORDER_SERVICE] ❌ Error in createorders:`, err.message);
        throw err;
    }
};

// ==========================================
// 5. CANCEL ORDER
// ==========================================
// ==========================================
// 5. CANCEL ORDER (BEFORE & AFTER DIAGNOSTIC)
// ==========================================
const ordercencel = async (orderId, userId) => {
    console.log(`[ORDER_SERVICE] 🗄️ Attempting to cancel Order ID: ${orderId} for User ID: ${userId}`);
    
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const [orders] = await connection.execute(
            "SELECT status FROM orders WHERE order_id = ? AND user_id = ?", 
            [orderId, userId]
        );

        if (orders.length === 0) {
            throw new Error('ORDER_NOT_FOUND');
        }

        const currentStatus = orders[0].status;

        if (currentStatus === 'shipped' || currentStatus === 'delivered') {
            throw new Error(`UNCANCELLABLE_STATE:${currentStatus}`);
        }

        if (currentStatus !== 'cancelled') {
            await connection.execute(
                "UPDATE orders SET status = 'cancelled' WHERE order_id = ?", 
                [orderId]
            );

            const [orderItems] = await connection.execute(
                "SELECT product_id, quantity FROM orderitems WHERE order_id = ?",
                [orderId]
            );

            if (orderItems && orderItems.length > 0) {
                for (const item of orderItems) {
                    const prodId = Number(item.product_id);
                    const qty = Number(item.quantity);

                    // 1. CHECK STOCK BEFORE UPDATE
                    const [beforeRows] = await connection.execute(
                        `SELECT stock_qty FROM products WHERE product_id = ?`,
                        [prodId]
                    );
                    console.log(`🔍 [DEBUG] Stock BEFORE update for Product ${prodId}:`, beforeRows[0]?.stock_qty);

                    // 2. RUN UPDATE
                    const [updateRes] = await connection.execute(
                        `UPDATE products SET stock_qty = COALESCE(stock_qty, 0) + ? WHERE product_id = ?`,
                        [qty, prodId]
                    );
                    console.log(`📊 Stock Restore Affected Rows: ${updateRes.affectedRows}`);

                    // 3. CHECK STOCK AFTER UPDATE
                    const [afterRows] = await connection.execute(
                        `SELECT stock_qty FROM products WHERE product_id = ?`,
                        [prodId]
                    );
                    console.log(`🔍 [DEBUG] Stock AFTER update for Product ${prodId}:`, afterRows[0]?.stock_qty);

                    if (myCache) {
                        myCache.flushAll();
                    }
                }
            }
        }

        await connection.commit();
        console.log(`[ORDER_SERVICE] 🎉 Order ${orderId} cancelled successfully.`);
        return true;

    } catch (err) {
        await connection.rollback();
        console.error(`[ORDER_SERVICE] ❌ Error in ordercencel:`, err.message);
        throw err;
    } finally {
        connection.release();
    }
};
// ==========================================
// 6. GET DETAILED ORDER FOR ADMIN PAGE
// ==========================================
const getDetailedOrderById = async (orderId) => {
    console.log(`[ORDER_SERVICE] 🗄️ Fetching MASTER details for Order ID: ${orderId}`);
    try {
        const orderQuery = `
            SELECT 
                o.*, 
                u.name as fetched_user_name, 
                u.email as fetched_user_email,
                a.full_name as addr_name, 
                a.phone as addr_phone, 
                a.alternate_phone, 
                a.house_no, 
                a.road_area, 
                a.landmark, 
                a.city, 
                a.state, 
                a.pincode
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.user_id
            LEFT JOIN addresses a ON o.address_id = a.address_id
            WHERE o.order_id = ?
        `;
        const [orderResult] = await db.execute(orderQuery, [orderId]);
        
        if (orderResult.length === 0) {
            console.warn(`[ORDER_SERVICE] ⚠️ Master details fetch failed: Order ${orderId} not found.`);
            return null; 
        }
        const orderData = orderResult[0];

        orderData.shipping_address = {
            name: orderData.addr_name || orderData.fetched_user_name || 'N/A',
            phone: orderData.addr_phone || orderData.phone || 'N/A',
            alternate_phone: orderData.alternate_phone || '',
            house_no: orderData.house_no || '',
            road_area: orderData.road_area || '',
            landmark: orderData.landmark || '',
            city: orderData.city || 'N/A',
            state: orderData.state || 'N/A',
            pincode: orderData.pincode || 'N/A',
            full_address: `${orderData.house_no || ''} ${orderData.road_area || ''}, ${orderData.city || ''}, ${orderData.state || ''} - ${orderData.pincode || ''}`.trim()
        };

        // 🌟 YAHAN UPDATE KIYA HAI: p.mrp, p.dealer_base_price, p.packaging_cost, p.discount_percentage add kiya
        const itemsQuery = `
            SELECT 
                oi.*, 
                p.name as product_name, 
                p.image_url as product_image,
                p.mrp,
                p.dealer_base_price,
                p.packaging_cost,
                p.discount_percentage,
                c.name as category_name,
                s.subcategory_name,
                d.dealer_id,
                d.name as dealer_name,
                d.email as dealer_email,
                d.phone as dealer_phone,
                d.razorpay_linked_account_id
            FROM orderitems oi
            LEFT JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN subcategories s ON p.subcategory_id = s.subcategory_id
            LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
            WHERE oi.order_id = ?
        `;
        
        const transfersQuery = `SELECT id, transfer_id, dealer_id, amount, status, created_at FROM dealer_transfers WHERE order_id = ?`;
        const trackingQuery = `SELECT tracking_id, status, status_message, updated_at FROM order_tracking WHERE order_id = ? ORDER BY updated_at DESC`;

        const [itemsResult, transfersResult, trackingResult] = await Promise.all([
            db.execute(itemsQuery, [orderId]),
            db.execute(transfersQuery, [orderId]),
            db.execute(trackingQuery, [orderId])
        ]);

        let totalDealerPayout = 0;

        const formattedItems = itemsResult[0].map(item => {
            const itemTotal = Number(item.unit_price) * Number(item.quantity);
            const dealerGets = Number(item.locked_dealer_payout); 
            
            totalDealerPayout += dealerGets;

            return {
                ...item,
                image_url: getFullImageUrl(item.product_image), 
                category_info: {
                    category: item.category_name || 'N/A',
                    subcategory: item.subcategory_name || 'N/A'
                },
                financials: {
                    total_item_price: itemTotal,
                    dealer_payout: dealerGets
                },
                dealer_info: {
                    id: item.dealer_id,
                    name: item.dealer_name || 'Direct / No Dealer',
                    email: item.dealer_email || 'N/A',
                    phone: item.dealer_phone || 'N/A',
                    razorpay_account: item.razorpay_linked_account_id || 'N/A'
                }
            };
        });

        orderData.items = formattedItems;
        orderData.tracking_history = trackingResult[0]; 
        orderData.dealer_transfers = transfersResult[0]; 
        
        orderData.financial_summary = {
            total_order_value: Number(orderData.total_amount),
            gateway_fee: Number(orderData.gateway_fee),
            total_dealer_payout: totalDealerPayout,
            net_admin_profit: Number(orderData.net_admin_profit)
        };

        console.log(`[ORDER_SERVICE] ✅ Master order details successfully compiled for Order ID: ${orderId}`);
        return orderData;
        
    } catch (err) {
        console.error(`[ORDER_SERVICE] ❌ Error in getDetailedOrderById:`, err.message);
        throw err;
    }
};

module.exports = {
    adminorder,
    updatestatusinDB,
    getmyorderfromdb,
    createorders,
    ordercencel,
    getDetailedOrderById
};