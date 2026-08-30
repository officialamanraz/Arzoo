const db = require('../DATABASE/mysql');

const processCheckoutInDB = async (user_id, addressId, buyNowProduct, paymentMethod, tracking_ref, customEmail) => {
    const method = paymentMethod === 'online' ? 'online' : 'cod';
    const sourcevisiter = tracking_ref ?? null;
    
    // Yahan connection initiate hoga kyunki transaction chahiye
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. FETCH ADDRESS
        const [addressRows] = await connection.execute(
            `SELECT full_name, phone, house_no, road_area, landmark, city, state, pincode
             FROM addresses WHERE address_id = ? AND user_id = ?`,
            [addressId, user_id]
        );

        if (addressRows.length === 0) {
            throw new Error('ADDRESS_NOT_FOUND');
        }
        const addr = addressRows[0];
        const shippingAddressLine = `${addr.house_no}, ${addr.road_area}${addr.landmark ? ', ' + addr.landmark : ''}`;
        const shippingAddressFull = `${shippingAddressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}, Phone: ${addr.phone}`;

        // 2. FETCH USER EMAIL (Use custom email first, fallback to DB)
        let customerEmail = customEmail;
        
        if (!customerEmail) {
            const [userRows] = await connection.execute(
                `SELECT email FROM users WHERE user_id = ?`,
                [user_id]
            );
            if (userRows.length === 0) {
                throw new Error('USER_NOT_FOUND');
            }
            customerEmail = userRows[0].email;
        }

        // 3. SHIPPING ZONE LOOKUP
        const [zoneRows] = await connection.execute(
            `SELECT min_days, max_days FROM shipping_zones WHERE state_name = ?`,
            [addr.state]
        );
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
                `SELECT product_id, name AS product_name, price AS unit_price, hsn_code
                 FROM products WHERE product_id = ?`,
                [buyNowProduct.product_id]
            );
            if (productRows.length === 0) {
                throw new Error('PRODUCT_NOT_FOUND');
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
            throw new Error('CART_EMPTY');
        }

        // 5. SERVER-SIDE PRICING
        const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0);
        const totalAmount = subtotal; 
        const dynamicPaymentId = `ORD-${Date.now()}`;

        // 6. CREATE ORDER
        const [orderResult] = await connection.execute(
            `INSERT INTO orders
                (user_id, total_amount, status, payment_id, payment_method, payment_status,
                 shipping_address, customer_email, address_id, subtotal, estimated_delivery, tracking_ref)
             VALUES (?, ?, 'pending', ?, ?, 'unpaid', ?, ?, ?, ?, ?, ?)`,
            [user_id, totalAmount, dynamicPaymentId, method, shippingAddressFull, customerEmail, addressId, subtotal, estimatedDeliverySQL, sourcevisiter]
        );
        const newOrderId = orderResult.insertId;

        // 7. INVOICE UPDATE
        const invoiceYear = new Date().getFullYear();
        const invoiceNumber = `KW-${invoiceYear}-${String(newOrderId).padStart(6, '0')}`;
        await connection.execute(`UPDATE orders SET invoice_number = ? WHERE order_id = ?`, [invoiceNumber, newOrderId]);

        // 8. INSERT ORDER ITEMS
        for (const item of cartItems) {
            await connection.execute(
                `INSERT INTO orderitems (order_id, product_id, product_name, quantity, unit_price, hsn_code, discount)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [newOrderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.hsn_code || 'N/A', 0]
            );
        }

        // 9. ORDER TRACKING & CLEAR CART
        await connection.execute(
            `INSERT INTO order_tracking (order_id, status, status_message)
             VALUES (?, 'Order Placed', 'Your order has been received and is pending verification.')`,
            [newOrderId]
        );

        if (!isBuyNow) {
            await connection.execute('DELETE FROM Cart WHERE user_id = ?', [user_id]);
        }

        await connection.commit();
        
        return {
            newOrderId,
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