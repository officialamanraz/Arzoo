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
    const { name, email, username } = updateData;

    // 1. Username Validation
    if (username && !USERNAME_REGEX.test(username)) {
        throw new Error('Invalid username. Use only letters, numbers, and underscores (3-30 characters).');
    }

    // 2. Uniqueness Check 
    if (email || username) {
        const checkQuery = `
            SELECT email, username FROM users 
            WHERE (email = ? OR username = ?) AND user_id != ?
        `;
        const [existing] = await db.execute(checkQuery, [email || '', username || '', userId]);
        
        if (existing.length > 0) {
            const conflict = existing[0];
            if (conflict.email === email) throw new Error('This email is already in use.');
            if (conflict.username === username) throw new Error('This username is already taken.');
        }
    }

    // 3. Dynamic Update Query Builder
    const fields = [];
    const values = [];

    if (name) { fields.push('name = ?'); values.push(name); }
    if (email) { fields.push('email = ?'); values.push(email); }
    if (username) { fields.push('username = ?'); values.push(username); }
    
    // 🚨 UPDATE: Saving directly to 'profile_image' column
    // if (profile_image) { fields.push('image_url = ?'); values.push(profile_image); } // OLD CODE COMMENTED
    if (profile_image) { fields.push('profile_image = ?'); values.push(profile_image); }

    if (fields.length === 0) {
        // const [user] = await db.execute('SELECT user_id, name, email, username, image_url AS profile_image, role FROM users WHERE user_id = ?', [userId]); // OLD CODE
        const [user] = await db.execute(
            'SELECT user_id, name, email, username, profile_image, role FROM users WHERE user_id = ?', 
            [userId]
        );
        return {
            ...user[0],
            profile_image: getFullImageUrl(user[0].profile_image) 
        };
    }

    const updateQuery = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    values.push(userId);

    // 4. Execute Update
    await db.execute(updateQuery, values);

    // 5. Fetch and return the updated user data
    // const [updatedUser] = await db.execute('SELECT user_id, name, email, username, image_url AS profile_image, role FROM users WHERE user_id = ?', [userId]); // OLD CODE
    const [updatedUser] = await db.execute(
        'SELECT user_id, name, email, username, profile_image, role FROM users WHERE user_id = ?', 
        [userId]
    );
    
    return {
        ...updatedUser[0],
        profile_image: getFullImageUrl(updatedUser[0].profile_image)
    };
};

module.exports = { registerUserService, DuplicateEmailError, forgotpassword, resetpassword, loginuser, updateProfile };