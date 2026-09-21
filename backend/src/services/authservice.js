const db = require('../DATABASE/mysql');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { getFullImageUrl } = require('../utils/imageUtils'); 
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

class DuplicateEmailError extends Error {
  constructor(email) {
    super(`Email already exists: ${email}`);
    this.name = 'DuplicateEmailError';
  }
}

const registerUserService = async ({ name, email, password, phone, fullFormattedAddress, profile_image }) => {
  console.log(`[AUTH-SERVICE] Checking if email already exists: ${email}`);
  const [existingUsers] = await db.execute(
    'SELECT user_id FROM users WHERE email = ?',
    [email]
  );

  if (existingUsers.length > 0) {
    console.warn(`[AUTH-SERVICE] Registration failed -- email already exists: ${email}`);
    throw new DuplicateEmailError(email);
  }
  
  const finalImageUrl = profile_image || null; 
  const hashedPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);

  const [insertResult] = await db.execute(
    'INSERT INTO users (name, email, password_hash, phone, address, role, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, email, hashedPassword, phone, fullFormattedAddress, 'user', finalImageUrl]
  );

  console.log(`[AUTH-SERVICE] User successfully registered -- user_id: ${insertResult.insertId}`);

  return {
    insertId: insertResult.insertId,
    name,
    profile_image: finalImageUrl 
  };
};

const forgotpassword = async ({ email, token, expiry }) => {
  console.log(`[AUTH-SERVICE] Processing forgot password for: ${email}`);
  const [users] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
  
  if (users.length === 0) {
    console.log(`[AUTH-SERVICE] Forgot-password — no account found for ${email} (hidden for security)`);
    return { found: false };
  }

  await db.execute(
    'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
    [token, expiry, email]
  );
 
  console.log(`[AUTH-SERVICE] Reset token saved securely for ${email}`);
  return { found: true };
};

const resetpassword = async (token, newPassword) => {
  console.log(`[AUTH-SERVICE] Validating reset token...`);
  const [users] = await db.execute(
    'SELECT user_id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
    [token]
  );
  
  if (users.length === 0) {
    console.warn('[AUTH-SERVICE] Reset-password failed — token invalid or expired');
    return { found: false };
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await db.execute(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?',
    [hashedPassword, token]
  );
  
  console.log(`[AUTH-SERVICE] Password reset successful for user_id: ${users[0].user_id}`);
  return { found: true };
};

const loginuser = async (email, password) => {
  console.log(`[AUTH-SERVICE] Querying database for login email: ${email}`);
  const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

  if (users.length === 0) {
    console.warn(`[AUTH-SERVICE] Login failed — account not found for ${email}`);
    throw new Error('INVALID_CREDENTIALS');
  }

  const user = users[0];
  
  if (!user.password_hash) {
    console.error(`[AUTH-SERVICE] Login failed — user ${user.user_id} has no password_hash configured`);
    throw new Error('NO_PASSWORD_SET');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!isMatch) {
    console.warn(`[AUTH-SERVICE] Login failed — password mismatch for ${email}`);
    throw new Error('INVALID_CREDENTIALS');
  }

  delete user.password_hash;
  console.log(`[AUTH-SERVICE] Authentication passed for user_id: ${user.user_id}`);
  return user;
};

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const updateProfile = async (userId, updateData, profile_image) => {
    const { name, email, username, phone, currentPassword, newPassword } = updateData;

    console.log(`\n[PROFILE-SERVICE] Update initiated for User ID: ${userId}`);

    if (username && !USERNAME_REGEX.test(username)) {
        console.warn(`[PROFILE-SERVICE] Validation failed: Invalid username format.`);
        throw new Error('Invalid username. Use only letters, numbers, and underscores (3-30 characters).');
    }

    if (email || username) {
        console.log(`[PROFILE-SERVICE] Checking uniqueness constraints for email/username...`);
        const checkQuery = `
            SELECT email, username FROM users 
            WHERE (email = ? OR username = ?) AND user_id != ?
        `;
        const [existing] = await db.execute(checkQuery, [email || '', username || '', userId]);
        
        if (existing.length > 0) {
            const conflict = existing[0];
            if (conflict.email === email) {
                throw new Error('This email is already in use.');
            }
            if (conflict.username === username) {
                throw new Error('This username is already taken.');
            }
        }
    }

    let hashedPassword = null;
    if (newPassword) {
        console.log(`[PROFILE-SERVICE] Password update requested. Verifying current password...`);
        if (!currentPassword) {
            throw new Error('Current password is required to set a new password.');
        }

        // 🚨 FIXED: 'password' ki jagah database column 'password_hash' use kiya hai
        const [users] = await db.execute('SELECT password_hash FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) throw new Error('User not found.');

        const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isMatch) {
            console.warn(`[PROFILE-SERVICE] Verification failed: Incorrect current password.`);
            throw new Error('Incorrect current password.');
        }

        const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
        hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log(`[PROFILE-SERVICE] New password successfully hashed.`);
    }

    const updateFields = [];
    const updateValues = [];

    if (name) { updateFields.push('name = ?'); updateValues.push(name); }
    if (email) { updateFields.push('email = ?'); updateValues.push(email); }
    if (username) { updateFields.push('username = ?'); updateValues.push(username); }
    if (phone) { updateFields.push('phone = ?'); updateValues.push(phone); } 
    if (profile_image) { updateFields.push('profile_image = ?'); updateValues.push(profile_image); }
    if (hashedPassword) { updateFields.push('password_hash = ?'); updateValues.push(hashedPassword); } // 🚨 FIXED: password_hash

    if (updateFields.length === 0 && !profile_image) {
        console.log(`[PROFILE-SERVICE] No changes provided. Returning current user profile.`);
        const [user] = await db.execute(
            'SELECT user_id, name, email, username, phone, profile_image, role FROM users WHERE user_id = ?', 
            [userId]
        );
        if (user.length === 0) throw new Error('User not found.');
        return {
            ...user[0],
            profile_image: getFullImageUrl(user[0].profile_image) 
        };
    }

    updateValues.push(userId);
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;

    console.log(`[PROFILE-SERVICE] Executing dynamic update query...`);
    const [result] = await db.execute(updateQuery, updateValues);
    console.log(`[PROFILE-SERVICE] Successfully updated ${result.affectedRows} row(s).`);

    const [updatedUser] = await db.execute(
        'SELECT user_id, name, email, username, phone, profile_image, role FROM users WHERE user_id = ?', 
        [userId]
    );

    if (updatedUser.length === 0) throw new Error('User not found after update.');

    return {
        ...updatedUser[0],
        profile_image: getFullImageUrl(updatedUser[0].profile_image)
    };
};

module.exports = { 
  registerUserService, 
  DuplicateEmailError, 
  forgotpassword, 
  resetpassword, 
  loginuser, 
  updateProfile 
};