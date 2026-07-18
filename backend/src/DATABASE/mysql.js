const mysql = require('mysql2/promise');
const config = require('../../config/config');

// Pool that queries will actually use
let pool;

const initializeDatabase = async () => {
  if (!config.host || !config.user || !config.db_port || !config.database) {
    console.error('[DB] Missing one or more required config values (host/user/db_port/database). Check your .env / Render environment tab.');
  }

  console.log(`[DB] Connecting -- host: ${config.host}, port: ${config.db_port}, database: ${config.database}`);

  // FIX: pool now includes ssl config -- Aiven requires SSL connections.
  // Without it, connections would hang until Node's TCP timeout, causing
  // ETIMEDOUT on every query.
  pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.db_port,
    database: config.database, // FIX: was a hardcoded DB_NAME that didn't match .env's actual value
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Verify the pool can actually reach the database before the app starts
  // serving requests -- fails fast with a clear error instead of every
  // query timing out silently later.
  try {
    const testConnection = await pool.getConnection();
    console.log('[DB] Connected to MySQL Server successfully.');
    testConnection.release();
  } catch (err) {
    console.error('[DB] Failed to connect to MySQL Server:', err.message);
    throw err;
  }

  // ==========================================
  // One-time table setup -- uncomment if you need to (re)create this table.
  // ==========================================
  // const createTableQuery = `
  //   CREATE TABLE IF NOT EXISTS sarees_detailed (
  //       id INT PRIMARY KEY,
  //       title VARCHAR(255),
  //       price INT,
  //       thumbnail VARCHAR(255),
  //       primary_color VARCHAR(100),
  //       other_color VARCHAR(100),
  //       border_type VARCHAR(100),
  //       pattern VARCHAR(100),
  //       craft VARCHAR(100),
  //       weave VARCHAR(100),
  //       zari_type VARCHAR(100),
  //       blouse VARCHAR(100),
  //       border_motifs VARCHAR(100),
  //       origin VARCHAR(100),
  //       fabric_material VARCHAR(100),
  //       khats VARCHAR(100),
  //       product_weight VARCHAR(50),
  //       blouse_length VARCHAR(50),
  //       saree_length VARCHAR(50),
  //       saree_width VARCHAR(50)
  //   )
  // `;
  // await pool.query(createTableQuery);
  // console.log("[DB] Table 'sarees_detailed' is ready.");
};

// Run setup immediately when this file is first required
const dbReadyPromise = initializeDatabase().catch((err) => {
  console.error('[DB] Database initialization failed:', err.stack);
  process.exit(1);
});

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
  getConnection: async () => {
    await dbReadyPromise;
    return pool.getConnection();
  }
};