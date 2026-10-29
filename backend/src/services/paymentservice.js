const db = require('../DATABASE/mysql');
const crypto = require('crypto');
const { sendInvoiceEmail } = require('../services/emailService');
const myCache = require('../../config/cache'); // Cache import zaroori hai stock update hone par

const verifyPaymentbydb = async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    console.log(`[PAYMENT-SERVICE] 🔐 Verifying payment signature for Razorpay Order ID: ${razorpay_order_id}`);

    // Database connection for Transaction
    const connection = await db.getConnection();

    try {
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        // Agar signature fail ho jaye toh payment un-verified mark karein
        if (generated_signature !== razorpay_signature) {
            console.warn(`[PAYMENT-SERVICE] ❌ Invalid signature detected! Possible tampering for Order ID: ${razorpay_order_id}`);
            
            await connection.execute(
                "UPDATE orders SET payment_status = 'failed' WHERE razorpay_order_id = ?",
                [razorpay_order_id]
            );
            connection.release();
            return {
                success: false,
                reason: 'invalid_signature',
                message: 'Invalid signature, payment verification failed'
            };
        }

        console.log(`[PAYMENT-SERVICE] ✅ Signature verified successfully! Finding internal order...`);

        // Transaction shuru karein (Payment update + Stock minus + Cart empty)
        await connection.beginTransaction();

        // Find internal order and user_id
        const [rows] = await connection.execute(
            'SELECT order_id, user_id FROM orders WHERE razorpay_order_id = ?',
            [razorpay_order_id]
        );

        if (rows.length === 0) {
            await connection.rollback();
            console.error(`[PAYMENT-SERVICE] ❌ No matching internal order found for Razorpay Order ID: ${razorpay_order_id}`);
            return {
                success: false,
                reason: 'order_not_found',
                message: 'No matching order found'
            };
        }

        const internalOrderId = rows[0].order_id;
        const userId = rows[0].user_id;
        console.log(`[PAYMENT-SERVICE] 🔄 Updating internal Order ID: ${internalOrderId} as PAID.`);

        // 1. Mark Order as PAID
        await connection.execute(
            "UPDATE orders SET payment_status = 'paid', payment_id = ? WHERE razorpay_order_id = ?",
            [razorpay_payment_id, razorpay_order_id]
        );

        // 2. Fetch Order Items to Deduct Stock
        const [orderItems] = await connection.execute(
            "SELECT product_id, quantity FROM orderitems WHERE order_id = ?",
            [internalOrderId]
        );

        // 3. Deduct Stock & Clear Cache 
        console.log(`[PAYMENT-SERVICE] 📦 Deducting stock for Order ID: ${internalOrderId}...`);
        for (const item of orderItems) {
            await connection.execute(
                `UPDATE products SET stock_qty = GREATEST(0, stock_qty - ?) WHERE product_id = ?`,
                [item.quantity, item.product_id]
            );
            
            if (myCache) {
                myCache.del(`product_${item.product_id}`);
            }
        }

        // 4. Clear the User's Cart
        console.log(`[PAYMENT-SERVICE] 🗑️ Clearing cart for User ID: ${userId}...`);
        await connection.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

        // 5. Update Order Tracking Status
        await connection.execute(
            `INSERT INTO order_tracking (order_id, status, status_message)
             VALUES (?, 'Payment Confirmed', 'Your payment has been successfully verified. We are processing your order.')`,
            [internalOrderId]
        );

        // Transaction Save Karein (Commit)
        await connection.commit();
        console.log(`[PAYMENT-SERVICE] 🎉 Transaction committed successfully for Order ID: ${internalOrderId}`);

        // 6. Trigger Email (Email fail hone par transaction rollback nahi hogi)
        console.log(`[PAYMENT-SERVICE] 📧 Triggering invoice email for Order ID: ${internalOrderId}...`);
        sendInvoiceEmail(internalOrderId).catch(err =>
            console.error(`[PAYMENT-SERVICE] ❌ Invoice email failed -- order_id: ${internalOrderId}:`, err.message)
        );

        return {
            success: true,
            message: 'Payment successful'
        };

    } catch (err) {
        await connection.rollback();
        console.error(`[PAYMENT-SERVICE] ❌ Error in verifyPaymentbydb:`, err.message);
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = { verifyPaymentbydb };