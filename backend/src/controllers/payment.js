const db = require('../DATABASE/mysql');           // adjust path to your actual db file
const crypto = require('crypto');
const razorpayInstance = require('../../config/razorpay');
const { sendInvoiceEmail } = require('./sendInvoiceEmail'); // adjust path

// Called from PaymentPage.jsx AFTER checkout.controller.js already created
// the order row (with paymentMethod: 'online', payment_status: 'unpaid').
// Frontend sends the real DB order_id (returned by processCheckout as `order_id`).

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            // find which internal order this razorpay_order_id belongs to
            const [rows] = await db.execute(
                'select order_id from orders where razorpay_order_id = ?',
                [razorpay_order_id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: "Order not found" });
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

            return res.status(200).json({
                success: true,
                message: "payment successful"
            });
        } else {
await db.execute(
    "update orders set payment_status='unpaid' where razorpay_order_id=?",
    [razorpay_order_id]
);
            return res.status(400).json({
                success: false,
                message: "Invalid signature, payment verification failed"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Payment verification failed",
            error: error.message
        });
    }
};

module.exports = {
    verifyPayment
};