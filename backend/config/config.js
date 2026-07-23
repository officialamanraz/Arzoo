// Load environment variables strictly in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.log('[CONFIG] Non-production environment detected. Loading .env file...');
  require('dotenv').config();
}

// Define all required environment variables in a single array
const requiredEnvVars = [
  'host',
  'user',
  'password',
  'port',
  'database',
  'JWT_SECRET',
  'db_port'
];

console.log('[CONFIG] Validating environment variables...');

// Loop through the array to ensure no required variables are missing
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    const errorMessage = `Missing required environment variable: ${envVar}`;
    console.error(`[CONFIG ERROR] ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

console.log('[CONFIG] All required environment variables are present.');

// Construct the configuration object
const configdb = {
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  port: process.env.port,
  db_port: process.env.db_port,
  database: process.env.database,
};

console.log('[CONFIG] Database configuration object successfully created.');

module.exports = configdb;