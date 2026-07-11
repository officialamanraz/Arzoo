const db = require('../DATABASE/mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const brevo = require('@getbrevo/brevo');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
// 1. Node.js version conflict fix (Yeh automaticallys sahi object dhoondh lega)
const brevoSDK = brevo.default || brevo;

// 2. Sahi tarike se API Client aur Key setup karein
const defaultClient = brevoSDK.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; 

// 3. Email API initialize karein
const emailAPI = new brevoSDK.TransactionalEmailsApi();

// Iske neeche aapka emailAPI.sendTransacEmail() wala code same rahega...
// 3. Ab Constructor Sahi Se Kaam Karega
const emailAPI = new brevo.TransactionalEmailsApi();
const generateToken = (userId, role) => {
  return jwt.sign({ user_id: userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// 1. REGISTER USER
const registerUser = async (req, res) => {
  console.log(req)

  const { name, email, password, phone, state, city, fullAddress } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  // Combine address fields into a single formatted address string for storage.
  // (Frontend sends state/city/fullAddress separately; Users table currently
  // has a single `address` column.)
  const fullFormattedAddress = [fullAddress, city, state].filter(Boolean).join(', ');

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, existingUsers) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: 'Database error.', error: err.message });
      }

      if (existingUsers.length > 0) {
        return res
          .status(409)
          .json({ success: false, message: 'An account with this email already exists.' });
      }

      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const insertQuery =
          'INSERT INTO  users (name, email, password_hash, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)';

        db.query(
          insertQuery,
          [name, email, hashedPassword, phone, fullFormattedAddress, 'user'],
          (insertErr, insertResult) => {
            if (insertErr) {
              return res
                .status(500)
                .json({ success: false, message: 'Could not create account.', error: insertErr.message });
            };
            const token = generateToken(insertResult.insertId, 'customer');
            return res.status(201).json({
              success: true,
              message: 'Account created successfully!',
              token,
              user: { id: insertResult.insertId, name, role: 'customer' },
            });
          }
        );
      } catch (hashError) {
        console.log(hashError)
        return res
          .status(500)
          .json({ success: false, message: 'Server error while creating account.' });
      }
    }
  );
};

// 2. LOGIN USER
//// 2. LOGIN USER (Using Promises)
const loginUser = async (req, res) => {
  console.log("----------------------------------------");
  console.log("🚀 1. Login API Hit (Promise Version)");

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    console.log(`🚀 2. Attempting db.execute for email: ${email}`);
    
    // Using await db.execute() instead of db.query() with callbacks
    const [result] = await db.execute('SELECT * FROM  users WHERE email = ?', [email]);
    
    console.log(`🚀 3. Database replied! Users found: ${result.length}`);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    const user = result[0];
    
    if (!user.password_hash) {
      return res.status(500).json({ success: false, message: 'Account configuration error.' });
    }

    console.log("🚀 4. Checking password...");
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const payload = {
      id: user.user_id || user.id, 
      role: user.role
    };

    console.log("🚀 5. Generating Token...");
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    
    console.log("🚀 6. Login Successful!");
    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token: token,
      user: user.role
    });

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};
const sendEmail = async ({ to, subject, html }) => {
  const message = new brevo.SendSmtpEmail();
  message.subject = subject;
  message.htmlContent = html;
  message.sender = { name: 'Arzoo Saree', email: process.env.GMAIL_USER };
  message.to = [{ email: to }];
  return emailAPI.sendTransacEmail(message);
};
// 1. FORGOT PASSWORD — generates a token and emails a reset link
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      // Don't reveal whether the email exists — just say "sent" either way
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await db.execute(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry, email]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

 await sendEmail({
  to: email,
  subject: 'Reset your Arzoo password',
  html: `<p>Click below to reset your password. This link expires in 1 hour.</p>
         <a href="${resetLink}">${resetLink}</a>`,
});

    return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// 2. RESET PASSWORD — verifies token and sets new password
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    const [users] = await db.execute(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?',
      [hashedPassword, token]
    );

    return res.status(200).json({ success: true, messages: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};
module.exports = { registerUser, loginUser, forgotPassword, resetPassword };