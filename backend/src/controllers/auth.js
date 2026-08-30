const { sendEmailService } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { BrevoClient } = require('@getbrevo/brevo');
const { 
  registerUserService, 
  loginuser, 
  forgotpassword, 
  resetpassword, 
  DuplicateEmailError,
  updateProfile
} = require('../services/authservice');
const imagekit = require('../../config/imagekit'); 

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// ==========================================
// CONFIG — all values come from environment variables
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const APP_NAME = process.env.APP_NAME || 'Arzoo Saree';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || APP_NAME;
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_USER;
const FRONTEND_URL = process.env.FRONTEND_URL;
const MIN_PASSWORD_LENGTH = Number(process.env.MIN_PASSWORD_LENGTH) || 6;
const RESET_TOKEN_EXPIRY_MINUTES = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES) || 60;

if (!JWT_SECRET) console.error('[AUTH] Missing JWT_SECRET environment variable.');
if (!FRONTEND_URL) console.error('[AUTH] Missing FRONTEND_URL environment variable — reset links will be broken.');
if (!process.env.BREVO_API_KEY) console.error('[AUTH] Missing BREVO_API_KEY environment variable — emails will fail.');

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
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// ==========================================
// 1. REGISTER USER
// ==========================================
const registerUser = async (req, res) => {
  // 🚨 FIX: req.body se ab hum image_url ki jagah 'profile_image' nikal rahe hain
  const { name, email, password, phone, state, city, fullAddress, profile_image } = req.body;
  console.log(`[AUTH] Register attempt -- email: ${email}`);
 
  if (!name || !email || !password) {
    console.warn('[AUTH] Register failed -- missing required fields');
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }
 
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.warn(`[AUTH] Register failed -- password too short for ${email}`);
    return res.status(400).json({
      success: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    });
  }
 
  const fullFormattedAddress = [fullAddress, city, state].filter(Boolean).join(', ');
 
  try {
    const { insertId } = await registerUserService({
      name,
      email,
      password,
      phone,
      fullFormattedAddress,
      // 🚨 FIX: Service ko bhi hum 'profile_image' pass kar rahe hain
      profile_image
    });
 
    const token = generateToken(insertId, 'user');
    console.log(`[AUTH] Register success -- user_id: ${insertId}`);
 
    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: insertId, name, role: 'user' },
    });
 
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
 
    console.error(`[AUTH] Register error for ${email}:`, error.message);
    return res.status(500).json({ success: false, message: 'Server error while creating account.', error: error.message });
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
    const user = await loginuser (email, password);
    const token = generateToken(user.user_id, user.role);
    console.log(`[AUTH] Login success — user_id: ${user.user_id}, role: ${user.role}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user:{
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(`[AUTH] Login error for ${email}:`, error.message);
    if(error.message === 'INVALID_CREDENTIALS'){
      return res.status(401).json({success:false,message:'Invalid email or password.'})
    }
    if(error.message === 'NO_PASSWORD_SET'){
      return res.status(500).json({success:false,message:'Account configuration error. Please reset your password'});
    }
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ==========================================
// 3. FORGOT PASSWORD 
// ==========================================
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log(`[AUTH] Forgot-password request — email: ${email}`);
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    const {found} = await forgotpassword ({ email, token, expiry});
    
    if(found){
      const resetLink = `${FRONTEND_URL}/reset-password/${token}`;
      console.log(`[AUTH] Reset link generated for ${email} (expires in ${RESET_TOKEN_EXPIRY_MINUTES}m)`);
      await sendEmail({
        to: email,
        subject: `Reset your ${APP_NAME} password`,
        html: `<p>Click below to reset your password. This link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes.</p>
               <a href="${resetLink}">${resetLink}</a>`,
      });
    }
    return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error(`[AUTH] Forgot-password error for ${email}:`, error.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ==========================================
// 4. RESET PASSWORD 
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
    const {found} = await resetpassword (token,newPassword)
    if(!found){
      return res.status(404).json({ success:false, message:"service and database problem" })
    }
    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('[AUTH] Reset-password error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ==========================================
// 5. UPDATE USER PROFILE
// ==========================================
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.user_id || req.user.id;
        
        if (!userId) {
            console.error('[PROFILE UPDATE ERROR] User ID missing from token!');
            return res.status(400).json({ success: false, message: 'Invalid token data.' });
        }

        console.log(`[PROFILE UPDATE] Starting update for User ID: ${userId}`);

        const updateData = {
            name: req.body.name,
            email: req.body.email,
            username: req.body.username
        };

        let profile_image = null;

        if (req.file) {
            const fileBase64 = req.file.buffer.toString('base64');
            const uploadResponse = await imagekit.files.upload({
                file: fileBase64,
                fileName: `profile_${userId}_${Date.now()}`,
                folder: "/arzoo-saree/profile-images"
            });

            profile_image = uploadResponse.url; 
        }

        const updatedUser = await updateProfile(userId, updateData, profile_image);

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            user: updatedUser
        });

    } catch (error) {
        console.error('[PROFILE UPDATE ERROR]', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to update profile.'
        });
    }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword, updateUserProfile };