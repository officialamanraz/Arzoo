const mysql = require('mysql2/promise');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const pool = mysql.createPool({ 
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 18821,
  ssl: {
    rejectUnauthorized: false
  },
  // This tells MySQL to wait up to 10 seconds before giving up
  connectTimeout: 10000 
});

// Professional Startup Check using Promises
pool.getConnection()
  .then(conn => {
    console.log("✅ SUCCESS: Connected to Aiven Database!");
    conn.release();
  })
  .catch(err => {
    console.error("❌ CRITICAL ERROR: Could not connect to Database.");
    console.error("Check your DB_HOST, DB_USER, and DB_PASSWORD in Render!");
    console.error("Exact Error:", err.message);
  });

module.exports = pool;