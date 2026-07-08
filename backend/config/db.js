const mysql = require('mysql2/promise');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const connection = mysql.createConnection({ // ya createPool
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  // YEH SSL BLOCK ZAROORI HAI AIVEN KE LIYE:
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;