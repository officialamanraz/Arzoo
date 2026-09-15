// File: src/services/emailService.js
const nodemailer = require('nodemailer');
const db = require('../DATABASE/mysql'); 

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

module.exports = { sendEmailService, sendInvoiceEmail };