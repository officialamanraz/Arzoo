const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { BrevoClient } = require('@getbrevo/brevo');
const { 
  registerUserService, 
  loginuser, 
  forgotpassword, 
  resetpassword, 
  DuplicateEmailError,
  updateProfile,
  getUserById
} = require('../services/authservice');
const imagekit = require('../../config/imagekit'); 

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const APP_NAME = process.env.APP_NAME || 'Arzoo Saree';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || APP_NAME;
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_USER;
const MIN_PASSWORD_LENGTH = Number(process.env.MIN_PASSWORD_LENGTH) || 6;
const RESET_TOKEN_EXPIRY_MINUTES = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES) || 15; // 15 mins for OTP

if (!JWT_SECRET) console.error('[AUTH-CTRL] CRITICAL: Missing JWT_SECRET environment variable.');

const brevoClient = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM_ADDRESS },
      to: [{ email: to }],
    });
    return response;
  } catch (error) {
    console.error(`[AUTH-EMAIL] Delivery failure for ${to}:`, error.message);
    throw error;
  }
};

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// ==========================================
// REGISTER
// ==========================================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, state, city, fullAddress } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
    }
   
    // 🌟 FIX: Normalize email to prevent trailing space/case sensitivity login bugs
    const normalizedEmail = email.trim().toLowerCase();
    const fullFormattedAddress = [fullAddress, city, state].filter(Boolean).join(', ');
   
    let profile_image = null;
    if (req.file) {
      const fileBase64 = req.file.buffer.toString('base64');
      const uploadResponse = await imagekit.files.upload({
        file: fileBase64,
        fileName: `profile_reg_${Date.now()}`,
        folder: "/arzoo-saree/profile-images"
      });
      profile_image = uploadResponse.url;
    }

    const { insertId } = await registerUserService({
      name,
      email: normalizedEmail,
      password,
      phone,
      fullFormattedAddress,
      profile_image
    });
   
    const token = generateToken(insertId, 'user');
    return res.status(201).json({ success: true, message: 'Account created successfully!', token, user: { id: insertId, name, role: 'user', profile_image } });

  } catch (error) {
    if (error instanceof DuplicateEmailError) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    return res.status(500).json({ success: false, message: 'Server error while creating account.', error: error.message });
  }
};

// ==========================================
// LOGIN
// ==========================================
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });

  // 🌟 FIX: Normalize email to match the sanitized database record
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await loginuser(normalizedEmail, password);
    const token = generateToken(user.user_id, user.role);

    return res.status(200).json({
      success: true, message: 'Login successful!', token,
      user: { id: user.user_id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (error.message === 'NO_PASSWORD_SET') return res.status(500).json({ success: false, message: 'Account configuration error.' });
    return res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
};

// ==========================================
// FORGOT PASSWORD (OTP FLOW)
// ==========================================
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
  
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    // 🌟 Generate 6-Digit OTP instead of Hex token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    
    const { found } = await forgotpassword({ email: normalizedEmail, token: otp, expiry });
    
    if (found) {
      await sendEmail({
        to: normalizedEmail,
        subject: `${APP_NAME} - Password Reset OTP`,
        html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                 <h2>Password Reset Request</h2>
                 <p>Your One-Time Password (OTP) to reset your password is:</p>
                 <h1 style="font-size: 32px; letter-spacing: 4px; color: #7d1638; background: #fdf5eb; padding: 10px; border-radius: 5px; display: inline-block;">${otp}</h1>
                 <p>This OTP is valid for ${RESET_TOKEN_EXPIRY_MINUTES} minutes.</p>
                 <p>If you didn't request this, please ignore this email.</p>
               </div>`,
      });
    }
    // Always return success to prevent email enumeration attacks
    return res.status(200).json({ success: true, message: 'If that email exists, an OTP has been sent.' });
  } catch (error) {
    console.error(`[AUTH-CTRL] OTP exception for ${email}:`, error.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ==========================================
// RESET PASSWORD (OTP FLOW)
// ==========================================
const resetpassword = async (email, otp, newPassword) => {
  console.log(`[AUTH-SERVICE] Validating OTP for: ${email}`);
  
  // 🌟 Check that the OTP matches the specific email
  const [users] = await db.execute(
    'SELECT user_id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()',
    [email, otp]
  );
  
  if (users.length === 0) {
    console.warn('[AUTH-SERVICE] Reset-password failed — OTP invalid or expired');
    return { found: false };
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // Clear the OTP once used
  await db.execute(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?',
    [hashedPassword, email]
  );
  
  console.log(`[AUTH-SERVICE] Password reset successful for user_id: ${users[0].user_id}`);
  return { found: true };
};

// Profile Update & Get (Unchanged functionality)
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.user_id || req.user.id;
        if (!userId) return res.status(400).json({ success: false, message: 'Invalid authentication token context.' });
        
        const updateData = {
            name: req.body.name, email: req.body.email ? req.body.email.trim().toLowerCase() : undefined,
            username: req.body.username, phone: req.body.phone,
            currentPassword: req.body.currentPassword, newPassword: req.body.newPassword
        };

        let profile_image = null;
        if (req.file) {
            const fileBase64 = req.file.buffer.toString('base64');
            const uploadResponse = await imagekit.files.upload({
                file: fileBase64, fileName: `profile_${userId}_${Date.now()}`, folder: "/arzoo-saree/profile-images"
            });
            profile_image = uploadResponse.url; 
        }
        const updatedUser = await updateProfile(userId, updateData, profile_image);
        return res.status(200).json({ success: true, message: 'Profile updated successfully.', user: updatedUser });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message || 'Failed to update user profile.' });
    }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id || req.user?.userId;
    if (!userId) return res.status(400).json({ success: false, message: "Invalid token payload: User ID missing" });
    const user = await getUserById(userId);
    return res.status(200).json({ success: true, user });
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') return res.status(404).json({ success: false, message: "User not found" });
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword, updateUserProfile, getUserProfile };