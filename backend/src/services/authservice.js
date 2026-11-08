const db = require('../DATABASE/mysql');
const bcrypt = require('bcrypt');
const { getFullImageUrl } = require('../utils/imageUtils'); 
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

class DuplicateEmailError extends Error {
  constructor(email) {
    super(`Email already exists: ${email}`);
    this.name = 'DuplicateEmailError';
  }
}

// ==========================================
// 1. REGISTER USER
// ==========================================
const registerUserService = async ({ name, email, password, phone, fullFormattedAddress, profile_image }) => {
  const [existingUsers] = await db.execute(
    'SELECT user_id FROM users WHERE email = ?',
    [email]
  );

  if (existingUsers.length > 0) {
    throw new DuplicateEmailError(email);
  }
  
  const finalImageUrl = profile_image || null; 
  const hashedPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);

  const [insertResult] = await db.execute(
    'INSERT INTO users (name, email, password_hash, phone, address, role, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, email, hashedPassword, phone, fullFormattedAddress, 'user', finalImageUrl]
  );

  return {
    insertId: insertResult.insertId,
    name,
    profile_image: finalImageUrl 
  };
};

// ==========================================
// 2. LOGIN USER
// ==========================================
const loginuser = async (email, password) => {
  const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

  if (users.length === 0) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const user = users[0];
  
  if (!user.password_hash) {
    throw new Error('NO_PASSWORD_SET');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!isMatch) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // 🛡️ SECURITY SHIELD: Remove sensitive data before returning
  delete user.password_hash;
  delete user.reset_token;
  delete user.reset_token_expiry;
  
  return user;
};

// ==========================================
// 3. FORGOT PASSWORD (OTP GENERATION)
// ==========================================
const forgotpassword = async ({ email, token, expiry }) => {
  const [users] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
  
  if (users.length === 0) {
    return { found: false };
  }

  await db.execute(
    'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
    [token, expiry, email]
  );
 
  return { found: true };
};

// ==========================================
// 4. VERIFY OTP
// ==========================================
const verifyotp = async (email, otp) => {
  const [users] = await db.execute(
    'SELECT user_id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()',
    [email, otp]
  );
  return { found: users.length > 0 };
};

// ==========================================
// 5. RESET PASSWORD (WITH OTP)
// ==========================================
const resetpassword = async (email, otp, newPassword) => {
  const [users] = await db.execute(
    'SELECT user_id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()',
    [email, otp]
  );
  
  if (users.length === 0) {
    return { found: false };
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await db.execute(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?',
    [hashedPassword, email]
  );
  
  return { found: true };
};

// ==========================================
// 6. UPDATE PROFILE
// ==========================================
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const updateProfile = async (userId, updateData, profile_image) => {
    const { name, email, username, phone, currentPassword, newPassword } = updateData;

    if (username && !USERNAME_REGEX.test(username)) {
        throw new Error('Invalid username. Use only letters, numbers, and underscores (3-30 characters).');
    }

    if (email || username) {
        const checkQuery = `
            SELECT email, username FROM users 
            WHERE (email = ? OR username = ?) AND user_id != ?
        `;
        const [existing] = await db.execute(checkQuery, [email || '', username || '', userId]);
        
        if (existing.length > 0) {
            const conflict = existing[0];
            if (conflict.email === email && email) {
                throw new Error('This email is already in use.');
            }
            if (conflict.username === username && username) {
                throw new Error('This username is already taken.');
            }
        }
    }

    let hashedPassword = null;
    if (newPassword) {
        if (!currentPassword) {
            throw new Error('Current password is required to set a new password.');
        }

        const [users] = await db.execute('SELECT password_hash FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) throw new Error('User not found.');

        const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isMatch) {
            throw new Error('Incorrect current password.');
        }

        const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
        hashedPassword = await bcrypt.hash(newPassword, salt);
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined && name !== null) { updateFields.push('name = ?'); updateValues.push(name); }
    if (email !== undefined && email !== null) { updateFields.push('email = ?'); updateValues.push(email); }
    if (username !== undefined && username !== null) { updateFields.push('username = ?'); updateValues.push(username); }
    if (phone !== undefined && phone !== null) { updateFields.push('phone = ?'); updateValues.push(phone); } 
    if (profile_image !== undefined && profile_image !== null) { updateFields.push('profile_image = ?'); updateValues.push(profile_image); }
    if (hashedPassword !== undefined && hashedPassword !== null) { updateFields.push('password_hash = ?'); updateValues.push(hashedPassword); }

    if (updateFields.length === 0) {
        const [user] = await db.execute(
            'SELECT user_id, name, email, username, phone, profile_image, role FROM users WHERE user_id = ?', 
            [userId]
        );
        if (user.length === 0) throw new Error('User not found.');
        
        // 🛡️ SECURITY SHIELD
        delete user[0].password_hash;
        delete user[0].reset_token;
        
        return {
            ...user[0],
            profile_image: getFullImageUrl(user[0].profile_image) 
        };
    }

    updateValues.push(userId);
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;
    
    await db.execute(updateQuery, updateValues);

    const [updatedUser] = await db.execute(
        'SELECT user_id, name, email, username, phone, profile_image, role FROM users WHERE user_id = ?', 
        [userId]
    );

    if (updatedUser.length === 0) throw new Error('User not found after update.');

    // 🛡️ SECURITY SHIELD
    delete updatedUser[0].password_hash;
    delete updatedUser[0].reset_token;

    return {
        ...updatedUser[0],
        profile_image: getFullImageUrl(updatedUser[0].profile_image)
    };
};

// ==========================================
// 7. GET USER BY ID
// ==========================================
const getUserById = async (userId) => {
  const [users] = await db.execute(
    'SELECT user_id, name, email, username, phone, address, profile_image, role FROM users WHERE user_id = ?',
    [userId]
  );

  if (users.length === 0) {
    throw new Error('USER_NOT_FOUND');
  }

  const user = users[0];
  
  // 🛡️ SECURITY SHIELD: Double protection against accidental fetches
  delete user.password_hash;
  delete user.reset_token;
  delete user.reset_token_expiry;

  return {
    ...user,
    profile_image: getFullImageUrl(user.profile_image)
  };
};

module.exports = { 
  registerUserService, 
  DuplicateEmailError, 
  forgotpassword, 
  verifyotp,
  resetpassword, 
  loginuser, 
  updateProfile,
  getUserById
};