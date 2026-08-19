const db = require('../DATABASE/mysql'); // mysql2/promise pool
const { sendInvoiceEmail } = require('./sendInvoiceEmail');

// ==========================================
// PLACE ORDER (COD or ONLINE) -- server-side pricing, never trust client for amounts
// The frontend sends addressId (+ optional buyNowProduct) (+ optional paymentMethod).
// Shipping address and customer email/name are fetched here from the DB.
// No GST is charged (no GSTIN yet) -- this generates a Bill of Supply, not a Tax Invoice.
// ==========================================
const processCheckout = async (req, res) => {
    const user_id = req.user.id;
    const { addressId, buyNowProduct, paymentMethod,tracking_ref } = req.body;
    const method = paymentMethod === 'online' ? 'online' : 'cod'; // default to cod if not sent
    const sourcevisiter = tracking_ref??null; 
    console.log(`[CHECKOUT] Start -- user_id: ${user_id}, addressId: ${addressId}, buyNow: ${!!buyNowProduct}, method: ${method}`);

    if (!addressId) {
        console.warn(`[CHECKOUT] Failed -- no addressId (user_id: ${user_id})`);
        return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // --- FETCH ADDRESS ---
        const [addressRows] = await connection.execute(
            `SELECT full_name, phone, house_no, road_area, landmark, city, state, pincode
             FROM addresses WHERE address_id = ? AND user_id = ?`,
            [addressId, user_id]
        );

        if (addressRows.length === 0) {
            console.warn(`[CHECKOUT] Failed -- address ${addressId} not found for user_id ${user_id}`);
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        const addr = addressRows[0];
        const shippingAddressLine = `${addr.house_no}, ${addr.road_area}${addr.landmark ? ', ' + addr.landmark : ''}`;
        const shippingAddressFull = `${shippingAddressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}, Phone: ${addr.phone}`;

        // --- SHIPPING ZONE LOOKUP (estimated delivery) ---
        const [zoneRows] = await connection.execute(
            `SELECT min_days, max_days FROM shipping_zones WHERE state_name = ?`,
            [addr.state]
        );

        const defaultMaxDays = Number(process.env.DEFAULT_DELIVERY_DAYS) || 7;
        const maxDays = zoneRows.length > 0 ? zoneRows[0].max_days : defaultMaxDays;

        if (zoneRows.length === 0) {
            console.warn(`[CHECKOUT] No shipping zone found for state "${addr.state}" -- using default ${defaultMaxDays} days`);
        }

        const estimatedDeliveryDateObj = new Date();
        estimatedDeliveryDateObj.setDate(estimatedDeliveryDateObj.getDate() + maxDays);
        const estimatedDeliverySQL = estimatedDeliveryDateObj.toISOString().split('T')[0];

        // --- FETCH USER EMAIL ---
        const [userRows] = await connection.execute(
            `SELECT email FROM users WHERE user_id = ?`,
            [user_id]
        );

        if (userRows.length === 0) {
            console.error(`[CHECKOUT] Failed -- user_id ${user_id} not found in users table`);
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'User account not found' });
        }

        const customerEmail = userRows[0].email;

        // --- PROCESS CART / BUY NOW ---
        let cartItems = [];
        const isBuyNow = buyNowProduct && buyNowProduct.product_id;

        if (isBuyNow) {
            const [productRows] = await connection.execute(
                `SELECT product_id, name AS product_name, price AS unit_price, hsn_code
                 FROM products WHERE product_id = ?`,
                [buyNowProduct.product_id]
            );

            if (productRows.length === 0) {
                console.warn(`[CHECKOUT] Buy-now product ${buyNowProduct.product_id} not found`);
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            cartItems = [{
                product_id: productRows[0].product_id,
                product_name: productRows[0].product_name,
                unit_price: productRows[0].unit_price,
                hsn_code: productRows[0].hsn_code,
                quantity: buyNowProduct.quantity || 1
            }];
        } else {
            const [rows] = await connection.execute(
                `SELECT c.product_id, c.quantity, p.price AS unit_price, p.name AS product_name, p.hsn_code
                 FROM Cart c
                 INNER JOIN products p ON c.product_id = p.product_id
                 WHERE c.user_id = ?`,
                [user_id]
            );
            cartItems = rows;
        }

        if (cartItems.length === 0) {
            console.warn(`[CHECKOUT] Failed -- empty cart (user_id: ${user_id})`);
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        console.log(`[CHECKOUT] Processing ${cartItems.length} item(s) -- user_id: ${user_id}, mode: ${isBuyNow ? 'buyNow' : 'cart'}`);

        // ---- Server-side pricing math (no GST -- not GST registered yet) ----
        const subtotal = cartItems.reduce(
            (sum, item) => sum + item.quantity * Number(item.unit_price),
            0
        );
        const totalAmount = subtotal;

        const dynamicPaymentId = `ORD-${Date.now()}`;

        // --- CREATE ORDER (payment_method is now dynamic: 'cod' or 'online') ---
        const [orderResult] = await connection.execute(
            `INSERT INTO orders
                (user_id, total_amount, status, payment_id, payment_method, payment_status,
                 shipping_address, customer_email, address_id, subtotal, estimated_delivery,tracking_ref)
             VALUES (?, ?, 'pending', ?, ?, 'unpaid', ?, ?, ?, ?, ?,?)`,
            [user_id, totalAmount, dynamicPaymentId, method, shippingAddressFull, customerEmail, addressId, subtotal, estimatedDeliverySQL,sourcevisiter]
        );

        const newOrderId = orderResult.insertId;
        console.log(`[CHECKOUT] Order created -- order_id: ${newOrderId}, payment_id: ${dynamicPaymentId}, method: ${method}, total: ₹${totalAmount}`);

        // --- GENERATE INVOICE NUMBER ---
        const invoiceYear = new Date().getFullYear();
        const invoiceNumber = `KW-${invoiceYear}-${String(newOrderId).padStart(6, '0')}`;

        await connection.execute(
            `UPDATE orders SET invoice_number = ? WHERE order_id = ?`,
            [invoiceNumber, newOrderId]
        );

        // ---- Insert order items ----
        for (const item of cartItems) {
            const itemDiscount = 0;
            await connection.execute(
                `INSERT INTO orderitems (order_id, product_id, product_name, quantity, unit_price, hsn_code, discount)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [newOrderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.hsn_code || 'N/A', itemDiscount]
            );
        }

        await connection.execute(
            `INSERT INTO order_tracking (order_id, status, status_message)
             VALUES (?, 'Order Placed', 'Your order has been received and is pending verification.')`,
            [newOrderId]
        );

        if (!isBuyNow) {
            await connection.execute('DELETE FROM Cart WHERE user_id = ?', [user_id]);
            console.log(`[CHECKOUT] Cart cleared -- user_id: ${user_id}`);
        }

        await connection.commit();
        console.log(`[CHECKOUT] Transaction committed -- order_id: ${newOrderId}`);

        // ---- Invoice email ----
        // COD: confirmed immediately, send now.
        // Online: NOT sent here -- payment.controller.js -> verifyPayment sends it
        // only after Razorpay confirms the payment succeeded.
        if (method === 'cod') {
            sendInvoiceEmail(newOrderId).catch(err =>
                console.error(`[CHECKOUT] Invoice email failed -- order_id: ${newOrderId}:`, err.message)
            );
        }

        return res.status(200).json({
            success: true,
            message: method === 'cod'
                ? 'Order placed and confirmation email sent!'
                : 'Order created, proceed to payment',
            orderId: dynamicPaymentId,
            order_id: newOrderId,   // real DB order_id -- needed by /api/payment/create-order for online flow
            paymentMethod: method
        });

    } catch (error) {
        await connection.rollback();
        console.error(`[CHECKOUT] Failed -- user_id: ${user_id}:`, error.message);
        return res.status(500).json({ success: false, error: 'Checkout failed, please try again.' });
    } finally {
        connection.release();
    }
};

module.exports = { processCheckout };