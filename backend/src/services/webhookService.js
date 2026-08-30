 // File: src/services/webhookService.js
const db = require('../DATABASE/mysql');

const processWebhookEventInDB = async (event) => {
  const eventId = event.event + '_' + event.payload.payment.entity.id;

  // 1. Idempotency guard - check if already processed
  const [existing] = await db.execute(
    'SELECT id FROM webhook_events WHERE event_id = ?',
    [eventId]
  );
  if (existing.length > 0) {
    return { status: 'ignored', message: 'Already processed' };
  }

  const razorpayOrderId = event.payload.payment.entity.order_id;
  let orderData = null;
  let action = null;

  // ==========================================
  // PAYMENT SUCCESS LOGIC
  // ==========================================
  if (event.event === 'payment.captured') {
    await db.execute(
      'UPDATE orders SET payment_status="paid", status="processing" WHERE razorpay_order_id = ?',
      [razorpayOrderId]
    );

    const [orderRows] = await db.execute(
      'SELECT * FROM orders WHERE razorpay_order_id = ?',
      [razorpayOrderId]
    );
    orderData = orderRows[0];
    const realOrderId = orderData.order_id;

    // DEALER SPLIT LOGIC
    const [dealerItems] = await db.execute(
      `SELECT p.dealer_id, oi.quantity, oi.unit_price, d.commission_percentage 
       FROM orderitems oi
       INNER JOIN products p ON oi.product_id = p.product_id
       INNER JOIN dealers d ON p.dealer_id = d.dealer_id
       WHERE oi.order_id = ? AND p.dealer_id IS NOT NULL`,
      [realOrderId]
    );

    if (dealerItems.length > 0) {
      const dealerTotals = {};
      
      dealerItems.forEach(item => {
        const dId = item.dealer_id;
        const itemGross = item.quantity * item.unit_price;
        const comm = item.commission_percentage;
        const dealerShare = itemGross * ((100 - comm) / 100);

        if (!dealerTotals[dId]) dealerTotals[dId] = 0;
        dealerTotals[dId] += dealerShare;
      });

      for (const dId in dealerTotals) {
        const amount = dealerTotals[dId];
        const mockTransferId = `TRF_${Date.now()}_${dId}`; 
        
        await db.execute(
          `INSERT INTO dealer_transfers (transfer_id, dealer_id, order_id, amount, status) 
           VALUES (?, ?, ?, ?, 'processed')`,
          [mockTransferId, dId, realOrderId, amount]
        );
        console.log(`[WEBHOOK-SERVICE] Dealer ${dId} payout recorded: ₹${amount}`);
      }
    }
    
    action = 'captured';
  } 
  
  // ==========================================
  // PAYMENT FAILED LOGIC
  // ==========================================
  else if (event.event === 'payment.failed') {
    await db.execute(
      "UPDATE orders SET payment_status='unpaid', status='cancelled' WHERE razorpay_order_id = ?",
      [razorpayOrderId]
    );

    const [orderRows] = await db.execute(
      'SELECT * FROM orders WHERE razorpay_order_id = ?',
      [razorpayOrderId]
    );
    orderData = orderRows[0];
    action = 'failed';
  }

  // 2. Mark event as processed 
  await db.execute('INSERT INTO webhook_events (event_id) VALUES (?)', [eventId]);

  return { status: 'processed', action, orderData, razorpayOrderId };
};

module.exports = { processWebhookEventInDB };