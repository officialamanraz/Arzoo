const { processCheckoutInDB } = require('../services/checkoutService'); // Ensure correct path
const { triggerInvoiceEmail } = require('../controllers/Email');
const processCheckout = async (req, res) => {
    const user_id = req.user.id;
    const { addressId, buyNowProduct, paymentMethod, tracking_ref } = req.body;
    
    console.log(`[CHECKOUT] Start -- user_id: ${user_id}, addressId: ${addressId}`);

    if (!addressId) {
        return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    try {
        const result = await processCheckoutInDB(user_id, addressId, buyNowProduct, paymentMethod, tracking_ref);

        if (result.method === 'cod') {
            triggerInvoiceEmail(result.newOrderId).catch(err =>
                console.error(`[CHECKOUT] Invoice email failed -- order_id: ${result.newOrderId}:`, err.message)
            );
        }

        return res.status(200).json({
            success: true,
            message: result.method === 'cod' ? 'Order placed and confirmation email sent!' : 'Order created, proceed to payment',
            orderId: result.dynamicPaymentId,
            order_id: result.newOrderId, 
            paymentMethod: result.method
        });

    } catch (error) {
        console.error(`[CHECKOUT] Failed -- user_id: ${user_id}:`, error.message);
        
        if (error.message === 'ADDRESS_NOT_FOUND') return res.status(404).json({ success: false, message: 'Delivery address not found.' });
        if (error.message === 'USER_NOT_FOUND') return res.status(404).json({ success: false, message: 'User account not found.' });
        if (error.message === 'PRODUCT_NOT_FOUND') return res.status(404).json({ success: false, message: 'Buy-now product not found.' });
        if (error.message === 'CART_EMPTY') return res.status(400).json({ success: false, message: 'Your cart is empty.' });

        return res.status(500).json({ success: false, error: 'Checkout failed, please try again.' });
    }
};

module.exports = { processCheckout };