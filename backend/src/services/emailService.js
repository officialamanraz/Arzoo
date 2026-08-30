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
    const [orderRows] = await db.execute(
        `SELECT o.*, a.full_name, a.phone, a.city, a.state, a.pincode, a.house_no, a.road_area, a.landmark
         FROM orders o
         LEFT JOIN addresses a ON o.address_id = a.address_id
         WHERE o.order_id = ?`,
        [order_id]
    );

    if (orderRows.length === 0) {
        console.error(`[EMAIL] order_id ${order_id} not found -- cannot send confirmation`);
        return;
    }

    const order = orderRows[0];

    const [itemRows] = await db.execute(
        `SELECT product_name, quantity, unit_price
         FROM orderitems WHERE order_id = ?`,
        [order_id]
    );

    const storeName = process.env.STORE_NAME || 'Arzoo Saree';
    const supportEmail = process.env.GMAIL_USER;
    const supportPhone = process.env.SUPPORT_PHONE || '';
    
    // Build a simple list of items bought
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
            
            <!-- Header -->
            <div style="background-color: #ad3764; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">${storeName}</h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="margin-top: 0; color: #222222; font-size: 20px;">Hi ${order.full_name},</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #555555;">
                    Thank you for shopping with us! Your order <strong>#${order.payment_id || order.order_id}</strong> has been successfully placed and ${paymentText}
                </p>

                <!-- Order Summary Box -->
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

                <!-- Next Steps -->
                <p style="font-size: 15px; line-height: 1.6; color: #555555; text-align: center; margin-bottom: 10px;">
                    You can track your delivery status and <strong>download your official invoice</strong> at any time by visiting the <strong>My Orders</strong> section on our website.
                </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 13px; color: #888888; border-top: 1px solid #eeeeee;">
                Need help? Contact us at <a href="mailto:${supportEmail}" style="color: #ad3764; text-decoration: none;">${supportEmail}</a> 
                ${supportPhone ? `or call ${supportPhone}` : ''}.<br><br>
                &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
            </div>

        </div>
    </body>
    </html>`;

    return sendEmailService({
        to: order.customer_email,
        subject: `Order Confirmed! #${order.payment_id || order.order_id} - ${storeName}`,
        html: emailHtmlTemplate
    }).then(() => {
        console.log(`[EMAIL] Order confirmation sent -- order_id: ${order_id}, to: ${order.customer_email}`);
    }).catch((mailErr) => {
        console.error(`[EMAIL] Confirmation failed -- order_id: ${order_id}:`, mailErr.message);
    });
};

module.exports = { sendEmailService, sendInvoiceEmail };