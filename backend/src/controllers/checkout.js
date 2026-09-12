// File: src/controllers/checkoutController.js
const { processCheckoutInDB } = require('../services/checkoutservice'); 
const { triggerInvoiceEmail } = require('../controllers/Email');

const processCheckout = async (req, res) => {
    const user_id = req.user.id;
    const { addressId, buyNowProduct, paymentMethod, tracking_ref } = req.body;
    
    console.log(`[CHECKOUT_CONTROLLER] 🚀 Checkout API hit -- User ID: ${user_id}, Address ID: ${addressId}, Payment: ${paymentMethod}`);

    if (!addressId) {
        console.warn(`[CHECKOUT_CONTROLLER] ⚠️ Validation failed: Delivery address is missing.`);
        return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    try {
        // Calling our heavy database service function
        const result = await processCheckoutInDB(user_id, addressId, buyNowProduct, paymentMethod, tracking_ref);

        // If Cash on Delivery, trigger invoice email instantly
        if (result.method === 'cod') {
            console.log(`[CHECKOUT_CONTROLLER] 📄 COD order detected. Triggering invoice email for Order ID: ${result.newOrderId}...`);
            triggerInvoiceEmail(result.newOrderId).catch(err =>
                console.error(`[CHECKOUT_CONTROLLER] ❌ Background Invoice Email Failed -- Order ID: ${result.newOrderId}:`, err.message)
            );
        }

        console.log(`[CHECKOUT_CONTROLLER] ✅ Checkout successful -- Internal Order ID: ${result.newOrderId}`);
        return res.status(200).json({
            success: true,
            message: result.method === 'cod' ? 'Order placed and confirmation email sent!' : 'Order created, proceed to payment',
            orderId: result.dynamicPaymentId,
            order_id: result.newOrderId, 
            paymentMethod: result.method
        });

    } catch (error) {
        console.error(`[CHECKOUT_CONTROLLER] ❌ Checkout failed for User ID ${user_id}. Error:`, error.message);
        
        if (error.message === 'ADDRESS_NOT_FOUND') return res.status(404).json({ success: false, message: 'Delivery address not found.' });
        if (error.message === 'USER_NOT_FOUND') return res.status(404).json({ success: false, message: 'User account not found.' });
        if (error.message === 'PRODUCT_NOT_FOUND') return res.status(404).json({ success: false, message: 'Buy-now product not found.' });
        if (error.message === 'CART_EMPTY') return res.status(400).json({ success: false, message: 'Your cart is empty.' });

        return res.status(500).json({ success: false, error: 'Checkout failed, please try again.' });
    }
};

module.exports = { processCheckout };