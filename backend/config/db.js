const mysql = require('mysql2/promise');

// Load environment variables strictly in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.log('[DATABASE] Non-production environment detected. Loading .env file...');
  require('dotenv').config();
}

// Define required environment variables (excluding db_port since you have a fallback)
const requiredEnvVars = [
  'host',
  'user',
  'password',
  'database'
];

console.log('[DATABASE] Validating database environment variables...');

// Loop through to ensure no required variables are missing
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    const errorMessage = `Missing required environment variable for database connection: ${envVar}`;
    console.error(`[DATABASE ERROR] ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

console.log('[DATABASE] All required variables are present. Initializing connection pool...');

// Create the connection pool using the exact variable names
const pool = mysql.createPool({ 
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  port: process.env.db_port || 3306,
  // Aiven requires this SSL block
  ssl: {
    rejectUnauthorized: false
  },
  // Upgraded: Added standard pool performance settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('[DATABASE] MySQL connection pool successfully created.');

module.exports = pool;