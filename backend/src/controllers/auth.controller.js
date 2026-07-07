const db = require('../DATABASE/mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper to generate a signed JWT for a user
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
    'SELECT * FROM Users WHERE email = ?',
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
          'INSERT INTO Users (name, email, password_hash, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)';

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
    const [result] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
    
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
module.exports = { registerUser, loginUser };