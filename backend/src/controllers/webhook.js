const crypto = require('crypto');
const db = require('../DATABASE/mysql');

const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.log('[WEBHOOK] Invalid signature');
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(req.body);
    console.log('[WEBHOOK] Event received:', event.event);

    // Idempotency guard
    const eventId = event.event + '_' + event.payload.payment.entity.id;
    const [existing] = await db.execute(
      'select id from webhook_events where event_id = ?',
      [eventId]
    );
    if (existing.length > 0) {
      console.log('[WEBHOOK] Already processed, skipping');
      return res.status(200).json({ success: true });
    }
    await db.execute('insert into webhook_events (event_id) values (?)', [eventId]);

    const razorpayOrderId = event.payload.payment.entity.order_id;
    const io = req.app.get('io'); // socket instance yaha se milega

    if (event.event === 'payment.captured') {
      await db.execute(
        'update orders set payment_status="paid", status="processing" where razorpay_order_id = ?',
        [razorpayOrderId]
      );
      console.log('[WEBHOOK] Order marked paid+processing:', razorpayOrderId);

      const [orderRows] = await db.execute(
        'select * from orders where razorpay_order_id = ?',
        [razorpayOrderId]
      );

      // 🔴 YE LINE FRONTEND KO REAL-TIME UPDATE BHEJEGI
      io.emit('order_updated', { order: orderRows[0] });
    }

    if (event.event === 'payment.failed') {
      await db.execute(
        'update orders set payment_status="unpaid", status="cancelled" where razorpay_order_id = ?',
        [razorpayOrderId]
      );

      const [orderRows] = await db.execute(
        'select * from orders where razorpay_order_id = ?',
        [razorpayOrderId]
      );

      io.emit('order_updated', { order: orderRows[0] });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[WEBHOOK] Error:', err);
    res.status(500).json({ success: false });
  }
};

module.exports = { razorpayWebhook };