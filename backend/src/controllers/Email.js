// File: src/controllers/Email.js
const { sendEmailService, sendInvoiceEmail, getInvoiceHtml, sendAdminOrderAlert, sendStatusUpdateEmail } = require('../services/emailService');

const APP_NAME = process.env.APP_NAME || 'Arzoo Saree';
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ==========================================
// CONTACT FORM
// ==========================================
const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;
  console.log(`[CONTACT] New inquiry -- name: ${name}, email: ${email}`);

  if (!name || !email || !message) {
    console.warn('[CONTACT] Failed -- missing required fields');
    return res.status(400).json({ success: false, message: 'Name, email, and message are all required.' });
  }

  if (!isValidEmail(email)) {
    console.warn(`[CONTACT] Failed -- invalid email format: ${email}`);
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.GMAIL_USER;

  if (!receiverEmail) {
    console.error('[CONTACT] Missing both CONTACT_RECEIVER_EMAIL and GMAIL_USER env vars');
    return res.status(500).json({ success: false, message: 'Server configuration error.' });
  }

  try {
    await sendEmailService({
      to: receiverEmail,
      subject: `New Inquiry from ${APP_NAME} Website - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ad3764;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong><br/> ${message}</p>
        </div>
      `,
    });

    console.log(`[CONTACT] Email sent successfully -- from: ${email}`);
    return res.status(200).json({ success: true, message: 'Your message has been sent!' });

  } catch (error) {
    console.error(`[CONTACT] Email send failed (from: ${email}):`, error.message);
    return res.status(500).json({ success: false, message: 'Could not send your message. Please try again later.' });
  }
};

// ==========================================
// ORDER CONFIRMATION WRAPPER
// ==========================================
const triggerInvoiceEmail = (order_id) => {
  return sendInvoiceEmail(order_id).catch(err =>
    console.error(`[EMAIL] Invoice email failed -- order_id: ${order_id}:`, err.message)
  );
};

// ==========================================
// ADMIN ALERT WRAPPER
// ==========================================
const triggerAdminOrderAlert = (order_id) => {
  return sendAdminOrderAlert(order_id).catch(err =>
    console.error(`[EMAIL] Admin alert email failed -- order_id: ${order_id}:`, err.message)
  );
};

// ==========================================
// HTTP ENDPOINT: UPDATE STATUS EMAIL
// ==========================================
const sendOrderStatusEmail = async (req, res) => {
    const { order_id, status, customMessage, tracking_number } = req.body;
    
    if (!order_id || !status) {
        return res.status(400).json({ success: false, message: 'Order ID and Status are required.' });
    }

    try {
        await sendStatusUpdateEmail(order_id, status, customMessage, tracking_number);
        return res.status(200).json({ success: true, message: 'Status email sent successfully.' });
    } catch (error) {
        console.error(`[EMAIL] Status update email failed:`, error.message);
        return res.status(500).json({ success: false, message: 'Failed to send status email.' });
    }
};

// ==========================================
// GET INVOICE HTML
// ==========================================
const getInvoice = async (req, res) => {
    const userId = req.user.id;
    const orderId = parseInt(req.params.orderId, 10);
 
    if (isNaN(orderId) || orderId <= 0) {
        return res.status(400).json({ success: false, message: 'A valid order id is required.' });
    }
 
    try {
        const html = await getInvoiceHtml(userId, orderId);
        if (!html) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        return res.status(200).type('html').send(html);
    } catch (error) {
        console.error(`[INVOICE] Failed to build bill for order ${orderId}:`, error.message);
        return res.status(500).json({ success: false, message: 'Could not generate the bill.' });
    }
};

module.exports = { 
    sendContactEmail, 
    triggerInvoiceEmail, 
    triggerAdminOrderAlert, 
    getInvoice, 
    sendOrderStatusEmail 
};