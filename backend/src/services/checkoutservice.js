// const db = require('../DATABASE/mysql');
// // ⚡ Import cache instance
// const myCache = require('../../config/cache');

// const processCheckoutInDB = async (user_id, addressId, buyNowProduct, paymentMethod, tracking_ref, customEmail) => {
//     // 🚨 ULTIMATE COD KILL SWITCH: Completely block COD for everything
//     if (paymentMethod === 'cod') {
//         throw new Error('Cash on Delivery has been completely disabled. Please choose Online Payment.');
//     }

//     const method = 'online'; // Force method to be online
//     const sourcevisiter = tracking_ref ?? null;
    
//     console.log(`[CHECKOUT] 🚀 Starting checkout process for User ID: ${user_id}, Method: ${method}`);
    
//     const connection = await db.getConnection();
    
//     try {
//         await connection.beginTransaction();
//         console.log(`[CHECKOUT] 🔒 Database transaction started successfully.`);

//         // 1. FETCH ADDRESS
//         console.log(`[CHECKOUT] 📍 Fetching address ID: ${addressId} for user: ${user_id}...`);
//         const [addressRows] = await connection.execute(
//             `SELECT full_name, phone, house_no, road_area, landmark, city, state, pincode
//              FROM addresses WHERE address_id = ? AND user_id = ?`,
//             [addressId, user_id]
//         );

//         if (addressRows.length === 0) {
//             console.error(`[CHECKOUT] ❌ Address ID ${addressId} not found for user ${user_id}.`);
//             throw new Error('ADDRESS_NOT_FOUND');
//         }
//         const addr = addressRows[0];
//         const shippingAddressLine = `${addr.house_no}, ${addr.road_area}${addr.landmark ? ', ' + addr.landmark : ''}`;
//         const shippingAddressFull = `${shippingAddressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}, Phone: ${addr.phone}`;
//         console.log(`[CHECKOUT] ✅ Address fetched successfully.`);

//         // 2. FETCH USER EMAIL
//         let customerEmail = customEmail;
//         if (!customerEmail) {
//             console.log(`[CHECKOUT] 📧 Fetching email for User ID: ${user_id}...`);
//             const [userRows] = await connection.execute(
//                 `SELECT email FROM users WHERE user_id = ?`,
//                 [user_id]
//             );
//             if (userRows.length === 0) {
//                 console.error(`[CHECKOUT] ❌ User ID ${user_id} not found.`);
//                 throw new Error('USER_NOT_FOUND');
//             }
//             customerEmail = userRows[0].email;
//         }
//         console.log(`[CHECKOUT] ✅ Customer Email resolved: ${customerEmail}`);

//         // 3. SHIPPING ZONE LOOKUP
//         console.log(`[CHECKOUT] 🚚 Checking shipping zone for state: ${addr.state}...`);
//         const [zoneRows] = await connection.execute(
//             `SELECT min_days, max_days FROM shipping_zones WHERE state_name = ?`,
//             [addr.state]
//         );
//         const defaultMaxDays = Number(process.env.DEFAULT_DELIVERY_DAYS) || 7;
//         const maxDays = zoneRows.length > 0 ? zoneRows[0].max_days : defaultMaxDays;
        
//         const estimatedDeliveryDateObj = new Date();
//         estimatedDeliveryDateObj.setDate(estimatedDeliveryDateObj.getDate() + maxDays);
//         const estimatedDeliverySQL = estimatedDeliveryDateObj.toISOString().split('T')[0];
//         console.log(`[CHECKOUT] ✅ Estimated delivery calculated: ${estimatedDeliverySQL}`);

//         // 4. PROCESS CART / BUY NOW
//         let cartItems = [];
//         const isBuyNow = buyNowProduct && buyNowProduct.product_id;

//         if (isBuyNow) {
//             console.log(`[CHECKOUT] 🛍️ Processing 'Buy Now' for Product ID: ${buyNowProduct.product_id}`);
//             const [productRows] = await connection.execute(
//                 `SELECT p.product_id, p.name AS product_name, p.price AS unit_price, p.hsn_code, p.dealer_base_price, p.packaging_cost, c.name AS category_name
//                  FROM products p
//                  LEFT JOIN categories c ON p.category_id = c.category_id
//                  WHERE p.product_id = ?`,
//                 [buyNowProduct.product_id]
//             );
//             if (productRows.length === 0) {
//                 console.error(`[CHECKOUT] ❌ Buy Now Product ID ${buyNowProduct.product_id} not found.`);
//                 throw new Error('PRODUCT_NOT_FOUND');
//             }
//             cartItems = [{
//                 ...productRows[0],
//                 quantity: buyNowProduct.quantity || 1
//             }];
//         } else {
//             console.log(`[CHECKOUT] 🛒 Fetching cart items for User ID: ${user_id}`);
//             const [rows] = await connection.execute(
//                 `SELECT cart.product_id, cart.quantity, p.price AS unit_price, p.name AS product_name, p.hsn_code, p.dealer_base_price, p.packaging_cost, c.name AS category_name
//                  FROM cart
//                  INNER JOIN products p ON cart.product_id = p.product_id
//                  LEFT JOIN categories c ON p.category_id = c.category_id
//                  WHERE cart.user_id = ?`,
//                 [user_id]
//             );
//             cartItems = rows;
//         }

//         if (cartItems.length === 0) {
//             console.warn(`[CHECKOUT] ⚠️ Cart is empty for User ID: ${user_id}`);
//             throw new Error('CART_EMPTY');
//         }
//         console.log(`[CHECKOUT] ✅ Cart items loaded: ${cartItems.length} item(s) found.`);

//         // ========================================================
//         // 🔒 FIRST KOTA DORIYA COD BLOCK (COMMENTED OUT)
//         // ========================================================
//         /*
//         const isKotaDoriyaOrder = cartItems.some(item => {
//             const text = `${item.product_name || ''} ${item.category_name || ''} ${item.fabric || ''}`.toLowerCase();
//             return text.includes('kota doriya') || text.includes('kotadoria') || text.includes('doriya');
//         });

//         if (isKotaDoriyaOrder && method === 'cod') {
//             console.error(`[CHECKOUT] 🚨 SECURITY BLOCK: COD attempted for Kota Doriya products.`);
//             throw new Error('Cash on Delivery is not allowed for authentic Kota Doriya products.');
//         }
//         */

//         // 5. 💰 SERVER-SIDE PRICING & PROFIT CALCULATION
//         let subtotal = 0;
//         let totalLockedDealerPayout = 0;
//         let totalPackagingCost = 0;

//         for (const item of cartItems) {
//             const itemTotal = item.quantity * Number(item.unit_price);
//             const itemDealerCost = item.quantity * Number(item.dealer_base_price);
//             const itemPackaging = item.quantity * Number(item.packaging_cost);

//             subtotal += itemTotal;
//             totalLockedDealerPayout += itemDealerCost;
//             totalPackagingCost += itemPackaging;
            
//             console.log(`[CHECKOUT_MATH] Item: ${item.product_name} | Qty: ${item.quantity} | Price: ₹${item.unit_price} | Dealer Base: ₹${item.dealer_base_price}`);
//         }

//         const totalAmount = subtotal; 
//         const dynamicPaymentId = `ORD-${Date.now()}`;

//         // Gateway Fee (2%) & Net Admin Profit
//         const gatewayFee = (totalAmount * 2) / 100;
//         const netAdminProfit = totalAmount - totalLockedDealerPayout - totalPackagingCost - gatewayFee;

//         console.log(`[CHECKOUT_SUMMARY] 📊 Total: ₹${totalAmount} | Dealer Payout: ₹${totalLockedDealerPayout} | Packaging: ₹${totalPackagingCost} | Gateway Fee (2%): ₹${gatewayFee} | Net Profit: ₹${netAdminProfit}`);

//         // 6. CREATE ORDER
//         console.log(`[CHECKOUT] 📝 Inserting main order into database...`);
//         const [orderResult] = await connection.execute(
//             `INSERT INTO orders
//                 (user_id, total_amount, status, payment_id, payment_method, payment_status,
//                  shipping_address, customer_email, address_id, subtotal, estimated_delivery, tracking_ref, gateway_fee, net_admin_profit)
//              VALUES (?, ?, 'pending', ?, ?, 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [user_id, totalAmount, dynamicPaymentId, method, shippingAddressFull, customerEmail, addressId, subtotal, estimatedDeliverySQL, sourcevisiter, gatewayFee, netAdminProfit]
//         );
//         const newOrderId = orderResult.insertId;
//         console.log(`[CHECKOUT] ✅ Order created successfully with Order ID: ${newOrderId}`);

//         // 7. INVOICE UPDATE
//         const invoiceYear = new Date().getFullYear();
//         const invoiceNumber = `KW-${invoiceYear}-${String(newOrderId).padStart(6, '0')}`;
//         await connection.execute(`UPDATE orders SET invoice_number = ? WHERE order_id = ?`, [invoiceNumber, newOrderId]);
//         console.log(`[CHECKOUT] 📄 Invoice number generated: ${invoiceNumber}`);

//         // 8. INSERT ORDER ITEMS, DEDUCT STOCK & CLEAR CACHE INSIDE TRANSACTION
//         console.log(`[CHECKOUT] 📦 Inserting order items and updating stock...`);
//         for (const item of cartItems) {
//             const itemDealerPayout = item.quantity * Number(item.dealer_base_price);
            
//             console.log(`🔍 DEBUG ITEM -> Product ID: ${item.product_id}, Quantity: ${item.quantity}`);

//             await connection.execute(
//                 `INSERT INTO orderitems (order_id, product_id, product_name, quantity, unit_price, hsn_code, discount, locked_dealer_payout)
//                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//                 [newOrderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.hsn_code || 'N/A', 0, itemDealerPayout]
//             );

//             const [updateResult] = await connection.execute(
//                 `UPDATE products SET stock_qty = GREATEST(0, stock_qty - ?) WHERE product_id = ?`,
//                 [item.quantity, item.product_id]
//             );
            
//             console.log(`📊 UPDATE RESULT (Affected Rows): ${updateResult.affectedRows}`);

//             // ⚡ CLEAR PRODUCT CACHE INSTANTLY
//             if (myCache) {
//                 myCache.del(`product_${item.product_id}`);
//                 console.log(`[CHECKOUT] 🧹 Cache cleared for product ID: ${item.product_id}`);
//             }
//         }

//         // 9. ORDER TRACKING & CLEAR CART
//         console.log(`[CHECKOUT] 📌 Inserting initial order tracking status...`);
//         await connection.execute(
//             `INSERT INTO order_tracking (order_id, status, status_message)
//              VALUES (?, 'Order Placed', 'Your order has been received and is pending verification.')`,
//             [newOrderId]
//         );

//         if (!isBuyNow) {
//             console.log(`[CHECKOUT] 🗑️ Clearing cart for User ID: ${user_id}...`);
//             await connection.execute('DELETE FROM cart WHERE user_id = ?', [user_id]);
//         }

//         // ========================================================
//         // 🔒 SECOND KOTA DORIYA COD BLOCK (ORIGINAL BOTTOM BLOCK)
//         // (COMMENTED OUT: Restored and disabled safely)
//         // ========================================================
//         /*
//         // Inside your checkout service before creating the order record:
//         const isKotaDoriyaOrder_duplicate = orderItems.some(item => {
//           const text = `${item.name || ''} ${item.title || ''} ${item.category_name || ''} ${item.fabric || ''}`.toLowerCase();
//           return text.includes('kota doriya') || text.includes('kotadoria') || text.includes('doriya');
//         });

//         if (isKotaDoriyaOrder_duplicate && String(paymentMethod).toLowerCase() === 'cod') {
//           throw new Error('COD_NOT_ALLOWED_FOR_KOTA_DORIYA');
//         }
//         */

//         // 10. COMMIT TRANSACTION PERMANENTLY
//         await connection.commit();
//         console.log(`[CHECKOUT] 🎉 Transaction committed successfully for Order ID: ${newOrderId}`);
        
//         return {
//             newOrderId,
//             dynamicPaymentId,
//             method
//         };

//     } catch (error) {
//         console.error(`[CHECKOUT] ❌ Checkout failed, rolling back transaction. Error:`, error.message);
//         await connection.rollback();
//         throw error;
//     } finally {
//         connection.release();
//         console.log(`[CHECKOUT] 🔌 Database connection released.`);
//     }
// };

// module.exports = { processCheckoutInDB };

const db = require('../DATABASE/mysql');
// ⚡ Import cache instance
const myCache = require('../../config/cache');

const processCheckoutInDB = async (user_id, addressId, buyNowProduct, paymentMethod, tracking_ref, customEmail) => {
    // 🚨 Block COD completely
    if (paymentMethod === 'cod') {
        throw new Error('Cash on Delivery has been completely disabled. Please choose Online Payment.');
    }

    const method = 'online'; 
    const sourcevisiter = tracking_ref ?? null;
    
    console.log(`[CHECKOUT] 🚀 Starting checkout process for User ID: ${user_id}`);
    
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. FETCH ADDRESS
        const [addressRows] = await connection.execute(
            `SELECT full_name, phone, house_no, road_area, landmark, city, state, pincode
             FROM addresses WHERE address_id = ? AND user_id = ?`,
            [addressId, user_id]
        );

        if (addressRows.length === 0) throw new Error('ADDRESS_NOT_FOUND');
        const addr = addressRows[0];
        const shippingAddressLine = `${addr.house_no}, ${addr.road_area}${addr.landmark ? ', ' + addr.landmark : ''}`;
        const shippingAddressFull = `${shippingAddressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}, Phone: ${addr.phone}`;

        // 2. FETCH USER EMAIL
        let customerEmail = customEmail;
        if (!customerEmail) {
            const [userRows] = await connection.execute(`SELECT email FROM users WHERE user_id = ?`, [user_id]);
            if (userRows.length === 0) throw new Error('USER_NOT_FOUND');
            customerEmail = userRows[0].email;
        }

        // 3. SHIPPING ZONE LOOKUP
        const [zoneRows] = await connection.execute(`SELECT min_days, max_days FROM shipping_zones WHERE state_name = ?`, [addr.state]);
        const defaultMaxDays = Number(process.env.DEFAULT_DELIVERY_DAYS) || 7;
        const maxDays = zoneRows.length > 0 ? zoneRows[0].max_days : defaultMaxDays;
        
        const estimatedDeliveryDateObj = new Date();
        estimatedDeliveryDateObj.setDate(estimatedDeliveryDateObj.getDate() + maxDays);
        const estimatedDeliverySQL = estimatedDeliveryDateObj.toISOString().split('T')[0];

        // 4. PROCESS CART / BUY NOW
        let cartItems = [];
        const isBuyNow = buyNowProduct && buyNowProduct.product_id;

        if (isBuyNow) {
            const [productRows] = await connection.execute(
                `SELECT p.product_id, p.name AS product_name, p.price AS unit_price, p.hsn_code, p.dealer_base_price, p.packaging_cost, c.name AS category_name
                 FROM products p WHERE p.product_id = ?`,
                [buyNowProduct.product_id]
            );
            if (productRows.length === 0) throw new Error('PRODUCT_NOT_FOUND');
            cartItems = [{ ...productRows[0], quantity: buyNowProduct.quantity || 1 }];
        } else {
            const [rows] = await connection.execute(
                `SELECT cart.product_id, cart.quantity, p.price AS unit_price, p.name AS product_name, p.hsn_code, p.dealer_base_price, p.packaging_cost, c.name AS category_name
                 FROM cart INNER JOIN products p ON cart.product_id = p.product_id WHERE cart.user_id = ?`,
                [user_id]
            );
            cartItems = rows;
        }

        if (cartItems.length === 0) throw new Error('CART_EMPTY');

        // 5. PRICING & RAZORPAY PROFIT CALCULATION
        let subtotal = 0;
        let totalLockedDealerPayout = 0;
        let totalPackagingCost = 0;

        for (const item of cartItems) {
            subtotal += (item.quantity * Number(item.unit_price));
            totalLockedDealerPayout += (item.quantity * Number(item.dealer_base_price));
            totalPackagingCost += (item.quantity * Number(item.packaging_cost));
        }

        const totalAmount = subtotal; 
        const dynamicPaymentId = `ORD-${Date.now()}`;
        
        // Accurate Razorpay Fee Math (2% + 18% GST)
        const gatewayFee = (totalAmount * 0.02) * 1.18;
        const netAdminProfit = totalAmount - totalLockedDealerPayout - totalPackagingCost - gatewayFee;

        // 6. CREATE ORDER (Staged as Unpaid)
        const [orderResult] = await connection.execute(
            `INSERT INTO orders
                (user_id, total_amount, status, payment_id, payment_method, payment_status,
                 shipping_address, customer_email, address_id, subtotal, estimated_delivery, tracking_ref, gateway_fee, net_admin_profit)
             VALUES (?, ?, 'pending', ?, ?, 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, totalAmount, dynamicPaymentId, method, shippingAddressFull, customerEmail, addressId, subtotal, estimatedDeliverySQL, sourcevisiter, gatewayFee, netAdminProfit]
        );
        const newOrderId = orderResult.insertId;

        // 7. INVOICE UPDATE
        const invoiceYear = new Date().getFullYear();
        const invoiceNumber = `KW-${invoiceYear}-${String(newOrderId).padStart(6, '0')}`;
        await connection.execute(`UPDATE orders SET invoice_number = ? WHERE order_id = ?`, [invoiceNumber, newOrderId]);

        // 8. INSERT ORDER ITEMS (🚨 NOTICE: STOCK DEDUCTION REMOVED FROM HERE)
        for (const item of cartItems) {
            const itemDealerPayout = item.quantity * Number(item.dealer_base_price);
            await connection.execute(
                `INSERT INTO orderitems (order_id, product_id, product_name, quantity, unit_price, hsn_code, discount, locked_dealer_payout)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [newOrderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.hsn_code || 'N/A', 0, itemDealerPayout]
            );
        }

        // 9. ORDER TRACKING LOG
        await connection.execute(
            `INSERT INTO order_tracking (order_id, status, status_message)
             VALUES (?, 'Order Placed', 'Your order has been received and is pending verification.')`,
            [newOrderId]
        );

        // 10. COMMIT TRANSACTION
        await connection.commit();
        
        // Ensure all possible ID variables are returned so frontend doesn't crash
        return {
            newOrderId,
            order_id: newOrderId,
            orderId: newOrderId,
            dynamicPaymentId,
            method
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { processCheckoutInDB };