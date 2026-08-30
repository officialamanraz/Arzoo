// File: src/controllers/webhookController.js
const crypto = require('crypto');
const { processWebhookEventInDB } = require('../services/webhookService');

const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // 1. Signature Validation
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body) // Note: webhook body must be raw for accurate crypto hashing
      .digest('hex');

    if (expectedSignature !== signature) {
      console.log('[WEBHOOK] Invalid signature');
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(req.body);
    console.log('[WEBHOOK] Event received:', event.event);

    // 2. Delegate Database Logic to Service Layer
    const result = await processWebhookEventInDB(event);

    if (result.status === 'ignored') {
      console.log('[WEBHOOK]', result.message);
      return res.status(200).json({ success: true });
    }

    // 3. Socket.io Real-Time Updates to Frontend
    const io = req.app.get('io');
    
    if (result.action === 'captured') {
      console.log('[WEBHOOK] Order marked paid+processing:', result.razorpayOrderId);
      io.emit('order_updated', { order: result.orderData });
    } else if (result.action === 'failed') {
      console.log('[WEBHOOK] Order marked unpaid+cancelled:', result.razorpayOrderId);
      io.emit('order_updated', { order: result.orderData });
    }

    // 4. Send Success Response to Razorpay
    return res.status(200).json({ success: true });
    
  } catch (err) {
    console.error('[WEBHOOK] Controller Error:', err);
    return res.status(500).json({ success: false });
  }
};

module.exports = { razorpayWebhook };