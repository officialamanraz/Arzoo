const db = require('../DATABASE/mysql');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    },
    family: 4,
    tls: { rejectUnauthorized: false }
});

// Rebuilds the invoice purely from DB data using order_id.
// Works for BOTH cod and online orders, because everything needed
// (shipping_address, customer_email, subtotal, total_amount, invoice_number,
// estimated_delivery) is already saved on the orders row, and line items
// are already saved in orderitems.
const sendInvoiceEmail = async (order_id) => {
    const [orderRows] = await db.execute(
        `SELECT o.*, a.full_name, a.phone, a.city, a.state, a.pincode, a.house_no, a.road_area, a.landmark
         FROM orders o
         LEFT JOIN addresses a ON o.address_id = a.address_id
         WHERE o.order_id = ?`,
        [order_id]
    );

    if (orderRows.length === 0) {
        console.error(`[INVOICE] order_id ${order_id} not found -- cannot send invoice`);
        return;
    }

    const order = orderRows[0];

    const [itemRows] = await db.execute(
        `SELECT product_id, product_name, quantity, unit_price, hsn_code, discount
         FROM orderitems WHERE order_id = ?`,
        [order_id]
    );

    const storeName = process.env.STORE_NAME;
    const storeTagline = process.env.STORE_TAGLINE;
    const sellerGstin = process.env.SELLER_GSTIN || '';
    const sellerAddress1 = process.env.SELLER_ADDRESS_1;
    const sellerAddress2 = process.env.SELLER_ADDRESS_2;
    const supportEmail = process.env.GMAIL_USER;
    const supportPhone = process.env.SUPPORT_PHONE;
    const gstinRowHtml = sellerGstin ? `GSTIN: ${sellerGstin}<br>` : '';

    const shippingAddressLine = `${order.house_no}, ${order.road_area}${order.landmark ? ', ' + order.landmark : ''}`;
    const orderDate = new Date(order.ordered_at).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
    const estDeliveryDate = order.estimated_delivery
        ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        })
        : 'N/A';

    let itemsHtmlList = '';
    for (const item of itemRows) {
        const lineTotal = Number(item.unit_price) * item.quantity - Number(item.discount || 0);
        itemsHtmlList += `
        <tr>
          <td>
            <div class="item-name">${item.product_name}</div>
            <div class="item-variant">HSN: ${item.hsn_code || 'N/A'} | SKU: PROD-${item.product_id}</div>
          </td>
          <td class="align-center">${item.quantity}</td>
          <td class="align-right">₹${Number(item.unit_price).toFixed(2)}</td>
          <td class="align-right">₹${Number(item.discount || 0).toFixed(2)}</td>
          <td class="align-right">₹${lineTotal.toFixed(2)}</td>
        </tr>`;
    }

    const paymentMethodLabel = order.payment_method === 'online' ? 'Online Payment (Razorpay)' : 'Cash on Delivery (COD)';
    const paymentStatusLabel = order.payment_status === 'paid' ? 'Paid' : 'Pending Verification';

    const emailHtmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <title>Invoice - ${order.invoice_number}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #eceae4; padding: 40px 20px; color: #242824; }
      .invoice { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
      .invoice-header { background: linear-gradient(135deg, #ad3764, #d28a2e); color: #ffffff; padding: 32px 40px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; }
      .seller-block .store-name { font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
      .seller-block .store-tagline { font-size: 12px; opacity: 0.85; margin-top: 4px; }
      .seller-block .store-meta { margin-top: 14px; font-size: 12px; line-height: 1.6; opacity: 0.9; }
      .invoice-meta { text-align: right; }
      .invoice-meta .invoice-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; }
      .invoice-meta .invoice-number-box { display: inline-block; border: 1px dashed rgba(255,255,255,0.6); border-radius: 6px; padding: 6px 12px; margin-top: 6px; font-size: 15px; font-weight: 700; }
      .invoice-meta .invoice-date { font-size: 12px; margin-top: 10px; opacity: 0.9; line-height: 1.6; }
      .order-meta-strip { display: flex; gap: 30px; padding: 16px 40px; border-bottom: 1px solid #eee; background: #faf9f7; font-size: 12.5px; color: #555; flex-wrap: wrap; }
      .order-meta-strip strong { color: #222; }
      .parties-section { display: flex; gap: 30px; padding: 28px 40px; border-bottom: 1px solid #eee; flex-wrap: wrap; }
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
      .invoice-footer { text-align: center; padding: 24px 40px 32px; font-size: 11.5px; color: #999; line-height: 1.7; }
      .invoice-footer strong { color: #666; }
      .eoe-note { text-align: right; padding: 0 40px; font-size: 11px; color: #aaa; }
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
            <div class="invoice-number-box">${order.invoice_number}</div>
            <div class="invoice-date">
              Order Date: ${orderDate}<br>
              Invoice Date: ${orderDate}
            </div>
          </div>
        </div>

        <div class="order-meta-strip">
          <span>Order ID: <strong>${order.payment_id || order.order_id}</strong></span>
        </div>

        <div class="parties-section">
          <div class="party-block">
            <h4>Billing Address</h4>
            <p class="name">${order.full_name}</p>
            <p>${shippingAddressLine}</p>
            <p>${order.city}, ${order.state} - ${order.pincode}</p>
            <p>Phone: ${order.phone}</p>
            <p>Email: ${order.customer_email}</p>
          </div>
          <div class="party-block">
            <h4>Shipping Address</h4>
            <p class="name">${order.full_name}</p>
            <p>${shippingAddressLine}</p>
            <p>${order.city}, ${order.state} - ${order.pincode}</p>
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
            <div class="totals-row"><span>Subtotal</span><span>₹${Number(order.subtotal).toFixed(2)}</span></div>
            <div class="totals-row"><span>Discount</span><span>−₹0.00</span></div>
            <div class="totals-row"><span>Shipping</span><span>Free</span></div>
            <div class="totals-row grand-total"><span>Grand Total</span><span>₹${Number(order.total_amount).toFixed(2)}</span></div>
          </div>
        </div>

        <div class="info-strip">
          <div class="info-block">
            <h4>Payment Details</h4>
            <p><span class="field-label">Method:</span> ${paymentMethodLabel}</p>
            <p><span class="field-label">Status:</span> ${paymentStatusLabel}</p>
          </div>
          <div class="info-block">
            <h4>Delivery Details</h4>
            <p><span class="field-label">Estimated Delivery:</span> ${estDeliveryDate}</p>
            <p><span class="field-label">Courier Partner:</span> Standard Delivery</p>
          </div>
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

    return new Promise((resolve) => {
        transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: order.customer_email,
            subject: `Order Confirmed! Invoice ${order.invoice_number} - ${storeName}`,
            html: emailHtmlTemplate
        }, (mailErr) => {
            if (mailErr) {
                console.error(`[INVOICE] Email failed -- order_id: ${order_id}:`, mailErr.message);
            } else {
                console.log(`[INVOICE] Email sent -- order_id: ${order_id}, to: ${order.customer_email}`);
            }
            resolve();
        });
    });
};

module.exports = { sendInvoiceEmail };