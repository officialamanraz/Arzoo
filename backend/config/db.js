const mysql = require('mysql2/promise');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// FIXED: Variable name is now 'pool' and using 'createPool'
const pool = mysql.createPool({ 
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 18821,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool; // Ab ye properly export ho jayega bina crash hue