const nodemailer = require('nodemailer');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

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
  // THE FIX: Forces Node.js to use IPv4 instead of IPv6. 
  // This bypasses the Render 'ENETUNREACH' error completely.
  family: 4, 
  tls: {
    rejectUnauthorized: false
  }
});

const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation — don't let empty/garbage submissions through
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, message: 'Name, email, and message are all required.' });
  }

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: 'Please enter a valid email address.' });
  }

  try {
await sendEmail({
  to: process.env.CONTACT_RECEIVER_EMAIL,
  subject: `New Inquiry from Aman Saare Website - ${name}`,
  html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`,
});

    return res.status(200).json({ success: true, message: 'Your message has been sent!' });
  } catch (error) {
    console.error('Email Error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Could not send your message. Please try again later.' });
  }
};

module.exports = { sendContactEmail };