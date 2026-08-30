const { verifyPaymentbydb } = require('../services/paymentservice'); // adjust path

// Called from PaymentPage.jsx AFTER checkout.controller.js already created
// the order row (with paymentMethod: 'online', payment_status: 'unpaid').
// Frontend sends the real DB order_id (returned by processCheckout as `order_id`).

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const result = await verifyPaymentbydb(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (result.success) {
            return res.status(200).json(result);
        }

        if (result.reason === 'order_not_found') {
            return res.status(404).json(result);
        }

        // reason === 'invalid_signature'
        return res.status(400).json(result);

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