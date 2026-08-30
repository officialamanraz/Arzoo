// File: src/controllers/Email.js
const { sendEmailService, sendInvoiceEmail } = require('../services/emailService');

const APP_NAME = process.env.APP_NAME || 'Arzoo Saree';
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ==========================================
// CONTACT FORM -- reached via HTTP (POST /api/contact), triggered by the
// user's browser submitting the form.
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
// ORDER CONFIRMATION -- NOT reached via HTTP. This is a plain function,
// called directly (in-process) by checkout.controller.js after an order
// is placed, and by webhook.controller.js / verifyPayment.service.js
// after an online payment is confirmed.
//
// It's kept here (not called straight from emailService.js by those
// controllers) so every outgoing email in the app is triggered through
// this one file -- contact form and order confirmations both -- even
// though only the contact form actually arrives over HTTP.
// ==========================================
const triggerInvoiceEmail = (order_id) => {
  return sendInvoiceEmail(order_id).catch(err =>
    console.error(`[EMAIL] Invoice email failed -- order_id: ${order_id}:`, err.message)
  );
};

module.exports = { sendContactEmail, triggerInvoiceEmail };