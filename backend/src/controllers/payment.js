const db = require('../DATABASE/mysql');           // adjust path to your actual db file
const crypto = require('crypto');
const razorpayInstance = require('../../config/razorpay');
const { sendInvoiceEmail } = require('./sendInvoiceEmail'); // adjust path

// Called from PaymentPage.jsx AFTER checkout.controller.js already created
// the order row (with paymentMethod: 'online', payment_status: 'unpaid').
// Frontend sends the real DB order_id (returned by processCheckout as `order_id`).
const orderCreate = async (req, res) => {
    try {
        const { order_id } = req.body;
        const user_id = req.user.id; // ownership check -- don't let user A pay for user B's order

        if (!order_id) {
            return res.status(400).json({
                success: false,
                message: "order_id is required"
            });
        }

        const [orderRows] = await db.execute(
            'select total_amount from orders where order_id = ? and user_id = ?',
            [order_id, user_id]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const totalAmount = orderRows[0].total_amount;

        const options = {
            amount: Math.round(totalAmount * 100), 
            currency: "INR",
            receipt: `order_rcpt_${order_id}`,
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        await db.execute(
            'update orders set razorpay_order_id = ? where order_id = ?',
            [razorpayOrder.id, order_id]
        );

        return res.status(200).json({
            success: true,
            razorpay_order_id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "failed to create razorpay order",
            error: error.message
        });
    }
};

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
                'update orders set payment_status="paid", payment_id=? where razorpay_order_id=?',
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
                'update orders set payment_status="unpaid" where razorpay_order_id=?',
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
    orderCreate,
    verifyPayment
};