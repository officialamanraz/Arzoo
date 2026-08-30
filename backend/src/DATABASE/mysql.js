const mysql = require('mysql2/promise');

// ==========================================
// 1. ENVIRONMENT SETUP & VALIDATION
// ==========================================
if (process.env.NODE_ENV !== 'production') {
  console.log('[DB] Non-production environment detected. Loading .env file...');
  require('dotenv').config();
}

const requiredEnvVars = ['host', 'user', 'password', 'database'];
console.log('[DB] Validating database environment variables...');

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[DB ERROR] Missing required environment variable: ${envVar}`);
    process.exit(1); 
  }
}

// ==========================================
// 2. AUTOMATIC TABLE CREATION LOGIC
// ==========================================
const setupDatabaseTables = async (pool) => {
  console.log('[DB] Checking and creating missing tables in exact hierarchy...');

  // LEVEL 1: Independent Tables (Bina kisi dusri table par depend hue)
  const level1Queries = [
    `CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(255),
      address VARCHAR(255),
      role ENUM('admin', 'customer') DEFAULT 'customer',
      reset_token VARCHAR(255),
      reset_token_expiry DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      category_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255),
      parent_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS banners (
      banner_id INT AUTO_INCREMENT PRIMARY KEY,
      image_url VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      subtitle VARCHAR(255),
      button_text VARCHAR(255),
      button_link VARCHAR(255),
      display_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS shipping_zones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      state_name VARCHAR(255) UNIQUE NOT NULL,
      min_days INT,
      max_days INT
    )`,
    `CREATE TABLE IF NOT EXISTS webhook_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sarees_detailed (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      price DECIMAL(10,2),
      thumbnail VARCHAR(255),
      primary_color VARCHAR(255),
      other_color VARCHAR(255),
      border_type VARCHAR(255),
      pattern VARCHAR(255),
      craft VARCHAR(255),
      weave VARCHAR(255),
      zari_type VARCHAR(255),
      blouse VARCHAR(255),
      border_motifs VARCHAR(255),
      origin VARCHAR(255),
      fabric_material VARCHAR(255),
      khats VARCHAR(255),
      product_weight VARCHAR(255),
      blouse_length VARCHAR(255),
      saree_length VARCHAR(255),
      saree_width VARCHAR(255)
    )`,
    // NEW TABLE IN LEVEL 1
    `CREATE TABLE IF NOT EXISTS dealers (
      dealer_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20) NOT NULL,
      razorpay_linked_account_id VARCHAR(100) DEFAULT NULL,
      commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
      status ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  // LEVEL 2: Tables depending on users and categories
  const level2Queries = [
    `CREATE TABLE IF NOT EXISTS subcategories (
      subcategory_id INT AUTO_INCREMENT PRIMARY KEY,
      subcategory_name VARCHAR(255) NOT NULL,
      category_id INT NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS addresses (
      address_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      full_name VARCHAR(255),
      phone VARCHAR(255),
      alternate_phone VARCHAR(255),
      pincode VARCHAR(255),
      state VARCHAR(255),
      city VARCHAR(255),
      house_no VARCHAR(255),
      road_area VARCHAR(255),
      landmark VARCHAR(255),
      is_default TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )`
  ];

  // LEVEL 3: Main Product Table
  const level3Queries = [
    `CREATE TABLE IF NOT EXISTS products (
      product_id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      subcategory_id INT,
      dealer_id INT NULL DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock_qty INT DEFAULT 0,
      image_url VARCHAR(255),
      is_active TINYINT(1) DEFAULT 1,
      base_color VARCHAR(255),
      primary_color VARCHAR(255),
      other_color VARCHAR(255),
      border_type VARCHAR(255),
      pattern VARCHAR(255),
      craft VARCHAR(255),
      weave VARCHAR(255),
      zari_type VARCHAR(255),
      blouse VARCHAR(255),
      border_motifs VARCHAR(255),
      origin VARCHAR(255),
      fabric VARCHAR(255),
      khats INT,
      weight VARCHAR(255),
      blouse_length VARCHAR(255),
      producer VARCHAR(255),
      maker VARCHAR(255),
      hsn_code VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(category_id),
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(subcategory_id),
      FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE SET NULL
    )`
  ];

  // LEVEL 4: Tables depending on products, addresses, and users
  const level4Queries = [
    `CREATE TABLE IF NOT EXISTS product_images (
      image_id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS cart (
      cart_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
      review_id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT NOT NULL,
      rating_type ENUM('1','2','3','4','5'),
      comment TEXT,
      image_url VARCHAR(255),
      is_verified_buyer TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      order_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      address_id INT NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'pending',
      payment_id VARCHAR(255),
      payment_method ENUM('cod', 'online') DEFAULT 'online',
      payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
      shipping_address TEXT,
      customer_email VARCHAR(255),
      estimated_delivery DATE,
      subtotal DECIMAL(10, 2),
      invoice_number VARCHAR(255),
      razorpay_order_id VARCHAR(255),
      tracking_ref VARCHAR(255),
      ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (address_id) REFERENCES addresses(address_id)
    )`
  ];

  // LEVEL 5: Tables depending on orders (and dealers)
  const level5Queries = [
    `CREATE TABLE IF NOT EXISTS orderitems (
      item_id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      product_name VARCHAR(255),
      product_sku VARCHAR(255),
      item_status ENUM('pending', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'pending',
      discount DECIMAL(10, 2) DEFAULT 0.00,
      hsn_code VARCHAR(255),
      FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    )`,
    `CREATE TABLE IF NOT EXISTS order_status_history (
      history_id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      note VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS order_tracking (
      tracking_id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      status VARCHAR(255) DEFAULT 'dispatched',
      status_message VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
    )`,
    // NEW TABLE IN LEVEL 5
    `CREATE TABLE IF NOT EXISTS dealer_transfers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transfer_id VARCHAR(100) UNIQUE NOT NULL, 
      dealer_id INT NOT NULL,
      order_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
    )`
  ];

  try {
    for (let query of level1Queries) await pool.query(query);
    for (let query of level2Queries) await pool.query(query);
    for (let query of level3Queries) await pool.query(query);
    for (let query of level4Queries) await pool.query(query);
    for (let query of level5Queries) await pool.query(query);
    
    console.log('[DB] All 19 precise tables updated & verified successfully (including Dealer system)!');
  } catch (error) {
    console.error('[DB ERROR] Failed to create tables:', error.message);
    throw error;
  }
};

// ==========================================
// 3. DATABASE POOL & RETRY LOGIC
// ==========================================
let pool;

const initializeDatabase = async (retries = 5, delayMs = 3000) => {
  console.log(`[DB] Connecting to database: ${process.env.database} at ${process.env.host}`);

  pool = mysql.createPool({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    port: process.env.db_port || 3306,
    ssl: { rejectUnauthorized: false }, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000 
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const testConnection = await pool.getConnection();
      console.log('[DB] Connected to MySQL Server successfully.');
      testConnection.release();
      
      // Call setup to automatically check and build missing structures
      await setupDatabaseTables(pool);
      return; 
    } catch (err) {
      console.error(`[DB] Connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) {
        throw err; 
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

// ==========================================
// 4. SMART PROMISE WRAPPER
// ==========================================
const dbReadyPromise = initializeDatabase().catch((err) => {
  console.error('[DB] Database initialization completely failed:', err.message);
  process.exit(1);
});

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