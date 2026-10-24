// File: src/services/webhookService.js
const db = require('../DATABASE/mysql');

const processWebhookEventInDB = async (event) => {
    const eventId = event.event + '_' + event.payload.payment.entity.id;
    console.log(`[WEBHOOK-SERVICE] 📥 Incoming webhook event received: ${event.event} (Event ID: ${eventId})`);

    try {
        // 1. Idempotency guard - check if already processed
        const [existing] = await db.execute(
            'SELECT id FROM webhook_events WHERE event_id = ?',
            [eventId]
        );
        if (existing.length > 0) {
            console.warn(`[WEBHOOK-SERVICE] ⚠️ Webhook event ${eventId} already processed. Ignoring.`);
            return { status: 'ignored', message: 'Already processed' };
        }

        const razorpayOrderId = event.payload.payment.entity.order_id;
        const razorpayPaymentId = event.payload.payment.entity.id;
        console.log(`[WEBHOOK-SERVICE] 🔍 Processing for Razorpay Order ID: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}`);

        let orderData = null;
        let action = null;

        // ==========================================
        // PAYMENT SUCCESS LOGIC
        // ==========================================
        if (event.event === 'payment.captured') {
            console.log(`[WEBHOOK-SERVICE] 💰 Payment captured successfully. Updating order status...`);
            
            await db.execute(
                'UPDATE orders SET payment_status = "paid", status = "processing", payment_id = ? WHERE razorpay_order_id = ?',
                [razorpayPaymentId, razorpayOrderId]
            );

            const [orderRows] = await db.execute(
                'SELECT * FROM orders WHERE razorpay_order_id = ?',
                [razorpayOrderId]
            );
            
            if (orderRows.length === 0) {
                console.error(`[WEBHOOK-SERVICE] ❌ Order not found for Razorpay Order ID: ${razorpayOrderId}`);
                throw new Error('ORDER_NOT_FOUND_FOR_WEBHOOK');
            }

            orderData = orderRows[0];
            const realOrderId = orderData.order_id;
            console.log(`[WEBHOOK-SERVICE] ✅ Internal Order ID: ${realOrderId} marked as PAID & PROCESSING.`);

            // 🚨 NAYA: FIXED DEALER SPLIT LOGIC (Using locked_dealer_payout)
            console.log(`[WEBHOOK-SERVICE] 🔄 Fetching locked dealer payouts for Order ID: ${realOrderId}...`);
            const [dealerItems] = await db.execute(
                `SELECT p.dealer_id, oi.locked_dealer_payout, d.razorpay_linked_account_id 
                 FROM orderitems oi
                 INNER JOIN products p ON oi.product_id = p.product_id
                 LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
                 WHERE oi.order_id = ? AND p.dealer_id IS NOT NULL`,
                [realOrderId]
            );

            if (dealerItems.length > 0) {
                const dealerTotals = {};
                
                dealerItems.forEach(item => {
                    const dId = item.dealer_id;
                    const payoutAmount = Number(item.locked_dealer_payout);

                    if (!dealerTotals[dId]) dealerTotals[dId] = 0;
                    dealerTotals[dId] += payoutAmount;
                });

                for (const dId in dealerTotals) {
                    const amount = dealerTotals[dId];
                    const mockTransferId = `TRF_${Date.now()}_${dId}`; 
                    
                    console.log(`[WEBHOOK-SERVICE] 💸 Recording transfer for Dealer ID: ${dId} | Amount: ₹${amount}`);
                    await db.execute(
                        `INSERT INTO dealer_transfers (transfer_id, dealer_id, order_id, amount, status) 
                         VALUES (?, ?, ?, ?, 'processed')`,
                        [mockTransferId, dId, realOrderId, amount]
                    );
                    console.log(`[WEBHOOK-SERVICE] ✅ Dealer ${dId} transfer recorded successfully (Transfer ID: ${mockTransferId})`);
                }
            } else {
                console.log(`[WEBHOOK-SERVICE] ℹ️ No dealers attached to items in Order ID: ${realOrderId}. All revenue stays with Admin.`);
            }
            
            action = 'captured';
        } 
        
        // ==========================================
        // PAYMENT FAILED LOGIC
        // ==========================================
        else if (event.event === 'payment.failed') {
            console.warn(`[WEBHOOK-SERVICE] ❌ Payment failed for Razorpay Order ID: ${razorpayOrderId}`);
            
            await db.execute(
                "UPDATE orders SET payment_status = 'unpaid', status = 'cancelled' WHERE razorpay_order_id = ?",
                [razorpayOrderId]
            );

            const [orderRows] = await db.execute(
                'SELECT * FROM orders WHERE razorpay_order_id = ?',
                [razorpayOrderId]
            );
            orderData = orderRows[0];
            action = 'failed';
            console.log(`[WEBHOOK-SERVICE] 🚫 Order status updated to 'cancelled' due to payment failure.`);
        } else {
            console.log(`[WEBHOOK-SERVICE] ℹ️ Unhandled webhook event type: ${event.event}`);
            action = 'ignored_event';
        }

        // 2. Mark event as processed (Idempotency table)
        console.log(`[WEBHOOK-SERVICE] 📝 Storing event ID in webhook_events table: ${eventId}`);
        await db.execute('INSERT INTO webhook_events (event_id) VALUES (?)', [eventId]);

        console.log(`[WEBHOOK-SERVICE] 🎉 Webhook processed successfully for event action: ${action}`);
        return { status: 'processed', action, orderData, razorpayOrderId };

    } catch (err) {
        console.error(`[WEBHOOK-SERVICE] ❌ Error processing webhook event:`, err.message);
        throw err;
    }
};

const processCourierWebhook = async (awbNumber, newStatus, statusMessage) => {
  // Fix 1: && ki jagah || (OR) use karna chahiye. Dono mein se ek bhi missing ho toh error.
  if (!awbNumber || !newStatus) {
    throw new Error('AWB Number and Status are required'); // Fix 2: 'new Error()' hota hai
  }

  try {
    // Fix 3: Query ke aage [awbNumber] pass karna zaroori hai
    const [orderRow] = await db.execute(
      "SELECT order_id, status FROM orders WHERE tracking_awb_number = ?", 
      [awbNumber]
    );

    if (!orderRow || orderRow.length === 0) {
      throw new Error('Order not found for this AWB');
    }

    // Fix 4: Variable destructure karna padega pehle
    const { order_id, status } = orderRow[0];

    // Agar status already same hai toh database ko wapas touch nahi karenge
    if (status === newStatus) {
      // Fix 5: Service layer mein 'res' nahi hota, plain object return karte hain
      return {
        success: true,
        message: "Status is already up to date"
      };
    }

    // Step 1: Update main orders table
    await db.execute(
      "UPDATE orders SET status = ? WHERE tracking_awb_number = ?",
      [newStatus, awbNumber]
    );

    // Step 2: Insert into order_tracking (Yeh aapke code mein missing tha)
    await db.execute(
      "INSERT INTO order_tracking (order_id, status, status_message) VALUES (?, ?, ?)",
      [order_id, newStatus, statusMessage || `Status updated by courier to ${newStatus}`]
    );

    return {
      success: true,
      orderId: order_id,
      status: newStatus,
      message: "Order and tracking history updated successfully"
    };

  } catch (err) {
    throw err; // Fix 6: Error catch karke aage controller ko bhejna zaroori hai
  }
};

module.exports = { processWebhookEventInDB,processCourierWebhook };