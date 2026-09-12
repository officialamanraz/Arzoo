const db = require('../DATABASE/mysql');
const crypto = require('crypto');
const { sendInvoiceEmail } = require('../services/emailService');

const verifyPaymentbydb = async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    console.log(`[PAYMENT-SERVICE] 🔐 Verifying payment signature for Razorpay Order ID: ${razorpay_order_id}`);

    try {
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            console.warn(`[PAYMENT-SERVICE] ❌ Invalid signature detected! Possible tampering for Order ID: ${razorpay_order_id}`);
            
            await db.execute(
                "UPDATE orders SET payment_status = 'unpaid' WHERE razorpay_order_id = ?",
                [razorpay_order_id]
            );
            
            return {
                success: false,
                reason: 'invalid_signature',
                message: 'Invalid signature, payment verification failed'
            };
        }

        console.log(`[PAYMENT-SERVICE] ✅ Signature verified successfully! Finding internal order...`);

        // Find which internal order this belongs to
        const [rows] = await db.execute(
            'SELECT order_id FROM orders WHERE razorpay_order_id = ?',
            [razorpay_order_id]
        );

        if (rows.length === 0) {
            console.error(`[PAYMENT-SERVICE] ❌ No matching internal order found for Razorpay Order ID: ${razorpay_order_id}`);
            return {
                success: false,
                reason: 'order_not_found',
                message: 'No matching order found'
            };
        }

        const internalOrderId = rows[0].order_id;
        console.log(`[PAYMENT-SERVICE] 🔄 Updating internal Order ID: ${internalOrderId} as PAID.`);

        await db.execute(
            "UPDATE orders SET payment_status = 'paid', payment_id = ? WHERE razorpay_order_id = ?",
            [razorpay_payment_id, razorpay_order_id]
        );

        console.log(`[PAYMENT-SERVICE] 📧 Triggering invoice email for Order ID: ${internalOrderId}...`);
        // Safe to send the invoice -- payment is confirmed
        sendInvoiceEmail(internalOrderId).catch(err =>
            console.error(`[PAYMENT-SERVICE] ❌ Invoice email failed -- order_id: ${internalOrderId}:`, err.message)
        );

        console.log(`[PAYMENT-SERVICE] 🎉 Payment verification completed successfully for Order ID: ${internalOrderId}`);
        return {
            success: true,
            message: 'Payment successful'
        };

    } catch (err) {
        console.error(`[PAYMENT-SERVICE] ❌ Error in verifyPaymentbydb:`, err.message);
        throw err;
    }
};

module.exports = { verifyPaymentbydb };