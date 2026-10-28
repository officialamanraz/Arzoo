// File: src/services/emailService.js
const nodemailer = require('nodemailer');
const db = require('../DATABASE/mysql'); 
const { getFullImageUrl } = require('../utils/imageUtils');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    },
    family: 4, 
    tls: {
        rejectUnauthorized: false
    }
});

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('[EMAIL-SERVICE] Missing GMAIL env vars -- emails will fail.');
}

const sendEmailService = ({ to, subject, html }) => {
    return new Promise((resolve, reject) => {
        transporter.sendMail(
            { from: process.env.GMAIL_USER, to, subject, html },
            (err, info) => (err ? reject(err) : resolve(info))
        );
    });
};

// ==========================================
// ORDER CONFIRMATION EMAIL 
// (Function kept named 'sendInvoiceEmail' so controllers don't break)
// ==========================================
const sendInvoiceEmail = async (order_id) => {
    console.log(`\n--- [EMAIL START] Attempting to send email for Order ID: ${order_id} ---`);

    try {
        // 1. Fetch Order Data
        console.log(`[EMAIL STEP 1] Fetching order data from DB...`);
        const [orderRows] = await db.execute(
            `SELECT o.*, u.email as user_email, a.full_name, a.phone, a.city, a.state, a.pincode, a.house_no, a.road_area, a.landmark
             FROM orders o
             LEFT JOIN addresses a ON o.address_id = a.address_id
             LEFT JOIN users u ON o.user_id = u.user_id
             WHERE o.order_id = ?`,
            [order_id]
        );

        console.log(`[EMAIL STEP 1] SQL Result: Found ${orderRows.length} order(s).`);

        if (orderRows.length === 0) {
            console.error(`[EMAIL ERROR] order_id ${order_id} not found in database. Aborting.`);
            return;
        }

        const order = orderRows[0];
        console.log(`[EMAIL STEP 2] Order Details Fetched -> user_id: ${order.user_id}, customer_email: ${order.customer_email}, user_email: ${order.user_email}`);
        
        // 2. Determine Target Email
        const targetEmail = order.customer_email || order.user_email || order.email;
        console.log(`[EMAIL STEP 3] Final Target Email Determined: ${targetEmail}`);

        if (!targetEmail) {
            console.error(`[EMAIL ERROR] No email address found for order_id ${order_id}. Aborting.`);
            return; 
        }

        // 3. Fetch Items
        console.log(`[EMAIL STEP 4] Fetching order items...`);
        const [itemRows] = await db.execute(
            `SELECT product_name, quantity, unit_price
             FROM orderitems WHERE order_id = ?`,
            [order_id]
        );
        console.log(`[EMAIL STEP 4] Found ${itemRows.length} item(s) for this order.`);

        const storeName = process.env.STORE_NAME || 'Arzoo Saree';
        const supportEmail = process.env.GMAIL_USER;
        const supportPhone = process.env.SUPPORT_PHONE || '';
        
        console.log(`[EMAIL STEP 5] Checking Env Vars -> SENDER_EMAIL: ${supportEmail ? 'CONFIGURED' : 'MISSING'}`);

        let simpleItemsList = '';
        for (const item of itemRows) {
            simpleItemsList += `
            <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; color: #333333;">
                    <strong>${item.product_name}</strong><br>
                    <span style="font-size: 13px; color: #777777;">Qty: ${item.quantity}</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right; color: #333333; font-weight: bold;">
                    ₹${(Number(item.unit_price) * item.quantity).toFixed(2)}
                </td>
            </tr>`;
        }

        const paymentText = order.payment_method === 'online' 
            ? 'has been paid securely online.' 
            : 'will be paid via Cash on Delivery.';

        // HTML Template (Same as before)
        const emailHtmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; color: #333333;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background-color: #ad3764; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">${storeName}</h1>
                </div>
                <div style="padding: 40px 30px;">
                    <h2 style="margin-top: 0; color: #222222; font-size: 20px;">Hi ${order.full_name},</h2>
                    <p style="font-size: 15px; line-height: 1.6; color: #555555;">
                        Thank you for shopping with us! Your order <strong>#${order.payment_id || order.order_id}</strong> has been successfully placed and ${paymentText}
                    </p>
                    <div style="background-color: #fcfcfc; border: 1px solid #eeeeee; border-radius: 6px; padding: 20px; margin: 30px 0;">
                        <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #ad3764; letter-spacing: 1px; border-bottom: 1px solid #dddddd; padding-bottom: 10px;">Order Summary</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            ${simpleItemsList}
                            <tr>
                                <td style="padding: 15px 0 0; color: #333333; font-size: 16px;"><strong>Grand Total</strong></td>
                                <td style="padding: 15px 0 0; text-align: right; color: #ad3764; font-size: 18px; font-weight: bold;">
                                    ₹${Number(order.total_amount).toFixed(2)}
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        console.log(`[EMAIL STEP 6] HTML generated. Dispatching to Nodemailer...`);

        // 4. Send Email via Promise
        const info = await sendEmailService({
            to: targetEmail,
            subject: `Order Confirmed! #${order.payment_id || order.order_id} - ${storeName}`,
            html: emailHtmlTemplate
        });

        console.log(`[EMAIL SUCCESS] Email dispatched successfully! Message ID: ${info?.messageId}`);
        console.log(`--- [EMAIL END] ---\n`);

    } catch (error) {
        console.error(`\n[EMAIL CRITICAL ERROR] Process failed for Order ID: ${order_id}`);
        console.error(`[EMAIL CRITICAL ERROR DETAILS]:`, error.message);
        console.error(error); // Pura error print hoga yahan
        console.error(`--- [EMAIL END WITH ERROR] ---\n`);
    }
};

// ==========================================
// BILL SETTINGS (website name is fixed for now, everything else comes from the database)
// ==========================================
const BILL_SETTINGS = {
    SITE_NAME: 'Arzoo Saree',
    CURRENCY_CODE: 'INR',
    LOCALE: 'en-IN',
    FALLBACK_IMAGE: '/saare_1.jpeg'
};

// Same fields the product detail page shows inside "All details"
const SPEC_FIELDS = [
    { key: 'fabric', label: 'Fabric/Material' },
    { key: 'product_length', label: 'Product Length' },
    { key: 'primary_color', label: 'Primary Color' },
    { key: 'other_color', label: 'Other Colors' },
    { key: 'pattern', label: 'Pattern' },
    { key: 'craft', label: 'Craft' },
    { key: 'weave', label: 'Weave' },
    { key: 'zari_type', label: 'Zari Type' },
    { key: 'border_type', label: 'Border Type' },
    { key: 'border_motifs', label: 'Border Motifs' },
    { key: 'blouse', label: 'Blouse' },
    { key: 'blouse_length', label: 'Blouse Length' },
    { key: 'khats', label: 'Khats' },
    { key: 'weight', label: 'Weight' }
];

const moneyFormatter = new Intl.NumberFormat(BILL_SETTINGS.LOCALE, {
    style: 'currency',
    currency: BILL_SETTINGS.CURRENCY_CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
});

const money = (value) => moneyFormatter.format(Number(value) || 0);

// Everything that comes from the database goes through this before it enters the HTML
const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== '' && String(value) !== 'null';

const formatDate = (value, withTime = false) => {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString(BILL_SETTINGS.LOCALE, {
        day: '2-digit', month: 'short', year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
    });
};

// ==========================================
// 1. FETCH ALL BILL DATA FROM THE DATABASE
// ==========================================
const getInvoiceData = async (userId, orderId) => {
    const [orderRows] = await db.execute(
        `SELECT o.*, u.name AS user_name, u.email AS user_email,
                a.full_name AS addr_name, a.phone AS addr_phone, a.alternate_phone,
                a.house_no, a.road_area, a.landmark, a.city, a.state, a.pincode
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.user_id
         LEFT JOIN addresses a ON o.address_id = a.address_id
         WHERE o.order_id = ? AND o.user_id = ?`,
        [orderId, userId]
    );
    if (orderRows.length === 0) return null;
    const order = orderRows[0];

    // p.* first, then uniquely named order columns, so nothing from products can overwrite the ordered quantity/price
    const [itemRows] = await db.execute(
        `SELECT p.*,
                c.name AS category_name,
                s.subcategory_name AS subcategory_label,
                d.name AS dealer_name,
                d.email AS dealer_email,
                oi.product_name AS bill_name,
                oi.quantity AS bill_qty,
                oi.unit_price AS bill_unit_price,
                oi.discount AS bill_discount,
                oi.hsn_code AS bill_hsn
         FROM orderitems oi
         LEFT JOIN products p ON oi.product_id = p.product_id
         LEFT JOIN categories c ON p.category_id = c.category_id
         LEFT JOIN subcategories s ON p.subcategory_id = s.subcategory_id
         LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
         WHERE oi.order_id = ?`,
        [orderId]
    );

    // Delivery date saved on the order; if it is missing, use the shipping zone of the address state
    let deliveryDate = order.estimated_delivery || null;
    if (!deliveryDate) {
        const [zoneRows] = await db.execute(
            `SELECT max_days FROM shipping_zones
             WHERE LOWER(TRIM(state_name)) = LOWER(TRIM(?)) OR state_name = 'Default'
             ORDER BY (state_name = 'Default') ASC LIMIT 1`,
            [order.state || '']
        );
        if (zoneRows.length > 0) {
            const date = new Date(order.ordered_at);
            date.setDate(date.getDate() + Number(zoneRows[0].max_days));
            deliveryDate = date;
        }
    }

    return { order, items: itemRows, deliveryDate };
};

// ==========================================
// 2. SMALL HTML BUILDERS
// ==========================================
const infoRow = (label, value) =>
    hasValue(value) ? `<div class="info-item"><span class="info-label">${esc(label)}</span><span class="info-value">${esc(value)}</span></div>` : '';

const buildItemHtml = (item) => {
    const qty = Number(item.bill_qty) || 1;
    const unitPrice = Number(item.bill_unit_price) || 0;
    const discount = Number(item.bill_discount) || 0;
    const mrp = Number(item.mrp) > unitPrice ? Number(item.mrp) : unitPrice;
    const lineTotal = unitPrice * qty - discount;
    const name = item.bill_name || item.name || 'Product';
    const image = getFullImageUrl(item.image_url || BILL_SETTINGS.FALLBACK_IMAGE);

    const subcategories = item.subcategory_label || '';
    const specRows = [
        infoRow('Category', item.category_name),
        infoRow('Subcategory / Style', subcategories),
        infoRow('HSN Code', item.bill_hsn),
        ...SPEC_FIELDS.map((f) => infoRow(f.label, item[f.key]))
    ].join('');

    const firmEmail = item.producer_email || item.dealer_email;
    const makerRows = [
        infoRow('Firm / Producer', item.producer || item.dealer_name),
        infoRow('Firm Email', firmEmail),
        infoRow('Maker', item.maker),
        infoRow('Country of Origin', item.origin),
        infoRow('Name and address of the Manufacturer', item.producer_address),
        infoRow('Name and address of the Packer', item.packer_address)
    ].join('');

    return `
      <div class="item-block">
        <div class="item-main">
          <img class="item-img" src="${esc(image)}" alt="${esc(name)}" onerror="this.onerror=null;this.src='${esc(BILL_SETTINGS.FALLBACK_IMAGE)}'">
          <div class="item-body">
            <div class="item-name">${esc(name)}</div>
            <div class="item-sub">SKU: PROD-${esc(item.product_id)}${hasValue(item.bill_hsn) ? ` | HSN: ${esc(item.bill_hsn)}` : ''}</div>

            <div class="firm-box">
              <div><strong>Firm / Producer:</strong> ${esc(item.producer || item.dealer_name || 'N/A')}</div>
              ${hasValue(item.producer_address) ? `<div><strong>Firm address:</strong> ${esc(item.producer_address)}</div>` : ''}
              ${hasValue(firmEmail) ? `<div><strong>Firm email:</strong> ${esc(firmEmail)}</div>` : ''}
              ${hasValue(item.origin) ? `<div><strong>Made in:</strong> ${esc(item.origin)}</div>` : ''}
              ${hasValue(item.packer_address) ? `<div><strong>Packed at:</strong> ${esc(item.packer_address)}</div>` : ''}
            </div>
          </div>
          <div class="item-money">
            <div class="m-row"><span>Qty</span><strong>${qty}</strong></div>
            ${mrp > unitPrice ? `<div class="m-row"><span>MRP</span><s>${money(mrp)}</s></div>` : ''}
            <div class="m-row"><span>Price</span><strong>${money(unitPrice)}</strong></div>
            ${discount > 0 ? `<div class="m-row"><span>Discount</span><strong>- ${money(discount)}</strong></div>` : ''}
            <div class="m-row m-total"><span>Item total</span><strong>${money(lineTotal)}</strong></div>
          </div>
        </div>

        <details class="item-toggle">
          <summary>All details</summary>
          <div class="toggle-body">
            <h4>Specifications</h4>
            <div class="info-grid">${specRows || '<span class="muted">No specifications available.</span>'}</div>
            <h4>Description</h4>
            <p class="desc">${hasValue(item.description) ? esc(item.description) : 'No description available.'}</p>
            <h4>Manufacturer info</h4>
            <div class="info-grid">${makerRows || '<span class="muted">No manufacturer info available.</span>'}</div>
          </div>
        </details>
      </div>`;
};

// ==========================================
// 3. BUILD THE COMPLETE BILL (HTML)
// ==========================================
const buildInvoiceHtml = ({ order, items, deliveryDate }) => {
    let itemsTotal = 0;
    let mrpTotal = 0;
    items.forEach((item) => {
        const qty = Number(item.bill_qty) || 1;
        const unitPrice = Number(item.bill_unit_price) || 0;
        const mrp = Number(item.mrp) > unitPrice ? Number(item.mrp) : unitPrice;
        itemsTotal += unitPrice * qty - (Number(item.bill_discount) || 0);
        mrpTotal += mrp * qty;
    });
    const totalDiscount = Math.max(0, mrpTotal - itemsTotal);
    const deliveryCharge = 0; // delivery is free on every bill
    const grandTotal = itemsTotal + deliveryCharge;

    const invoiceNumber = order.invoice_number || order.payment_id || `ORD-${order.order_id}`;
    const customerName = order.user_name || order.addr_name || 'Customer';
    const addressLine = [order.house_no, order.road_area, order.landmark].filter(hasValue).join(', ');
    const cityLine = [order.city, order.state].filter(hasValue).join(', ') + (hasValue(order.pincode) ? ` - ${order.pincode}` : '');
    const email = order.customer_email || order.user_email;
    const paymentLabel = order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery';
    const paymentStatus = order.payment_status === 'paid' ? 'Paid' : 'Pending';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bill - ${esc(invoiceNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: #f4efe9; color: #2b2024; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.5; }
  .bill { max-width: 860px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.08); overflow: hidden; }
  .bill-head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding: 28px 32px; color: #fff; background: linear-gradient(135deg, #7d1638, #b8893f); }
  .site-name { margin: 0; font-size: 28px; font-family: Georgia, serif; letter-spacing: .5px; }
  .bill-kind { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: .9; }
  .bill-meta { text-align: right; font-size: 13px; }
  .bill-no { display: inline-block; margin: 4px 0; padding: 4px 10px; border: 1px dashed rgba(255,255,255,.7); border-radius: 6px; font-weight: 700; }
  .section { padding: 20px 32px; border-bottom: 1px solid #eee; }
  .section h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .8px; color: #7d1638; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .cust-name { font-size: 16px; font-weight: 700; }
  .muted { color: #8a7f78; }
  .deliver-by { display: inline-block; margin-top: 6px; padding: 4px 10px; border-radius: 6px; background: #eaf6ee; color: #0f6b3a; font-weight: 700; }
  .item-block { margin-bottom: 18px; border: 1px solid #eadfce; border-radius: 10px; overflow: hidden; }
  .item-main { display: flex; gap: 16px; padding: 14px; flex-wrap: wrap; }
  .item-img { width: 110px; height: 146px; object-fit: cover; border-radius: 8px; background: #f3ebe0; }
  .item-body { flex: 1 1 260px; min-width: 0; }
  .item-name { font-size: 15px; font-weight: 700; }
  .item-sub { font-size: 12px; color: #8a7f78; margin-bottom: 8px; }
  .firm-box { padding: 8px 10px; border-radius: 8px; background: #fbf6ee; font-size: 12.5px; }
  .item-money { flex: 0 0 190px; font-size: 13px; }
  .m-row { display: flex; justify-content: space-between; gap: 10px; padding: 2px 0; }
  .m-total { margin-top: 4px; padding-top: 6px; border-top: 1px solid #eadfce; font-size: 15px; color: #7d1638; }
  .item-toggle { border-top: 1px solid #eadfce; }
  .item-toggle summary { cursor: pointer; padding: 10px 14px; font-weight: 700; color: #7d1638; list-style: none; }
  .item-toggle summary::after { content: ' \\25BC'; font-size: 11px; }
  .item-toggle[open] summary::after { content: ' \\25B2'; }
  .toggle-body { padding: 0 14px 14px; }
  .toggle-body h4 { margin: 14px 0 8px; font-size: 13px; color: #5c0f2a; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
  .info-item { display: flex; flex-direction: column; }
  .info-label { font-size: 11.5px; color: #8a7f78; }
  .info-value { font-weight: 600; overflow-wrap: anywhere; }
  .desc { margin: 0; white-space: pre-line; }
  .totals { max-width: 340px; margin-left: auto; }
  .t-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .t-free { color: #0f6b3a; font-weight: 700; }
  .t-grand { margin-top: 6px; padding-top: 8px; border-top: 2px solid #7d1638; font-size: 18px; font-weight: 800; color: #7d1638; }
  .bill-foot { padding: 18px 32px 26px; text-align: center; font-size: 12px; color: #8a7f78; }
  .print-btn { display: block; margin: 16px auto 0; padding: 10px 26px; border: 0; border-radius: 8px; background: #7d1638; color: #fff; font-weight: 700; cursor: pointer; }
  @media (max-width: 640px) { body { padding: 10px; } .section, .bill-head { padding: 16px; } .two-col, .info-grid { grid-template-columns: 1fr; } .bill-meta { text-align: left; } .item-money { flex-basis: 100%; } }
  @media print { body { background: #fff; padding: 0; } .bill { box-shadow: none; border-radius: 0; } .print-btn { display: none; } }
</style>
</head>
<body>
  <div class="bill">
    <div class="bill-head">
      <div>
        <h1 class="site-name">${esc(BILL_SETTINGS.SITE_NAME)}</h1>
        <div class="bill-kind">Bill of Supply</div>
      </div>
      <div class="bill-meta">
        <div class="bill-no">${esc(invoiceNumber)}</div>
        <div>Order ID: #${esc(order.order_id)}</div>
        <div>Date: ${esc(formatDate(order.ordered_at, true))}</div>
      </div>
    </div>

    <div class="section two-col">
      <div>
        <h3>Customer</h3>
        <div class="cust-name">${esc(customerName)}</div>
        ${hasValue(order.addr_name) && order.addr_name !== customerName ? `<div>Deliver to: ${esc(order.addr_name)}</div>` : ''}
        ${hasValue(order.addr_phone) ? `<div>Mobile: ${esc(order.addr_phone)}</div>` : ''}
        ${hasValue(order.alternate_phone) ? `<div>Alternate: ${esc(order.alternate_phone)}</div>` : ''}
        ${hasValue(email) ? `<div>Email: ${esc(email)}</div>` : ''}
      </div>
      <div>
        <h3>Delivery address</h3>
        <div>${esc(addressLine) || '<span class="muted">N/A</span>'}</div>
        <div>${esc(cityLine)}</div>
        <div class="deliver-by">Delivery by ${esc(formatDate(deliveryDate))}</div>
      </div>
    </div>

    <div class="section">
      <h3>Products</h3>
      ${items.length > 0 ? items.map(buildItemHtml).join('') : '<p class="muted">No items found for this order.</p>'}
    </div>

    <div class="section">
      <div class="totals">
        <div class="t-row"><span>Total MRP</span><span>${money(mrpTotal)}</span></div>
        ${totalDiscount > 0 ? `<div class="t-row"><span>Discount</span><span>- ${money(totalDiscount)}</span></div>` : ''}
        <div class="t-row"><span>Delivery charges</span><span class="t-free">FREE</span></div>
        <div class="t-row t-grand"><span>Total</span><span>${money(grandTotal)}</span></div>
        <div class="t-row muted"><span>Payment</span><span>${esc(paymentLabel)} (${esc(paymentStatus)})</span></div>
      </div>
    </div>

    <div class="bill-foot">
      Thank you for shopping with ${esc(BILL_SETTINGS.SITE_NAME)}.<br>
      This is a computer generated bill and does not need a signature.
      <button type="button" class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>
  <script>
    // Open every toggle when printing, so the product details are on the paper too
    window.addEventListener('beforeprint', function () {
      document.querySelectorAll('details').forEach(function (d) { d.open = true; });
    });
  </script>
</body>
</html>`;
};

// ==========================================
// 4. PUBLIC FUNCTION: BILL HTML FOR ONE ORDER (null if the order is not this user's)
// ==========================================
const getInvoiceHtml = async (userId, orderId) => {
    const data = await getInvoiceData(userId, orderId);
    if (!data) return null;
    return buildInvoiceHtml(data);
};

module.exports = { sendEmailService, sendInvoiceEmail, getInvoiceHtml };