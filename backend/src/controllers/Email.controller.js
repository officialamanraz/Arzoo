const nodemailer = require('nodemailer');
require('dotenv').config();

// Basic email format check
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Transporter created once (not on every request) for better performance
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
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
    const mailOptions = {
      // IMPORTANT: "from" must be YOUR authenticated Gmail address — Gmail
      // rejects/spam-flags emails claiming to be "from" someone else's address.
      from: `"${name} via Aman Saare" <${process.env.GMAIL_USER}>`,
      // Reply-To is the visitor's real email, so when you hit "Reply" in
      // your inbox, it goes straight back to them.
      replyTo: email,
      to: process.env.CONTACT_RECEIVER_EMAIL,
      subject: `New Inquiry from Aman Saare Website - ${name}`,
      text: `New message from the website:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: 'Your message has been sent!' });
  } catch (error) {
    console.error('Email Error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Could not send your message. Please try again later.' });
  }
};

module.exports = { sendContactEmail };