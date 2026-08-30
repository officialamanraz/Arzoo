const db = require('../DATABASE/mysql');           // adjust path
const crypto = require('crypto');
const { sendInvoiceEmail } = require('../services/emailService'); // <-- was missing

const verifyPaymentbydb = async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

    if (generated_signature !== razorpay_signature) {
        await db.execute(
            "update orders set payment_status='unpaid' where razorpay_order_id=?",
            [razorpay_order_id]
        );
        return {
            success: false,
            reason: 'invalid_signature',
            message: 'Invalid signature, payment verification failed'
        };
    }

    // signature is valid -- find which internal order this belongs to
    const [rows] = await db.execute(
        'select order_id from orders where razorpay_order_id = ?',
        [razorpay_order_id]
    );

    if (rows.length === 0) {
        return {
            success: false,
            reason: 'order_not_found',
            message: 'No matching order found'
        };
    }

    const internalOrderId = rows[0].order_id;

    await db.execute(
        "update orders set payment_status='paid', payment_id=? where razorpay_order_id=?",
        [razorpay_payment_id, razorpay_order_id]
    );

    // NOW it's safe to send the invoice -- payment is confirmed
    sendInvoiceEmail(internalOrderId).catch(err =>
        console.error(`[PAYMENT] Invoice email failed -- order_id: ${internalOrderId}:`, err.message)
    );

    return {
        success: true,
        message: 'Payment successful'
    };
};

module.exports = { verifyPaymentbydb };