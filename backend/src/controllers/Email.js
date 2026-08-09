const nodemailer = require('nodemailer');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const APP_NAME = process.env.APP_NAME || 'Arzoo Saree';

// Basic email format check
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Transporter created once (not on every request) for better performance
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  // Forces Node.js to use IPv4 instead of IPv6.
  // This bypasses the Render 'ENETUNREACH' error completely.
  family: 4,
  tls: {
    rejectUnauthorized: false
  }
});

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.error('[CONTACT] Missing GMAIL_USER or GMAIL_APP_PASSWORD env var -- contact emails will fail.');
}
if (!process.env.CONTACT_RECEIVER_EMAIL) {
  console.error('[CONTACT] Missing CONTACT_RECEIVER_EMAIL env var -- no recipient set for inquiries.');
}

// BUG FIX: this file was calling `sendEmail(...)` but never defined or
// imported it, so every contact-form submission would throw a
// ReferenceError and always hit the catch block. Defining it locally here.
const sendEmail = ({ to, subject, html }) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      { from: process.env.GMAIL_USER, to, subject, html },
      (err, info) => (err ? reject(err) : resolve(info))
    );
  });
};

const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;
  console.log(`[CONTACT] New inquiry -- name: ${name}, email: ${email}`);

  // Basic validation — don't let empty/garbage submissions through
  if (!name || !email || !message) {
    console.warn('[CONTACT] Failed -- missing required fields');
    return res
      .status(400)
      .json({ success: false, message: 'Name, email, and message are all required.' });
  }

  if (!isValidEmail(email)) {
    console.warn(`[CONTACT] Failed -- invalid email format: ${email}`);
    return res
      .status(400)
      .json({ success: false, message: 'Please enter a valid email address.' });
  }

  try {
    await sendEmail({
      to: process.env.CONTACT_RECEIVER_EMAIL,
      subject: `New Inquiry from ${APP_NAME} Website - ${name}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`,
    });

    console.log(`[CONTACT] Email sent successfully -- from: ${email}`);
    return res.status(200).json({ success: true, message: 'Your message has been sent!' });
  } catch (error) {
    console.error(`[CONTACT] Email send failed (from: ${email}):`, error.message);
    return res
      .status(500)
      .json({ success: false, message: 'Could not send your message. Please try again later.' });
  }
};

module.exports = { sendContactEmail };