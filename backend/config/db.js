const mysql = require('mysql2/promise');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Using the exact variable names from your Render dashboard (e.g., process.env.host)
const pool = mysql.createPool({ 
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  port: process.env.port || 18821,
  // Aiven requires this SSL block
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;