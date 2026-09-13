const db = require('../DATABASE/mysql');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { getFullImageUrl } = require('../utils/imageUtils'); 
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10; // ParseInt for safety
const ImageKit = require('imagekit');

// Custom error so the controller can tell "duplicate email" apart from
// a generic server error and respond with the right status code.
class DuplicateEmailError extends Error {
  constructor(email) {
    super(`Email already exists: ${email}`);
    this.name = 'DuplicateEmailError';
  }
}

// 🚨 UPDATE: Changed 'image_url' parameter to 'profile_image' to match DB
const registerUserService = async ({ name, email, password, phone, fullFormattedAddress, profile_image }) => {
  const [existingUsers] = await db.execute(
    'SELECT user_id FROM users WHERE email = ?',
    [email]
  );

  if (existingUsers.length > 0) {
    console.warn(`[AUTH-SERVICE] Register failed -- email already exists: ${email}`);
    throw new DuplicateEmailError(email); // stops execution here -- no insert happens
  }
  
  // const finalImageUrl = image_url || null; // OLD CODE COMMENTED
  const finalImageUrl = profile_image || null; 
  
  const hashedPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS); // Changed crypto.hash to bcrypt.hashSync for correct bcrypt hashing

  // 🚨 UPDATE: Insert query me 'image_url' ki jagah 'profile_image' kiya
  // const [insertResult] = await db.execute('INSERT INTO users (name, email, password_hash, phone, address, role, image_url) VALUES (?, ?, ?, ?, ?, ?,?)', [name, email, hashedPassword, phone, fullFormattedAddress, 'user', finalImageUrl]);
  const [insertResult] = await db.execute(
    'INSERT INTO users (name, email, password_hash, phone, address, role, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, email, hashedPassword, phone, fullFormattedAddress, 'user', finalImageUrl]
  );

  console.log(`[AUTH-SERVICE] User inserted -- user_id: ${insertResult.insertId}`);

  return {
    insertId: insertResult.insertId,
    name,
    // image_url: finalImageUrl // OLD CODE COMMENTED
    profile_image: finalImageUrl 
  };
};

const forgotpassword = async({ email, token, expiry }) =>{
    const [users] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log(`[AUTH] Forgot-password — no account for ${email} (not disclosed to client)`);
      return {found:false}
    }
    else{
      await db.execute(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry, email]
    );
   
    console.log(`[AUTH-SERVICE] Reset token saved for ${email}`);
    return { found: true };
    };
};

const resetpassword = async(token,newPassword) =>{
    const [users] = await db.execute(
      'SELECT user_id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );
    if (users.length === 0) {
      console.warn('[AUTH] Reset-password failed — token invalid or expired');
      return {found:false}
    }
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await db.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?',
      [hashedPassword, token]
    );
    console.log(`[AUTH] Reset-password success — user_id: ${users[0].user_id}`);
    return{found:true};
};

const loginuser = async(email, password) =>{
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
    console.warn(`[AUTH] Login failed — no account for ${email}`);
     throw new Error('INVALID_CREDENTIALS');
    }

    const user = users[0];
    
    if (!user.password_hash) {
      console.error(`[AUTH] Login failed — user ${user.user_id} has no password_hash set`);
      throw new Error('NO_PASSWORD_SET');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
        throw new Error('INVALID_CREDENTIALS'); // Same error as 'user not found'
    }
    delete user.password_hash;
    return user;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const updateProfile = async (userId, updateData, profile_image) => {
    // Destructure all possible fields, including phone and passwords
    const { name, email, username, phone, currentPassword, newPassword } = updateData;

    console.log(`\n[Profile Update] Initiated for User ID: ${userId}`);
    console.log(`[Profile Update] Received Data -> Name: ${!!name}, Email: ${!!email}, Username: ${!!username}, Phone: ${!!phone}, Image: ${!!profile_image}, PasswordChange: ${!!newPassword}`);

    // 1. Username Validation
    if (username && !USERNAME_REGEX.test(username)) {
        console.log(`[Profile Update] FAILED: Invalid username format provided.`);
        throw new Error('Invalid username. Use only letters, numbers, and underscores (3-30 characters).');
    }

    // 2. Uniqueness Check 
    if (email || username) {
        console.log(`[Profile Update] Checking uniqueness for email/username...`);
        const checkQuery = `
            SELECT email, username FROM users 
            WHERE (email = ? OR username = ?) AND user_id != ?
        `;
        const [existing] = await db.execute(checkQuery, [email || '', username || '', userId]);
        
        if (existing.length > 0) {
            const conflict = existing[0];
            if (conflict.email === email) {
                console.log(`[Profile Update] FAILED: Email already in use.`);
                throw new Error('This email is already in use.');
            }
            if (conflict.username === username) {
                console.log(`[Profile Update] FAILED: Username already taken.`);
                throw new Error('This username is already taken.');
            }
        }
    }

    // 3. Password Verification & Hashing
    let hashedPassword = null;
    if (newPassword) {
        console.log(`[Profile Update] Password update requested. Verifying current password...`);
        if (!currentPassword) {
            throw new Error('Current password is required to set a new password.');
        }

        // Fetch user's current password hash
        const [users] = await db.execute('SELECT password FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) throw new Error('User not found.');

        // Compare with current password
        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            console.log(`[Profile Update] FAILED: Incorrect current password provided.`);
            throw new Error('Incorrect current password.');
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log(`[Profile Update] Current password verified and new password hashed successfully.`);
    }

    // 4. Dynamic Query Builder (Only update provided columns)
    const updateFields = [];
    const updateValues = [];

    if (name) { updateFields.push('name = ?'); updateValues.push(name); }
    if (email) { updateFields.push('email = ?'); updateValues.push(email); }
    if (username) { updateFields.push('username = ?'); updateValues.push(username); }
    if (phone) { updateFields.push('phone = ?'); updateValues.push(phone); } 
    if (profile_image) { updateFields.push('profile_image = ?'); updateValues.push(profile_image); }
    if (hashedPassword) { updateFields.push('password = ?'); updateValues.push(hashedPassword); }

    // Agar koi bhi field update ke liye nahi aayi, toh current user data fetch karke return kar do
    if (updateFields.length === 0) {
        console.log(`[Profile Update] No changes requested. Fetching current user details...`);
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

    // Append userId for the WHERE clause
    updateValues.push(userId);

    const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE user_id = ?
    `;

    console.log(`[Profile Update] Executing DB Query. Updating columns: [${updateFields.map(f => f.split(' =')[0]).join(', ')}]`);

    // 5. Execute Update
    const [result] = await db.execute(updateQuery, updateValues);
    console.log(`[Profile Update] SUCCESS: Updated ${result.affectedRows} row(s) for User ID: ${userId}\n`);

    // 6. Fetch and return the updated user data with full image URL
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

module.exports = { registerUserService, DuplicateEmailError, forgotpassword, resetpassword, loginuser, updateProfile };