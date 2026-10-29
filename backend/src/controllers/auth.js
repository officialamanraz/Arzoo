const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { BrevoClient } = require('@getbrevo/brevo');
const { 
  registerUserService, 
  loginuser, 
  forgotpassword,
  verifyotp,          // 🌟 NAYA: Verify OTP import kiya gaya hai
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
  console.log(`[AUTH-EMAIL] Dispatching transactional email to: ${to} | Subject: "${subject}"`);
  try {
    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM_ADDRESS },
      to: [{ email: to }],
    });
    console.log(`[AUTH-EMAIL] Successfully delivered email to ${to}`);
    return response;
  } catch (error) {
    console.error(`[AUTH-EMAIL] Delivery failure for ${to}:`, error.message);
    throw error;
  }
};

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const registerUser = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing.' });
    }

    const { name, email, password, phone, state, city, fullAddress } = req.body;
    console.log(`[AUTH-CTRL] Registration request received for email: ${email}`);
   
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
   
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      });
    }
   
    const normalizedEmail = email.trim().toLowerCase();
    const fullFormattedAddress = [fullAddress, city, state].filter(Boolean).join(', ');
   
    let profile_image = null;
    if (req.file) {
      console.log(`[AUTH-CTRL] Processing profile image upload via ImageKit...`);
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
    console.log(`[AUTH-CTRL] Registration complete — assigned token to user_id: ${insertId}`);
   
    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: insertId, name, role: 'user', profile_image },
    });

  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    console.error(`[AUTH-CTRL] Registration exception:`, error.message);
    return res.status(500).json({ success: false, message: 'Server error while creating account.', error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH-CTRL] Login invocation for email: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await loginuser(normalizedEmail, password);
    const token = generateToken(user.user_id, user.role);
    console.log(`[AUTH-CTRL] Login verified successfully for user_id: ${user.user_id}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(`[AUTH-CTRL] Login rejected for ${email}:`, error.message);
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (error.message === 'NO_PASSWORD_SET') {
      return res.status(500).json({ success: false, message: 'Account configuration error. Please reset your password.' });
    }
    return res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
};

// ==========================================
// 🌟 YAHAN CHANGE HUA HAI: FORGOT PASSWORD (OTP BANAYEGA)
// ==========================================
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log(`[AUTH-CTRL] Password recovery triggered for email: ${email}`);
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }
  
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    // 🌟 LINK HAT GAYA, SIRF 6-DIGIT OTP BANEGA
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
    return res.status(200).json({ success: true, message: 'If that email exists, an OTP has been sent.' });
  } catch (error) {
    console.error(`[AUTH-CTRL] Forgot password exception for ${email}:`, error.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ==========================================
// 🌟 YAHAN CHANGE HUA HAI: RESET PASSWORD (2 STEPS: VERIFY OR RESET)
// ==========================================
const resetPassword = async (req, res) => {
  const { email, otp, newPassword, action } = req.body;
  console.log(`[AUTH-CTRL] Password reset sequence started for: ${email}, action: ${action}`);

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (action === 'verify') {
      const { found } = await verifyotp(normalizedEmail, otp.trim());
      if (!found) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
      }
      return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
      
    } else if (action === 'reset') {
      if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
      }

      const { found } = await resetpassword(normalizedEmail, otp.trim(), newPassword);
      if (!found) {
        return res.status(404).json({ success: false, message: 'Invalid or expired password reset OTP.' });
      }
      return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
    }
  } catch (error) {
    console.error('[AUTH-CTRL] Reset password exception:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.user_id || req.user.id;
        
        if (!userId) {
            console.error('[AUTH-CTRL] Critical: User ID missing from security token payload!');
            return res.status(400).json({ success: false, message: 'Invalid authentication token context.' });
        }

        console.log(`[AUTH-CTRL] Profile update pipeline triggered for User ID: ${userId}`);

        const updateData = {
            name: req.body.name,
            email: req.body.email,
            username: req.body.username,
            phone: req.body.phone,
            currentPassword: req.body.currentPassword,
            newPassword: req.body.newPassword
        };

        let profile_image = null;
        if (req.file) {
            console.log(`[AUTH-CTRL] Uploading new profile image asset via ImageKit...`);
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
        console.error('[AUTH-CTRL] Profile update error:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to update user profile.'
        });
    }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id || req.user?.userId;
    console.log(`[AUTH-CONTROLLER] 📥 Fetching profile for resolved user_id:`, userId);

    if (!userId) {
      console.warn(`[AUTH-CONTROLLER] ⚠️ User ID is undefined in token payload:`, req.user);
      return res.status(400).json({ success: false, message: "Invalid token payload: User ID missing" });
    }

    const user = await getUserById(userId);
    console.log(`[AUTH-CONTROLLER] 📤 Profile successfully fetched for user_id:`, userId);
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error(`[AUTH-CONTROLLER] ❌ Error fetching profile:`, err.message);
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  updateUserProfile,
  getUserProfile
};