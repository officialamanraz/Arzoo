// File: src/controllers/webhookController.js
const crypto = require('crypto');
const { processWebhookEventInDB,processCourierWebhook } = require('../services/webhookService');

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


const courierWebhookController = async (req, res) => {
    try {
        // ==========================================
        // 🛑 1. SECURITY CHECK: Verify Webhook Secret
        // ==========================================
        // Courier company jo header bhejti hai, uska naam alag-alag ho sakta hai (e.g., x-webhook-secret, x-api-key)
        // Abhi hum ek standard 'x-webhook-secret' maan kar chal rahe hain.
        const providedSecret = req.headers['x-webhook-secret'] || req.headers['authorization'];
        const expectedSecret = process.env.COURIER_WEBHOOK_SECRET;

        if (!providedSecret || providedSecret !== expectedSecret) {
            console.error(`[CONTROLLER] 🚨 Unauthorized Webhook Attempt! Fake or Missing Key.`);
            return res.status(401).json({ success: false, message: 'Unauthorized request' });
        }

        // ==========================================
        // ✅ 2. EXTRACT PAYLOAD
        // ==========================================
        const awbNumber = req.body.awb || req.body.awb_number;
        const newStatus = req.body.current_status || req.body.status;
        const statusMessage = req.body.status_message || req.body.message || '';

        if (!awbNumber || !newStatus) {
            console.warn(`[CONTROLLER] ⚠️ Invalid Webhook Payload: Missing AWB or Status`);
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }

        console.log(`[CONTROLLER] 🚚 Webhook Triggered for AWB: ${awbNumber} | Status: ${newStatus}`);
        
        // ==========================================
        // 🗄️ 3. PROCESS IN DATABASE
        // ==========================================
        await processCourierWebhook(awbNumber, newStatus, statusMessage);

        return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
        
    } catch (error) {
        console.error('[CONTROLLER] ❌ Error processing webhook:', error.message);
        
        if (error.message === 'ORDER_NOT_FOUND_FOR_AWB') {
            return res.status(404).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = { razorpayWebhook,courierWebhookController };