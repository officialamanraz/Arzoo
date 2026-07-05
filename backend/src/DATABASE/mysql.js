const mysql = require('mysql2/promise');
const config = require('../../config/config');

// Pool that queries will actually use (created after DB is ensured to exist)
let pool;

const DB_NAME = 'shoping_website_database';

const initializeDatabase = async () => {
  // Step 1: Connect without selecting a database, so we can CREATE DATABASE IF NOT EXISTS
  const connection = await mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
  });

  console.log('Connected to MySQL Server.');

  // Step 2: Create database if it doesn't exist
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);

  // Step 3: Switch to that database
  await connection.changeUser({ database: DB_NAME });
  console.log(`Using database: ${DB_NAME}`);

  // Step 4: Create table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS sarees_detailed (
        id INT PRIMARY KEY,
        title VARCHAR(255),
        price INT,
        thumbnail VARCHAR(255),
        primary_color VARCHAR(100),
        other_color VARCHAR(100),
        border_type VARCHAR(100),
        pattern VARCHAR(100),
        craft VARCHAR(100),
        weave VARCHAR(100),
        zari_type VARCHAR(100),
        blouse VARCHAR(100),
        border_motifs VARCHAR(100),
        origin VARCHAR(100),
        fabric_material VARCHAR(100),
        khats VARCHAR(100),
        product_weight VARCHAR(50),
        blouse_length VARCHAR(50),
        saree_length VARCHAR(50),
        saree_width VARCHAR(50)
    )
  `;

  await connection.query(createTableQuery);
  console.log("Table 'sarees_detailed' is successfully created and ready!");

  // Step 5: Close this one-off setup connection
  await connection.end();

  // Step 6: NOW create the actual connection pool that the rest of the app will use for all queries
  pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
};

// Run setup immediately when this file is first required
const dbReadyPromise = initializeDatabase().catch((err) => {
  console.error('Database initialization failed: ' + err.stack);
  process.exit(1);
});

// Export an object with the same `.execute` / `.query` interface as a pool,
// but every call waits for initialization to finish first.
// Export an object with the same `.execute` / `.query` interface as a pool,
// but every call waits for initialization to finish first.
module.exports = {
  execute: async (...args) => {
    await dbReadyPromise;
    return pool.execute(...args);
  },
  query: async (...args) => {
    await dbReadyPromise;
    return pool.query(...args);
  },
  // ✅ NEW: needed for transactions (beginTransaction/commit/rollback/release)
  getConnection: async () => {
    await dbReadyPromise;
    return pool.getConnection();
  }
};