const db = require('../DATABASE/mysql'); // mysql2/promise pool
const nodemailer = require('nodemailer');

// Email transporter -- credentials from env only, never hardcoded
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    },
    // Forces IPv4 instead of IPv6 -- avoids Render's ENETUNREACH error
    family: 4,
    tls: {
        rejectUnauthorized: false
    }
});

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('[CHECKOUT] Missing GMAIL_USER or GMAIL_APP_PASSWORD env var -- invoice emails will fail.');
}

// ==========================================
// PLACE COD ORDER (server-side pricing -- never trust client for amounts)
// The frontend only sends addressId (+ optional buyNowProduct).
// Shipping address and customer email/name are fetched here from the DB.
// No GST is charged (no GSTIN yet) -- this generates a Bill of Supply, not a Tax Invoice.
// ==========================================
const processCheckout = async (req, res) => {
    const user_id = req.user.id;
    const { addressId, buyNowProduct } = req.body;
    console.log(`[CHECKOUT] Start -- user_id: ${user_id}, addressId: ${addressId}, buyNow: ${!!buyNowProduct}`);

    if (!addressId) {
        console.warn(`[CHECKOUT] Failed -- no addressId (user_id: ${user_id})`);
        return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // --- FETCH ADDRESS ---
        const [addressRows] = await connection.execute(
            `SELECT full_name, phone, house_no, road_area, landmark, city, state, pincode
             FROM addresses WHERE address_id = ? AND user_id = ?`,
            [addressId, user_id]
        );

        if (addressRows.length === 0) {
            console.warn(`[CHECKOUT] Failed -- address ${addressId} not found for user_id ${user_id}`);
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        const addr = addressRows[0];
        const shippingAddressLine = `${addr.house_no}, ${addr.road_area}${addr.landmark ? ', ' + addr.landmark : ''}`;
        const shippingAddressFull = `${shippingAddressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}, Phone: ${addr.phone}`;
        const customerName = addr.full_name;

        // --- SHIPPING ZONE LOOKUP (estimated delivery) ---
        const [zoneRows] = await connection.execute(
            `SELECT min_days, max_days FROM shipping_zones WHERE state_name = ?`,
            [addr.state]
        );

        const defaultMaxDays = Number(process.env.DEFAULT_DELIVERY_DAYS) || 7;
        const maxDays = zoneRows.length > 0 ? zoneRows[0].max_days : defaultMaxDays;

        if (zoneRows.length === 0) {
            console.warn(`[CHECKOUT] No shipping zone found for state "${addr.state}" -- using default ${defaultMaxDays} days`);
        }

        const estimatedDeliveryDateObj = new Date();
        estimatedDeliveryDateObj.setDate(estimatedDeliveryDateObj.getDate() + maxDays);
        const estimatedDeliverySQL = estimatedDeliveryDateObj.toISOString().split('T')[0];

        const estDeliveryDate = estimatedDeliveryDateObj.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        // --- FETCH USER EMAIL ---
        const [userRows] = await connection.execute(
            `SELECT email FROM users WHERE user_id = ?`,
            [user_id]
        );

        if (userRows.length === 0) {
            console.error(`[CHECKOUT] Failed -- user_id ${user_id} not found in users table`);
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'User account not found' });
        }

        const customerEmail = userRows[0].email;

        // --- PROCESS CART / BUY NOW ---
        let cartItems = [];
        const isBuyNow = buyNowProduct && buyNowProduct.product_id;

        if (isBuyNow) {
            const [productRows] = await connection.execute(
                `SELECT product_id, name AS product_name, price AS unit_price, hsn_code
                 FROM products WHERE product_id = ?`,
                [buyNowProduct.product_id]
            );

            if (productRows.length === 0) {
                console.warn(`[CHECKOUT] Buy-now product ${buyNowProduct.product_id} not found`);
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            cartItems = [{
                product_id: productRows[0].product_id,
                product_name: productRows[0].product_name,
                unit_price: productRows[0].unit_price,
                hsn_code: productRows[0].hsn_code,
                quantity: buyNowProduct.quantity || 1
            }];
        } else {
            const [rows] = await connection.execute(
                `SELECT c.product_id, c.quantity, p.price AS unit_price, p.name AS product_name, p.hsn_code
                 FROM Cart c
                 INNER JOIN products p ON c.product_id = p.product_id
                 WHERE c.user_id = ?`,
                [user_id]
            );
            cartItems = rows;
        }

        if (cartItems.length === 0) {
            console.warn(`[CHECKOUT] Failed -- empty cart (user_id: ${user_id})`);
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        console.log(`[CHECKOUT] Processing ${cartItems.length} item(s) -- user_id: ${user_id}, mode: ${isBuyNow ? 'buyNow' : 'cart'}`);

        // ---- Server-side pricing math (no GST -- not GST registered yet) ----
        const subtotal = cartItems.reduce(
            (sum, item) => sum + item.quantity * Number(item.unit_price),
            0
        );
        const totalAmount = subtotal;

        const dynamicPaymentId = `ORD-${Date.now()}`;
        const orderDate = new Date().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        // --- CREATE ORDER ---
        const [orderResult] = await connection.execute(
            `INSERT INTO orders
                (user_id, total_amount, status, payment_id, payment_method, payment_status,
                 shipping_address, customer_email, address_id, subtotal, estimated_delivery)
             VALUES (?, ?, 'pending', ?, 'cod', 'unpaid', ?, ?, ?, ?, ?)`,
            [user_id, totalAmount, dynamicPaymentId, shippingAddressFull, customerEmail, addressId, subtotal, estimatedDeliverySQL]
        );

        const newOrderId = orderResult.insertId;
        console.log(`[CHECKOUT] Order created -- order_id: ${newOrderId}, payment_id: ${dynamicPaymentId}, total: ₹${totalAmount}`);

        // --- GENERATE INVOICE NUMBER ---
        const invoiceYear = new Date().getFullYear();
        const invoiceNumber = `KW-${invoiceYear}-${String(newOrderId).padStart(6, '0')}`;

        await connection.execute(
            `UPDATE orders SET invoice_number = ? WHERE order_id = ?`,
            [invoiceNumber, newOrderId]
        );

        // ---- Insert order items + build itemized HTML rows ----
        let itemsHtmlList = '';
        for (const item of cartItems) {
            const itemDiscount = 0;

            await connection.execute(
                `INSERT INTO orderitems (order_id, product_id, product_name, quantity, unit_price, hsn_code, discount)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [newOrderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.hsn_code || 'N/A', itemDiscount]
            );

            const lineTotal = Number(item.unit_price) * item.quantity - itemDiscount;

            itemsHtmlList += `
            <tr>
              <td>
                <div class="item-name">${item.product_name}</div>
                <div class="item-variant">HSN: ${item.hsn_code || 'N/A'} | SKU: PROD-${item.product_id}</div>
              </td>
              <td class="align-center">${item.quantity}</td>
              <td class="align-right">₹${Number(item.unit_price).toFixed(2)}</td>
              <td class="align-right">₹${itemDiscount.toFixed(2)}</td>
              <td class="align-right">₹${lineTotal.toFixed(2)}</td>
            </tr>`;
        }

        await connection.execute(
            `INSERT INTO order_tracking (order_id, status, status_message)
             VALUES (?, 'Order Placed', 'Your order has been received and is pending verification.')`,
            [newOrderId]
        );

        if (!isBuyNow) {
            await connection.execute('DELETE FROM Cart WHERE user_id = ?', [user_id]);
            console.log(`[CHECKOUT] Cart cleared -- user_id: ${user_id}`);
        }

        await connection.commit();
        console.log(`[CHECKOUT] Transaction committed -- order_id: ${newOrderId}`);

        // ---- Store Information & Settings (all from env, no hardcoded business info) ----
        const storeName = process.env.STORE_NAME;
        const storeTagline = process.env.STORE_TAGLINE;
        const sellerGstin = process.env.SELLER_GSTIN || '';
        const sellerAddress1 = process.env.SELLER_ADDRESS_1;
        const sellerAddress2 = process.env.SELLER_ADDRESS_2;
        const supportEmail = process.env.GMAIL_USER;
        const supportPhone = process.env.SUPPORT_PHONE;

        if (!storeName || !storeTagline || !sellerAddress1 || !sellerAddress2 || !supportPhone) {
            console.warn('[CHECKOUT] One or more STORE_* / SELLER_* / SUPPORT_PHONE env vars are missing -- invoice will show blanks.');
        }

        // Only show a GSTIN row if one is actually set (honest -- no fake "N/A" clutter)
        const gstinRowHtml = sellerGstin ? `GSTIN: ${sellerGstin}<br>` : '';

        // ---- Invoice Email Template (Bill of Supply -- no GST) ----
        const emailHtmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <title>Invoice - ${invoiceNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background: #eceae4;
            padding: 40px 20px;
            color: #242824;
          }

          .invoice {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            overflow: hidden;
          }

          .invoice-header {
            background: linear-gradient(135deg, #ad3764, #d28a2e);
            color: #ffffff;
            padding: 32px 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 20px;
          }

          .seller-block .store-name { font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
          .seller-block .store-tagline { font-size: 12px; opacity: 0.85; margin-top: 4px; }
          .seller-block .store-meta { margin-top: 14px; font-size: 12px; line-height: 1.6; opacity: 0.9; }

          .invoice-meta { text-align: right; }
          .invoice-meta .invoice-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; }
          .invoice-meta .invoice-number-box {
            display: inline-block;
            border: 1px dashed rgba(255,255,255,0.6);
            border-radius: 6px;
            padding: 6px 12px;
            margin-top: 6px;
            font-size: 15px;
            font-weight: 700;
          }
          .invoice-meta .invoice-date { font-size: 12px; margin-top: 10px; opacity: 0.9; line-height: 1.6; }

          .order-meta-strip {
            display: flex;
            gap: 30px;
            padding: 16px 40px;
            border-bottom: 1px solid #eee;
            background: #faf9f7;
            font-size: 12.5px;
            color: #555;
            flex-wrap: wrap;
          }
          .order-meta-strip strong { color: #222; }

          .parties-section {
            display: flex; gap: 30px; padding: 28px 40px; border-bottom: 1px solid #eee; flex-wrap: wrap;
          }
          .party-block { flex: 1; min-width: 220px; }
          .party-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #ad3764; margin-bottom: 10px; }
          .party-block p { font-size: 13.5px; line-height: 1.6; color: #444; }
          .party-block p.name { font-weight: 700; color: #222; font-size: 14.5px; }

          .items-section { padding: 28px 40px; }
          table.items-table { width: 100%; border-collapse: collapse; }
          .items-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #ad3764; padding: 0 8px 12px; border-bottom: 2px solid #ad3764; }
          .items-table thead th.align-center { text-align: center; }
          .items-table thead th.align-right { text-align: right; }
          .items-table tbody td { padding: 14px 8px; border-bottom: 1px solid #f0f0f0; font-size: 13.5px; color: #333; vertical-align: top; }
          .items-table tbody td.align-center { text-align: center; }
          .items-table tbody td.align-right { text-align: right; }
          .item-name { font-weight: 600; color: #222; }
          .item-variant { font-size: 12px; color: #888; margin-top: 2px; }

          .totals-section { padding: 0 40px 28px; display: flex; justify-content: flex-end; }
          .totals-box { width: 100%; max-width: 280px; }
          .totals-row { display: flex; justify-content: space-between; font-size: 13.5px; color: #555; padding: 6px 0; }
          .totals-row.grand-total { border-top: 2px solid #242824; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 700; color: #ad3764; }

          .info-strip { display: flex; gap: 30px; padding: 24px 40px; background: #f7f6f2; border-top: 1px solid #eee; flex-wrap: wrap; }
          .info-block { flex: 1; min-width: 220px; }
          .info-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
          .info-block p { font-size: 13px; color: #333; line-height: 1.7; }
          .info-block p span.field-label { color: #888; }

          .signature-block {
            padding: 20px 40px 0;
            display: flex;
            justify-content: flex-end;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .signature-block .sig-line {
            border-top: 1px solid #999;
            width: 180px;
            padding-top: 6px;
          }

          .invoice-footer { text-align: center; padding: 24px 40px 32px; font-size: 11.5px; color: #999; line-height: 1.7; }
          .invoice-footer strong { color: #666; }
          .eoe-note { text-align: right; padding: 0 40px; font-size: 11px; color: #aaa; }

          @media print {
            body { background: #fff; padding: 0; }
            .invoice { box-shadow: none; border-radius: 0; }
          }
        </style>
        </head>
        <body>

          <div class="invoice">

            <div class="invoice-header">
              <div class="seller-block">
                <div class="store-name">${storeName}</div>
                <div class="store-tagline">${storeTagline}</div>
                <div class="store-meta">
                  ${gstinRowHtml}
                  ${sellerAddress1}<br>
                  ${sellerAddress2}
                </div>
              </div>
              <div class="invoice-meta">
                <div class="invoice-label">Bill of Supply</div>
                <div class="invoice-number-box">${invoiceNumber}</div>
                <div class="invoice-date">
                  Order Date: ${orderDate}<br>
                  Invoice Date: ${orderDate}
                </div>
              </div>
            </div>

            <div class="order-meta-strip">
              <span>Order ID: <strong>${dynamicPaymentId}</strong></span>
            </div>

            <div class="parties-section">
              <div class="party-block">
                <h4>Billing Address</h4>
                <p class="name">${customerName}</p>
                <p>${shippingAddressLine}</p>
                <p>${addr.city}, ${addr.state} - ${addr.pincode}</p>
                <p>Phone: ${addr.phone}</p>
                <p>Email: ${customerEmail}</p>
              </div>
              <div class="party-block">
                <h4>Shipping Address</h4>
                <p class="name">${customerName}</p>
                <p>${shippingAddressLine}</p>
                <p>${addr.city}, ${addr.state} - ${addr.pincode}</p>
              </div>
            </div>

            <div class="items-section">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="align-center">Qty</th>
                    <th class="align-right">Price</th>
                    <th class="align-right">Discount</th>
                    <th class="align-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtmlList}
                </tbody>
              </table>
            </div>

            <div class="totals-section">
              <div class="totals-box">
                <div class="totals-row">
                  <span>Subtotal</span>
                  <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="totals-row">
                  <span>Discount</span>
                  <span>−₹0.00</span>
                </div>
                <div class="totals-row">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div class="totals-row grand-total">
                  <span>Grand Total</span>
                  <span>₹${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="info-strip">
              <div class="info-block">
                <h4>Payment Details</h4>
                <p><span class="field-label">Method:</span> Cash on Delivery (COD)</p>
                <p><span class="field-label">Status:</span> Pending Verification</p>
              </div>
              <div class="info-block">
                <h4>Delivery Details</h4>
                <p><span class="field-label">Estimated Delivery:</span> ${estDeliveryDate}</p>
                <p><span class="field-label">Courier Partner:</span> Standard Delivery</p>
              </div>
            </div>

            <div class="signature-block">
              <div class="sig-line">Authorized Signatory<br>${storeName}</div>
            </div>

            <div class="eoe-note">E. &amp; O.E.</div>

            <div class="invoice-footer">
              This is a computer-generated document and does not require a physical signature.<br>
              Need help? Contact us at <strong>${supportEmail}</strong> or <strong>${supportPhone}</strong><br>
              Return/Exchange available within 7 days of delivery.<br><br>
              Thank you for shopping with ${storeName}!
            </div>

          </div>

        </body>
        </html>`;

        // Send Email
        transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: customerEmail,
            subject: `Order Confirmed! Invoice ${invoiceNumber} - ${storeName}`,
            html: emailHtmlTemplate
        }, (mailErr) => {
            if (mailErr) {
                console.error(`[CHECKOUT] Invoice email failed -- order_id: ${newOrderId}:`, mailErr.message);
            } else {
                console.log(`[CHECKOUT] Invoice email sent -- order_id: ${newOrderId}, to: ${customerEmail}`);
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Order placed and confirmation email sent!',
            orderId: dynamicPaymentId
        });

    } catch (error) {
        await connection.rollback();
        console.error(`[CHECKOUT] Failed -- user_id: ${user_id}:`, error.message);
        return res.status(500).json({ success: false, error: 'Checkout failed, please try again.' });
    } finally {
        connection.release();
    }
};

module.exports = { processCheckout };