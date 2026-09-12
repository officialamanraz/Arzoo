// File: src/controllers/webhookController.js
const crypto = require('crypto');
const { processWebhookEventInDB } = require('../services/webhookService');

const razorpayWebhook = async (req, res) => {
    console.log('[WEBHOOK_CONTROLLER] 🔔 Incoming webhook request intercepted from Razorpay.');
    
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        console.log('[WEBHOOK_CONTROLLER] 🔐 Validating webhook cryptographic signature...');
        // 1. Signature Validation
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(req.rawbody) 
            .digest('hex');

        if (expectedSignature !== signature) {
            console.warn('[WEBHOOK_CONTROLLER] ❌ SECURITY ALERT: Invalid signature detected! Request rejected.');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }
        console.log('[WEBHOOK_CONTROLLER] ✅ Signature verified successfully. Request is authentic.');

        const event = req.body;
        console.log(`[WEBHOOK_CONTROLLER] 📦 Event type received: ${event.event}`);

        // 2. Delegate Database Logic to Service Layer
        const result = await processWebhookEventInDB(event);

        if (result.status === 'ignored') {
            console.log(`[WEBHOOK_CONTROLLER] ℹ️ Webhook action ignored: ${result.message}`);
            return res.status(200).json({ success: true, message: result.message });
        }

        // 3. Socket.io Real-Time Updates to Frontend
        const io = req.app.get('io');
        if (io) {
            console.log('[WEBHOOK_CONTROLLER] ⚡ Socket.io instance found. Preparing real-time broadcast...');
        } else {
            console.warn('[WEBHOOK_CONTROLLER] ⚠️ Socket.io instance not found on app object.');
        }
        
        if (result.action === 'captured') {
            console.log(`[WEBHOOK_CONTROLLER] 🚀 Broadcasting 'order_updated' (Paid/Processing) for Razorpay Order: ${result.razorpayOrderId}`);
            if (io) io.emit('order_updated', { order: result.orderData });
        } else if (result.action === 'failed') {
            console.log(`[WEBHOOK_CONTROLLER] 🚫 Broadcasting 'order_updated' (Cancelled/Unpaid) for Razorpay Order: ${result.razorpayOrderId}`);
            if (io) io.emit('order_updated', { order: result.orderData });
        }

        // 4. Send Success Response to Razorpay
        console.log('[WEBHOOK_CONTROLLER] ✅ Webhook processed completely. Sending 200 OK to Razorpay.');
        return res.status(200).json({ success: true });
        
    } catch (err) {
        console.error('[WEBHOOK_CONTROLLER] ❌ Critical Controller Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { razorpayWebhook };