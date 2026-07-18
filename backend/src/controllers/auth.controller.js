const db = require('../DATABASE/mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { BrevoClient } = require('@getbrevo/brevo');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// ==========================================
// CONFIG — all values come from environment variables,
// with safe fallbacks only for non-secret defaults.
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const APP_NAME = process.env.APP_NAME || 'Arzoo Saree';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || APP_NAME;
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_USER;
const FRONTEND_URL = process.env.FRONTEND_URL;
const MIN_PASSWORD_LENGTH = Number(process.env.MIN_PASSWORD_LENGTH) || 6;
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
const RESET_TOKEN_EXPIRY_MINUTES = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES) || 60;

if (!JWT_SECRET) {
  console.error('[AUTH] Missing JWT_SECRET environment variable.');
}
if (!FRONTEND_URL) {
  console.error('[AUTH] Missing FRONTEND_URL environment variable — reset links will be broken.');
}
if (!process.env.BREVO_API_KEY) {
  console.error('[AUTH] Missing BREVO_API_KEY environment variable — emails will fail.');
}

// ==========================================
// BREVO (transactional email API) SETUP
// ==========================================
const brevoClient = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

console.log(
  '[AUTH] BREVO_API_KEY loaded:',
  process.env.BREVO_API_KEY ? `Yes, starts with ${process.env.BREVO_API_KEY.slice(0, 8)}...` : 'NO — undefined!'
);

const sendEmail = async ({ to, subject, html }) => {
  console.log(`[AUTH] Sending email — to: ${to}, subject: "${subject}"`);
  try {
    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM_ADDRESS },
      to: [{ email: to }],
    });
    console.log(`[AUTH] Email sent successfully to ${to}`);
    return response;
  } catch (error) {
    console.error(`[AUTH] Email send failed for ${to}:`, error.message);
    throw error;
  }
};

// ==========================================
// HELPERS
// ==========================================

// Generates a signed JWT. Payload shape is kept identical across
// register/login so downstream middleware always sees the same structure.
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// ==========================================
// 1. REGISTER USER
// ==========================================
const registerUser = async (req, res) => {
  const { name, email, password, phone, state, city, fullAddress } = req.body;
  console.log(`[AUTH] Register attempt — email: ${email}`);

  if (!name || !email || !password) {
    console.warn('[AUTH] Register failed — missing required fields');
    return res
      .status(400)
      .json({ success: false, message: 'Name, email, and password are required.' });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.warn(`[AUTH] Register failed — password too short for ${email}`);
    return res.status(400).json({
      success: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    });
  }

  // Combine address fields into a single formatted string for storage
  // (frontend sends state/city/fullAddress separately; users table
  // currently has a single `address` column).
  const fullFormattedAddress = [fullAddress, city, state].filter(Boolean).join(', ');

  try {
    const [existingUsers] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      console.warn(`[AUTH] Register failed — email already exists: ${email}`);
      return res
        .status(409)
        .json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const [insertResult] = await db.execute(
      'INSERT INTO users (name, email, password_hash, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, fullFormattedAddress, 'user']
    );

    const token = generateToken(insertResult.insertId, 'user');
    console.log(`[AUTH] Register success — user_id: ${insertResult.insertId}`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: insertResult.insertId, name, role: 'user' },
    });
  } catch (error) {
    console.error(`[AUTH] Register error for ${email}:`, error.message);
    return res
      .status(500)
      .json({ success: false, message: 'Server error while creating account.', error: error.message });
  }
};

// ==========================================
// 2. LOGIN USER
// ==========================================
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH] Login attempt — email: ${email}`);

  if (!email || !password) {
    console.warn('[AUTH] Login failed — missing email or password');
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const [result] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (result.length === 0) {
      console.warn(`[AUTH] Login failed — no account for ${email}`);
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    const user = result[0];

    if (!user.password_hash) {
      console.error(`[AUTH] Login failed — user ${user.user_id} has no password_hash set`);
      return res.status(500).json({ success: false, message: 'Account configuration error.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      console.warn(`[AUTH] Login failed — incorrect password for ${email}`);
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const token = generateToken(user.user_id, user.role);
    console.log(`[AUTH] Login success — user_id: ${user.user_id}, role: ${user.role}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: user.role,
    });
  } catch (error) {
    console.error(`[AUTH] Login error for ${email}:`, error.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ==========================================
// 3. FORGOT PASSWORD — generates a token and emails a reset link
// ==========================================
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log(`[AUTH] Forgot-password request — email: ${email}`);

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
    const [users] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      console.log(`[AUTH] Forgot-password — no account for ${email} (not disclosed to client)`);
      // Don't reveal whether the email exists — respond the same way either way
      return res
        .status(200)
        .json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await db.execute(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry, email]
    );

    const resetLink = `${FRONTEND_URL}/reset-password/${token}`;
    console.log(`[AUTH] Reset link generated for ${email} (expires in ${RESET_TOKEN_EXPIRY_MINUTES}m)`);

    await sendEmail({
      to: email,
      subject: `Reset your ${APP_NAME} password`,
      html: `<p>Click below to reset your password. This link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes.</p>
             <a href="${resetLink}">${resetLink}</a>`,
    });

    return res
      .status(200)
      .json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error(`[AUTH] Forgot-password error for ${email}:`, error.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ==========================================
// 4. RESET PASSWORD — verifies token and sets a new password
// ==========================================
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  console.log(`[AUTH] Reset-password attempt — token: ${token.slice(0, 8)}...`);

  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    console.warn('[AUTH] Reset-password failed — password too short');
    return res.status(400).json({
      success: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    });
  }

  try {
    const [users] = await db.execute(
      'SELECT user_id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );

    if (users.length === 0) {
      console.warn('[AUTH] Reset-password failed — token invalid or expired');
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await db.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?',
      [hashedPassword, token]
    );

    console.log(`[AUTH] Reset-password success — user_id: ${users[0].user_id}`);

    return res
      .status(200)
      .json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('[AUTH] Reset-password error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };