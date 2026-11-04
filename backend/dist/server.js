var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/DATABASE/mysql.js
var require_mysql = __commonJS({
  "src/DATABASE/mysql.js"(exports2, module2) {
    var mysql = require("mysql2/promise");
    if (process.env.NODE_ENV !== "production") {
      console.log("[DB] Non-production environment detected. Loading .env file...");
      require("dotenv").config();
    }
    var requiredEnvVars = ["host", "user", "password", "database"];
    console.log("[DB] Validating database environment variables...");
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`[DB ERROR] Missing required environment variable: ${envVar}`);
        process.exit(1);
      }
    }
    var setupDatabaseTables = async (pool2) => {
      console.log("[DB] Checking and creating missing tables in exact hierarchy...");
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
      const level4Queries = [
        `CREATE TABLE IF NOT EXISTS product_images (
      image_id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      is_primary BOOLEAN DEFAULT 0,
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
        for (let query of level1Queries) await pool2.query(query);
        for (let query of level2Queries) await pool2.query(query);
        for (let query of level3Queries) await pool2.query(query);
        for (let query of level4Queries) await pool2.query(query);
        for (let query of level5Queries) await pool2.query(query);
        console.log("[DB] All 19 precise tables updated & verified successfully (including Dealer system)!");
      } catch (error) {
        console.error("[DB ERROR] Failed to create tables:", error.message);
        throw error;
      }
    };
    var pool;
    var initializeDatabase = async (retries = 5, delayMs = 3e3) => {
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
        connectTimeout: 2e4
      });
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const testConnection = await pool.getConnection();
          console.log("[DB] Connected to MySQL Server successfully.");
          testConnection.release();
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
    var dbReadyPromise = initializeDatabase().catch((err) => {
      console.error("[DB] Database initialization completely failed:", err.message);
      process.exit(1);
    });
    module2.exports = {
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
  }
});

// src/services/webhookService.js
var require_webhookService = __commonJS({
  "src/services/webhookService.js"(exports2, module2) {
    var db2 = require_mysql();
    var processWebhookEventInDB = async (event) => {
      const eventId = event.event + "_" + event.payload.payment.entity.id;
      console.log(`[WEBHOOK-SERVICE] \u{1F4E5} Incoming webhook event received: ${event.event} (Event ID: ${eventId})`);
      try {
        const [existing] = await db2.execute(
          "SELECT id FROM webhook_events WHERE event_id = ?",
          [eventId]
        );
        if (existing.length > 0) {
          console.warn(`[WEBHOOK-SERVICE] \u26A0\uFE0F Webhook event ${eventId} already processed. Ignoring.`);
          return { status: "ignored", message: "Already processed" };
        }
        const razorpayOrderId = event.payload.payment.entity.order_id;
        const razorpayPaymentId = event.payload.payment.entity.id;
        console.log(`[WEBHOOK-SERVICE] \u{1F50D} Processing for Razorpay Order ID: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}`);
        let orderData = null;
        let action = null;
        if (event.event === "payment.captured") {
          console.log(`[WEBHOOK-SERVICE] \u{1F4B0} Payment captured successfully. Updating order status...`);
          await db2.execute(
            'UPDATE orders SET payment_status = "paid", status = "processing", payment_id = ? WHERE razorpay_order_id = ?',
            [razorpayPaymentId, razorpayOrderId]
          );
          const [orderRows] = await db2.execute(
            "SELECT * FROM orders WHERE razorpay_order_id = ?",
            [razorpayOrderId]
          );
          if (orderRows.length === 0) {
            console.error(`[WEBHOOK-SERVICE] \u274C Order not found for Razorpay Order ID: ${razorpayOrderId}`);
            throw new Error("ORDER_NOT_FOUND_FOR_WEBHOOK");
          }
          orderData = orderRows[0];
          const realOrderId = orderData.order_id;
          console.log(`[WEBHOOK-SERVICE] \u2705 Internal Order ID: ${realOrderId} marked as PAID & PROCESSING.`);
          console.log(`[WEBHOOK-SERVICE] \u{1F504} Fetching locked dealer payouts for Order ID: ${realOrderId}...`);
          const [dealerItems] = await db2.execute(
            `SELECT p.dealer_id, oi.locked_dealer_payout, d.razorpay_linked_account_id 
                 FROM orderitems oi
                 INNER JOIN products p ON oi.product_id = p.product_id
                 LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
                 WHERE oi.order_id = ? AND p.dealer_id IS NOT NULL`,
            [realOrderId]
          );
          if (dealerItems.length > 0) {
            const dealerTotals = {};
            dealerItems.forEach((item) => {
              const dId = item.dealer_id;
              const payoutAmount = Number(item.locked_dealer_payout);
              if (!dealerTotals[dId]) dealerTotals[dId] = 0;
              dealerTotals[dId] += payoutAmount;
            });
            for (const dId in dealerTotals) {
              const amount = dealerTotals[dId];
              const mockTransferId = `TRF_${Date.now()}_${dId}`;
              console.log(`[WEBHOOK-SERVICE] \u{1F4B8} Recording transfer for Dealer ID: ${dId} | Amount: \u20B9${amount}`);
              await db2.execute(
                `INSERT INTO dealer_transfers (transfer_id, dealer_id, order_id, amount, status) 
                         VALUES (?, ?, ?, ?, 'processed')`,
                [mockTransferId, dId, realOrderId, amount]
              );
              console.log(`[WEBHOOK-SERVICE] \u2705 Dealer ${dId} transfer recorded successfully (Transfer ID: ${mockTransferId})`);
            }
          } else {
            console.log(`[WEBHOOK-SERVICE] \u2139\uFE0F No dealers attached to items in Order ID: ${realOrderId}. All revenue stays with Admin.`);
          }
          action = "captured";
        } else if (event.event === "payment.failed") {
          console.warn(`[WEBHOOK-SERVICE] \u274C Payment failed for Razorpay Order ID: ${razorpayOrderId}`);
          await db2.execute(
            "UPDATE orders SET payment_status = 'unpaid', status = 'cancelled' WHERE razorpay_order_id = ?",
            [razorpayOrderId]
          );
          const [orderRows] = await db2.execute(
            "SELECT * FROM orders WHERE razorpay_order_id = ?",
            [razorpayOrderId]
          );
          orderData = orderRows[0];
          action = "failed";
          console.log(`[WEBHOOK-SERVICE] \u{1F6AB} Order status updated to 'cancelled' due to payment failure.`);
        } else {
          console.log(`[WEBHOOK-SERVICE] \u2139\uFE0F Unhandled webhook event type: ${event.event}`);
          action = "ignored_event";
        }
        console.log(`[WEBHOOK-SERVICE] \u{1F4DD} Storing event ID in webhook_events table: ${eventId}`);
        await db2.execute("INSERT INTO webhook_events (event_id) VALUES (?)", [eventId]);
        console.log(`[WEBHOOK-SERVICE] \u{1F389} Webhook processed successfully for event action: ${action}`);
        return { status: "processed", action, orderData, razorpayOrderId };
      } catch (err) {
        console.error(`[WEBHOOK-SERVICE] \u274C Error processing webhook event:`, err.message);
        throw err;
      }
    };
    var processCourierWebhook = async (awbNumber, newStatus, statusMessage) => {
      if (!awbNumber || !newStatus) {
        throw new Error("AWB Number and Status are required");
      }
      try {
        const [orderRow] = await db2.execute(
          "SELECT order_id, status FROM orders WHERE tracking_awb_number = ?",
          [awbNumber]
        );
        if (!orderRow || orderRow.length === 0) {
          throw new Error("Order not found for this AWB");
        }
        const { order_id, status } = orderRow[0];
        if (status === newStatus) {
          return {
            success: true,
            message: "Status is already up to date"
          };
        }
        await db2.execute(
          "UPDATE orders SET status = ? WHERE tracking_awb_number = ?",
          [newStatus, awbNumber]
        );
        await db2.execute(
          "INSERT INTO order_tracking (order_id, status, status_message) VALUES (?, ?, ?)",
          [order_id, newStatus, statusMessage || `Status updated by courier to ${newStatus}`]
        );
        return {
          success: true,
          orderId: order_id,
          status: newStatus,
          message: "Order and tracking history updated successfully"
        };
      } catch (err) {
        throw err;
      }
    };
    module2.exports = { processWebhookEventInDB, processCourierWebhook };
  }
});

// src/controllers/webhook.js
var require_webhook = __commonJS({
  "src/controllers/webhook.js"(exports2, module2) {
    var crypto = require("crypto");
    var { processWebhookEventInDB, processCourierWebhook } = require_webhookService();
    var razorpayWebhook2 = async (req, res) => {
      console.log("[WEBHOOK_CONTROLLER] \u{1F514} Incoming webhook request intercepted from Razorpay.");
      try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];
        console.log("[WEBHOOK_CONTROLLER] \u{1F510} Validating webhook cryptographic signature...");
        const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(req.rawbody).digest("hex");
        if (expectedSignature !== signature) {
          console.warn("[WEBHOOK_CONTROLLER] \u274C SECURITY ALERT: Invalid signature detected! Request rejected.");
          return res.status(400).json({ success: false, message: "Invalid signature" });
        }
        console.log("[WEBHOOK_CONTROLLER] \u2705 Signature verified successfully. Request is authentic.");
        const event = req.body;
        console.log(`[WEBHOOK_CONTROLLER] \u{1F4E6} Event type received: ${event.event}`);
        const result = await processWebhookEventInDB(event);
        if (result.status === "ignored") {
          console.log(`[WEBHOOK_CONTROLLER] \u2139\uFE0F Webhook action ignored: ${result.message}`);
          return res.status(200).json({ success: true, message: result.message });
        }
        const io2 = req.app.get("io");
        if (io2) {
          console.log("[WEBHOOK_CONTROLLER] \u26A1 Socket.io instance found. Preparing real-time broadcast...");
        } else {
          console.warn("[WEBHOOK_CONTROLLER] \u26A0\uFE0F Socket.io instance not found on app object.");
        }
        if (result.action === "captured") {
          console.log(`[WEBHOOK_CONTROLLER] \u{1F680} Broadcasting 'order_updated' (Paid/Processing) for Razorpay Order: ${result.razorpayOrderId}`);
          if (io2) io2.emit("order_updated", { order: result.orderData });
        } else if (result.action === "failed") {
          console.log(`[WEBHOOK_CONTROLLER] \u{1F6AB} Broadcasting 'order_updated' (Cancelled/Unpaid) for Razorpay Order: ${result.razorpayOrderId}`);
          if (io2) io2.emit("order_updated", { order: result.orderData });
        }
        console.log("[WEBHOOK_CONTROLLER] \u2705 Webhook processed completely. Sending 200 OK to Razorpay.");
        return res.status(200).json({ success: true });
      } catch (err) {
        console.error("[WEBHOOK_CONTROLLER] \u274C Critical Controller Error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    };
    var courierWebhookController = async (req, res) => {
      try {
        const providedSecret = req.headers["x-webhook-secret"] || req.headers["authorization"];
        const expectedSecret = process.env.COURIER_WEBHOOK_SECRET;
        if (!providedSecret || providedSecret !== expectedSecret) {
          console.error(`[CONTROLLER] \u{1F6A8} Unauthorized Webhook Attempt! Fake or Missing Key.`);
          return res.status(401).json({ success: false, message: "Unauthorized request" });
        }
        const awbNumber = req.body.awb || req.body.awb_number;
        const newStatus = req.body.current_status || req.body.status;
        const statusMessage = req.body.status_message || req.body.message || "";
        if (!awbNumber || !newStatus) {
          console.warn(`[CONTROLLER] \u26A0\uFE0F Invalid Webhook Payload: Missing AWB or Status`);
          return res.status(400).json({ success: false, message: "Invalid payload" });
        }
        console.log(`[CONTROLLER] \u{1F69A} Webhook Triggered for AWB: ${awbNumber} | Status: ${newStatus}`);
        await processCourierWebhook(awbNumber, newStatus, statusMessage);
        return res.status(200).json({ success: true, message: "Webhook processed successfully" });
      } catch (error) {
        console.error("[CONTROLLER] \u274C Error processing webhook:", error.message);
        if (error.message === "ORDER_NOT_FOUND_FOR_AWB") {
          return res.status(404).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    };
    module2.exports = { razorpayWebhook: razorpayWebhook2, courierWebhookController };
  }
});

// src/middleware/authmiddleware.js
var require_authmiddleware = __commonJS({
  "src/middleware/authmiddleware.js"(exports2, module2) {
    var jwt = require("jsonwebtoken");
    if (!process.env.JWT_SECRET) {
      const errorMessage = "Missing JWT_SECRET environment variable -- all token verification will fail.";
      console.error(`[AUTH-MW ERROR] ${errorMessage}`);
      throw new Error(errorMessage);
    }
    var extractToken = (authHeader) => {
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
      }
      const token = authHeader.split(" ")[1];
      if (!token || token === "null" || token === "undefined") {
        return null;
      }
      return token;
    };
    var handleJwtError = (err, res, path2) => {
      console.error(`[AUTH-MW ERROR] ${err.name} on ${path2}: ${err.message}`);
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again."
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid or malformed token."
      });
    };
    var verifyToken = (req, res, next) => {
      const token = extractToken(req.headers["authorization"]);
      if (!token) {
        console.warn(`[AUTH-MW] verifyToken -- no valid token on ${req.method} ${req.originalUrl}`);
        return res.status(401).json({
          success: false,
          message: "Authentication required. No valid token provided."
        });
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(`[AUTH-MW] verifyToken success -- user_id: ${decoded.id}, role: ${decoded.role}, ${req.method} ${req.originalUrl}`);
        next();
      } catch (err) {
        return handleJwtError(err, res, req.originalUrl);
      }
    };
    var verifyAdmin = (req, res, next) => {
      if (!req.user) {
        console.error(`[AUTH-MW ERROR] verifyAdmin failed -- req.user is missing. Did you forget to chain verifyToken before verifyAdmin on ${req.method} ${req.originalUrl}?`);
        return res.status(401).json({
          success: false,
          message: "Authentication required. No valid session found."
        });
      }
      if (req.user.role !== "admin") {
        console.warn(`[AUTH-MW] verifyAdmin -- forbidden, user_id: ${req.user.id}, role: ${req.user.role}, ${req.method} ${req.originalUrl}`);
        return res.status(403).json({
          success: false,
          message: "Forbidden. Admin privileges required."
        });
      }
      console.log(`[AUTH-MW] verifyAdmin success -- user_id: ${req.user.id}, ${req.method} ${req.originalUrl}`);
      next();
    };
    module2.exports = { verifyToken, verifyAdmin };
  }
});

// src/utils/imageUtils.js
var require_imageUtils = __commonJS({
  "src/utils/imageUtils.js"(exports2, module2) {
    var getFullImageUrl = (imageName) => {
      const DEFAULT_IMAGE = "/saare_1.jpeg";
      if (!imageName || imageName === "null" || imageName === "undefined" || String(imageName).includes("undefined")) {
        return DEFAULT_IMAGE;
      }
      const imgStr = String(imageName);
      if (imgStr.startsWith("http://") || imgStr.startsWith("https://")) {
        return imgStr;
      }
      const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
      if (!endpoint) {
        return `/${imgStr}`;
      }
      const cleanEndpoint = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
      const cleanImageName = imgStr.startsWith("/") ? imgStr.substring(1) : imgStr;
      if (!cleanImageName.includes("arzoo-saree/uploads/")) {
        return `${cleanEndpoint}/arzoo-saree/uploads/${cleanImageName}`;
      }
      return `${cleanEndpoint}/${cleanImageName}`;
    };
    module2.exports = { getFullImageUrl };
  }
});

// src/services/authservice.js
var require_authservice = __commonJS({
  "src/services/authservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var bcrypt = require("bcrypt");
    var { getFullImageUrl } = require_imageUtils();
    var BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    var DuplicateEmailError = class extends Error {
      constructor(email) {
        super(`Email already exists: ${email}`);
        this.name = "DuplicateEmailError";
      }
    };
    var registerUserService = async ({ name, email, password, phone, fullFormattedAddress, profile_image }) => {
      console.log(`[AUTH-SERVICE] Checking if email already exists: ${email}`);
      const [existingUsers] = await db2.execute(
        "SELECT user_id FROM users WHERE email = ?",
        [email]
      );
      if (existingUsers.length > 0) {
        console.warn(`[AUTH-SERVICE] Registration failed -- email already exists: ${email}`);
        throw new DuplicateEmailError(email);
      }
      const finalImageUrl = profile_image || null;
      const hashedPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
      const [insertResult] = await db2.execute(
        "INSERT INTO users (name, email, password_hash, phone, address, role, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, email, hashedPassword, phone, fullFormattedAddress, "user", finalImageUrl]
      );
      console.log(`[AUTH-SERVICE] User successfully registered -- user_id: ${insertResult.insertId}`);
      return {
        insertId: insertResult.insertId,
        name,
        profile_image: finalImageUrl
      };
    };
    var loginuser = async (email, password) => {
      console.log(`[AUTH-SERVICE] Querying database for login email: ${email}`);
      const [users] = await db2.execute("SELECT * FROM users WHERE email = ?", [email]);
      if (users.length === 0) {
        console.warn(`[AUTH-SERVICE] Login failed \u2014 account not found for ${email}`);
        throw new Error("INVALID_CREDENTIALS");
      }
      const user = users[0];
      if (!user.password_hash) {
        console.error(`[AUTH-SERVICE] Login failed \u2014 user ${user.user_id} has no password_hash configured`);
        throw new Error("NO_PASSWORD_SET");
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        console.warn(`[AUTH-SERVICE] Login failed \u2014 password mismatch for ${email}`);
        throw new Error("INVALID_CREDENTIALS");
      }
      delete user.password_hash;
      console.log(`[AUTH-SERVICE] Authentication passed for user_id: ${user.user_id}`);
      return user;
    };
    var forgotpassword = async ({ email, token, expiry }) => {
      console.log(`[AUTH-SERVICE] Processing forgot password for: ${email}`);
      const [users] = await db2.execute("SELECT user_id FROM users WHERE email = ?", [email]);
      if (users.length === 0) {
        console.log(`[AUTH-SERVICE] Forgot-password \u2014 no account found for ${email} (hidden for security)`);
        return { found: false };
      }
      await db2.execute(
        "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
        [token, expiry, email]
      );
      console.log(`[AUTH-SERVICE] Reset token (OTP) saved securely for ${email}`);
      return { found: true };
    };
    var verifyotp = async (email, otp) => {
      console.log(`[AUTH-SERVICE] Verifying OTP for: ${email}`);
      const [users] = await db2.execute(
        "SELECT user_id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()",
        [email, otp]
      );
      return { found: users.length > 0 };
    };
    var resetpassword = async (email, otp, newPassword) => {
      console.log(`[AUTH-SERVICE] Validating OTP to reset password for: ${email}`);
      const [users] = await db2.execute(
        "SELECT user_id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()",
        [email, otp]
      );
      if (users.length === 0) {
        console.warn("[AUTH-SERVICE] Reset-password failed \u2014 OTP invalid or expired");
        return { found: false };
      }
      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      await db2.execute(
        "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?",
        [hashedPassword, email]
      );
      console.log(`[AUTH-SERVICE] Password reset successful for user_id: ${users[0].user_id}`);
      return { found: true };
    };
    var USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
    var updateProfile = async (userId, updateData, profile_image) => {
      const { name, email, username, phone, currentPassword, newPassword } = updateData;
      console.log(`
[PROFILE-SERVICE] \u{1F50D} Update initiated for User ID: ${userId}`);
      console.log(`[PROFILE-SERVICE] \u{1F4E6} Received updateData:`, { name, email, username, phone, hasPassword: !!newPassword, hasImage: !!profile_image });
      if (username && !USERNAME_REGEX.test(username)) {
        console.warn(`[PROFILE-SERVICE] \u26A0\uFE0F Validation failed: Invalid username format.`);
        throw new Error("Invalid username. Use only letters, numbers, and underscores (3-30 characters).");
      }
      if (email || username) {
        console.log(`[PROFILE-SERVICE] \u{1F50D} Checking uniqueness constraints for email/username...`);
        const checkQuery = `
            SELECT email, username FROM users 
            WHERE (email = ? OR username = ?) AND user_id != ?
        `;
        const [existing] = await db2.execute(checkQuery, [email || "", username || "", userId]);
        if (existing.length > 0) {
          const conflict = existing[0];
          if (conflict.email === email && email) {
            throw new Error("This email is already in use.");
          }
          if (conflict.username === username && username) {
            throw new Error("This username is already taken.");
          }
        }
      }
      let hashedPassword = null;
      if (newPassword) {
        console.log(`[PROFILE-SERVICE] \u{1F512} Password update requested. Verifying current password...`);
        if (!currentPassword) {
          throw new Error("Current password is required to set a new password.");
        }
        const [users] = await db2.execute("SELECT password_hash FROM users WHERE user_id = ?", [userId]);
        if (users.length === 0) throw new Error("User not found.");
        const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isMatch) {
          console.warn(`[PROFILE-SERVICE] \u26A0\uFE0F Verification failed: Incorrect current password.`);
          throw new Error("Incorrect current password.");
        }
        const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
        hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log(`[PROFILE-SERVICE] \u2705 New password successfully hashed.`);
      }
      const updateFields = [];
      const updateValues = [];
      if (name !== void 0 && name !== null) {
        updateFields.push("name = ?");
        updateValues.push(name);
      }
      if (email !== void 0 && email !== null) {
        updateFields.push("email = ?");
        updateValues.push(email);
      }
      if (username !== void 0 && username !== null) {
        updateFields.push("username = ?");
        updateValues.push(username);
      }
      if (phone !== void 0 && phone !== null) {
        updateFields.push("phone = ?");
        updateValues.push(phone);
      }
      if (profile_image !== void 0 && profile_image !== null) {
        updateFields.push("profile_image = ?");
        updateValues.push(profile_image);
      }
      if (hashedPassword !== void 0 && hashedPassword !== null) {
        updateFields.push("password_hash = ?");
        updateValues.push(hashedPassword);
      }
      if (updateFields.length === 0) {
        console.log(`[PROFILE-SERVICE] \u26A0\uFE0F No changes provided. Returning current user profile.`);
        const [user] = await db2.execute(
          "SELECT user_id, name, email, username, phone, profile_image, role FROM users WHERE user_id = ?",
          [userId]
        );
        if (user.length === 0) throw new Error("User not found.");
        return {
          ...user[0],
          profile_image: getFullImageUrl(user[0].profile_image)
        };
      }
      updateValues.push(userId);
      const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE user_id = ?`;
      console.log(`[PROFILE-SERVICE] \u{1F680} Executing dynamic update query:`, updateQuery);
      console.log(`[PROFILE-SERVICE] \u{1F4CC} With bind values:`, updateValues);
      const [result] = await db2.execute(updateQuery, updateValues);
      console.log(`[PROFILE-SERVICE] \u2705 Successfully updated ${result.affectedRows} row(s).`);
      const [updatedUser] = await db2.execute(
        "SELECT user_id, name, email, username, phone, profile_image, role FROM users WHERE user_id = ?",
        [userId]
      );
      if (updatedUser.length === 0) throw new Error("User not found after update.");
      return {
        ...updatedUser[0],
        profile_image: getFullImageUrl(updatedUser[0].profile_image)
      };
    };
    var getUserById = async (userId) => {
      console.log(`[AUTH-SERVICE] Fetching user profile for user_id: ${userId}`);
      const [users] = await db2.execute(
        "SELECT user_id, name, email, username, phone, address, profile_image, role FROM users WHERE user_id = ?",
        [userId]
      );
      if (users.length === 0) {
        console.warn(`[AUTH-SERVICE] User not found for user_id: ${userId}`);
        throw new Error("USER_NOT_FOUND");
      }
      const user = users[0];
      console.log(`[AUTH-SERVICE] User profile fetched successfully for user_id: ${userId}`);
      return {
        ...user,
        profile_image: getFullImageUrl(user.profile_image)
      };
    };
    module2.exports = {
      registerUserService,
      DuplicateEmailError,
      forgotpassword,
      verifyotp,
      resetpassword,
      loginuser,
      updateProfile,
      getUserById
    };
  }
});

// config/imagekit.js
var require_imagekit = __commonJS({
  "config/imagekit.js"(exports2, module2) {
    var ImageKit = require("@imagekit/nodejs");
    require("dotenv").config();
    var imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
    console.log("\u{1F449} [IMAGEKIT] Keys mili kya?", process.env.IMAGEKIT_PUBLIC_KEY ? "HAAN" : "NAHI");
    console.log("[IMAGEKIT] client initialized", process.env.IMAGEKIT_URL_ENDPOINT ? "ok" : "missing");
    module2.exports = imagekit;
  }
});

// src/controllers/auth.js
var require_auth = __commonJS({
  "src/controllers/auth.js"(exports2, module2) {
    var jwt = require("jsonwebtoken");
    var crypto = require("crypto");
    var { BrevoClient } = require("@getbrevo/brevo");
    var {
      registerUserService,
      loginuser,
      forgotpassword,
      verifyotp,
      // 🌟 NAYA: Verify OTP import kiya gaya hai
      resetpassword,
      DuplicateEmailError,
      updateProfile,
      getUserById
    } = require_authservice();
    var imagekit = require_imagekit();
    if (process.env.NODE_ENV !== "production") {
      require("dotenv").config();
    }
    var JWT_SECRET = process.env.JWT_SECRET;
    var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
    var APP_NAME = process.env.APP_NAME || "Arzoo Saree";
    var EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || APP_NAME;
    var EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_USER;
    var MIN_PASSWORD_LENGTH = Number(process.env.MIN_PASSWORD_LENGTH) || 6;
    var RESET_TOKEN_EXPIRY_MINUTES = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES) || 15;
    if (!JWT_SECRET) console.error("[AUTH-CTRL] CRITICAL: Missing JWT_SECRET environment variable.");
    var brevoClient = new BrevoClient({
      apiKey: process.env.BREVO_API_KEY
    });
    var sendEmail = async ({ to, subject, html }) => {
      console.log(`[AUTH-EMAIL] Dispatching transactional email to: ${to} | Subject: "${subject}"`);
      try {
        const response = await brevoClient.transactionalEmails.sendTransacEmail({
          subject,
          htmlContent: html,
          sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM_ADDRESS },
          to: [{ email: to }]
        });
        console.log(`[AUTH-EMAIL] Successfully delivered email to ${to}`);
        return response;
      } catch (error) {
        console.error(`[AUTH-EMAIL] Delivery failure for ${to}:`, error.message);
        throw error;
      }
    };
    var generateToken = (userId, role) => {
      return jwt.sign({ id: userId, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      });
    };
    var registerUser = async (req, res) => {
      try {
        if (!req.body) {
          return res.status(400).json({ success: false, message: "Request body is missing." });
        }
        const { name, email, password, phone, state, city, fullAddress } = req.body;
        console.log(`[AUTH-CTRL] Registration request received for email: ${email}`);
        if (!name || !email || !password) {
          return res.status(400).json({ success: false, message: "Name, email, and password are required." });
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
          return res.status(400).json({
            success: false,
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
          });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const fullFormattedAddress = [fullAddress, city, state].filter(Boolean).join(", ");
        let profile_image = null;
        if (req.file) {
          console.log(`[AUTH-CTRL] Processing profile image upload via ImageKit...`);
          const fileBase64 = req.file.buffer.toString("base64");
          const uploadResponse = await imagekit.files.upload({
            file: fileBase64,
            fileName: `profile_reg_${Date.now()}`,
            folder: "/arzoo-saree/profile-images"
          });
          profile_image = uploadResponse.url;
        }
        const { insertId } = await registerUserService({
          name,
          email: normalizedEmail,
          password,
          phone,
          fullFormattedAddress,
          profile_image
        });
        const token = generateToken(insertId, "user");
        console.log(`[AUTH-CTRL] Registration complete \u2014 assigned token to user_id: ${insertId}`);
        return res.status(201).json({
          success: true,
          message: "Account created successfully!",
          token,
          user: { id: insertId, name, role: "user", profile_image }
        });
      } catch (error) {
        if (error instanceof DuplicateEmailError) {
          return res.status(409).json({ success: false, message: "An account with this email already exists." });
        }
        console.error(`[AUTH-CTRL] Registration exception:`, error.message);
        return res.status(500).json({ success: false, message: "Server error while creating account.", error: error.message });
      }
    };
    var loginUser = async (req, res) => {
      const { email, password } = req.body;
      console.log(`[AUTH-CTRL] Login invocation for email: ${email}`);
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
      }
      const normalizedEmail = email.trim().toLowerCase();
      try {
        const user = await loginuser(normalizedEmail, password);
        const token = generateToken(user.user_id, user.role);
        console.log(`[AUTH-CTRL] Login verified successfully for user_id: ${user.user_id}`);
        return res.status(200).json({
          success: true,
          message: "Login successful!",
          token,
          user: {
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      } catch (error) {
        console.error(`[AUTH-CTRL] Login rejected for ${email}:`, error.message);
        if (error.message === "INVALID_CREDENTIALS") {
          return res.status(401).json({ success: false, message: "Invalid email or password." });
        }
        if (error.message === "NO_PASSWORD_SET") {
          return res.status(500).json({ success: false, message: "Account configuration error. Please reset your password." });
        }
        return res.status(500).json({ success: false, message: "Server error during login.", error: error.message });
      }
    };
    var forgotPassword = async (req, res) => {
      const { email } = req.body;
      console.log(`[AUTH-CTRL] Password recovery triggered for email: ${email}`);
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
      }
      const normalizedEmail = email.trim().toLowerCase();
      try {
        const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
        const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1e3);
        const { found } = await forgotpassword({ email: normalizedEmail, token: otp, expiry });
        if (found) {
          await sendEmail({
            to: normalizedEmail,
            subject: `${APP_NAME} - Password Reset OTP`,
            html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                 <h2>Password Reset Request</h2>
                 <p>Your One-Time Password (OTP) to reset your password is:</p>
                 <h1 style="font-size: 32px; letter-spacing: 4px; color: #7d1638; background: #fdf5eb; padding: 10px; border-radius: 5px; display: inline-block;">${otp}</h1>
                 <p>This OTP is valid for ${RESET_TOKEN_EXPIRY_MINUTES} minutes.</p>
                 <p>If you didn't request this, please ignore this email.</p>
               </div>`
          });
        }
        return res.status(200).json({ success: true, message: "If that email exists, an OTP has been sent." });
      } catch (error) {
        console.error(`[AUTH-CTRL] Forgot password exception for ${email}:`, error.message);
        return res.status(500).json({ success: false, message: "Server error.", error: error.message });
      }
    };
    var resetPassword = async (req, res) => {
      const { email, otp, newPassword, action } = req.body;
      console.log(`[AUTH-CTRL] Password reset sequence started for: ${email}, action: ${action}`);
      if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email and OTP are required." });
      }
      const normalizedEmail = email.trim().toLowerCase();
      try {
        if (action === "verify") {
          const { found } = await verifyotp(normalizedEmail, otp.trim());
          if (!found) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
          }
          return res.status(200).json({ success: true, message: "OTP verified successfully." });
        } else if (action === "reset") {
          if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
          }
          const { found } = await resetpassword(normalizedEmail, otp.trim(), newPassword);
          if (!found) {
            return res.status(404).json({ success: false, message: "Invalid or expired password reset OTP." });
          }
          return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
        }
      } catch (error) {
        console.error("[AUTH-CTRL] Reset password exception:", error.message);
        return res.status(500).json({ success: false, message: "Server error.", error: error.message });
      }
    };
    var updateUserProfile = async (req, res) => {
      try {
        const userId = req.user.user_id || req.user.id;
        if (!userId) {
          console.error("[AUTH-CTRL] Critical: User ID missing from security token payload!");
          return res.status(400).json({ success: false, message: "Invalid authentication token context." });
        }
        console.log(`[AUTH-CTRL] Profile update pipeline triggered for User ID: ${userId}`);
        const updateData = {
          name: req.body.name,
          email: req.body.email,
          username: req.body.username,
          phone: req.body.phone,
          currentPassword: req.body.currentPassword,
          newPassword: req.body.newPassword
        };
        let profile_image = null;
        if (req.file) {
          console.log(`[AUTH-CTRL] Uploading new profile image asset via ImageKit...`);
          const fileBase64 = req.file.buffer.toString("base64");
          const uploadResponse = await imagekit.files.upload({
            file: fileBase64,
            fileName: `profile_${userId}_${Date.now()}`,
            folder: "/arzoo-saree/profile-images"
          });
          profile_image = uploadResponse.url;
        }
        const updatedUser = await updateProfile(userId, updateData, profile_image);
        return res.status(200).json({
          success: true,
          message: "Profile updated successfully.",
          user: updatedUser
        });
      } catch (error) {
        console.error("[AUTH-CTRL] Profile update error:", error.message);
        return res.status(400).json({
          success: false,
          message: error.message || "Failed to update user profile."
        });
      }
    };
    var getUserProfile = async (req, res) => {
      try {
        const userId = req.user?.user_id || req.user?.id || req.user?.userId;
        console.log(`[AUTH-CONTROLLER] \u{1F4E5} Fetching profile for resolved user_id:`, userId);
        if (!userId) {
          console.warn(`[AUTH-CONTROLLER] \u26A0\uFE0F User ID is undefined in token payload:`, req.user);
          return res.status(400).json({ success: false, message: "Invalid token payload: User ID missing" });
        }
        const user = await getUserById(userId);
        console.log(`[AUTH-CONTROLLER] \u{1F4E4} Profile successfully fetched for user_id:`, userId);
        return res.status(200).json({ success: true, user });
      } catch (err) {
        console.error(`[AUTH-CONTROLLER] \u274C Error fetching profile:`, err.message);
        if (err.message === "USER_NOT_FOUND") {
          return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(500).json({ success: false, message: err.message });
      }
    };
    module2.exports = {
      registerUser,
      loginUser,
      forgotPassword,
      resetPassword,
      updateUserProfile,
      getUserProfile
    };
  }
});

// src/router/auth.js
var require_auth2 = __commonJS({
  "src/router/auth.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { verifyToken } = require_authmiddleware();
    var multer2 = require("multer");
    var {
      registerUser,
      loginUser,
      forgotPassword,
      resetPassword,
      getUserProfile,
      updateUserProfile
    } = require_auth();
    var storage = multer2.memoryStorage();
    var upload = multer2({ storage });
    router.post("/forgot-password", (req, res, next) => {
      console.log(`[AUTH-ROUTE] \u{1F4E5} POST /forgot-password hit with body email:`, req.body?.email);
      next();
    }, forgotPassword);
    router.post("/reset-password", (req, res, next) => {
      console.log(`[AUTH-ROUTE] \u{1F4E5} POST /reset-password/:token hit with token:`, req.params.token);
      next();
    }, resetPassword);
    router.post("/register", upload.single("profile_image"), (req, res, next) => {
      console.log(`[AUTH-ROUTE] \u{1F4E5} POST /register hit with email:`, req.body?.email, `| File attached:`, !!req.file);
      next();
    }, registerUser);
    router.post("/login", (req, res, next) => {
      console.log(`[AUTH-ROUTE] \u{1F4E5} POST /login hit with email:`, req.body?.email);
      next();
    }, loginUser);
    router.get("/profile", verifyToken, (req, res, next) => {
      console.log(`[AUTH-ROUTE] \u{1F4E5} GET /profile hit for authenticated user object:`, req.user);
      next();
    }, getUserProfile);
    router.put("/profile", verifyToken, upload.single("profile_image"), (req, res, next) => {
      console.log(`[AUTH-ROUTE] \u{1F4E5} PUT /profile hit with File attached:`, !!req.file);
      next();
    }, updateUserProfile);
    module2.exports = router;
  }
});

// src/services/categoryservice.js
var require_categoryservice = __commonJS({
  "src/services/categoryservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var { getFullImageUrl } = require_imageUtils();
    var generateSlug = (text) => {
      return text.toString().toLowerCase().trim().replace(/[\s\W-]+/g, "-");
    };
    var Addcategoryindb = async (name, slug = null) => {
      try {
        if (!name || typeof name !== "string" || !name.trim()) {
          throw new Error(`[CATEGORY_SERVICE] Invalid category name provided: "${name}"`);
        }
        const categorySlug = slug || generateSlug(name);
        console.log(`[CATEGORY_SERVICE] Inserting category -> Name: "${name.trim()}", Slug: "${categorySlug}"`);
        const [result] = await db2.execute(
          "INSERT INTO categories (name, slug) VALUES (?, ?)",
          [name.trim(), categorySlug]
        );
        console.log(`[CATEGORY_SERVICE] Category saved successfully -> ID: ${result.insertId}`);
        return result;
      } catch (error) {
        console.error("[CATEGORY_SERVICE] Error in Addcategoryindb:", {
          message: error.message,
          code: error.code,
          sqlMessage: error.sqlMessage
        });
        throw error;
      }
    };
    var getcategorybydb = async () => {
      try {
        console.log("[CATEGORY_SERVICE] Fetching all categories...");
        const [rows] = await db2.execute("SELECT * FROM categories");
        console.log(`[CATEGORY_SERVICE] Fetched ${rows.length} category(ies)`);
        return rows;
      } catch (error) {
        console.error("[CATEGORY_SERVICE] Error in getcategorybydb:", {
          message: error.message,
          code: error.code,
          sqlMessage: error.sqlMessage
        });
        throw error;
      }
    };
    var Addsubcategorybydb = async (category_id, subcategory_name) => {
      try {
        const catId = parseInt(category_id, 10);
        if (isNaN(catId) || catId <= 0) {
          throw new Error(`[CATEGORY_SERVICE] Invalid category_id provided: "${category_id}"`);
        }
        if (!subcategory_name || typeof subcategory_name !== "string" || !subcategory_name.trim()) {
          throw new Error(`[CATEGORY_SERVICE] Invalid subcategory_name provided: "${subcategory_name}"`);
        }
        console.log(`[CATEGORY_SERVICE] Inserting subcategory -> category_id: ${catId}, name: "${subcategory_name.trim()}"`);
        const [result] = await db2.execute(
          "INSERT INTO subcategories (category_id, subcategory_name, is_active) VALUES (?, ?, 1)",
          [catId, subcategory_name.trim()]
        );
        console.log(`[CATEGORY_SERVICE] Subcategory added successfully -> subcategory_id: ${result.insertId}, category_id: ${catId}`);
        return result;
      } catch (error) {
        console.error("[CATEGORY_SERVICE] Error in Addsubcategorybydb:", {
          message: error.message,
          code: error.code,
          sqlMessage: error.sqlMessage
        });
        throw error;
      }
    };
    var getProductsBySubcategoryFromDB = async (raw_subcategory_id) => {
      try {
        console.log(`
--- [DEBUG: getProductsBySubcategoryFromDB START] ---`);
        console.log(`[PARAM RECEIVED] raw_subcategory_id:`, raw_subcategory_id, `(type: ${typeof raw_subcategory_id})`);
        const subcategory_id = parseInt(raw_subcategory_id, 10);
        if (isNaN(subcategory_id) || subcategory_id <= 0) {
          console.warn(`[WARNING] Invalid subcategory_id parsed: ${subcategory_id}. Returning empty result.`);
          return {
            subcategory_name: "Products",
            products: []
          };
        }
        console.log(`[SQL 1] Checking subcategory existence for ID: ${subcategory_id}...`);
        const [subcatRows] = await db2.execute(
          "SELECT subcategory_name, category_id, is_active FROM subcategories WHERE subcategory_id = ?",
          [subcategory_id]
        );
        if (subcatRows.length === 0) {
          console.warn(`[WARNING] No subcategory found in DB for subcategory_id = ${subcategory_id}`);
        } else {
          console.log(`[SUBCATEGORY INFO] Found:`, subcatRows[0]);
        }
        const subcategory_name = subcatRows.length > 0 ? subcatRows[0].subcategory_name : "Products";
        console.log(`[SQL 2] Querying products for subcategory_id = ${subcategory_id}...`);
        const [products] = await db2.execute(
          `SELECT * FROM products 
     WHERE subcategory_id = ? 
     OR JSON_CONTAINS(subcategory_ids, CAST(? AS JSON))`,
          [subcategory_id, String(subcategory_id)]
        );
        console.log(`[PRODUCTS FOUND] Count: ${products.length} product(s) matching subcategory_id = ${subcategory_id}`);
        if (products.length > 0) {
          console.log(`[SAMPLE PRODUCT] First item ID: ${products[0].product_id}, Name: "${products[0].name}"`);
        } else {
          console.warn(`[NOTICE] Query returned 0 products. Verify if any row in 'products' has subcategory_id = ${subcategory_id}`);
        }
        const formattedProducts = products.map((product) => {
          const rawUrl = product.image_url || "";
          const processedUrl = typeof getFullImageUrl === "function" ? getFullImageUrl(rawUrl) : rawUrl;
          return {
            ...product,
            image_url: processedUrl
          };
        });
        console.log(`--- [DEBUG: getProductsBySubcategoryFromDB END] ---
`);
        return {
          subcategory_name,
          products: formattedProducts
        };
      } catch (error) {
        console.error("[CATEGORY_SERVICE] Error in getProductsBySubcategoryFromDB:", {
          message: error.message,
          code: error.code,
          sqlMessage: error.sqlMessage
        });
        throw error;
      }
    };
    var getSubcategoriesByCategoryFromDB = async (raw_category_id) => {
      try {
        const category_id = parseInt(raw_category_id, 10);
        console.log(`[CATEGORY_SERVICE] Fetching subcategories for category_id: ${category_id}`);
        if (isNaN(category_id) || category_id <= 0) {
          console.warn(`[WARNING] Invalid category_id: ${raw_category_id}. Returning empty array.`);
          return [];
        }
        const [rows] = await db2.execute(
          "SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1",
          [category_id]
        );
        console.log(`[CATEGORY_SERVICE] Found ${rows.length} active subcategory(ies) for category_id: ${category_id}`);
        return rows;
      } catch (error) {
        console.error("[CATEGORY_SERVICE] Error in getSubcategoriesByCategoryFromDB:", {
          message: error.message,
          code: error.code,
          sqlMessage: error.sqlMessage
        });
        throw error;
      }
    };
    var getCategoryCardsFromDB = async () => {
      try {
        console.log("[CATEGORY_SERVICE] Fetching category cards with representative images...");
        const query = `
            SELECT 
                c.category_id, 
                c.name, 
                c.slug,
                (
                    SELECT p.image_url 
                    FROM products p 
                    WHERE p.category_id = c.category_id AND p.image_url IS NOT NULL 
                    LIMIT 1
                ) AS category_image
            FROM categories c
        `;
        const [rows] = await db2.execute(query);
        console.log(`[CATEGORY_SERVICE] Successfully fetched ${rows.length} category card(s).`);
        return rows.map((cat) => ({
          ...cat,
          category_image: getFullImageUrl(cat.category_image || "/saare_1.jpeg")
        }));
      } catch (error) {
        console.error("[CATEGORY_SERVICE] Error in getCategoryCardsFromDB:", error.message);
        throw error;
      }
    };
    var getProductsByCategoryFromDB = async (raw_category_id, page = 1, limit = 12) => {
      try {
        const category_id = parseInt(raw_category_id, 10);
        if (isNaN(category_id) || category_id <= 0) {
          return { category_name: "Products", products: [], total: 0, totalPages: 0 };
        }
        const [catRows] = await db2.execute("SELECT name FROM categories WHERE category_id = ?", [category_id]);
        const category_name = catRows.length > 0 ? catRows[0].name : "Products";
        const [countRows] = await db2.execute("SELECT COUNT(*) as total FROM products WHERE category_id = ?", [category_id]);
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const query = `SELECT * FROM products WHERE category_id = ? LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
        const [products] = await db2.execute(query, [category_id]);
        const formattedProducts = products.map((product) => ({
          ...product,
          image_url: typeof getFullImageUrl === "function" ? getFullImageUrl(product.image_url || "") : product.image_url || ""
        }));
        return {
          category_name,
          products: formattedProducts,
          total,
          totalPages
          // Frontend ko page button banane me madad karega
        };
      } catch (error) {
        console.error("[CATEGORY_SERVICE] Error in getProductsByCategoryFromDB:", error);
        throw error;
      }
    };
    module2.exports = {
      Addcategoryindb,
      getcategorybydb,
      Addsubcategorybydb,
      getProductsBySubcategoryFromDB,
      getSubcategoriesByCategoryFromDB,
      getCategoryCardsFromDB,
      getProductsByCategoryFromDB
      // 👈 ADDED HERE
    };
  }
});

// src/controllers/category.js
var require_category = __commonJS({
  "src/controllers/category.js"(exports2, module2) {
    var {
      Addcategoryindb,
      getcategorybydb,
      Addsubcategorybydb,
      getProductsBySubcategoryFromDB,
      getSubcategoriesByCategoryFromDB,
      getCategoryCardsFromDB,
      getProductsByCategoryFromDB
    } = require_categoryservice();
    var Addcategory = async (req, res) => {
      console.log("\n--- [CONTROLLER: Addcategory START] ---");
      console.log("[CATEGORY] Request body:", req.body);
      const category_name = req.body?.category_name || req.body?.name;
      const slug = req.body?.slug || null;
      if (!category_name || typeof category_name !== "string" || !category_name.trim()) {
        console.warn("[CATEGORY] Add failed: category_name/name is missing or invalid.");
        return res.status(400).json({
          success: false,
          message: "Category name is required and must be a valid non-empty string."
        });
      }
      try {
        const result = await Addcategoryindb(category_name.trim(), slug);
        console.log(`[CATEGORY] Added successfully -> insertedId: ${result.insertId}`);
        console.log("--- [CONTROLLER: Addcategory END] ---\n");
        return res.status(201).json({
          success: true,
          message: "Category saved successfully.",
          category_id: result.insertId,
          result
        });
      } catch (error) {
        console.error(`[CATEGORY] Add error (name: ${category_name}):`, error);
        return res.status(500).json({
          success: false,
          message: "Failed to save category into the database.",
          error: error.message
        });
      }
    };
    var getcategory = async (req, res) => {
      console.log("\n--- [CONTROLLER: getcategory START] ---");
      try {
        const categoriesData = await getcategorybydb();
        console.log(`[CATEGORY] Successfully fetched ${categoriesData.length} category records.`);
        console.log("--- [CONTROLLER: getcategory END] ---\n");
        return res.status(200).json({
          success: true,
          message: "All categories fetched successfully.",
          total_categories: categoriesData.length,
          categories: categoriesData
        });
      } catch (error) {
        console.error("[CATEGORY] Fetch error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve categories from the database.",
          error: error.message
        });
      }
    };
    var Addsubcategory = async (req, res) => {
      console.log("\n--- [CONTROLLER: Addsubcategory START] ---");
      console.log("[SUBCATEGORY] Request body:", req.body);
      const { category_id, subcategory_name } = req.body || {};
      if (!category_id || !subcategory_name) {
        console.warn("[SUBCATEGORY] Add failed: category_id or subcategory_name is missing.");
        return res.status(400).json({
          success: false,
          message: "Both category_id and subcategory_name are required."
        });
      }
      try {
        const result = await Addsubcategorybydb(category_id, subcategory_name);
        console.log(`[SUBCATEGORY] Subcategory created -> ID: ${result.insertId}`);
        console.log("--- [CONTROLLER: Addsubcategory END] ---\n");
        return res.status(201).json({
          success: true,
          message: "Subcategory added successfully.",
          subcategory_id: result.insertId,
          result
        });
      } catch (error) {
        console.error(`[SUBCATEGORY] Add error (category_id: ${category_id}):`, error);
        return res.status(500).json({
          success: false,
          message: "Failed to add subcategory.",
          error: error.message
        });
      }
    };
    var getProductsBySubcategory = async (req, res) => {
      console.log("\n--- [CONTROLLER: getProductsBySubcategory START] ---");
      console.log("[SUBCATEGORY] Route params:", req.params);
      console.log("[SUBCATEGORY] Query params:", req.query);
      const rawSubcategoryId = req.params?.subcategory_id || req.query?.subcategory_id || req.query?.subcategoryId;
      console.log(`[SUBCATEGORY] Extracted raw subcategory ID: "${rawSubcategoryId}"`);
      if (!rawSubcategoryId || rawSubcategoryId === "undefined" || rawSubcategoryId === "null") {
        console.warn("[SUBCATEGORY] Missing or invalid subcategory identifier.");
        return res.status(400).json({
          success: false,
          message: "A valid subcategory_id parameter or query is required."
        });
      }
      try {
        const { subcategory_name, products } = await getProductsBySubcategoryFromDB(rawSubcategoryId);
        console.log(`[SUBCATEGORY] Done. Returning ${products.length} product(s) for "${subcategory_name}".`);
        console.log("--- [CONTROLLER: getProductsBySubcategory END] ---\n");
        return res.status(200).json({
          success: true,
          subcategory_name,
          total_found: products.length,
          data: products
        });
      } catch (error) {
        console.error(`[SUBCATEGORY] Fetch products error for ID "${rawSubcategoryId}":`, error);
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve products for the requested subcategory.",
          error: error.message
        });
      }
    };
    var getSubcategoriesByCategory = async (req, res) => {
      console.log("\n--- [CONTROLLER: getSubcategoriesByCategory START] ---");
      console.log("[SUBCATEGORY] Route params:", req.params);
      console.log("[SUBCATEGORY] Query params:", req.query);
      const rawCategoryId = req.params?.category_id || req.query?.category_id || req.query?.categoryId;
      if (!rawCategoryId || rawCategoryId === "undefined" || rawCategoryId === "null") {
        console.warn("[SUBCATEGORY] Missing or invalid category identifier.");
        return res.status(400).json({
          success: false,
          message: "A valid category_id parameter or query is required."
        });
      }
      try {
        const rows = await getSubcategoriesByCategoryFromDB(rawCategoryId);
        console.log(`[SUBCATEGORY] Found ${rows.length} subcategories for category ${rawCategoryId}.`);
        console.log("--- [CONTROLLER: getSubcategoriesByCategory END] ---\n");
        return res.status(200).json({
          success: true,
          total_found: rows.length,
          data: rows
        });
      } catch (error) {
        console.error(`[SUBCATEGORY] Fetch subcategories error for category "${rawCategoryId}":`, error);
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve subcategories for the requested category.",
          error: error.message
        });
      }
    };
    var getCategoryCards = async (req, res) => {
      console.log("\n--- [CONTROLLER: getCategoryCards START] ---");
      try {
        const cards = await getCategoryCardsFromDB();
        console.log(`[CATEGORY] Returning ${cards.length} category cards to frontend.`);
        console.log("--- [CONTROLLER: getCategoryCards END] ---\n");
        return res.status(200).json({
          success: true,
          total_found: cards.length,
          data: cards
        });
      } catch (error) {
        console.error("[CATEGORY] Fetch category cards error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve category cards.",
          error: error.message
        });
      }
    };
    var getProductsByCategory = async (req, res) => {
      console.log("\n--- [CONTROLLER: getProductsByCategory START] ---");
      const rawCategoryId = req.params?.category_id || req.query?.category_id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      if (!rawCategoryId || rawCategoryId === "undefined") {
        return res.status(400).json({ success: false, message: "Valid category_id required." });
      }
      try {
        const { category_name, products, total, totalPages } = await getProductsByCategoryFromDB(rawCategoryId, page, limit);
        return res.status(200).json({
          success: true,
          category_name,
          total_found: products.length,
          total,
          // Frontend ko pages count karne ke liye chahiye
          totalPages,
          // Frontend ko pages count karne ke liye chahiye
          data: products
        });
      } catch (error) {
        console.error(`[CATEGORY] Fetch error:`, error);
        return res.status(500).json({ success: false, message: "Failed to retrieve products.", error: error.message });
      }
    };
    module2.exports = {
      Addcategory,
      getcategory,
      Addsubcategory,
      getProductsBySubcategory,
      getSubcategoriesByCategory,
      getCategoryCards,
      getProductsByCategory
      // 👈 ADDED HERE
    };
  }
});

// src/router/category.js
var require_category2 = __commonJS({
  "src/router/category.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var {
      Addcategory,
      getcategory,
      Addsubcategory,
      getProductsBySubcategory,
      getSubcategoriesByCategory,
      getCategoryCards,
      getProductsByCategory
    } = require_category();
    router.use((req, res, next) => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      console.log(`
==================================================`);
      console.log(`[ROUTER TRACE] ${timestamp} | [${req.method}] ${req.originalUrl}`);
      if (req.params && Object.keys(req.params).length > 0) {
        console.log(`\u{1F50D} [PARAMS]:`, req.params);
      }
      if (req.query && Object.keys(req.query).length > 0) {
        console.log(`\u{1F50D} [QUERY]:`, req.query);
      }
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        console.log(`\u{1F4E6} [BODY]:`, req.body);
      }
      console.log(`==================================================`);
      next();
    });
    router.post("/add-category", Addcategory);
    router.get("/", getcategory);
    router.post("/add-subcategory", Addsubcategory);
    router.get("/subcategory-products/:subcategory_id", getProductsBySubcategory);
    router.get("/get-subcategories/:category_id", getSubcategoriesByCategory);
    router.get("/products", getCategoryCards);
    router.get("/:category_id/products", getProductsByCategory);
    module2.exports = router;
  }
});

// src/middleware/uploads.js
var require_uploads = __commonJS({
  "src/middleware/uploads.js"(exports2, module2) {
    var multer2 = require("multer");
    var storage = multer2.memoryStorage();
    var upload = multer2({
      storage,
      limits: {
        fileSize: 150 * 1024 * 1024
        // 150 MB max file size limit (suitable for 4K videos & high-res images)
      }
    });
    module2.exports = upload;
  }
});

// src/services/productservice.js
var require_productservice = __commonJS({
  "src/services/productservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var { getFullImageUrl } = require_imageUtils();
    var formatSubcategoriesForDB = (val) => {
      if (!val) return null;
      if (Array.isArray(val)) {
        const cleanArr = val.map(Number).filter((n) => !isNaN(n) && n > 0);
        return cleanArr.length > 0 ? JSON.stringify(cleanArr) : null;
      }
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            const cleanArr = parsed.map(Number).filter((n) => !isNaN(n) && n > 0);
            return cleanArr.length > 0 ? JSON.stringify(cleanArr) : null;
          }
          if (!isNaN(Number(parsed)) && Number(parsed) > 0) {
            return JSON.stringify([Number(parsed)]);
          }
        } catch (e) {
          const parts = val.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0);
          if (parts.length > 0) return JSON.stringify(parts);
        }
      }
      if (typeof val === "number" && val > 0) {
        return JSON.stringify([val]);
      }
      return null;
    };
    var parseSafeJson = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          return [];
        }
      }
      return [];
    };
    var productsearch = async (keyword, minprice, maxprice) => {
      console.log(`[PRODUCT_SERVICE] Searching products with keyword: "${keyword}", min: ${minprice}, max: ${maxprice}`);
      try {
        const searchvalue = "%" + keyword + "%";
        let sqlquery = `
            SELECT *, 
            IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount 
            FROM products 
            WHERE (name LIKE ? OR description LIKE ?)
        `;
        let queryvalue = [searchvalue, searchvalue];
        if (minprice) {
          sqlquery += " AND price >= ?";
          queryvalue.push(Number(minprice));
        }
        if (maxprice) {
          sqlquery += " AND price <= ?";
          queryvalue.push(Number(maxprice));
        }
        const [result] = await db2.execute(sqlquery, queryvalue);
        console.log(`[PRODUCT_SERVICE] Search found ${result.length} products.`);
        return result.map((product) => ({
          ...product,
          discount_percentage: product.calculated_discount,
          image_url: getFullImageUrl(product.image_url)
        }));
      } catch (err) {
        console.error("[PRODUCT_SERVICE] \u274C Error in productsearch:", err.message);
        console.error("[PRODUCT_SERVICE] Stack:", err.stack);
        throw err;
      }
    };
    var productdelete = async (product_id) => {
      console.log(`[PRODUCT_SERVICE] Deleting product with ID: ${product_id}`);
      try {
        const deleteImagesQuery = "DELETE FROM product_images WHERE product_id = ?";
        await db2.execute(deleteImagesQuery, [product_id]);
        console.log(`[PRODUCT_SERVICE] Associated images deleted for product ID: ${product_id}`);
        const deletequery = "DELETE FROM products WHERE product_id = ?";
        const [result] = await db2.execute(deletequery, [product_id]);
        console.log(`[PRODUCT_SERVICE] \u2705 Product deleted successfully. Affected rows: ${result.affectedRows}`);
        return result;
      } catch (err) {
        console.error(`[PRODUCT_SERVICE] \u274C Error deleting product ID ${product_id}:`, err.message);
        console.error("[PRODUCT_SERVICE] Stack:", err.stack);
        throw err;
      }
    };
    var allproductget = async (minPrice, maxPrice, limit, offset) => {
      console.log(`[PRODUCT_SERVICE] Fetching all products. Limit: ${limit}, Offset: ${offset}, Min: ${minPrice}, Max: ${maxPrice}`);
      try {
        let query = `
            SELECT *, 
            IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount 
            FROM products
        `;
        let queryParams = [];
        if (minPrice !== null && maxPrice !== null && !isNaN(minPrice) && !isNaN(maxPrice)) {
          query += ` WHERE price >= ? AND price <= ?`;
          queryParams.push(minPrice, maxPrice);
        }
        query += ` ORDER BY product_id DESC`;
        query += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
        const [results] = await db2.execute(query, queryParams);
        console.log(`[PRODUCT_SERVICE] \u2705 Fetched ${results.length} products successfully.`);
        return results.map((product) => ({
          ...product,
          product_length: product.product_length || "",
          subcategory_ids: parseSafeJson(product.subcategory_ids),
          discount_percentage: product.calculated_discount,
          image_url: getFullImageUrl(product.image_url)
        }));
      } catch (err) {
        console.error("[PRODUCT_SERVICE] \u274C Error in allproductget:", err.message);
        console.error("[PRODUCT_SERVICE] Stack:", err.stack);
        throw err;
      }
    };
    var productrecomendution = async (product_id, category_id, subcategory_id) => {
      console.log(`[PRODUCT_SERVICE] Fetching recommendations for Product ID: ${product_id}, SubCat: ${subcategory_id}, Cat: ${category_id}`);
      const RECOMMENDATION_LIMIT = 6;
      try {
        if (subcategory_id) {
          const priceQuery = `SELECT price FROM products WHERE product_id = ?`;
          const [priceResult] = await db2.execute(priceQuery, [product_id]);
          const currentPrice = priceResult[0]?.price || 0;
          const query = `
                SELECT product_id, name, price, mrp, image_url, subcategory_id,
                IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount
                FROM products 
                WHERE subcategory_id = ? AND product_id != ? AND stock_qty > 0
                ORDER BY RAND(), ABS(price - ?) ASC
                LIMIT ${RECOMMENDATION_LIMIT}
            `;
          const [results] = await db2.execute(query, [subcategory_id, product_id, currentPrice]);
          console.log(`[PRODUCT_SERVICE] \u2705 Subcategory recommendations found: ${results.length}`);
          return results.map((product) => ({
            ...product,
            discount_percentage: product.calculated_discount,
            image_url: getFullImageUrl(product.image_url)
          }));
        } else {
          const query = `
                SELECT product_id, name, price, mrp, image_url, subcategory_id,
                IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount
                FROM products 
                WHERE category_id = ? AND product_id != ? AND stock_qty > 0
                ORDER BY RAND()
                LIMIT ${RECOMMENDATION_LIMIT}
            `;
          const [results] = await db2.execute(query, [category_id, product_id]);
          console.log(`[PRODUCT_SERVICE] \u2705 Category recommendations found: ${results.length}`);
          return results.map((product) => ({
            ...product,
            discount_percentage: product.calculated_discount,
            image_url: getFullImageUrl(product.image_url)
          }));
        }
      } catch (err) {
        console.error("[PRODUCT_SERVICE] \u274C Error in productrecomendution:", err.message);
        console.error("[PRODUCT_SERVICE] Stack:", err.stack);
        throw err;
      }
    };
    var getproduct = async () => {
      console.log(`[PRODUCT_SERVICE] Fetching all raw products list...`);
      try {
        const query = `
            SELECT *, 
            IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount 
            FROM products
        `;
        const [result] = await db2.execute(query);
        console.log(`[PRODUCT_SERVICE] \u2705 Total raw products fetched: ${result.length}`);
        return result.map((product) => ({
          ...product,
          product_length: product.product_length || "",
          subcategory_ids: parseSafeJson(product.subcategory_ids),
          discount_percentage: product.calculated_discount
        }));
      } catch (err) {
        console.error("[PRODUCT_SERVICE] \u274C Error in getproduct:", err.message);
        console.error("[PRODUCT_SERVICE] Stack:", err.stack);
        throw err;
      }
    };
    var getbyidproduct = async (productId) => {
      console.log(`[PRODUCT_SERVICE] \u{1F50D} Fetching product details for ID: ${productId}`);
      try {
        const productQuery = `
            SELECT 
                p.*,
                COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(JSON_OBJECT('id', s.subcategory_id, 'name', s.subcategory_name))
                        FROM subcategories s
                        WHERE (
                            p.subcategory_ids IS NOT NULL 
                            AND JSON_CONTAINS(p.subcategory_ids, CAST(s.subcategory_id AS JSON))
                        )
                        OR s.subcategory_id = p.subcategory_id
                    ),
                    '[]'
                ) AS subcategory_details,
                IF(p.mrp > p.price, ROUND(((p.mrp - p.price) / p.mrp) * 100), 0) AS calculated_discount 
            FROM products p 
            WHERE p.product_id = ?
            LIMIT 1
        `;
        const [productResults] = await db2.execute(productQuery, [productId]);
        if (productResults.length === 0) {
          console.warn(`[PRODUCT_SERVICE] \u26A0\uFE0F Product not found with ID: ${productId}`);
          return null;
        }
        const product = productResults[0];
        console.log(`[PRODUCT_SERVICE] \u{1F4CC} Found Product Name: "${product.name}", Group ID in DB: "${product.group_id}"`);
        product.discount_percentage = product.calculated_discount;
        product.color_name = product.base_color;
        product.product_length = product.product_length || "";
        product.subcategory_ids = parseSafeJson(product.subcategory_ids);
        product.subcategory_details = parseSafeJson(product.subcategory_details);
        const imagesQuery = `SELECT image_url FROM product_images WHERE product_id = ?`;
        const [imageResults] = await db2.execute(imagesQuery, [productId]);
        const allImages = [];
        if (product.image_url) allImages.push(getFullImageUrl(product.image_url));
        if (imageResults && imageResults.length > 0) {
          imageResults.forEach((img) => allImages.push(getFullImageUrl(img.image_url)));
        }
        product.images = [...new Set(allImages)];
        product.gallery_images = [...new Set(allImages)];
        product.image_url = getFullImageUrl(product.image_url);
        let variantResults = [];
        if (product.group_id !== null && product.group_id !== void 0 && String(product.group_id).trim() !== "") {
          const rawGroupId = product.group_id;
          console.log(`[PRODUCT_SERVICE] \u{1F50D} Executing variants query for group_id: ${rawGroupId} excluding product ID: ${productId}`);
          const variantsQuery = `
                SELECT product_id, base_color AS color_name, image_url, is_active, stock_qty
                FROM products 
                WHERE group_id = ? AND product_id != ?
            `;
          [variantResults] = await db2.execute(variantsQuery, [rawGroupId, productId]);
          console.log(`[PRODUCT_SERVICE] \u2705 Variants query returned ${variantResults.length} row(s).`);
        }
        product.variants = variantResults.filter((v) => v.is_active === 1).map((v) => ({
          product_id: v.product_id,
          color_name: v.color_name || "Variant",
          image_url: getFullImageUrl(v.image_url),
          stock_qty: v.stock_qty
        }));
        return product;
      } catch (err) {
        console.error(`[PRODUCT_SERVICE] \u274C Error in getbyidproduct for ID ${productId}:`, err.message);
        throw err;
      }
    };
    var addProductToDB = async (productData) => {
      console.log(`[PRODUCT_SERVICE] Attempting to add new product: "${productData?.name}"`);
      try {
        const {
          name,
          price,
          description,
          base_color,
          category_id,
          stock_qty,
          is_active = 1,
          mainImage,
          video_url,
          primary_color,
          other_color,
          border_type,
          pattern,
          craft,
          weave,
          zari_type,
          blouse,
          border_motifs,
          origin,
          fabric,
          khats,
          weight,
          blouse_length,
          producer,
          maker,
          extraImagesUrls,
          mrp,
          dealer_base_price,
          packaging_cost,
          is_returnable,
          dealer_id,
          producer_address,
          packer_address,
          group_id,
          product_length,
          subcategory_ids
        } = productData;
        const parsedPrice = Number(price) || 0;
        const parsedMrp = Number(mrp) || 0;
        const computedDiscount = parsedMrp > parsedPrice ? Math.round((parsedMrp - parsedPrice) / parsedMrp * 100) : 0;
        const safeIsReturnable = is_returnable === true || is_returnable === "1" || is_returnable === 1 ? 1 : 0;
        const categoryQuery = "SELECT category_id FROM categories WHERE category_id = ?";
        const [categoryResult] = await db2.execute(categoryQuery, [category_id]);
        if (categoryResult.length === 0) {
          console.warn(`[PRODUCT_SERVICE] \u26A0\uFE0F Category not found with ID: ${category_id}`);
          throw new Error("CATEGORY_NOT_FOUND");
        }
        const duplicateQuery = "SELECT product_id FROM products WHERE name = ? AND category_id = ?";
        const [productResult] = await db2.execute(duplicateQuery, [name, category_id]);
        if (productResult.length > 0) {
          console.warn(`[PRODUCT_SERVICE] \u26A0\uFE0F Duplicate product detected: "${name}" in category ID ${category_id}`);
          throw new Error("DUPLICATE_PRODUCT");
        }
        const subcatJson = formatSubcategoriesForDB(subcategory_ids);
        const insertProductQuery = `
          INSERT INTO products (
            name, price, description, base_color, category_id, stock_qty, is_active, image_url,
            primary_color, other_color, border_type, pattern, craft, weave, zari_type, 
            blouse, border_motifs, origin, fabric, khats, weight, blouse_length, producer, maker,
            mrp, discount_percentage, dealer_base_price, packaging_cost, is_returnable, dealer_id, producer_address, packer_address, group_id, video_url,
            product_length, subcategory_ids
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          name,
          parsedPrice,
          description || null,
          base_color || null,
          Number(category_id) || 0,
          Number(stock_qty) || 10,
          Number(is_active) || 1,
          mainImage || null,
          primary_color || null,
          other_color || null,
          border_type || null,
          pattern || null,
          craft || null,
          weave || null,
          zari_type || null,
          blouse || null,
          border_motifs || null,
          origin || null,
          fabric || null,
          khats || null,
          weight || null,
          blouse_length || null,
          producer || null,
          maker || null,
          parsedMrp ? parsedMrp : null,
          computedDiscount,
          dealer_base_price ? Number(dealer_base_price) : null,
          packaging_cost ? Number(packaging_cost) : null,
          safeIsReturnable,
          dealer_id || null,
          producer_address || null,
          packer_address || null,
          group_id || null,
          video_url || null,
          product_length || null,
          subcatJson
        ];
        const [result] = await db2.execute(insertProductQuery, values);
        const newProductId = result.insertId;
        console.log(`[PRODUCT_SERVICE] \u2705 Main product inserted successfully with ID: ${newProductId}`);
        if (typeof myCache !== "undefined") {
          myCache.del("all_products");
        }
        if (extraImagesUrls && extraImagesUrls.length > 0) {
          console.log(`[PRODUCT_SERVICE] Inserting ${extraImagesUrls.length} extra images for new product ID: ${newProductId}`);
          const insertImagesQuery = `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?`;
          const imageValues = extraImagesUrls.map((url) => [newProductId, url, false]);
          await db2.query(insertImagesQuery, [imageValues]);
          console.log(`[PRODUCT_SERVICE] \u2705 Extra images inserted successfully.`);
        }
        return newProductId;
      } catch (err) {
        console.error(`[PRODUCT_SERVICE] \u274C Error in addProductToDB:`, err.message);
        throw err;
      }
    };
    var updateProductInDB = async (product_id, updateData) => {
      console.log(`[PRODUCT_SERVICE] Attempting to update product ID: ${product_id}`);
      try {
        const checkQuery = "SELECT product_id FROM products WHERE product_id=?";
        const [checkResult] = await db2.execute(checkQuery, [product_id]);
        if (checkResult.length === 0) {
          console.warn(`[PRODUCT_SERVICE] \u26A0\uFE0F Update failed. Product not found with ID: ${product_id}`);
          throw new Error("PRODUCT_NOT_FOUND");
        }
        const {
          category_id,
          name,
          description,
          price,
          stock_qty,
          is_active,
          base_color,
          primary_color,
          other_color,
          border_type,
          pattern,
          craft,
          weave,
          zari_type,
          blouse,
          border_motifs,
          origin,
          fabric,
          khats,
          weight,
          blouse_length,
          producer,
          maker,
          extraImagesUrls,
          mainImage,
          mrp,
          dealer_base_price,
          packaging_cost,
          is_returnable,
          dealer_id,
          producer_address,
          packer_address,
          group_id,
          video_url,
          product_length,
          subcategory_ids
        } = updateData;
        const parsedPrice = Number(price) || 0;
        const parsedMrp = Number(mrp) || 0;
        const computedDiscount = parsedMrp > parsedPrice ? Math.round((parsedMrp - parsedPrice) / parsedMrp * 100) : 0;
        const safeIsReturnable = is_returnable === true || is_returnable === "1" || is_returnable === 1 ? 1 : 0;
        const subcatJson = formatSubcategoriesForDB(subcategory_ids);
        let updateQuery = `
          UPDATE products SET 
            category_id=?, name=?, description=?, price=?, stock_qty=?, is_active=?,
            base_color=?, primary_color=?, other_color=?, border_type=?, pattern=?, 
            craft=?, weave=?, zari_type=?, blouse=?, border_motifs=?, origin=?, 
            fabric=?, khats=?, weight=?, blouse_length=?, producer=?, maker=?,
            mrp=?, discount_percentage=?, dealer_base_price=?, packaging_cost=?, is_returnable=?, dealer_id=?, producer_address=?, packer_address=?, group_id=?,
            product_length=?, subcategory_ids=?
        `;
        const values = [
          Number(category_id),
          name,
          description || null,
          parsedPrice,
          Number(stock_qty),
          Number(is_active),
          base_color || null,
          primary_color || null,
          other_color || null,
          border_type || null,
          pattern || null,
          craft || null,
          weave || null,
          zari_type || null,
          blouse || null,
          border_motifs || null,
          origin || null,
          fabric || null,
          khats || null,
          weight || null,
          blouse_length || null,
          producer || null,
          maker || null,
          parsedMrp ? parsedMrp : null,
          computedDiscount,
          dealer_base_price ? Number(dealer_base_price) : null,
          packaging_cost ? Number(packaging_cost) : null,
          safeIsReturnable,
          dealer_id || null,
          producer_address || null,
          packer_address || null,
          group_id || null,
          product_length || null,
          subcatJson
        ];
        if (mainImage) {
          console.log(`[PRODUCT_SERVICE] Updating main image for product ID: ${product_id}`);
          updateQuery += `, image_url=?`;
          values.push(mainImage);
        }
        if (video_url !== void 0 && video_url !== null) {
          console.log(`[PRODUCT_SERVICE] Updating video for product ID: ${product_id}`);
          updateQuery += `, video_url=?`;
          values.push(video_url);
        }
        updateQuery += ` WHERE product_id=?`;
        values.push(Number(product_id));
        await db2.execute(updateQuery, values);
        console.log(`[PRODUCT_SERVICE] \u2705 Main product data updated successfully for ID: ${product_id}`);
        if (typeof myCache !== "undefined") {
          myCache.del(`product_${product_id}`);
          console.log(`[PRODUCT_CONTROLLER] \u26A1 Cache cleared for product ID: ${product_id}`);
        }
        if (extraImagesUrls && extraImagesUrls.length > 0) {
          console.log(`[PRODUCT_SERVICE] Adding ${extraImagesUrls.length} new extra images during update for product ID: ${product_id}`);
          const insertImagesQuery = `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?`;
          const imageValues = extraImagesUrls.map((url) => [Number(product_id), url, false]);
          await db2.query(insertImagesQuery, [imageValues]);
          console.log(`[PRODUCT_SERVICE] \u2705 Extra images added successfully during update.`);
        }
        return true;
      } catch (err) {
        console.error(`[PRODUCT_SERVICE] \u274C Error in updateProductInDB for ID ${product_id}:`, err.message);
        console.error("[PRODUCT_SERVICE] Stack:", err.stack);
        throw err;
      }
    };
    var addimageindb = async (product_id, uploadedImages) => {
      console.log(`[PRODUCT_SERVICE] Adding ${uploadedImages.length} images via addimageindb for product ID: ${product_id}`);
      try {
        const insertImagesQuery = "INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?";
        const imageValues = uploadedImages.map((uploaded) => [product_id, uploaded.url, false]);
        const [result] = await db2.query(insertImagesQuery, [imageValues]);
        console.log(`[PRODUCT_SERVICE] \u2705 Images inserted via addimageindb successfully.`);
        return result;
      } catch (err) {
        console.error(`[PRODUCT_SERVICE] \u274C Error in addimageindb:`, err.message);
        console.error("[PRODUCT_SERVICE] Stack:", err.stack);
        throw err;
      }
    };
    var deleteimageindb = async (image_id) => {
      console.log(`[PRODUCT_SERVICE] Deleting image record with image_id: ${image_id}`);
      try {
        const deleteQuery = "DELETE FROM product_images WHERE image_id = ?";
        const [result] = await db2.execute(deleteQuery, [image_id]);
        console.log(`[PRODUCT_SERVICE] \u2705 Image deleted successfully. Affected rows: ${result.affectedRows}`);
        return result;
      } catch (err) {
        console.error(`[PRODUCT_SERVICE] \u274C Error in deleteimageindb for image_id ${image_id}:`, err.message);
        console.error("[PRODUCT_SERVICE] Stack:", err.stack);
        throw err;
      }
    };
    var deleteAllInventoryInDB = async () => {
      console.log(`[INVENTORY_SERVICE] \u26A0\uFE0F Request to delete ALL inventory items.`);
      const connection = await db2.getConnection();
      try {
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");
        const [result] = await connection.query("DELETE FROM products");
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");
        connection.release();
        console.log(`[INVENTORY_SERVICE] \u2705 Successfully deleted ${result.affectedRows} items.`);
        return result.affectedRows;
      } catch (err) {
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");
        connection.release();
        console.error("[INVENTORY_SERVICE] \u274C Error in deleteAllInventoryInDB:", err.message);
        throw err;
      }
    };
    var getDealerAndAdminFinancials = async (dealer_id = null) => {
      try {
        let inventoryQuery = `
            SELECT 
                COUNT(product_id) AS total_products,
                COALESCE(SUM(stock_qty), 0) AS total_stock_units,
                COALESCE(SUM(stock_qty * dealer_base_price), 0) AS total_dealer_inventory_cost,
                COALESCE(SUM(stock_qty * price), 0) AS total_retail_inventory_value
            FROM products
            WHERE 1=1
        `;
        const inventoryParams = [];
        if (dealer_id) {
          inventoryQuery += ` AND dealer_id = ?`;
          inventoryParams.push(dealer_id);
        }
        const [inventoryResult] = await db2.execute(inventoryQuery, inventoryParams);
        let salesQuery = `
            SELECT 
                COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
                COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS total_sales_amount,
                COALESCE(SUM(p.dealer_base_price * oi.quantity), 0) AS total_dealer_payout,
                COALESCE(SUM(p.packaging_cost * oi.quantity), 0) AS total_packaging_expense,
                COALESCE(
                    SUM((oi.unit_price - (COALESCE(p.dealer_base_price, 0) + COALESCE(p.packaging_cost, 0))) * oi.quantity), 
                    0
                ) AS admin_profit
            FROM orderitems oi
            INNER JOIN products p ON oi.product_id = p.product_id
            INNER JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status NOT IN ('cancelled', 'refunded')
        `;
        const salesParams = [];
        if (dealer_id) {
          salesQuery += ` AND p.dealer_id = ?`;
          salesParams.push(dealer_id);
        }
        const [salesResult] = await db2.execute(salesQuery, salesParams);
        return {
          inventory: inventoryResult[0],
          financials: salesResult[0]
        };
      } catch (err) {
        console.error("[FINANCIAL_SERVICE] \u274C Error calculating dealer/admin financials:", err.message);
        throw err;
      }
    };
    module2.exports = {
      productsearch,
      productdelete,
      allproductget,
      productrecomendution,
      getproduct,
      getbyidproduct,
      addProductToDB,
      updateProductInDB,
      addimageindb,
      deleteimageindb,
      deleteAllInventoryInDB,
      getDealerAndAdminFinancials
    };
  }
});

// config/cache.js
var require_cache = __commonJS({
  "config/cache.js"(exports2, module2) {
    var NodeCache = require("node-cache");
    var myCache2 = new NodeCache({ stdTTL: 600 });
    module2.exports = myCache2;
  }
});

// src/controllers/product.js
var require_product = __commonJS({
  "src/controllers/product.js"(exports2, module2) {
    var {
      productsearch,
      productdelete,
      allproductget,
      productrecomendution,
      getproduct,
      getbyidproduct,
      addProductToDB,
      updateProductInDB,
      addimageindb,
      deleteimageindb,
      deleteAllInventoryInDB,
      getDealerAndAdminFinancials
    } = require_productservice();
    var imagekit = require_imagekit();
    var myCache2 = require_cache();
    var uploadToImageKit = async (fileBuffer, fileName, folderPath) => {
      console.log(`[IMAGEKIT] Starting upload for file: ${fileName} to folder: ${folderPath}`);
      const base64String = fileBuffer.toString("base64");
      const uploadPromise = imagekit.files.upload({
        file: base64String,
        fileName,
        folder: folderPath
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("IMAGEKIT_TIMEOUT")), 15e3);
      });
      try {
        const result = await Promise.race([uploadPromise, timeoutPromise]);
        console.log(`[IMAGEKIT] \u2705 Upload success: ${result.url}`);
        return result;
      } catch (err) {
        console.error(`[IMAGEKIT] \u274C Upload failed for ${fileName}:`, err.message);
        throw err;
      }
    };
    var product = async (req, res) => {
      console.log("[PRODUCT_CONTROLLER] \u{1F4E1} Fetching all products (basic)");
      try {
        const result = await getproduct();
        console.log(`[PRODUCT_CONTROLLER] \u2705 Fetch success -- ${result.length} product(s)`);
        return res.status(200).json({ success: true, message: "Data fetched successfully", data: result });
      } catch (err) {
        console.error("[PRODUCT_CONTROLLER] \u274C Error fetching basic products:", err.message);
        console.error("[PRODUCT_CONTROLLER] Stack:", err.stack);
        return res.status(500).json({ success: false, message: "Error fetching products", error: err.message });
      }
    };
    var getProductById = async (req, res) => {
      try {
        const productId = req.params.id;
        const cacheKey = `product_${productId}`;
        console.log(`[PRODUCT_CONTROLLER] \u{1F4E5} Incoming GET request for product ID: ${productId}`);
        if (typeof myCache2 !== "undefined" && myCache2.has(cacheKey)) {
          console.log(`[PRODUCT_CONTROLLER] \u{1F4E6} Serving product ID ${productId} from Cache`);
          const cachedData = myCache2.get(cacheKey);
          return res.status(200).json({ success: true, data: cachedData });
        }
        console.log(`[PRODUCT_CONTROLLER] \u{1F504} Not in cache. Fetching fresh data from database...`);
        const product2 = await getbyidproduct(productId);
        if (!product2) {
          console.warn(`[PRODUCT_CONTROLLER] \u26A0\uFE0F Product not found (ID: ${productId})`);
          return res.status(404).json({ success: false, message: "Product not found" });
        }
        if (typeof myCache2 !== "undefined") {
          myCache2.set(cacheKey, product2, 300);
          console.log(`[PRODUCT_CONTROLLER] \u{1F4BE} Product data successfully cached.`);
        }
        return res.status(200).json({ success: true, data: product2 });
      } catch (err) {
        console.error(`[PRODUCT_CONTROLLER] \u274C Error in getProductById:`, err.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
      }
    };
    var addproducts = async (req, res) => {
      console.log("[PRODUCT_CONTROLLER] \u{1F4E1} Add product request received.");
      try {
        const data = req.body;
        console.log("[PRODUCT_CONTROLLER] Parsed body:", { name: data.name, category_id: data.category_id, price: data.price });
        if (!data.category_id || !data.name || !data.price) {
          console.warn("[PRODUCT_CONTROLLER] \u26A0\uFE0F Add product failed: Missing required fields");
          return res.status(400).json({ success: false, message: "Category ID, Name, and Price are required" });
        }
        if (Number(data.price) <= 0) return res.status(400).json({ success: false, message: "Invalid price" });
        if (Number(data.stock_qty) < 0) return res.status(400).json({ success: false, message: "Invalid stock_qty" });
        let mainImage = null;
        let extraImagesUrls = [];
        let videoUrl = req.body.video_url || req.body.vidoe_url || null;
        if (req.files) {
          console.log(`[PRODUCT_CONTROLLER] Files attached in request.`);
          if (req.files["image"] && req.files["image"].length > 0) {
            console.log(`[PRODUCT_CONTROLLER] Uploading Main Cover Image...`);
            const mainFile = req.files["image"][0];
            const uploadedMain = await uploadToImageKit(
              mainFile.buffer,
              `${Date.now()}-${mainFile.originalname}`,
              "/arzoo-saree/products"
            );
            mainImage = uploadedMain.url;
          }
          if (req.files["video"] && req.files["video"].length > 0) {
            console.log(`[PRODUCT_CONTROLLER] Uploading Product Video...`);
            const videoFile = req.files["video"][0];
            const uploadedVideo = await uploadToImageKit(
              videoFile.buffer,
              `${Date.now()}-${videoFile.originalname}`,
              "/arzoo-saree/products"
            );
            videoUrl = uploadedVideo.url;
          }
          if (req.files["extraImages"] && req.files["extraImages"].length > 0) {
            const extraFiles = req.files["extraImages"];
            console.log(`[PRODUCT_CONTROLLER] Uploading ${extraFiles.length} extra gallery images...`);
            const uploadedExtras = await Promise.all(
              extraFiles.map((file) => uploadToImageKit(
                file.buffer,
                `${Date.now()}-${file.originalname}`,
                "/arzoo-saree/products"
              ))
            );
            extraImagesUrls = uploadedExtras.map((uploaded) => uploaded.url);
          }
        }
        let subcategoryIds = data.subcategory_ids;
        if (typeof subcategoryIds === "string") {
          try {
            subcategoryIds = JSON.parse(subcategoryIds);
          } catch (e) {
            subcategoryIds = subcategoryIds.split(",").map((s) => Number(s.trim())).filter(Boolean);
          }
        }
        const productData = {
          ...data,
          subcategory_ids: subcategoryIds,
          product_length: data.product_length || null,
          is_active: data.is_active ?? 1,
          mainImage,
          extraImagesUrls,
          video_url: videoUrl
        };
        const newProductId = await addProductToDB(productData);
        console.log(`[PRODUCT_CONTROLLER] \u2705 Product successfully added with ID: ${newProductId}`);
        return res.status(201).json({ success: true, message: "Product successfully added.", product_id: newProductId });
      } catch (err) {
        console.error(`[PRODUCT_CONTROLLER] \u274C Add Product Error:`, err.message);
        console.error("[PRODUCT_CONTROLLER] Stack:", err.stack);
        if (err.message === "IMAGEKIT_TIMEOUT") {
          return res.status(504).json({ success: false, message: "Image upload took too long. Please try smaller images." });
        }
        if (err.message === "CATEGORY_NOT_FOUND") return res.status(404).json({ success: false, message: "Category does not exist" });
        if (err.message === "DUPLICATE_PRODUCT") return res.status(409).json({ success: false, message: "Product already exists" });
        return res.status(500).json({ success: false, message: "Database error", error: err.message });
      }
    };
    var searchproduct = async (req, res) => {
      const { keyword, minprice, maxprice } = req.query;
      console.log(`[PRODUCT_CONTROLLER] \u{1F4E1} Search request -- keyword:${keyword}, min:${minprice}, max:${maxprice}`);
      if (!keyword) {
        console.warn("[PRODUCT_CONTROLLER] \u26A0\uFE0F Search failed: Missing keyword");
        return res.status(400).json({ success: false, message: "Search keyword is required" });
      }
      try {
        const result = await productsearch(keyword, minprice, maxprice);
        console.log(`[PRODUCT_CONTROLLER] \u2705 Search successful -- found ${result.length} result(s)`);
        return res.status(200).json({ success: true, total_found: result.length, data: result });
      } catch (err) {
        console.error(`[PRODUCT_CONTROLLER] \u274C Search error:`, err.message);
        console.error("[PRODUCT_CONTROLLER] Stack:", err.stack);
        return res.status(500).json({ success: false, message: "Database search error.", error: err.message });
      }
    };
    var updateproduct = async (req, res) => {
      const product_id = req.params.id;
      console.log(`[PRODUCT_CONTROLLER] \u{1F4E1} Update request received for product ID: ${product_id}`);
      try {
        let mainImage = null;
        let extraImagesUrls = [];
        let videoUrl = void 0;
        if (req.files) {
          console.log(`[PRODUCT_CONTROLLER] Processing uploaded file(s) for update...`);
          if (req.files["image"] && req.files["image"].length > 0) {
            console.log(`[PRODUCT_CONTROLLER] Updating Main Cover Image...`);
            const mainFile = req.files["image"][0];
            const uploadedMain = await uploadToImageKit(
              mainFile.buffer,
              `${Date.now()}-${mainFile.originalname}`,
              "/arzoo-saree/products"
            );
            mainImage = uploadedMain.url;
          }
          if (req.files["video"] && req.files["video"].length > 0) {
            console.log(`[PRODUCT_CONTROLLER] Updating Product Video...`);
            const videoFile = req.files["video"][0];
            const uploadedVideo = await uploadToImageKit(
              videoFile.buffer,
              `${Date.now()}-${videoFile.originalname}`,
              "/arzoo-saree/products"
            );
            videoUrl = uploadedVideo.url;
          }
          if (req.files["extraImages"] && req.files["extraImages"].length > 0) {
            const extraFiles = req.files["extraImages"];
            console.log(`[PRODUCT_CONTROLLER] Uploading ${extraFiles.length} NEW extra gallery images...`);
            const uploadedExtras = await Promise.all(
              extraFiles.map((file) => uploadToImageKit(
                file.buffer,
                `${Date.now()}-${file.originalname}`,
                "/arzoo-saree/products"
              ))
            );
            extraImagesUrls = uploadedExtras.map((uploaded) => uploaded.url);
          }
        }
        if (req.body.video_url === "" || req.body.videoUrl === "") {
          videoUrl = null;
        }
        let subcategoryIds = req.body.subcategory_ids;
        if (typeof subcategoryIds === "string") {
          try {
            subcategoryIds = JSON.parse(subcategoryIds);
          } catch (e) {
            subcategoryIds = subcategoryIds.split(",").map((s) => Number(s.trim())).filter(Boolean);
          }
        }
        const updateData = {
          ...req.body,
          subcategory_ids: subcategoryIds,
          product_length: req.body.product_length,
          mainImage,
          extraImagesUrls,
          video_url: videoUrl
        };
        await updateProductInDB(product_id, updateData);
        if (typeof myCache2 !== "undefined") {
          myCache2.del(`product_${product_id}`);
          console.log(`[PRODUCT_CONTROLLER] \u26A1 Cache cleared for product ID: ${product_id}`);
        }
        console.log(`[PRODUCT_CONTROLLER] \u2705 Update success -- product_id: ${product_id}`);
        return res.status(200).json({ success: true, message: "Product details and images updated successfully" });
      } catch (err) {
        console.error(`[PRODUCT_CONTROLLER] \u274C Update error (product_id: ${product_id}):`, err.message);
        console.error("[PRODUCT_CONTROLLER] Stack:", err.stack);
        if (err.message === "PRODUCT_NOT_FOUND") return res.status(404).json({ success: false, message: "Product not found" });
        if (err.message === "IMAGEKIT_TIMEOUT") return res.status(504).json({ success: false, message: "Image upload timeout." });
        return res.status(500).json({ success: false, message: "Failed to update product details", error: err.message });
      }
    };
    var deleteproduct = async (req, res) => {
      const product_id = req.params.id;
      console.log(`[PRODUCT_CONTROLLER] \u{1F4E1} Delete request for product ID: ${product_id}`);
      try {
        const result = await productdelete(product_id);
        if (result.affectedRows === 0) {
          console.warn(`[PRODUCT_CONTROLLER] \u26A0\uFE0F Delete failed -- product ID ${product_id} not found`);
          return res.status(404).json({ success: false, message: "Product not found" });
        }
        if (typeof myCache2 !== "undefined") {
          myCache2.del(`product_${product_id}`);
        }
        console.log(`[PRODUCT_CONTROLLER] \u2705 Delete success -- product_id: ${product_id}`);
        return res.status(200).json({ success: true, message: "Product and associated images successfully deleted." });
      } catch (err) {
        console.error(`[PRODUCT_CONTROLLER] \u274C Delete error (product_id: ${product_id}):`, err.message);
        console.error("[PRODUCT_CONTROLLER] Stack:", err.stack);
        return res.status(500).json({ success: false, message: "Error deleting product", error: err.message });
      }
    };
    var getallproduct = async (req, res) => {
      console.log("[PRODUCT_CONTROLLER] \u{1F4E1} Fetching paginated products -- query:", req.query);
      try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 12);
        const offset = (page - 1) * limit;
        const minPrice = req.query.min ? Number(req.query.min) : null;
        const maxPrice = req.query.max ? Number(req.query.max) : null;
        const results = await allproductget(minPrice, maxPrice, limit, offset);
        console.log(`[PRODUCT_CONTROLLER] \u2705 Paginated fetch success -- page: ${page}, returned: ${results.length}`);
        return res.status(200).json({ success: true, data: results });
      } catch (err) {
        console.error("[PRODUCT_CONTROLLER] \u274C Error fetching paginated products:", err.message);
        console.error("[PRODUCT_CONTROLLER] Stack:", err.stack);
        return res.status(500).json({ success: false, message: "Server Error fetching product list", error: err.message });
      }
    };
    var addNewImagesToProduct = async (req, res) => {
      const product_id = req.params.id;
      console.log(`[PRODUCT_CONTROLLER] \u{1F4E1} Adding new images to product ID: ${product_id}`);
      if (!req.files || req.files.length === 0) {
        console.warn(`[PRODUCT_CONTROLLER] \u26A0\uFE0F Add images failed: No files provided.`);
        return res.status(400).json({ success: false, message: "At least one image file is required to upload." });
      }
      try {
        const uploadedImages = await Promise.all(
          req.files.map((file) => uploadToImageKit(
            file.buffer,
            `${Date.now()}-${file.originalname}`,
            "/arzoo-saree/products"
          ))
        );
        const imageUrls = uploadedImages.map((img) => img.url);
        const result = await addimageindb(product_id, imageUrls);
        if (typeof myCache2 !== "undefined") {
          myCache2.del(`product_${product_id}`);
        }
        console.log(`[PRODUCT_CONTROLLER] \u2705 ${result.affectedRows} image(s) successfully added to product ID: ${product_id}`);
        return res.status(201).json({ success: true, message: `${result.affectedRows} new image(s) successfully added.` });
      } catch (err) {
        console.error(`[PRODUCT_CONTROLLER] \u274C Error adding new images:`, err.message);
        console.error("[PRODUCT_CONTROLLER] Stack:", err.stack);
        if (err.message === "IMAGEKIT_TIMEOUT") {
          return res.status(504).json({ success: false, message: "Image upload took too long." });
        }
        return res.status(500).json({ success: false, message: "Error saving new images", error: err.message });
      }
    };
    var deleteSingleImage = async (req, res) => {
      const image_id = req.params.image_id;
      console.log(`[PRODUCT_CONTROLLER] \u{1F4E1} Deleting single image ID: ${image_id}`);
      try {
        const result = await deleteimageindb(image_id);
        if (result.affectedRows === 0) {
          console.warn(`[PRODUCT_CONTROLLER] \u26A0\uFE0F Image record not found for ID: ${image_id}`);
          return res.status(404).json({ success: false, message: "Image record not found" });
        }
        console.log(`[PRODUCT_CONTROLLER] \u2705 Image permanently deleted -- image_id: ${image_id}`);
        return res.status(200).json({ success: true, message: "Image permanently deleted." });
      } catch (err) {
        console.error(`[PRODUCT_CONTROLLER] \u274C Error deleting image:`, err.message);
        console.error("[PRODUCT_CONTROLLER] Stack:", err.stack);
        return res.status(500).json({ success: false, message: "Error processing image deletion", error: err.message });
      }
    };
    var getRecommendedProducts = async (req, res) => {
      const { product_id, category_id, subcategory_id } = req.query;
      console.log(`[PRODUCT_CONTROLLER] \u{1F4E1} Fetching recommendations for product_id: ${product_id}`);
      if (!product_id || !category_id) {
        console.warn("[PRODUCT_CONTROLLER] \u26A0\uFE0F Recommendations failed: missing parameters");
        return res.status(400).json({ success: false, message: "product_id and category_id are required" });
      }
      try {
        const results = await productrecomendution(product_id, category_id, subcategory_id);
        console.log(`[PRODUCT_CONTROLLER] \u2705 Recommendations success -- ${results.length} result(s)`);
        return res.status(200).json({ success: true, data: results || [] });
      } catch (err) {
        console.error(`[PRODUCT_CONTROLLER] \u274C Recommendations error:`, err.message);
        console.error("[PRODUCT_CONTROLLER] Stack:", err.stack);
        return res.status(500).json({ success: false, message: err.message });
      }
    };
    var deleteAllInventory = async (req, res) => {
      console.log(`[INVENTORY_CONTROLLER] Received request to wipe all inventory.`);
      try {
        const deletedCount = await deleteAllInventoryInDB();
        return res.status(200).json({
          success: true,
          message: `Successfully deleted all inventory items. Total removed: ${deletedCount}`,
          deletedCount
        });
      } catch (err) {
        console.error("[INVENTORY_CONTROLLER] \u274C Error deleting all inventory:", err.message);
        return res.status(500).json({
          success: false,
          message: "Failed to delete inventory. Please try again later."
        });
      }
    };
    var getFinancialSummary = async (req, res) => {
      console.log(`[FINANCIAL_CONTROLLER] \u{1F4E1} Fetching financial and profit summary`);
      try {
        const dealerId = req.query.dealer_id ? Number(req.query.dealer_id) : null;
        const summary = await getDealerAndAdminFinancials(dealerId);
        return res.status(200).json({
          success: true,
          data: summary
        });
      } catch (err) {
        console.error("[FINANCIAL_CONTROLLER] \u274C Error getting financial summary:", err.message);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch financial calculations",
          error: err.message
        });
      }
    };
    module2.exports = {
      product,
      getProductById,
      addproducts,
      searchproduct,
      updateproduct,
      deleteproduct,
      getallproduct,
      addNewImagesToProduct,
      deleteSingleImage,
      getRecommendedProducts,
      deleteAllInventory,
      getFinancialSummary
    };
  }
});

// src/router/product.js
var require_product2 = __commonJS({
  "src/router/product.js"(exports2, module2) {
    var express2 = require("express");
    var upload = require_uploads();
    var { verifyToken, verifyAdmin } = require_authmiddleware();
    var router = express2.Router();
    var {
      searchproduct,
      getProductById,
      addproducts,
      updateproduct,
      deleteproduct,
      getallproduct,
      bugdutfilter,
      product,
      addNewImagesToProduct,
      deleteSingleImage,
      getRecommendedProducts,
      deleteAllInventory
    } = require_product();
    var routeLogger = (req, res, next) => {
      console.log(`
[ROUTER LOG] -----------------------------------------`);
      console.log(`[ROUTER LOG] \u{1F4E5} ${req.method} Request received on: ${req.originalUrl}`);
      console.log(`[ROUTER LOG] \u{1F552} Time: ${(/* @__PURE__ */ new Date()).toISOString()}`);
      console.log(`[ROUTER LOG] -----------------------------------------
`);
      next();
    };
    router.use(routeLogger);
    var productUploads = upload.fields([
      { name: "image", maxCount: 1 },
      // Single Main Cover Photo
      { name: "extraImages", maxCount: 10 },
      { name: "video", maxCount: 1 }
      // Gallery Multiple Angles
    ]);
    router.get("/recommendations", getRecommendedProducts);
    router.get("/search", searchproduct);
    router.get("/product/:id", getProductById);
    router.get("/all", getallproduct);
    router.post("/product", verifyToken, verifyAdmin, productUploads, (req, res, next) => {
      console.log(`[ROUTER LOG] \u{1F680} POST /product API Triggered by Admin.`);
      if (req.files) {
        console.log(`[ROUTER LOG] \u{1F4C1} Files received:`, Object.keys(req.files));
        if (req.files["image"]) console.log(`[ROUTER LOG] - Main Image: ${req.files["image"].length} file(s)`);
        if (req.files["extraImages"]) console.log(`[ROUTER LOG] - Extra Images: ${req.files["extraImages"].length} file(s)`);
        if (req.files["video"]) console.log(`[ROUTER LOG] - Video: ${req.files["video"].length} file(s)`);
      }
      next();
    }, addproducts);
    router.put("/product/:id", verifyToken, verifyAdmin, productUploads, (req, res, next) => {
      console.log(`[ROUTER LOG] \u{1F504} PUT /product/${req.params.id} API Triggered by Admin.`);
      if (req.files) console.log(`[ROUTER LOG] \u{1F4C1} Files received for update:`, Object.keys(req.files));
      next();
    }, updateproduct);
    router.delete("/product/:id", verifyToken, verifyAdmin, (req, res, next) => {
      console.log(`[ROUTER LOG] \u274C DELETE /product/${req.params.id} API Triggered.`);
      next();
    }, deleteproduct);
    router.post("/product/:id/images", verifyToken, verifyAdmin, upload.array("extraImages", 10), (req, res, next) => {
      console.log(`[ROUTER LOG] \u{1F4F8} POST extra images for product ID: ${req.params.id}`);
      console.log(`[ROUTER LOG] \u{1F4C1} Files count: ${req.files ? req.files.length : 0}`);
      next();
    }, addNewImagesToProduct);
    router.delete("/product/image/:image_id", verifyToken, verifyAdmin, (req, res, next) => {
      console.log(`[ROUTER LOG] \u{1F5D1}\uFE0F DELETE single image ID: ${req.params.image_id}`);
      next();
    }, deleteSingleImage);
    router.delete("/delete-all", deleteAllInventory);
    module2.exports = router;
  }
});

// src/services/cartservice.js
var require_cartservice = __commonJS({
  "src/services/cartservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var { getFullImageUrl } = require_imageUtils();
    var addtocartindb = async (userId, product_id, quantity) => {
      const qty = Number(quantity) > 0 ? Number(quantity) : 1;
      const [existing] = await db2.execute(
        "SELECT cart_id FROM cart WHERE user_id = ? AND product_id = ?",
        [userId, product_id]
      );
      if (existing.length > 0) {
        await db2.execute(
          "UPDATE cart SET quantity = quantity + ?, updated_at = NOW() WHERE user_id = ? AND product_id = ?",
          [qty, userId, product_id]
        );
        console.log(`[CART] Quantity updated \u2014 cart_id: ${existing[0].cart_id}, +${qty}`);
        return { action: "updated", cart_id: existing[0].cart_id };
      }
      const [insertResult] = await db2.execute(
        "INSERT INTO cart (user_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
        [userId, product_id, qty]
      );
      console.log(`[CART] Item inserted \u2014 cart_id: ${insertResult.insertId}`);
      return { action: "inserted", cart_id: insertResult.insertId };
    };
    var getcartbydb = async (user_id) => {
      const [rows] = await db2.execute(
        `SELECT c.cart_id, c.user_id, c.product_id, c.quantity,
                p.name, p.price, p.mrp, p.stock_qty, p.image_url,
                -- Database khud har product ka discount calculate karega
                IF(p.mrp > p.price, ROUND(((p.mrp - p.price) / p.mrp) * 100), 0) AS discount_percentage
         FROM cart c
         INNER JOIN products p ON c.product_id = p.product_id
         WHERE c.user_id = ?`,
        [user_id]
      );
      const formatted = rows.map((item) => {
        const price = Number(item.price || 0);
        const mrp = Number(item.mrp || price);
        const discountPercent = Number(item.discount_percentage || 0);
        const deliveryDate = /* @__PURE__ */ new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5);
        return {
          cart_id: item.cart_id,
          product_id: item.product_id,
          name: item.name,
          price,
          mrp,
          // Exact MRP for this specific product
          discount_percentage: discountPercent,
          // Exact Discount for this specific product
          estimated_delivery: deliveryDate,
          quantity: item.quantity,
          stock_qty: item.stock_qty,
          image_url: getFullImageUrl(item.image_url),
          // Make sure getFullImageUrl is available in this file
          item_total: price * item.quantity,
          in_stock: item.stock_qty >= item.quantity
        };
      });
      console.log(`[CART] Returned ${formatted.length} item(s) for user_id: ${user_id}`);
      return formatted;
    };
    var ItemNotFoundError = class extends Error {
      constructor(cart_id) {
        super(`Cart item not found or does not belong to this user: ${cart_id}`);
        this.name = "ItemNotFoundError";
      }
    };
    var RemoveFromCartindb = async (cart_id, user_id) => {
      const [result] = await db2.execute(
        "DELETE FROM cart WHERE cart_id = ? AND user_id = ?",
        [cart_id, user_id]
      );
      if (result.affectedRows === 0) {
        console.warn(`[CART] Remove failed \u2014 cart_id ${cart_id} not found for user_id ${user_id}`);
        throw new ItemNotFoundError(cart_id);
      }
      console.log(`[CART] Item removed \u2014 cart_id: ${cart_id}`);
      return true;
    };
    var updateCartQuantityInDB = async (cart_id, user_id, quantity) => {
      const qty = Number(quantity);
      if (qty < 1) {
        throw new Error("INVALID_QUANTITY");
      }
      const updatequery = "UPDATE cart SET quantity = ?, updated_at = NOW() WHERE cart_id = ? AND user_id = ?";
      const [result] = await db2.execute(updatequery, [qty, cart_id, user_id]);
      if (result.affectedRows === 1) {
        return true;
      }
      if (result.affectedRows === 0) {
        throw new ItemNotFoundError(cart_id);
      }
      return true;
    };
    var clearCartService = async (user_id) => {
      await db2.execute("DELETE FROM cart WHERE user_id = ?", [user_id]);
      return { success: true };
    };
    module2.exports = {
      RemoveFromCartindb,
      getcartbydb,
      addtocartindb,
      ItemNotFoundError,
      updateCartQuantityInDB,
      clearCartService
    };
  }
});

// src/controllers/cart.js
var require_cart = __commonJS({
  "src/controllers/cart.js"(exports2, module2) {
    var {
      RemoveFromCartindb,
      getcartbydb,
      addtocartindb,
      ItemNotFoundError,
      updateCartQuantityInDB,
      clearCartService
    } = require_cartservice();
    var AddToCart = async (req, res) => {
      const userId = req.user.id;
      const { product_id, quantity } = req.body;
      console.log(`[CART] Add-to-cart \u2014 user_id: ${userId}, product_id: ${product_id}, qty: ${quantity}`);
      if (!product_id) {
        console.warn(`[CART] Add-to-cart failed \u2014 no product_id (user_id: ${userId})`);
        return res.status(400).json({ success: false, message: "Product ID is required." });
      }
      try {
        const result = await addtocartindb(userId, product_id, quantity);
        const message = result.action === "updated" ? "Cart quantity updated." : "Item added to cart.";
        return res.status(201).json({
          success: true,
          message,
          result
        });
      } catch (error) {
        console.error(`[CART] Add-to-cart error (user_id: ${userId}):`, error.message);
        return res.status(500).json({ success: false, message: "Server error while updating cart.", error: error.message });
      }
    };
    var getCart = async (req, res) => {
      const user_id = req.user.id;
      console.log(`[CART] Fetching cart \u2014 user_id: ${user_id}`);
      try {
        const cartitem = await getcartbydb(user_id);
        return res.status(200).json({ success: true, data: cartitem });
      } catch (error) {
        console.error(`[CART] Get-cart error (user_id: ${user_id}):`, error.message);
        return res.status(500).json({ success: false, message: "Server error while fetching cart.", error: error.message });
      }
    };
    var RemoveFromCart = async (req, res) => {
      const user_id = req.user.id;
      const { cart_id } = req.params;
      console.log(`[CART] Remove item \u2014 user_id: ${user_id}, cart_id: ${cart_id}`);
      try {
        await RemoveFromCartindb(cart_id, user_id);
        return res.status(200).json({ success: true, message: "Item removed from cart." });
      } catch (error) {
        console.error(`[CART] Remove error (user_id: ${user_id}):`, error.message);
        if (error instanceof ItemNotFoundError) {
          return res.status(404).json({ success: false, message: "Cart item not found." });
        }
        return res.status(500).json({ success: false, message: "Server error while removing item.", error: error.message });
      }
    };
    var updateCartItemQuantity = async (req, res) => {
      const user_id = req.user.id;
      const { cart_id, quantity } = req.body;
      console.log(`[CART] Update quantity -- user_id: ${user_id}, cart_id: ${cart_id}, qty: ${quantity}`);
      if (!cart_id || quantity === void 0 || quantity === null) {
        return res.status(400).json({ success: false, message: "Cart ID and Quantity are required." });
      }
      try {
        await updateCartQuantityInDB(cart_id, user_id, quantity);
        return res.status(200).json({ success: true, message: "Cart quantity updated successfully." });
      } catch (error) {
        console.error(`[CART] Update quantity error (user_id: ${user_id}):`, error.message);
        if (error.message === "INVALID_QUANTITY") {
          return res.status(400).json({ success: false, message: "Quantity must be at least 1." });
        }
        if (error instanceof ItemNotFoundError) {
          return res.status(404).json({ success: false, message: "Cart item not found or unauthorized." });
        }
        return res.status(500).json({ success: false, message: "Server error while updating cart.", error: error.message });
      }
    };
    var clearCart = async (req, res) => {
      try {
        const user_id = req.user.id;
        await clearCartService(user_id);
        const updatedCart = await getcartbydb(user_id);
        return res.status(200).json({
          success: true,
          message: "Cart cleared successfully",
          data: updatedCart
        });
      } catch (error) {
        console.error("[CART CONTROLLER] Error clearing cart:", error.message);
        return res.status(500).json({ success: false, message: "Server error" });
      }
    };
    module2.exports = {
      AddToCart,
      getCart,
      RemoveFromCart,
      updateCartItemQuantity,
      clearCart
    };
  }
});

// src/router/cart.js
var require_cart2 = __commonJS({
  "src/router/cart.js"(exports2, module2) {
    var express2 = require("express");
    var { verifyToken } = require_authmiddleware();
    var router = express2.Router();
    var {
      AddToCart,
      getCart,
      RemoveFromCart,
      clearCart,
      updateCartItemQuantity
      // 🚨 YEH MISSING THA!
    } = require_cart();
    var cartLogger = (req, res, next) => {
      console.log(`[CART ROUTER] \u{1F680} ${req.method} Request at: ${req.originalUrl}`);
      next();
    };
    router.use(cartLogger);
    router.post("/add", verifyToken, AddToCart);
    router.get("/data", verifyToken, getCart);
    router.put("/update", verifyToken, updateCartItemQuantity);
    router.delete("/remove/:cart_id", verifyToken, RemoveFromCart);
    router.delete("/clear", verifyToken, clearCart);
    module2.exports = router;
  }
});

// src/services/emailService.js
var require_emailService = __commonJS({
  "src/services/emailService.js"(exports2, module2) {
    var nodemailer = require("nodemailer");
    var db2 = require_mysql();
    var { getFullImageUrl } = require_imageUtils();
    var transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      family: 4,
      tls: {
        rejectUnauthorized: false
      }
    });
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("[EMAIL-SERVICE] Missing GMAIL env vars -- emails will fail.");
    }
    var sendEmailService = ({ to, subject, html }) => {
      return new Promise((resolve, reject) => {
        transporter.sendMail(
          { from: process.env.GMAIL_USER, to, subject, html },
          (err, info) => err ? reject(err) : resolve(info)
        );
      });
    };
    var sendInvoiceEmail = async (order_id) => {
      console.log(`
--- [EMAIL START] Attempting to send email for Order ID: ${order_id} ---`);
      try {
        console.log(`[EMAIL STEP 1] Fetching order data from DB...`);
        const [orderRows] = await db2.execute(
          `SELECT o.*, u.email as user_email, a.full_name, a.phone, a.city, a.state, a.pincode, a.house_no, a.road_area, a.landmark
             FROM orders o
             LEFT JOIN addresses a ON o.address_id = a.address_id
             LEFT JOIN users u ON o.user_id = u.user_id
             WHERE o.order_id = ?`,
          [order_id]
        );
        console.log(`[EMAIL STEP 1] SQL Result: Found ${orderRows.length} order(s).`);
        if (orderRows.length === 0) {
          console.error(`[EMAIL ERROR] order_id ${order_id} not found in database. Aborting.`);
          return;
        }
        const order = orderRows[0];
        console.log(`[EMAIL STEP 2] Order Details Fetched -> user_id: ${order.user_id}, customer_email: ${order.customer_email}, user_email: ${order.user_email}`);
        const targetEmail = order.customer_email || order.user_email || order.email;
        console.log(`[EMAIL STEP 3] Final Target Email Determined: ${targetEmail}`);
        if (!targetEmail) {
          console.error(`[EMAIL ERROR] No email address found for order_id ${order_id}. Aborting.`);
          return;
        }
        console.log(`[EMAIL STEP 4] Fetching order items...`);
        const [itemRows] = await db2.execute(
          `SELECT product_name, quantity, unit_price
             FROM orderitems WHERE order_id = ?`,
          [order_id]
        );
        console.log(`[EMAIL STEP 4] Found ${itemRows.length} item(s) for this order.`);
        const storeName = process.env.STORE_NAME || "Arzoo Saree";
        let simpleItemsList = "";
        for (const item of itemRows) {
          simpleItemsList += `
            <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; color: #333333;">
                    <strong>${item.product_name}</strong><br>
                    <span style="font-size: 13px; color: #777777;">Qty: ${item.quantity}</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right; color: #333333; font-weight: bold;">
                    \u20B9${(Number(item.unit_price) * item.quantity).toFixed(2)}
                </td>
            </tr>`;
        }
        const paymentText = order.payment_method === "online" ? "has been paid securely online." : "will be paid via Cash on Delivery.";
        const emailHtmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; color: #333333;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background-color: #ad3764; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">${storeName}</h1>
                </div>
                <div style="padding: 40px 30px;">
                    <h2 style="margin-top: 0; color: #222222; font-size: 20px;">Hi ${order.full_name},</h2>
                    <p style="font-size: 15px; line-height: 1.6; color: #555555;">
                        Thank you for shopping with us! Your order <strong>#${order.payment_id || order.order_id}</strong> has been successfully placed and ${paymentText}
                    </p>
                    <div style="background-color: #fcfcfc; border: 1px solid #eeeeee; border-radius: 6px; padding: 20px; margin: 30px 0;">
                        <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #ad3764; letter-spacing: 1px; border-bottom: 1px solid #dddddd; padding-bottom: 10px;">Order Summary</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            ${simpleItemsList}
                            <tr>
                                <td style="padding: 15px 0 0; color: #333333; font-size: 16px;"><strong>Grand Total</strong></td>
                                <td style="padding: 15px 0 0; text-align: right; color: #ad3764; font-size: 18px; font-weight: bold;">
                                    \u20B9${Number(order.total_amount).toFixed(2)}
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </body>
        </html>`;
        const info = await sendEmailService({
          to: targetEmail,
          subject: `Order Confirmed! #${order.payment_id || order.order_id} - ${storeName}`,
          html: emailHtmlTemplate
        });
        console.log(`[EMAIL SUCCESS] Email dispatched successfully! Message ID: ${info?.messageId}`);
      } catch (error) {
        console.error(`
[EMAIL CRITICAL ERROR] Process failed for Order ID: ${order_id}`);
        console.error(`[EMAIL CRITICAL ERROR DETAILS]:`, error.message);
      }
    };
    var sendAdminOrderAlert = async (order_id) => {
      try {
        const [orderRows] = await db2.execute(`
            SELECT o.*, a.full_name, a.city, a.state
            FROM orders o
            LEFT JOIN addresses a ON o.address_id = a.address_id
            WHERE o.order_id = ?
        `, [order_id]);
        if (!orderRows.length) return;
        const order = orderRows[0];
        const adminEmails = process.env.ADMIN_EMAILS;
        if (!adminEmails) return;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 2px solid #ad3764; border-radius: 8px;">
                <h2 style="color: #ad3764;">\u{1F6A8} New Order Received!</h2>
                <p><strong>Order ID:</strong> #${order.order_id}</p>
                <p><strong>Amount:</strong> \u20B9${order.total_amount}</p>
                <p><strong>Payment Method:</strong> ${order.payment_method}</p>
                <p><strong>Customer Name:</strong> ${order.full_name}</p>
                <p><strong>Location:</strong> ${order.city}, ${order.state}</p>
                <br>
                <a href="https://royal-heritage.in/admin" style="background-color: #ad3764; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a>
            </div>
        `;
        await sendEmailService({
          to: adminEmails,
          subject: `New Order Alert! #${order.order_id} - \u20B9${order.total_amount}`,
          html
        });
      } catch (error) {
        console.error(`[EMAIL ERROR] Admin alert failed:`, error.message);
      }
    };
    var sendStatusUpdateEmail = async (order_id, status, customMessage = "", tracking_number = "") => {
      try {
        const [orderRows] = await db2.execute(`
            SELECT o.*, u.email as user_email, a.full_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.user_id
            LEFT JOIN addresses a ON o.address_id = a.address_id
            WHERE o.order_id = ?
        `, [order_id]);
        if (!orderRows.length) return;
        const order = orderRows[0];
        const targetEmail = order.customer_email || order.user_email;
        if (!targetEmail) return;
        let defaultMessage = `Your order status has been updated to <strong>${status}</strong>.`;
        if (status.toLowerCase() === "shipped") {
          defaultMessage = `Great news! Your order has been shipped and is on its way to you.`;
        } else if (status.toLowerCase() === "delivered") {
          defaultMessage = `Your order has been delivered successfully. Thank you for shopping with Arzoo Saree!`;
        } else if (status.toLowerCase() === "processing") {
          defaultMessage = `We are currently processing your order and getting it ready for shipment.`;
        }
        const finalMessage = customMessage && customMessage.trim() !== "" ? customMessage : defaultMessage;
        let trackingHtml = "";
        if (tracking_number && tracking_number.trim() !== "") {
          trackingHtml = `
            <div style="background-color: #f1f8f5; border-left: 4px solid #0f6b3a; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #0f6b3a; font-size: 16px;"><strong>Tracking Number / AWB:</strong> <br><span style="font-size: 18px;">${tracking_number}</span></p>
            </div>`;
        }
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 8px;">
                <h2 style="color: #ad3764; margin-top: 0;">Order Update - #${order.order_id}</h2>
                <p style="font-size: 16px; color: #333;">Hi ${order.full_name},</p>
                <p style="font-size: 15px; line-height: 1.6; color: #444;">${finalMessage}</p>
                ${trackingHtml}
                <p style="margin-top: 30px; font-size: 14px; color: #888;">Warm Regards,<br>Arzoo Team</p>
            </div>
        `;
        await sendEmailService({
          to: targetEmail,
          subject: `Update on your Arzoo Order #${order.order_id}`,
          html
        });
        console.log(`[EMAIL SUCCESS] Status update email sent for Order #${order_id}`);
      } catch (error) {
        console.error(`[EMAIL ERROR] Status update failed:`, error.message);
      }
    };
    var BILL_SETTINGS = {
      SITE_NAME: "Arzoo Saree",
      CURRENCY_CODE: "INR",
      LOCALE: "en-IN",
      FALLBACK_IMAGE: "/saare_1.jpeg"
    };
    var SPEC_FIELDS = [
      { key: "fabric", label: "Fabric/Material" },
      { key: "product_length", label: "Product Length" },
      { key: "primary_color", label: "Primary Color" },
      { key: "other_color", label: "Other Colors" },
      { key: "pattern", label: "Pattern" },
      { key: "craft", label: "Craft" },
      { key: "weave", label: "Weave" },
      { key: "zari_type", label: "Zari Type" },
      { key: "border_type", label: "Border Type" },
      { key: "border_motifs", label: "Border Motifs" },
      { key: "blouse", label: "Blouse" },
      { key: "blouse_length", label: "Blouse Length" },
      { key: "khats", label: "Khats" },
      { key: "weight", label: "Weight" }
    ];
    var moneyFormatter = new Intl.NumberFormat(BILL_SETTINGS.LOCALE, {
      style: "currency",
      currency: BILL_SETTINGS.CURRENCY_CODE,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    var money = (value) => moneyFormatter.format(Number(value) || 0);
    var esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    var hasValue = (value) => value !== null && value !== void 0 && String(value).trim() !== "" && String(value) !== "null";
    var formatDate = (value, withTime = false) => {
      const date = new Date(value);
      if (!value || Number.isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString(BILL_SETTINGS.LOCALE, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...withTime ? { hour: "2-digit", minute: "2-digit" } : {}
      });
    };
    var getInvoiceData = async (userId, orderId) => {
      const [orderRows] = await db2.execute(
        `SELECT o.*, u.name AS user_name, u.email AS user_email,
                a.full_name AS addr_name, a.phone AS addr_phone, a.alternate_phone,
                a.house_no, a.road_area, a.landmark, a.city, a.state, a.pincode
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.user_id
         LEFT JOIN addresses a ON o.address_id = a.address_id
         WHERE o.order_id = ? AND o.user_id = ?`,
        [orderId, userId]
      );
      if (orderRows.length === 0) return null;
      const order = orderRows[0];
      const [itemRows] = await db2.execute(
        `SELECT p.*,
                c.name AS category_name,
                s.subcategory_name AS subcategory_label,
                d.name AS dealer_name,
                d.email AS dealer_email,
                oi.product_name AS bill_name,
                oi.quantity AS bill_qty,
                oi.unit_price AS bill_unit_price,
                oi.discount AS bill_discount,
                oi.hsn_code AS bill_hsn
         FROM orderitems oi
         LEFT JOIN products p ON oi.product_id = p.product_id
         LEFT JOIN categories c ON p.category_id = c.category_id
         LEFT JOIN subcategories s ON p.subcategory_id = s.subcategory_id
         LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
         WHERE oi.order_id = ?`,
        [orderId]
      );
      let deliveryDate = order.estimated_delivery || null;
      if (!deliveryDate) {
        const [zoneRows] = await db2.execute(
          `SELECT max_days FROM shipping_zones
             WHERE LOWER(TRIM(state_name)) = LOWER(TRIM(?)) OR state_name = 'Default'
             ORDER BY (state_name = 'Default') ASC LIMIT 1`,
          [order.state || ""]
        );
        if (zoneRows.length > 0) {
          const date = new Date(order.ordered_at);
          date.setDate(date.getDate() + Number(zoneRows[0].max_days));
          deliveryDate = date;
        }
      }
      return { order, items: itemRows, deliveryDate };
    };
    var infoRow = (label, value) => hasValue(value) ? `<div class="info-item"><span class="info-label">${esc(label)}</span><span class="info-value">${esc(value)}</span></div>` : "";
    var buildItemHtml = (item) => {
      const qty = Number(item.bill_qty) || 1;
      const unitPrice = Number(item.bill_unit_price) || 0;
      const discount = Number(item.bill_discount) || 0;
      const mrp = Number(item.mrp) > unitPrice ? Number(item.mrp) : unitPrice;
      const lineTotal = unitPrice * qty - discount;
      const name = item.bill_name || item.name || "Product";
      const image = getFullImageUrl(item.image_url || BILL_SETTINGS.FALLBACK_IMAGE);
      const subcategories = item.subcategory_label || "";
      const specRows = [
        infoRow("Category", item.category_name),
        infoRow("Subcategory / Style", subcategories),
        infoRow("HSN Code", item.bill_hsn),
        ...SPEC_FIELDS.map((f) => infoRow(f.label, item[f.key]))
      ].join("");
      const firmEmail = item.producer_email || item.dealer_email;
      const makerRows = [
        infoRow("Firm / Producer", item.producer || item.dealer_name),
        infoRow("Firm Email", firmEmail),
        infoRow("Maker", item.maker),
        infoRow("Country of Origin", item.origin),
        infoRow("Name and address of the Manufacturer", item.producer_address),
        infoRow("Name and address of the Packer", item.packer_address)
      ].join("");
      return `
      <div class="item-block">
        <div class="item-main">
          <img class="item-img" src="${esc(image)}" alt="${esc(name)}" onerror="this.onerror=null;this.src='${esc(BILL_SETTINGS.FALLBACK_IMAGE)}'">
          <div class="item-body">
            <div class="item-name">${esc(name)}</div>
            <div class="item-sub">SKU: PROD-${esc(item.product_id)}${hasValue(item.bill_hsn) ? ` | HSN: ${esc(item.bill_hsn)}` : ""}</div>

            <div class="firm-box">
              <div><strong>Firm / Producer:</strong> ${esc(item.producer || item.dealer_name || "N/A")}</div>
              ${hasValue(item.producer_address) ? `<div><strong>Firm address:</strong> ${esc(item.producer_address)}</div>` : ""}
              ${hasValue(firmEmail) ? `<div><strong>Firm email:</strong> ${esc(firmEmail)}</div>` : ""}
              ${hasValue(item.origin) ? `<div><strong>Made in:</strong> ${esc(item.origin)}</div>` : ""}
              ${hasValue(item.packer_address) ? `<div><strong>Packed at:</strong> ${esc(item.packer_address)}</div>` : ""}
            </div>
          </div>
          <div class="item-money">
            <div class="m-row"><span>Qty</span><strong>${qty}</strong></div>
            ${mrp > unitPrice ? `<div class="m-row"><span>MRP</span><s>${money(mrp)}</s></div>` : ""}
            <div class="m-row"><span>Price</span><strong>${money(unitPrice)}</strong></div>
            ${discount > 0 ? `<div class="m-row"><span>Discount</span><strong>- ${money(discount)}</strong></div>` : ""}
            <div class="m-row m-total"><span>Item total</span><strong>${money(lineTotal)}</strong></div>
          </div>
        </div>

        <details class="item-toggle">
          <summary>All details</summary>
          <div class="toggle-body">
            <h4>Specifications</h4>
            <div class="info-grid">${specRows || '<span class="muted">No specifications available.</span>'}</div>
            <h4>Description</h4>
            <p class="desc">${hasValue(item.description) ? esc(item.description) : "No description available."}</p>
            <h4>Manufacturer info</h4>
            <div class="info-grid">${makerRows || '<span class="muted">No manufacturer info available.</span>'}</div>
          </div>
        </details>
      </div>`;
    };
    var buildInvoiceHtml = ({ order, items, deliveryDate }) => {
      let itemsTotal = 0;
      let mrpTotal = 0;
      items.forEach((item) => {
        const qty = Number(item.bill_qty) || 1;
        const unitPrice = Number(item.bill_unit_price) || 0;
        const mrp = Number(item.mrp) > unitPrice ? Number(item.mrp) : unitPrice;
        itemsTotal += unitPrice * qty - (Number(item.bill_discount) || 0);
        mrpTotal += mrp * qty;
      });
      const totalDiscount = Math.max(0, mrpTotal - itemsTotal);
      const deliveryCharge = 0;
      const grandTotal = itemsTotal + deliveryCharge;
      const invoiceNumber = order.invoice_number || order.payment_id || `ORD-${order.order_id}`;
      const customerName = order.user_name || order.addr_name || "Customer";
      const addressLine = [order.house_no, order.road_area, order.landmark].filter(hasValue).join(", ");
      const cityLine = [order.city, order.state].filter(hasValue).join(", ") + (hasValue(order.pincode) ? ` - ${order.pincode}` : "");
      const email = order.customer_email || order.user_email;
      const paymentLabel = order.payment_method === "online" ? "Online Payment" : "Cash on Delivery";
      const paymentStatus = order.payment_status === "paid" ? "Paid" : "Pending";
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bill - ${esc(invoiceNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: #f4efe9; color: #2b2024; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.5; }
  .bill { max-width: 860px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.08); overflow: hidden; }
  .bill-head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding: 28px 32px; color: #fff; background: linear-gradient(135deg, #7d1638, #b8893f); }
  .site-name { margin: 0; font-size: 28px; font-family: Georgia, serif; letter-spacing: .5px; }
  .bill-kind { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: .9; }
  .bill-meta { text-align: right; font-size: 13px; }
  .bill-no { display: inline-block; margin: 4px 0; padding: 4px 10px; border: 1px dashed rgba(255,255,255,.7); border-radius: 6px; font-weight: 700; }
  .section { padding: 20px 32px; border-bottom: 1px solid #eee; }
  .section h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .8px; color: #7d1638; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .cust-name { font-size: 16px; font-weight: 700; }
  .muted { color: #8a7f78; }
  .deliver-by { display: inline-block; margin-top: 6px; padding: 4px 10px; border-radius: 6px; background: #eaf6ee; color: #0f6b3a; font-weight: 700; }
  .item-block { margin-bottom: 18px; border: 1px solid #eadfce; border-radius: 10px; overflow: hidden; }
  .item-main { display: flex; gap: 16px; padding: 14px; flex-wrap: wrap; }
  .item-img { width: 110px; height: 146px; object-fit: cover; border-radius: 8px; background: #f3ebe0; }
  .item-body { flex: 1 1 260px; min-width: 0; }
  .item-name { font-size: 15px; font-weight: 700; }
  .item-sub { font-size: 12px; color: #8a7f78; margin-bottom: 8px; }
  .firm-box { padding: 8px 10px; border-radius: 8px; background: #fbf6ee; font-size: 12.5px; }
  .item-money { flex: 0 0 190px; font-size: 13px; }
  .m-row { display: flex; justify-content: space-between; gap: 10px; padding: 2px 0; }
  .m-total { margin-top: 4px; padding-top: 6px; border-top: 1px solid #eadfce; font-size: 15px; color: #7d1638; }
  .item-toggle { border-top: 1px solid #eadfce; }
  .item-toggle summary { cursor: pointer; padding: 10px 14px; font-weight: 700; color: #7d1638; list-style: none; }
  .item-toggle summary::after { content: ' \\25BC'; font-size: 11px; }
  .item-toggle[open] summary::after { content: ' \\25B2'; }
  .toggle-body { padding: 0 14px 14px; }
  .toggle-body h4 { margin: 14px 0 8px; font-size: 13px; color: #5c0f2a; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
  .info-item { display: flex; flex-direction: column; }
  .info-label { font-size: 11.5px; color: #8a7f78; }
  .info-value { font-weight: 600; overflow-wrap: anywhere; }
  .desc { margin: 0; white-space: pre-line; }
  .totals { max-width: 340px; margin-left: auto; }
  .t-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .t-free { color: #0f6b3a; font-weight: 700; }
  .t-grand { margin-top: 6px; padding-top: 8px; border-top: 2px solid #7d1638; font-size: 18px; font-weight: 800; color: #7d1638; }
  .bill-foot { padding: 18px 32px 26px; text-align: center; font-size: 12px; color: #8a7f78; }
  .print-btn { display: block; margin: 16px auto 0; padding: 10px 26px; border: 0; border-radius: 8px; background: #7d1638; color: #fff; font-weight: 700; cursor: pointer; }
  @media (max-width: 640px) { body { padding: 10px; } .section, .bill-head { padding: 16px; } .two-col, .info-grid { grid-template-columns: 1fr; } .bill-meta { text-align: left; } .item-money { flex-basis: 100%; } }
  @media print { body { background: #fff; padding: 0; } .bill { box-shadow: none; border-radius: 0; } .print-btn { display: none; } }
</style>
</head>
<body>
  <div class="bill">
    <div class="bill-head">
      <div>
        <h1 class="site-name">${esc(BILL_SETTINGS.SITE_NAME)}</h1>
        <div class="bill-kind">Bill of Supply</div>
      </div>
      <div class="bill-meta">
        <div class="bill-no">${esc(invoiceNumber)}</div>
        <div>Order ID: #${esc(order.order_id)}</div>
        <div>Date: ${esc(formatDate(order.ordered_at, true))}</div>
      </div>
    </div>

    <div class="section two-col">
      <div>
        <h3>Customer</h3>
        <div class="cust-name">${esc(customerName)}</div>
        ${hasValue(order.addr_name) && order.addr_name !== customerName ? `<div>Deliver to: ${esc(order.addr_name)}</div>` : ""}
        ${hasValue(order.addr_phone) ? `<div>Mobile: ${esc(order.addr_phone)}</div>` : ""}
        ${hasValue(order.alternate_phone) ? `<div>Alternate: ${esc(order.alternate_phone)}</div>` : ""}
        ${hasValue(email) ? `<div>Email: ${esc(email)}</div>` : ""}
      </div>
      <div>
        <h3>Delivery address</h3>
        <div>${esc(addressLine) || '<span class="muted">N/A</span>'}</div>
        <div>${esc(cityLine)}</div>
        <div class="deliver-by">Delivery by ${esc(formatDate(deliveryDate))}</div>
      </div>
    </div>

    <div class="section">
      <h3>Products</h3>
      ${items.length > 0 ? items.map(buildItemHtml).join("") : '<p class="muted">No items found for this order.</p>'}
    </div>

    <div class="section">
      <div class="totals">
        <div class="t-row"><span>Total MRP</span><span>${money(mrpTotal)}</span></div>
        ${totalDiscount > 0 ? `<div class="t-row"><span>Discount</span><span>- ${money(totalDiscount)}</span></div>` : ""}
        <div class="t-row"><span>Delivery charges</span><span class="t-free">FREE</span></div>
        <div class="t-row t-grand"><span>Total</span><span>${money(grandTotal)}</span></div>
        <div class="t-row muted"><span>Payment</span><span>${esc(paymentLabel)} (${esc(paymentStatus)})</span></div>
      </div>
    </div>

    <div class="bill-foot">
      Thank you for shopping with ${esc(BILL_SETTINGS.SITE_NAME)}.<br>
      This is a computer generated bill and does not need a signature.
      <button type="button" class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>
  <script>
    window.addEventListener('beforeprint', function () {
      document.querySelectorAll('details').forEach(function (d) { d.open = true; });
    });
  </script>
</body>
</html>`;
    };
    var getInvoiceHtml = async (userId, orderId) => {
      const data = await getInvoiceData(userId, orderId);
      if (!data) return null;
      return buildInvoiceHtml(data);
    };
    module2.exports = {
      sendEmailService,
      sendInvoiceEmail,
      getInvoiceHtml,
      sendAdminOrderAlert,
      sendStatusUpdateEmail
    };
  }
});

// src/services/checkoutservice.js
var require_checkoutservice = __commonJS({
  "src/services/checkoutservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var myCache2 = require_cache();
    var { sendInvoiceEmail, sendAdminOrderAlert } = require_emailService();
    var processCheckoutInDB = async (user_id, addressId, buyNowProduct, paymentMethod, tracking_ref, customEmail) => {
      if (paymentMethod === "cod") {
        throw new Error("Cash on Delivery has been completely disabled. Please choose Online Payment.");
      }
      const method = "online";
      const sourcevisiter = tracking_ref ?? null;
      console.log(`[CHECKOUT] \u{1F680} Starting checkout process for User ID: ${user_id}, Method: ${method}`);
      const connection = await db2.getConnection();
      try {
        await connection.beginTransaction();
        console.log(`[CHECKOUT] \u{1F512} Database transaction started successfully.`);
        console.log(`[CHECKOUT] \u{1F4CD} Fetching address ID: ${addressId} for user: ${user_id}...`);
        const [addressRows] = await connection.execute(
          `SELECT full_name, phone, house_no, road_area, landmark, city, state, pincode
             FROM addresses WHERE address_id = ? AND user_id = ?`,
          [addressId, user_id]
        );
        if (addressRows.length === 0) {
          console.error(`[CHECKOUT] \u274C Address ID ${addressId} not found for user ${user_id}.`);
          throw new Error("ADDRESS_NOT_FOUND");
        }
        const addr = addressRows[0];
        const shippingAddressLine = `${addr.house_no}, ${addr.road_area}${addr.landmark ? ", " + addr.landmark : ""}`;
        const shippingAddressFull = `${shippingAddressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}, Phone: ${addr.phone}`;
        console.log(`[CHECKOUT] \u2705 Address fetched successfully.`);
        let customerEmail = customEmail;
        if (!customerEmail) {
          console.log(`[CHECKOUT] \u{1F4E7} Fetching email for User ID: ${user_id}...`);
          const [userRows] = await connection.execute(
            `SELECT email FROM users WHERE user_id = ?`,
            [user_id]
          );
          if (userRows.length === 0) {
            console.error(`[CHECKOUT] \u274C User ID ${user_id} not found.`);
            throw new Error("USER_NOT_FOUND");
          }
          customerEmail = userRows[0].email;
        }
        console.log(`[CHECKOUT] \u2705 Customer Email resolved: ${customerEmail}`);
        console.log(`[CHECKOUT] \u{1F69A} Checking shipping zone for state: ${addr.state}...`);
        const [zoneRows] = await connection.execute(
          `SELECT min_days, max_days FROM shipping_zones WHERE state_name = ?`,
          [addr.state]
        );
        const defaultMaxDays = Number(process.env.DEFAULT_DELIVERY_DAYS) || 7;
        const maxDays = zoneRows.length > 0 ? zoneRows[0].max_days : defaultMaxDays;
        const estimatedDeliveryDateObj = /* @__PURE__ */ new Date();
        estimatedDeliveryDateObj.setDate(estimatedDeliveryDateObj.getDate() + maxDays);
        const estimatedDeliverySQL = estimatedDeliveryDateObj.toISOString().split("T")[0];
        console.log(`[CHECKOUT] \u2705 Estimated delivery calculated: ${estimatedDeliverySQL}`);
        let cartItems = [];
        const isBuyNow = buyNowProduct && buyNowProduct.product_id;
        if (isBuyNow) {
          console.log(`[CHECKOUT] \u{1F6CD}\uFE0F Processing 'Buy Now' for Product ID: ${buyNowProduct.product_id}`);
          const [productRows] = await connection.execute(
            `SELECT p.product_id, p.name AS product_name, p.price AS unit_price, p.hsn_code, p.dealer_base_price, p.packaging_cost
                 FROM products p
                 WHERE p.product_id = ?`,
            [buyNowProduct.product_id]
          );
          if (productRows.length === 0) {
            console.error(`[CHECKOUT] \u274C Buy Now Product ID ${buyNowProduct.product_id} not found.`);
            throw new Error("PRODUCT_NOT_FOUND");
          }
          cartItems = [{
            ...productRows[0],
            quantity: buyNowProduct.quantity || 1
          }];
        } else {
          console.log(`[CHECKOUT] \u{1F6D2} Fetching cart items for User ID: ${user_id}`);
          const [rows] = await connection.execute(
            `SELECT cart.product_id, cart.quantity, p.price AS unit_price, p.name AS product_name, p.hsn_code, p.dealer_base_price, p.packaging_cost
                 FROM cart
                 INNER JOIN products p ON cart.product_id = p.product_id
                 WHERE cart.user_id = ?`,
            [user_id]
          );
          cartItems = rows;
        }
        if (cartItems.length === 0) {
          console.warn(`[CHECKOUT] \u26A0\uFE0F Cart is empty for User ID: ${user_id}`);
          throw new Error("CART_EMPTY");
        }
        console.log(`[CHECKOUT] \u2705 Cart items loaded: ${cartItems.length} item(s) found.`);
        let subtotal = 0;
        let totalLockedDealerPayout = 0;
        let totalPackagingCost = 0;
        for (const item of cartItems) {
          const itemTotal = item.quantity * Number(item.unit_price);
          const itemDealerCost = item.quantity * Number(item.dealer_base_price);
          const itemPackaging = item.quantity * Number(item.packaging_cost);
          subtotal += itemTotal;
          totalLockedDealerPayout += itemDealerCost;
          totalPackagingCost += itemPackaging;
          console.log(`[CHECKOUT_MATH] Item: ${item.product_name} | Qty: ${item.quantity} | Price: \u20B9${item.unit_price} | Dealer Base: \u20B9${item.dealer_base_price}`);
        }
        const totalAmount = subtotal;
        const dynamicPaymentId = `ORD-${Date.now()}`;
        const gatewayFee = totalAmount * 0.02 * 1.18;
        const netAdminProfit = totalAmount - totalLockedDealerPayout - totalPackagingCost - gatewayFee;
        console.log(`[CHECKOUT_SUMMARY] \u{1F4CA} Total: \u20B9${totalAmount} | Dealer Payout: \u20B9${totalLockedDealerPayout} | Packaging: \u20B9${totalPackagingCost} | Net Profit: \u20B9${netAdminProfit}`);
        console.log(`[CHECKOUT] \u{1F4DD} Inserting main order into database...`);
        const [orderResult] = await connection.execute(
          `INSERT INTO orders
                (user_id, total_amount, status, payment_id, payment_method, payment_status,
                 shipping_address, customer_email, address_id, subtotal, estimated_delivery, tracking_ref, gateway_fee, net_admin_profit)
             VALUES (?, ?, 'pending', ?, ?, 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user_id, totalAmount, dynamicPaymentId, method, shippingAddressFull, customerEmail, addressId, subtotal, estimatedDeliverySQL, sourcevisiter, gatewayFee, netAdminProfit]
        );
        const newOrderId = orderResult.insertId;
        console.log(`[CHECKOUT] \u2705 Order created successfully with Order ID: ${newOrderId}`);
        const invoiceYear = (/* @__PURE__ */ new Date()).getFullYear();
        const invoiceNumber = `KW-${invoiceYear}-${String(newOrderId).padStart(6, "0")}`;
        await connection.execute(`UPDATE orders SET invoice_number = ? WHERE order_id = ?`, [invoiceNumber, newOrderId]);
        console.log(`[CHECKOUT] \u{1F4C4} Invoice number generated: ${invoiceNumber}`);
        console.log(`[CHECKOUT] \u{1F4E6} Inserting order items and updating stock...`);
        for (const item of cartItems) {
          const itemDealerPayout = item.quantity * Number(item.dealer_base_price);
          console.log(`\u{1F50D} DEBUG ITEM -> Product ID: ${item.product_id}, Quantity: ${item.quantity}`);
          await connection.execute(
            `INSERT INTO orderitems (order_id, product_id, product_name, quantity, unit_price, hsn_code, discount, locked_dealer_payout)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [newOrderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.hsn_code || "N/A", 0, itemDealerPayout]
          );
          const [updateResult] = await connection.execute(
            `UPDATE products SET stock_qty = GREATEST(0, stock_qty - ?) WHERE product_id = ?`,
            [item.quantity, item.product_id]
          );
          console.log(`\u{1F4CA} UPDATE RESULT (Affected Rows): ${updateResult.affectedRows}`);
          if (myCache2) {
            myCache2.del(`product_${item.product_id}`);
            console.log(`[CHECKOUT] \u{1F9F9} Cache cleared for product ID: ${item.product_id}`);
          }
        }
        console.log(`[CHECKOUT] \u{1F4CC} Inserting initial order tracking status...`);
        await connection.execute(
          `INSERT INTO order_tracking (order_id, status, status_message)
             VALUES (?, 'Order Placed', 'Your order has been received and is pending verification.')`,
          [newOrderId]
        );
        if (!isBuyNow) {
          console.log(`[CHECKOUT] \u{1F5D1}\uFE0F Clearing cart for User ID: ${user_id}...`);
          await connection.execute("DELETE FROM cart WHERE user_id = ?", [user_id]);
        }
        await connection.commit();
        console.log(`[CHECKOUT] \u{1F389} Transaction committed successfully for Order ID: ${newOrderId}`);
        sendInvoiceEmail(newOrderId).catch((err) => console.error("[CRITICAL] Invoice email failed:", err));
        sendAdminOrderAlert(newOrderId).catch((err) => console.error("[CRITICAL] Admin alert email failed:", err));
        return {
          newOrderId,
          order_id: newOrderId,
          orderId: newOrderId,
          dynamicPaymentId,
          method
        };
      } catch (error) {
        console.error(`[CHECKOUT] \u274C Checkout failed, rolling back transaction. Error:`, error.message);
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
        console.log(`[CHECKOUT] \u{1F50C} Database connection released.`);
      }
    };
    module2.exports = { processCheckoutInDB };
  }
});

// src/controllers/Email.js
var require_Email = __commonJS({
  "src/controllers/Email.js"(exports2, module2) {
    var { sendEmailService, sendInvoiceEmail, getInvoiceHtml, sendAdminOrderAlert, sendStatusUpdateEmail } = require_emailService();
    var APP_NAME = process.env.APP_NAME || "Arzoo Saree";
    var isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    var sendContactEmail = async (req, res) => {
      const { name, email, message } = req.body;
      console.log(`[CONTACT] New inquiry -- name: ${name}, email: ${email}`);
      if (!name || !email || !message) {
        console.warn("[CONTACT] Failed -- missing required fields");
        return res.status(400).json({ success: false, message: "Name, email, and message are all required." });
      }
      if (!isValidEmail(email)) {
        console.warn(`[CONTACT] Failed -- invalid email format: ${email}`);
        return res.status(400).json({ success: false, message: "Please enter a valid email address." });
      }
      const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.GMAIL_USER;
      if (!receiverEmail) {
        console.error("[CONTACT] Missing both CONTACT_RECEIVER_EMAIL and GMAIL_USER env vars");
        return res.status(500).json({ success: false, message: "Server configuration error." });
      }
      try {
        await sendEmailService({
          to: receiverEmail,
          subject: `New Inquiry from ${APP_NAME} Website - ${name}`,
          html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ad3764;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong><br/> ${message}</p>
        </div>
      `
        });
        console.log(`[CONTACT] Email sent successfully -- from: ${email}`);
        return res.status(200).json({ success: true, message: "Your message has been sent!" });
      } catch (error) {
        console.error(`[CONTACT] Email send failed (from: ${email}):`, error.message);
        return res.status(500).json({ success: false, message: "Could not send your message. Please try again later." });
      }
    };
    var triggerInvoiceEmail = (order_id) => {
      return sendInvoiceEmail(order_id).catch(
        (err) => console.error(`[EMAIL] Invoice email failed -- order_id: ${order_id}:`, err.message)
      );
    };
    var triggerAdminOrderAlert = (order_id) => {
      return sendAdminOrderAlert(order_id).catch(
        (err) => console.error(`[EMAIL] Admin alert email failed -- order_id: ${order_id}:`, err.message)
      );
    };
    var sendOrderStatusEmail = async (req, res) => {
      const { order_id, status, customMessage, tracking_number } = req.body;
      if (!order_id || !status) {
        return res.status(400).json({ success: false, message: "Order ID and Status are required." });
      }
      try {
        await sendStatusUpdateEmail(order_id, status, customMessage, tracking_number);
        return res.status(200).json({ success: true, message: "Status email sent successfully." });
      } catch (error) {
        console.error(`[EMAIL] Status update email failed:`, error.message);
        return res.status(500).json({ success: false, message: "Failed to send status email." });
      }
    };
    var getInvoice = async (req, res) => {
      const userId = req.user.id;
      const orderId = parseInt(req.params.orderId, 10);
      if (isNaN(orderId) || orderId <= 0) {
        return res.status(400).json({ success: false, message: "A valid order id is required." });
      }
      try {
        const html = await getInvoiceHtml(userId, orderId);
        if (!html) {
          return res.status(404).json({ success: false, message: "Order not found." });
        }
        return res.status(200).type("html").send(html);
      } catch (error) {
        console.error(`[INVOICE] Failed to build bill for order ${orderId}:`, error.message);
        return res.status(500).json({ success: false, message: "Could not generate the bill." });
      }
    };
    module2.exports = {
      sendContactEmail,
      triggerInvoiceEmail,
      triggerAdminOrderAlert,
      getInvoice,
      sendOrderStatusEmail
    };
  }
});

// src/controllers/checkout.js
var require_checkout = __commonJS({
  "src/controllers/checkout.js"(exports2, module2) {
    var { processCheckoutInDB } = require_checkoutservice();
    var { triggerInvoiceEmail, triggerAdminOrderAlert } = require_Email();
    var processCheckout = async (req, res) => {
      const user_id = req.user.id;
      const { addressId, buyNowProduct, paymentMethod, tracking_ref } = req.body;
      console.log(`[CHECKOUT_CONTROLLER] \u{1F680} Checkout API hit -- User ID: ${user_id}, Address ID: ${addressId}, Payment: ${paymentMethod}`);
      if (!addressId) {
        console.warn(`[CHECKOUT_CONTROLLER] \u26A0\uFE0F Validation failed: Delivery address is missing.`);
        return res.status(400).json({ success: false, message: "Delivery address is required" });
      }
      try {
        const result = await processCheckoutInDB(user_id, addressId, buyNowProduct, paymentMethod, tracking_ref);
        if (result.method === "cod") {
          console.log(`[CHECKOUT_CONTROLLER] \u{1F4C4} COD order detected. Triggering invoice email for Order ID: ${result.newOrderId}...`);
          triggerInvoiceEmail(result.newOrderId).catch(
            (err) => console.error(`[CHECKOUT_CONTROLLER] \u274C Background Invoice Email Failed -- Order ID: ${result.newOrderId}:`, err.message)
          );
          triggerAdminOrderAlert(result.newOrderId).catch(
            (err) => console.error(`[CHECKOUT_CONTROLLER] \u274C Background Admin Alert Failed -- Order ID: ${result.newOrderId}:`, err.message)
          );
        }
        console.log(`[CHECKOUT_CONTROLLER] \u2705 Checkout successful -- Internal Order ID: ${result.newOrderId}`);
        return res.status(200).json({
          success: true,
          message: result.method === "cod" ? "Order placed and confirmation email sent!" : "Order created, proceed to payment",
          orderId: result.dynamicPaymentId,
          order_id: result.newOrderId,
          paymentMethod: result.method
        });
      } catch (error) {
        console.error(`[CHECKOUT_CONTROLLER] \u274C Checkout failed for User ID ${user_id}. Error:`, error.message);
        if (error.message === "ADDRESS_NOT_FOUND") return res.status(404).json({ success: false, message: "Delivery address not found." });
        if (error.message === "USER_NOT_FOUND") return res.status(404).json({ success: false, message: "User account not found." });
        if (error.message === "PRODUCT_NOT_FOUND") return res.status(404).json({ success: false, message: "Buy-now product not found." });
        if (error.message === "CART_EMPTY") return res.status(400).json({ success: false, message: "Your cart is empty." });
        if (error.message === "COD option is not available for this product." || error.message === "COD_NOT_ALLOWED_FOR_KOTA_DORIYA" || error.message === "Cash on Delivery has been completely disabled. Please choose Online Payment.") {
          return res.status(400).json({
            success: false,
            message: "COD option is not available for this product."
          });
        }
        return res.status(500).json({ success: false, message: error.message || "Checkout failed, please try again." });
      }
    };
    module2.exports = { processCheckout };
  }
});

// src/services/trackingservice.js
var require_trackingservice = __commonJS({
  "src/services/trackingservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var getOrderTrackingbydb = async (orderId) => {
      const [orderRow] = await db2.execute(
        "SELECT order_id, status, ordered_at FROM orders WHERE payment_id = ?",
        [orderId]
      );
      if (orderRow.length === 0) {
        console.warn(`[TRACKING] Not found -- payment_id: ${orderId}`);
        return { success: false, message: "Order not found." };
      }
      const internalId = orderRow[0].order_id;
      const [trackingHistory] = await db2.execute(
        "SELECT status, status_message, updated_at FROM order_tracking WHERE order_id = ? ORDER BY updated_at ASC",
        [internalId]
      );
      console.log(`[TRACKING] Fetch success -- order_id: ${internalId}, ${trackingHistory.length} milestone(s)`);
      return {
        success: true,
        currentStatus: orderRow[0].status,
        orderedAt: orderRow[0].ordered_at,
        history: trackingHistory
      };
    };
    var updateOrderStatusindb = async (orderId, newStatus, adminNote) => {
      const connection = await db2.getConnection();
      try {
        await connection.beginTransaction();
        const [updateResult] = await connection.execute(
          "UPDATE orders SET status = ? WHERE payment_id = ?",
          [newStatus, orderId]
        );
        if (updateResult.affectedRows === 0) {
          console.warn(`[TRACKING] Update failed -- payment_id ${orderId} not found`);
          await connection.rollback();
          return { success: false, message: "Target order record missing." };
        }
        const [orderRow] = await connection.execute(
          "SELECT order_id FROM orders WHERE payment_id = ?",
          [orderId]
        );
        const internalId = orderRow[0].order_id;
        await connection.execute(
          "INSERT INTO order_tracking (order_id, status, status_message) VALUES (?, ?, ?)",
          [internalId, newStatus, adminNote || null]
        );
        await connection.commit();
        console.log(`[TRACKING] Update success -- order_id: ${internalId} -> ${newStatus}`);
        return { success: true, message: "Order tracking status updated successfully!" };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    };
    module2.exports = { getOrderTrackingbydb, updateOrderStatusindb };
  }
});

// src/controllers/tracking.js
var require_tracking = __commonJS({
  "src/controllers/tracking.js"(exports2, module2) {
    var { getOrderTrackingbydb, updateOrderStatusindb } = require_trackingservice();
    var getOrderTracking = async (req, res) => {
      const { orderId } = req.params;
      console.log(`[TRACKING] Fetching tracking -- payment_id: ${orderId}`);
      try {
        const result = await getOrderTrackingbydb(orderId);
        if (!result.success) {
          return res.status(404).json(result);
        }
        return res.status(200).json(result);
      } catch (error) {
        console.error(`[TRACKING] Fetch error (payment_id: ${orderId}):`, error.message);
        return res.status(500).json({ success: false, error: "Failed to load tracking data." });
      }
    };
    var updateOrderStatus = async (req, res) => {
      const { orderId, newStatus, adminNote } = req.body;
      console.log(`[TRACKING] Admin update -- payment_id: ${orderId}, newStatus: ${newStatus}`);
      if (!orderId || !newStatus) {
        console.warn("[TRACKING] Update failed -- missing orderId or newStatus");
        return res.status(400).json({ success: false, message: "orderId and newStatus are required" });
      }
      try {
        const result = await updateOrderStatusindb(orderId, newStatus, adminNote);
        if (!result.success) {
          return res.status(404).json(result);
        }
        return res.status(200).json(result);
      } catch (error) {
        console.error(`[TRACKING] Update error (payment_id: ${orderId}):`, error.message);
        return res.status(500).json({ success: false, error: "Failed to update order tracking status." });
      }
    };
    module2.exports = { getOrderTracking, updateOrderStatus };
  }
});

// config/razorpay.js
var require_razorpay = __commonJS({
  "config/razorpay.js"(exports2, module2) {
    var Razorpay = require("razorpay");
    var razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    module2.exports = razorpay;
  }
});

// src/services/orderservice.js
var require_orderservice = __commonJS({
  "src/services/orderservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var { getFullImageUrl } = require_imageUtils();
    var razorpayInstance = require_razorpay();
    var myCache2 = require_cache();
    var crypto = require("crypto");
    var ORDER_SETTINGS = {
      DELIVERY_DAYS: 5,
      DEFAULT_SELLER_NAME: "Arzoo Saree",
      CURRENCY_CODE: "INR",
      LOCALE: "en-IN"
    };
    var adminorder = async () => {
      console.log("[ORDER_SERVICE] \u{1F5C4}\uFE0F Fetching all orders for Admin panel...");
      try {
        const [ordersData] = await db2.execute(
          `SELECT o.*, u.name AS user_name, u.phone AS customer_phone
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.user_id
             ORDER BY o.order_id DESC`
        );
        const [itemsData] = await db2.execute(
          `SELECT oi.*, p.name, p.image_url
             FROM orderitems oi
             INNER JOIN products p ON oi.product_id = p.product_id`
        );
        const formattedItems = itemsData.map((item) => ({
          ...item,
          image_url: getFullImageUrl(item.image_url)
        }));
        console.log(`[ORDER_SERVICE] \u2705 Admin Orders fetched: ${ordersData.length} orders, ${formattedItems.length} items.`);
        return {
          orders: ordersData,
          items: formattedItems
        };
      } catch (err) {
        console.error("[ORDER_SERVICE] \u274C Error in adminorder:", err.message);
        throw err;
      }
    };
    var updatestatusinDB = async (orderId, status) => {
      console.log(`[ORDER_SERVICE] \u{1F5C4}\uFE0F Updating status to '${status}' for Order ID: ${orderId}`);
      try {
        const updateQuery = "UPDATE orders SET status = ? WHERE order_id = ?";
        const [result] = await db2.execute(updateQuery, [status, orderId]);
        if (result.affectedRows === 0) {
          console.warn(`[ORDER_SERVICE] \u26A0\uFE0F Order ID ${orderId} not found for status update.`);
          throw new Error("ORDER_NOT_FOUND");
        }
        console.log(`[ORDER_SERVICE] \u2705 Status successfully updated for Order ID: ${orderId}`);
        return true;
      } catch (err) {
        console.error(`[ORDER_SERVICE] \u274C Error in updatestatusinDB:`, err.message);
        throw err;
      }
    };
    var getmyorderfromdb = async (user_id) => {
      console.log(`[ORDER_SERVICE] \u{1F5C4}\uFE0F Fetching orders for User ID: ${user_id}`);
      try {
        const [ordersData] = await db2.execute(
          `SELECT o.*, 
                    a.full_name AS delivery_name,
                    a.phone AS delivery_phone,
                    a.house_no,
                    a.road_area,
                    a.landmark,
                    a.city,
                    a.state,
                    a.pincode
             FROM orders o
             LEFT JOIN addresses a ON o.address_id = a.address_id
             WHERE o.user_id = ? AND o.payment_status != 'unpaid'
             ORDER BY o.ordered_at DESC`,
          [user_id]
        );
        if (ordersData.length === 0) {
          console.log(`[ORDER_SERVICE] \u2139\uFE0F No paid orders found for User ID: ${user_id}`);
          return { orders: [], items: [] };
        }
        const [itemsData] = await db2.execute(
          `SELECT oi.*, p.name, p.image_url, p.mrp, p.discount_percentage
             FROM orderitems oi
             INNER JOIN products p ON oi.product_id = p.product_id
             INNER JOIN orders o ON oi.order_id = o.order_id
             WHERE o.user_id = ? AND o.payment_status != 'unpaid'`,
          [user_id]
        );
        const formattedItems = itemsData.map((item) => ({
          ...item,
          image_url: getFullImageUrl(item.image_url)
        }));
        console.log(`[ORDER_SERVICE] \u2705 User Orders fetched: ${ordersData.length} valid orders found.`);
        return {
          orders: ordersData,
          items: formattedItems
        };
      } catch (err) {
        console.error(`[ORDER_SERVICE] \u274C Error in getmyorderfromdb:`, err.message);
        throw err;
      }
    };
    var createorders = async (order_id, user_id, tracking_ref) => {
      console.log(`[ORDER_SERVICE] \u{1F5C4}\uFE0F Creating Razorpay payment for Order ID: ${order_id}`);
      try {
        const sourcevisiter = tracking_ref && tracking_ref !== "undefined" ? tracking_ref : null;
        let orderRows;
        if (sourcevisiter) {
          [orderRows] = await db2.execute(
            "SELECT total_amount FROM orders WHERE order_id = ? AND user_id = ? AND tracking_ref = ?",
            [order_id, user_id, sourcevisiter]
          );
        } else {
          [orderRows] = await db2.execute(
            "SELECT total_amount, tracking_ref FROM orders WHERE order_id = ? AND user_id = ?",
            [order_id, user_id]
          );
        }
        if (orderRows.length === 0) {
          console.warn(`[ORDER_SERVICE] \u26A0\uFE0F Order not found for Razorpay creation (Order ID: ${order_id})`);
          throw new Error("ORDER_NOT_FOUND");
        }
        const totalAmount = orderRows[0].total_amount;
        const options = {
          amount: Math.round(Number(totalAmount) * 100),
          currency: "INR",
          receipt: `order_rcpt_${order_id}`
        };
        console.log(`[ORDER_SERVICE] Initiating Razorpay instance create order...`);
        const razorpayOrder = await razorpayInstance.orders.create(options);
        console.log(`[ORDER_SERVICE] Updating Razorpay Order ID in database...`);
        await db2.execute(
          "UPDATE orders SET razorpay_order_id = ? WHERE order_id = ?",
          [razorpayOrder.id, order_id]
        );
        console.log(`[ORDER_SERVICE] \u2705 Razorpay order created successfully: ${razorpayOrder.id}`);
        return {
          razorpay_order_id: razorpayOrder.id,
          currency: razorpayOrder.currency,
          amount: razorpayOrder.amount
        };
      } catch (err) {
        console.error(`[ORDER_SERVICE] \u274C Error in createorders:`, err.message);
        throw err;
      }
    };
    var ordercencel = async (orderId, userId) => {
      console.log(`[ORDER_SERVICE] \u{1F5C4}\uFE0F Attempting to cancel Order ID: ${orderId} for User ID: ${userId}`);
      const connection = await db2.getConnection();
      try {
        await connection.beginTransaction();
        const [orders] = await connection.execute(
          "SELECT status FROM orders WHERE order_id = ? AND user_id = ?",
          [orderId, userId]
        );
        if (orders.length === 0) {
          throw new Error("ORDER_NOT_FOUND");
        }
        const currentStatus = orders[0].status;
        if (currentStatus === "shipped" || currentStatus === "delivered") {
          throw new Error(`UNCANCELLABLE_STATE:${currentStatus}`);
        }
        if (currentStatus !== "cancelled") {
          await connection.execute(
            "UPDATE orders SET status = 'cancelled' WHERE order_id = ?",
            [orderId]
          );
          const [orderItems] = await connection.execute(
            "SELECT product_id, quantity FROM orderitems WHERE order_id = ?",
            [orderId]
          );
          if (orderItems && orderItems.length > 0) {
            for (const item of orderItems) {
              const prodId = Number(item.product_id);
              const qty = Number(item.quantity);
              await connection.execute(
                `UPDATE products SET stock_qty = COALESCE(stock_qty, 0) + ? WHERE product_id = ?`,
                [qty, prodId]
              );
              if (myCache2) {
                myCache2.flushAll();
              }
            }
          }
        }
        await connection.commit();
        console.log(`[ORDER_SERVICE] \u{1F389} Order ${orderId} cancelled successfully.`);
        return true;
      } catch (err) {
        await connection.rollback();
        console.error(`[ORDER_SERVICE] \u274C Error in ordercencel:`, err.message);
        throw err;
      } finally {
        connection.release();
      }
    };
    var getDetailedOrderById = async (orderId) => {
      console.log(`[ORDER_SERVICE] \u{1F5C4}\uFE0F Fetching MASTER details for Order ID: ${orderId}`);
      try {
        const orderQuery = `
            SELECT 
                o.*, 
                u.name as fetched_user_name, 
                u.email as fetched_user_email,
                a.full_name as addr_name, 
                a.phone as addr_phone, 
                a.alternate_phone, 
                a.house_no, 
                a.road_area, 
                a.landmark, 
                a.city, 
                a.state, 
                a.pincode
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.user_id
            LEFT JOIN addresses a ON o.address_id = a.address_id
            WHERE o.order_id = ?
        `;
        const [orderResult] = await db2.execute(orderQuery, [orderId]);
        if (orderResult.length === 0) {
          console.warn(`[ORDER_SERVICE] \u26A0\uFE0F Master details fetch failed: Order ${orderId} not found.`);
          return null;
        }
        const orderData = orderResult[0];
        orderData.shipping_address = {
          name: orderData.addr_name || orderData.fetched_user_name || "N/A",
          phone: orderData.addr_phone || orderData.phone || "N/A",
          alternate_phone: orderData.alternate_phone || "",
          house_no: orderData.house_no || "",
          road_area: orderData.road_area || "",
          landmark: orderData.landmark || "",
          city: orderData.city || "N/A",
          state: orderData.state || "N/A",
          pincode: orderData.pincode || "N/A",
          full_address: `${orderData.house_no || ""} ${orderData.road_area || ""}, ${orderData.city || ""}, ${orderData.state || ""} - ${orderData.pincode || ""}`.trim()
        };
        const itemsQuery = `
            SELECT 
                oi.*, 
                p.name as product_name, 
                p.image_url as product_image,
                p.mrp,
                p.dealer_base_price,
                p.packaging_cost,
                p.discount_percentage,
                c.name as category_name,
                s.subcategory_name,
                d.dealer_id,
                d.name as dealer_name,
                d.email as dealer_email,
                d.phone as dealer_phone,
                d.razorpay_linked_account_id
            FROM orderitems oi
            LEFT JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN subcategories s ON p.subcategory_id = s.subcategory_id
            LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
            WHERE oi.order_id = ?
        `;
        const transfersQuery = `SELECT id, transfer_id, dealer_id, amount, status, created_at FROM dealer_transfers WHERE order_id = ?`;
        const trackingQuery = `SELECT tracking_id, status, status_message, updated_at FROM order_tracking WHERE order_id = ? ORDER BY updated_at DESC`;
        const [itemsResult, transfersResult, trackingResult] = await Promise.all([
          db2.execute(itemsQuery, [orderId]),
          db2.execute(transfersQuery, [orderId]),
          db2.execute(trackingQuery, [orderId])
        ]);
        let totalDealerPayout = 0;
        const formattedItems = itemsResult[0].map((item) => {
          const sellingPrice = Number(item.unit_price) * Number(item.quantity);
          const dealerBase = Number(item.dealer_base_price || 0) * Number(item.quantity);
          const packingCost = Number(item.packaging_cost || 0) * Number(item.quantity);
          const razorpayFee = sellingPrice * 0.024;
          const remainingNetProfit = sellingPrice - (razorpayFee + packingCost + dealerBase);
          const adminShare = remainingNetProfit > 0 ? remainingNetProfit / 2 : 0;
          const dealerProfitShare = remainingNetProfit > 0 ? remainingNetProfit / 2 : 0;
          const totalDealerGets = dealerBase + dealerProfitShare;
          totalDealerPayout += totalDealerGets;
          return {
            ...item,
            image_url: getFullImageUrl(item.product_image),
            category_info: {
              category: item.category_name || "N/A",
              subcategory: item.subcategory_name || "N/A"
            },
            financials: {
              selling_price: sellingPrice.toFixed(2),
              razorpay_fee_cut: razorpayFee.toFixed(2),
              packaging_cut: packingCost.toFixed(2),
              dealer_base_price: dealerBase.toFixed(2),
              net_remaining_profit: remainingNetProfit.toFixed(2),
              admin_profit_50: adminShare.toFixed(2),
              dealer_profit_50: dealerProfitShare.toFixed(2),
              dealer_payout: totalDealerGets.toFixed(2)
            },
            dealer_info: {
              id: item.dealer_id,
              name: item.dealer_name || "Direct / No Dealer",
              email: item.dealer_email || "N/A",
              phone: item.dealer_phone || "N/A",
              razorpay_account: item.razorpay_linked_account_id || "N/A"
            }
          };
        });
        orderData.items = formattedItems;
        orderData.tracking_history = trackingResult[0];
        orderData.dealer_transfers = transfersResult[0];
        orderData.financial_summary = {
          total_order_value: Number(orderData.total_amount),
          gateway_fee: Number(orderData.gateway_fee),
          total_dealer_payout: totalDealerPayout,
          net_admin_profit: Number(orderData.net_admin_profit)
        };
        console.log(`[ORDER_SERVICE] \u2705 Master order details successfully compiled for Order ID: ${orderId}`);
        return orderData;
      } catch (err) {
        console.error(`[ORDER_SERVICE] \u274C Error in getDetailedOrderById:`, err.message);
        throw err;
      }
    };
    var getOrderSummaryData = async (userId, addressId, buyNowProductId = null, buyNowQty = 1) => {
      console.log(`[ORDER_SERVICE] \u{1F5C4}\uFE0F Fetching Order Summary (BuyNow: ${buyNowProductId || "No"})`);
      try {
        let addressData = null;
        if (addressId && addressId !== "undefined") {
          const [addrRows] = await db2.execute(
            `SELECT full_name, phone, house_no, road_area, landmark, city, state, pincode 
                 FROM addresses WHERE address_id = ? AND user_id = ?`,
            [addressId, userId]
          );
          addressData = addrRows.length > 0 ? addrRows[0] : null;
        }
        const [zoneRows] = await db2.execute(
          `SELECT min_days, max_days
             FROM shipping_zones
             WHERE LOWER(TRIM(state_name)) = LOWER(TRIM(?)) OR state_name = 'Default'
             ORDER BY (state_name = 'Default') ASC
             LIMIT 1`,
          [addressData && addressData.state || ""]
        );
        const maxDays = zoneRows.length > 0 ? Number(zoneRows[0].max_days) : ORDER_SETTINGS.DELIVERY_DAYS;
        const minDays = zoneRows.length > 0 ? Number(zoneRows[0].min_days) : maxDays;
        const minDeliveryDate = /* @__PURE__ */ new Date();
        minDeliveryDate.setDate(minDeliveryDate.getDate() + minDays);
        const maxDeliveryDate = /* @__PURE__ */ new Date();
        maxDeliveryDate.setDate(maxDeliveryDate.getDate() + maxDays);
        let cartItems = [];
        if (buyNowProductId) {
          const [buyNowRows] = await db2.execute(
            `SELECT p.product_id, p.name AS product_name, 
                        p.price AS unit_price, p.mrp, p.discount_percentage, p.image_url,
                        d.name AS seller_name, ? AS quantity
                 FROM products p
                 LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
                 WHERE p.product_id = ?`,
            [Number(buyNowQty) || 1, buyNowProductId]
          );
          cartItems = buyNowRows;
        } else {
          const [cartRows] = await db2.execute(
            `SELECT c.cart_id, c.quantity, p.product_id, p.name AS product_name, 
                        p.price AS unit_price, p.mrp, p.discount_percentage, p.image_url,
                        d.name AS seller_name
                 FROM cart c
                 INNER JOIN products p ON c.product_id = p.product_id
                 LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
                 WHERE c.user_id = ?`,
            [userId]
          );
          cartItems = cartRows;
        }
        let subtotal = 0;
        let totalMrp = 0;
        const formattedItems = cartItems.map((item) => {
          const unitPrice = Number(item.unit_price) || 0;
          const qty = Number(item.quantity) || 1;
          let mrp = Number(item.mrp) || unitPrice;
          let discountPercent = Number(item.discount_percentage) || 0;
          if (mrp <= unitPrice) {
            mrp = unitPrice;
            discountPercent = 0;
          }
          subtotal += unitPrice * qty;
          totalMrp += mrp * qty;
          return {
            ...item,
            image_url: getFullImageUrl(item.image_url),
            seller_name: item.seller_name || ORDER_SETTINGS.DEFAULT_SELLER_NAME,
            estimated_delivery_min: minDeliveryDate.toISOString(),
            estimated_delivery: maxDeliveryDate.toISOString(),
            mrp,
            unit_price: unitPrice,
            discount_percentage: discountPercent
          };
        });
        const totalDiscount = Math.max(0, totalMrp - subtotal);
        const deliveryCharge = 0;
        const totalPayable = subtotal + deliveryCharge;
        return {
          address: addressData,
          items: formattedItems,
          pricing: {
            total_mrp: totalMrp,
            total_discount: totalDiscount,
            delivery_charge: deliveryCharge,
            subtotal,
            total_payable: totalPayable
          },
          meta: {
            currency_code: ORDER_SETTINGS.CURRENCY_CODE,
            locale: ORDER_SETTINGS.LOCALE,
            delivery_min_days: minDays,
            delivery_days: maxDays
          }
        };
      } catch (err) {
        console.error("[ORDER_SERVICE] \u274C Error in getOrderSummaryData:", err.message);
        throw err;
      }
    };
    var getDeliveredOrderHistory = async (userId) => {
      console.log(`[ORDER_SERVICE] \u{1F4E6} Fetching Delivered History for User ID: ${userId}`);
      try {
        const [ordersData] = await db2.execute(
          `SELECT o.order_id, o.total_amount, o.ordered_at, o.status, 
                    o.tracking_awb_number, o.courier_partner
             FROM orders o
             WHERE o.user_id = ? AND o.status = 'delivered'
             ORDER BY o.ordered_at DESC`,
          [userId]
        );
        if (ordersData.length === 0) {
          console.log(`[ORDER_SERVICE] \u2139\uFE0F No delivered orders found for User ID: ${userId}`);
          return { orders: [], items: [] };
        }
        const [itemsData] = await db2.execute(
          `SELECT oi.*, p.name, p.image_url
             FROM orderitems oi
             INNER JOIN products p ON oi.product_id = p.product_id
             INNER JOIN orders o ON oi.order_id = o.order_id
             WHERE o.user_id = ? AND o.status = 'delivered'`,
          [userId]
        );
        const formattedItems = itemsData.map((item) => ({
          ...item,
          image_url: getFullImageUrl(item.image_url)
        }));
        console.log(`[ORDER_SERVICE] \u2705 Delivered History fetched: ${ordersData.length} orders found.`);
        return {
          orders: ordersData,
          items: formattedItems
        };
      } catch (err) {
        console.error(`[ORDER_SERVICE] \u274C Error in getDeliveredOrderHistory:`, err.message);
        throw err;
      }
    };
    var getAllUserOrdersListService = async () => {
      const query = `
    SELECT 
      o.order_id,
      o.total_amount,
      o.status AS order_status,
      u.user_id,
      u.name AS user_name,
      oi.product_id,
      oi.product_name,
      p.image_url AS product_image
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    LEFT JOIN orderitems oi ON o.order_id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.product_id
    ORDER BY o.order_id DESC
  `;
      const [rows] = await db2.promise().query(query);
      const ordersMap = /* @__PURE__ */ new Map();
      for (const row of rows) {
        if (!ordersMap.has(row.order_id)) {
          ordersMap.set(row.order_id, {
            order_id: row.order_id,
            order_status: row.order_status || "pending",
            total_amount: row.total_amount,
            user: {
              name: row.user_name || "Customer"
            },
            items: []
            // Frontend needs items[0] for the cover image
          });
        }
        const currentOrder = ordersMap.get(row.order_id);
        if (currentOrder.items.length === 0) {
          currentOrder.items.push({
            product_name: row.product_name,
            product_image: row.product_image
          });
        }
      }
      return Array.from(ordersMap.values());
    };
    var getSingleOrderDetailService = async (orderId) => {
      const query = `
    SELECT 
      o.order_id,
      o.total_amount,
      o.payment_id,
      o.status AS order_status,
      o.tracking_ref AS tracking_number,
      o.shipping_address AS checkout_address,
      o.ordered_at AS order_date,
      u.user_id,
      u.name AS user_name,
      u.email AS user_email,
      u.address AS profile_address,
      oi.quantity,
      oi.unit_price AS item_price,
      p.product_id,
      p.name AS product_name,
      p.image_url AS product_image
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    LEFT JOIN orderitems oi ON o.order_id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.product_id
    WHERE o.order_id = ?
  `;
      const [rows] = await db2.promise().query(query, [orderId]);
      if (rows.length === 0) return null;
      const orderDetail = {
        order_id: rows[0].order_id,
        order_status: rows[0].order_status || "pending",
        tracking_number: rows[0].tracking_number || null,
        total_amount: rows[0].total_amount,
        payment_id: rows[0].payment_id,
        order_date: rows[0].order_date,
        user: {
          id: rows[0].user_id,
          name: rows[0].user_name,
          email: rows[0].user_email,
          profile_address: rows[0].profile_address,
          checkout_address: rows[0].checkout_address
        },
        items: rows.map((row) => ({
          product_id: row.product_id,
          product_name: row.product_name,
          product_image: row.product_image,
          quantity: row.quantity,
          price: row.item_price
        }))
      };
      return orderDetail;
    };
    module2.exports = {
      adminorder,
      updatestatusinDB,
      getmyorderfromdb,
      createorders,
      ordercencel,
      getDetailedOrderById,
      getOrderSummaryData,
      getDeliveredOrderHistory,
      getAllUserOrdersListService,
      getSingleOrderDetailService
    };
  }
});

// src/controllers/order.js
var require_order = __commonJS({
  "src/controllers/order.js"(exports2, module2) {
    var {
      adminorder,
      updatestatusinDB,
      getmyorderfromdb,
      createorders,
      ordercencel,
      getDetailedOrderById,
      getOrderSummaryData,
      // markOutForDelivery,
      // markDeliveryAttemptFailed,
      // verifyDeliveryOtp
      getDeliveredOrderHistory,
      getAllUserOrdersListService,
      getSingleOrderDetailService
    } = require_orderservice();
    var getadminorder = async (req, res) => {
      console.log("[ORDER_CONTROLLER] \u{1F4E1} Admin requested all orders list.");
      try {
        const { orders, items } = await adminorder();
        const finalOrdersWithItems = orders.map((order) => ({
          ...order,
          items: items.filter((item) => item.order_id === order.order_id)
        }));
        console.log(`[ORDER_CONTROLLER] \u2705 Successfully compiled ${finalOrdersWithItems.length} orders for Admin.`);
        return res.status(200).json({ success: true, data: finalOrdersWithItems });
      } catch (error) {
        console.error("[ORDER_CONTROLLER] \u274C Error in getadminorder:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching orders", error: error.message });
      }
    };
    var updateOrderStatus = async (req, res) => {
      const orderId = req.params.id;
      const { status } = req.body;
      console.log(`[ORDER_CONTROLLER] \u{1F4E1} Admin request received to change Order ID: ${orderId} status to '${status}'`);
      try {
        const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
        if (!validStatuses.includes(status)) {
          console.warn(`[ORDER_CONTROLLER] \u26A0\uFE0F Invalid status value rejected: ${status}`);
          return res.status(400).json({ success: false, message: "Invalid status value" });
        }
        await updatestatusinDB(orderId, status);
        console.log(`[ORDER_CONTROLLER] \u2705 Status successfully updated in DB for Order ID: ${orderId}`);
        return res.status(200).json({ success: true, message: `Order status updated to ${status}` });
      } catch (error) {
        console.error("[ORDER_CONTROLLER] \u274C Error in updateOrderStatus:", error.message);
        if (error.message === "ORDER_NOT_FOUND") {
          return res.status(404).json({ success: false, message: "Order not found" });
        }
        return res.status(500).json({ success: false, message: "Failed to update order status" });
      }
    };
    var getmyorders = async (req, res) => {
      const user_id = req.user.id;
      console.log(`[ORDER_CONTROLLER] \u{1F4E1} Customer requested their orders -- User ID: ${user_id}`);
      try {
        const { orders, items } = await getmyorderfromdb(user_id);
        if (orders.length === 0) {
          console.log(`[ORDER_CONTROLLER] \u2139\uFE0F Zero orders found for User ID: ${user_id}`);
          return res.status(200).json({ success: true, message: "No orders found", data: [] });
        }
        console.log("[DEBUG_MRP] Pehla item DB se:", items[0]?.mrp, items[0]);
        const finalOrdersWithItems = orders.map((order) => ({
          ...order,
          items: items.filter((item) => item.order_id === order.order_id)
        }));
        console.log(`[ORDER_CONTROLLER] \u2705 Successfully fetched ${finalOrdersWithItems.length} orders for User ID: ${user_id}`);
        return res.status(200).json({ success: true, data: finalOrdersWithItems });
      } catch (error) {
        console.error(`[ORDER_CONTROLLER] \u274C Error in getmyorders for User ID ${user_id}:`, error.message);
        return res.status(500).json({ success: false, message: "Error fetching orders", error: error.message });
      }
    };
    var orderCreate = async (req, res) => {
      const { order_id, tracking_ref } = req.body;
      const user_id = req.user.id;
      console.log(`[ORDER_CONTROLLER] \u{1F4E1} Request to initialize Razorpay payment -- Internal Order ID: ${order_id}, User ID: ${user_id}`);
      try {
        if (!order_id) {
          console.warn("[ORDER_CONTROLLER] \u26A0\uFE0F Bad Request: order_id is missing.");
          return res.status(400).json({ success: false, message: "order_id is required" });
        }
        const razorpayData = await createorders(order_id, user_id, tracking_ref);
        console.log(`[ORDER_CONTROLLER] \u2705 Razorpay payment object generated -- Razorpay ID: ${razorpayData.razorpay_order_id}`);
        return res.status(200).json({
          success: true,
          razorpay_order_id: razorpayData.razorpay_order_id,
          currency: razorpayData.currency,
          amount: razorpayData.amount
        });
      } catch (error) {
        console.error("[ORDER_CONTROLLER] \u274C Error in orderCreate:", error.message);
        if (error.message === "ORDER_NOT_FOUND") {
          return res.status(404).json({ success: false, message: "Order not found or access denied" });
        }
        return res.status(500).json({ success: false, message: "Failed to create razorpay order", error: error.message });
      }
    };
    var cancelOrder = async (req, res) => {
      const orderId = req.params.id;
      const userId = req.userId || req.user && req.user.userId || req.user && req.user.id;
      console.log(`[ORDER_CONTROLLER] \u{1F4E1} Customer requested cancellation for Order ID: ${orderId} | User ID: ${userId}`);
      try {
        if (!userId) {
          console.error("[ORDER_CONTROLLER] \u274C Auth Error: User ID could not be extracted from token.");
          return res.status(401).json({ success: false, message: "Authentication Error: User ID missing" });
        }
        await ordercencel(orderId, userId);
        console.log(`[ORDER_CONTROLLER] \u2705 Order ID ${orderId} successfully cancelled.`);
        return res.status(200).json({ success: true, message: "Order cancelled successfully" });
      } catch (error) {
        console.error("[ORDER_CONTROLLER] \u274C Error in cancelOrder:", error.message);
        if (error.message === "ORDER_NOT_FOUND") {
          return res.status(404).json({ success: false, message: "Order not found or access denied" });
        }
        if (error.message.startsWith("UNCANCELLABLE_STATE")) {
          const status = error.message.split(":")[1];
          console.warn(`[ORDER_CONTROLLER] \u26A0\uFE0F Cancellation blocked. Current order state is already: ${status}`);
          return res.status(400).json({ success: false, message: `Order cannot be cancelled because it is already ${status}` });
        }
        return res.status(500).json({ success: false, message: "Failed to cancel order" });
      }
    };
    var getSingleOrderAdmin = async (req, res) => {
      const orderId = req.params.id;
      console.log(`[ORDER_CONTROLLER] \u{1F4E1} Admin requested financial deep-dive for Order ID: ${orderId}`);
      try {
        const orderDetails = await getDetailedOrderById(orderId);
        if (!orderDetails) {
          console.warn(`[ORDER_CONTROLLER] \u26A0\uFE0F Order not found for ID: ${orderId}`);
          return res.status(404).json({ success: false, message: "Order not found" });
        }
        console.log(`[ORDER_CONTROLLER] \u2705 Deep details and financials compiled successfully for Order ID: ${orderId}`);
        return res.status(200).json({ success: true, data: orderDetails });
      } catch (error) {
        console.error(`[ORDER_CONTROLLER] \u274C Error in getSingleOrderAdmin:`, error.message);
        return res.status(500).json({ success: false, message: "Server error while fetching order details", error: error.message });
      }
    };
    var getOrderSummary = async (req, res, next) => {
      try {
        const userId = req.user?.user_id || req.user?.id;
        const addressId = req.query.address_id;
        const buyNowProductId = req.query.buy_now_product_id;
        const buyNowQty = req.query.buy_now_qty || 1;
        if (!userId) {
          return res.status(401).json({ success: false, message: "Unauthorized access" });
        }
        console.log(`[CONTROLLER] \u{1F4CB} Fetching Order Summary for User: ${userId}`);
        const summaryData = await getOrderSummaryData(userId, addressId, buyNowProductId, buyNowQty);
        res.status(200).json({
          success: true,
          data: summaryData
        });
      } catch (error) {
        console.error("[CONTROLLER] \u274C Error fetching order summary:", error);
        res.status(500).json({ success: false, message: "Failed to fetch order summary" });
      }
    };
    var getDeliveredOrderHistoryController = async (req, res) => {
      try {
        const userId = req.user?.user_id || req.user?.id;
        if (!userId) {
          return res.status(401).json({ success: false, message: "Unauthorized access" });
        }
        console.log(`[CONTROLLER] \u{1F4E6} Fetching Delivered History for User: ${userId}`);
        const result = await getDeliveredOrderHistory(userId);
        return res.status(200).json({
          success: true,
          message: "Delivered orders fetched successfully",
          data: result
        });
      } catch (error) {
        console.error("[CONTROLLER] \u274C Error fetching delivered history:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch order history" });
      }
    };
    var getAllUserOrdersController = async (req, res) => {
      try {
        const orders = await getAllUserOrdersListService();
        return res.status(200).json({
          success: true,
          count: orders.length,
          data: orders
        });
      } catch (error) {
        console.error("Error fetching orders list:", error);
        return res.status(500).json({ success: false, message: "Server error" });
      }
    };
    var getSingleOrderController = async (req, res) => {
      try {
        const { id } = req.params;
        const orderDetails = await getSingleOrderDetailService(id);
        if (!orderDetails) {
          return res.status(404).json({ success: false, message: "Order not found" });
        }
        return res.status(200).json({
          success: true,
          data: orderDetails
        });
      } catch (error) {
        console.error(`Error fetching order detail for ID ${req.params.id}:`, error);
        return res.status(500).json({ success: false, message: "Server error" });
      }
    };
    module2.exports = {
      getadminorder,
      updateOrderStatus,
      getmyorders,
      orderCreate,
      cancelOrder,
      getSingleOrderAdmin,
      getOrderSummary,
      // markOutForDeliveryController,
      // markDeliveryAttemptFailedController,
      // verifyDeliveryOtpController
      getDeliveredOrderHistoryController,
      getAllUserOrdersController,
      getSingleOrderController
    };
  }
});

// src/router/order.js
var require_order2 = __commonJS({
  "src/router/order.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { processCheckout } = require_checkout();
    var { getOrderTracking } = require_tracking();
    var { courierWebhookController } = require_webhook();
    var { getCart } = require_cart();
    var { verifyToken, verifyAdmin } = require_authmiddleware();
    var { getInvoice } = require_Email();
    var {
      getadminorder,
      getmyorders,
      updateOrderStatus,
      orderCreate,
      cancelOrder,
      getSingleOrderAdmin,
      getOrderSummary,
      //     markOutForDeliveryController,
      //   verifyDeliveryOtpController,
      //   markDeliveryAttemptFailedController
      getDeliveredOrderHistoryController,
      getAllUserOrdersController,
      getSingleOrderController
    } = require_order();
    router.get("/summary", verifyToken, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F4CB} Route Triggered: GET /summary by User`);
      getOrderSummary(req, res, next);
    });
    router.use((req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F6E3}\uFE0F API Traffic Hit: [${req.method}] ${req.originalUrl}`);
      next();
    });
    console.log("[ORDER_ROUTES] \u{1F680} Order, Checkout & Admin Routes Initialized Successfully!");
    router.post("/checkout", verifyToken, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F6CD}\uFE0F Route Triggered: POST /checkout by User`);
      processCheckout(req, res, next);
    });
    router.get("/cart", verifyToken, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F6D2} Route Triggered: GET /cart by User`);
      getCart(req, res, next);
    });
    router.get("/my-orders", verifyToken, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F4E6} Route Triggered: GET /my-orders by User`);
      getmyorders(req, res, next);
    });
    router.post("/create-order", verifyToken, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F4B3} Route Triggered: POST /create-order by User`);
      orderCreate(req, res, next);
    });
    router.put("/:id/cancel", verifyToken, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F6AB} Route Triggered: PUT /${req.params.id}/cancel by User`);
      cancelOrder(req, res, next);
    });
    router.get("/tracking/:orderId", verifyToken, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F69A} Route Triggered: GET /tracking/${req.params.orderId}`);
      getOrderTracking(req, res, next);
    });
    router.get("/delivered-history", verifyToken, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F4E6} Route Triggered: GET /delivered-history by User`);
      getDeliveredOrderHistoryController(req, res, next);
    });
    router.get("/admin/all", verifyToken, verifyAdmin, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F451} Admin Route Triggered: GET /admin/all`);
      getadminorder(req, res, next);
    });
    router.get("/admin/order/:id", verifyToken, verifyAdmin, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F451} Admin Route Triggered: GET /admin/order/${req.params.id}`);
      getSingleOrderAdmin(req, res, next);
    });
    router.patch("/admin/status", verifyToken, verifyAdmin, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F451} Admin Route Triggered: PATCH /admin/status`);
      updateOrderStatus(req, res, next);
    });
    router.put("/:id/status", verifyToken, verifyAdmin, (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F451} Admin Route Triggered: PUT /${req.params.id}/status`);
      updateOrderStatus(req, res, next);
    });
    router.post("/webhook/courier", (req, res, next) => {
      console.log(`[ORDER_ROUTES] \u{1F69A} Webhook Route Triggered: POST /webhook/courier by 3PL`);
      courierWebhookController(req, res, next);
    });
    router.get("/invoice/:orderId", verifyToken, getInvoice);
    router.get("/userorders", verifyAdmin, getAllUserOrdersController);
    router.get(
      "/user-orders/:id",
      /* verifyAdmin, */
      getSingleOrderController
    );
    module2.exports = router;
  }
});

// src/services/reviewservice.js
var require_reviewservice = __commonJS({
  "src/services/reviewservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var UPLOADS_DIR = "uploads";
    var DEFAULT_PAGE_LIMIT = 10;
    var MAX_PAGE_LIMIT = 50;
    var MIN_RATING = 1;
    var MAX_RATING = 5;
    var MEDIA_TYPE_IMAGE = "image";
    var MEDIA_TYPE_VIDEO = "video";
    var HTTP_URL_PATTERN = /^https?:\/\//i;
    var VIDEO_EXTENSION_PATTERN = /\.(mp4|mov|webm|mkv|m4v|3gp)$/i;
    var parseSafeJsonArray = (val, fallbackAsSingleItem = false) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (Buffer.isBuffer(val)) val = val.toString("utf8");
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          if (!parsed) return [];
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed];
        } catch (e) {
          return fallbackAsSingleItem ? [val] : [];
        }
      }
      return [];
    };
    var serializeAttributes = (attributes) => {
      if (attributes === void 0 || attributes === null || attributes === "") return null;
      return typeof attributes === "string" ? attributes : JSON.stringify(attributes);
    };
    var assertValidRating = (rating) => {
      const value = Number(rating);
      if (!Number.isInteger(value) || value < MIN_RATING || value > MAX_RATING) {
        throw new Error("INVALID_RATING");
      }
      return value;
    };
    var normalizeMediaFiles = (mediaFiles) => {
      if (!mediaFiles) return [];
      if (Array.isArray(mediaFiles)) return mediaFiles.filter(Boolean);
      if (typeof mediaFiles === "object") {
        const looksLikeSingleFile = ["url", "location", "path", "filename"].some((key) => mediaFiles[key]);
        if (looksLikeSingleFile) return [mediaFiles];
        return Object.values(mediaFiles).flat().filter(Boolean);
      }
      return [];
    };
    var toStoredMediaUrl = (file) => {
      const slashFix = (value) => String(value).replace(/\\/g, "/").trim();
      const candidates = [file.url, file.location, file.fileUrl, file.secure_url, file.filename, file.path].filter(Boolean).map(slashFix);
      const absolute = candidates.find((value) => HTTP_URL_PATTERN.test(value));
      if (absolute) return absolute;
      if (file.path) {
        const diskPath = slashFix(file.path);
        const marker = diskPath.lastIndexOf(`${UPLOADS_DIR}/`);
        if (marker !== -1) return diskPath.slice(marker);
      }
      if (file.filename) return `${UPLOADS_DIR}/${slashFix(file.filename).replace(/^\/+/, "")}`;
      return candidates[0] || "";
    };
    var detectMediaType = (file, storedUrl) => {
      const mime = String(file.mimetype || "");
      if (mime.startsWith("video/")) return MEDIA_TYPE_VIDEO;
      if (mime.startsWith("image/")) return MEDIA_TYPE_IMAGE;
      const cleanUrl = String(storedUrl).split("?")[0];
      return VIDEO_EXTENSION_PATTERN.test(cleanUrl) ? MEDIA_TYPE_VIDEO : MEDIA_TYPE_IMAGE;
    };
    var insertReviewMedia = async (review_id, mediaFiles) => {
      const files = normalizeMediaFiles(mediaFiles);
      if (files.length === 0) return 0;
      const rows = [];
      for (const file of files) {
        const storedUrl = toStoredMediaUrl(file);
        if (!storedUrl) {
          console.warn("[REVIEW_SERVICE] Media file skipped, no usable URL. File keys:", Object.keys(file));
          continue;
        }
        rows.push([review_id, detectMediaType(file, storedUrl), storedUrl]);
      }
      if (rows.length === 0) return 0;
      const placeholders = rows.map(() => "(?, ?, ?)").join(", ");
      await db2.execute(
        `INSERT INTO review_media (review_id, media_type, media_url) VALUES ${placeholders}`,
        rows.flat()
      );
      return rows.length;
    };
    var REVIEW_COLUMNS_SQL = `
    pr.review_id, pr.rating, pr.title, pr.comment, pr.attributes_json,
    pr.is_verified_buyer, pr.helpful_votes, pr.created_at,
    u.name AS user_name,
    (
        SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('type', rm.media_type, 'url', rm.media_url)), '[]')
        FROM review_media rm WHERE rm.review_id = pr.review_id
    ) AS media
`;
    var mapReviewRow = (rev) => ({
      ...rev,
      attributes: parseSafeJsonArray(rev.attributes_json, true),
      media: parseSafeJsonArray(rev.media, false).filter((m) => m && m.url)
    });
    var addReviewInDB = async (product_id, user_id, rating, title, comment, attributes, mediaFiles) => {
      console.log(`[REVIEW_SERVICE] Adding review for Product ID: ${product_id} by User ID: ${user_id}`);
      try {
        const safeRating = assertValidRating(rating);
        const verifyQuery = `
            SELECT o.order_id
            FROM orders o
            JOIN orderitems oi ON o.order_id = oi.order_id
            WHERE o.user_id = ? AND oi.product_id = ?
            LIMIT 1
        `;
        const [orderCheck] = await db2.execute(verifyQuery, [user_id, product_id]);
        const is_verified_buyer = orderCheck.length > 0 ? 1 : 0;
        const order_id = orderCheck.length > 0 ? orderCheck[0].order_id : null;
        const insertQuery = `
            INSERT INTO product_reviews
            (product_id, user_id, order_id, rating, title, comment, attributes_json, is_verified_buyer)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [reviewResult] = await db2.execute(insertQuery, [
          product_id,
          user_id,
          order_id,
          safeRating,
          title || null,
          comment || null,
          serializeAttributes(attributes),
          is_verified_buyer
        ]);
        const review_id = reviewResult.insertId;
        try {
          const savedCount = await insertReviewMedia(review_id, mediaFiles);
          console.log(`[REVIEW_SERVICE] Media saved for review ${review_id}: ${savedCount}`);
        } catch (mediaErr) {
          console.error("[REVIEW_SERVICE] Media insert failed, rolling back review:", mediaErr.message);
          await db2.execute(`DELETE FROM product_reviews WHERE review_id = ?`, [review_id]);
          throw mediaErr;
        }
        console.log(`[REVIEW_SERVICE] Review added successfully with ID: ${review_id}`);
        return review_id;
      } catch (err) {
        console.error("[REVIEW_SERVICE] Error in addReviewInDB:", err.message);
        throw err;
      }
    };
    var getReviewsFromDB = async (product_id) => {
      console.log(`[REVIEW_SERVICE] Fetching reviews for Product ID: ${product_id}`);
      try {
        const statsQuery = `
            SELECT
                COUNT(*) as totalReviews,
                ROUND(AVG(rating), 1) as avgRating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars1
            FROM product_reviews WHERE product_id = ?
        `;
        const [statsResult] = await db2.execute(statsQuery, [product_id]);
        const rawStats = statsResult[0] || {};
        const stats = Object.fromEntries(
          Object.entries(rawStats).map(([key, value]) => [key, Number(value) || 0])
        );
        const reviewsQuery = `
            SELECT ${REVIEW_COLUMNS_SQL}
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u.user_id
            WHERE pr.product_id = ?
            ORDER BY pr.created_at DESC
        `;
        const [reviews] = await db2.execute(reviewsQuery, [product_id]);
        return { stats, reviews: reviews.map(mapReviewRow) };
      } catch (err) {
        console.error("[REVIEW_SERVICE] Error in getReviewsFromDB:", err.message);
        throw err;
      }
    };
    var incrementHelpfulCount = async (review_id) => {
      try {
        const updateQuery = `UPDATE product_reviews SET helpful_votes = helpful_votes + 1 WHERE review_id = ?`;
        const [result] = await db2.execute(updateQuery, [review_id]);
        return result.affectedRows > 0;
      } catch (err) {
        throw err;
      }
    };
    var getPaginatedReviewsFromDB = async (product_id, page = 1, limit = DEFAULT_PAGE_LIMIT, sortBy = "recent", filterRating = null, withMedia = false) => {
      try {
        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const safeLimit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_LIMIT));
        const offset = (safePage - 1) * safeLimit;
        const queryParams = [product_id];
        let baseCondition = `WHERE pr.product_id = ?`;
        const ratingFilter = Number(filterRating);
        if (Number.isInteger(ratingFilter) && ratingFilter >= MIN_RATING && ratingFilter <= MAX_RATING) {
          baseCondition += ` AND pr.rating = ?`;
          queryParams.push(ratingFilter);
        }
        if (withMedia === "true" || withMedia === true) {
          baseCondition += ` AND EXISTS (SELECT 1 FROM review_media rm WHERE rm.review_id = pr.review_id)`;
        }
        const countQuery = `SELECT COUNT(*) as total FROM product_reviews pr ${baseCondition}`;
        const [countResult] = await db2.execute(countQuery, queryParams);
        const totalReviews = Number(countResult[0].total) || 0;
        let dataQuery = `
            SELECT ${REVIEW_COLUMNS_SQL}
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u.user_id
            ${baseCondition}
        `;
        dataQuery += sortBy === "helpful" ? ` ORDER BY pr.helpful_votes DESC, pr.created_at DESC` : ` ORDER BY pr.created_at DESC`;
        dataQuery += ` LIMIT ? OFFSET ?`;
        const [reviews] = await db2.execute(dataQuery, [...queryParams, safeLimit, offset]);
        return {
          totalReviews,
          currentPage: safePage,
          totalPages: Math.ceil(totalReviews / safeLimit),
          reviews: reviews.map(mapReviewRow)
        };
      } catch (err) {
        throw err;
      }
    };
    var updateReviewInDB = async (review_id, user_id, rating, title, comment, attributes, mediaFiles) => {
      try {
        const safeRating = assertValidRating(rating);
        const checkQuery = `SELECT review_id FROM product_reviews WHERE review_id = ? AND user_id = ?`;
        const [checkRes] = await db2.execute(checkQuery, [review_id, user_id]);
        if (checkRes.length === 0) throw new Error("UNAUTHORIZED_OR_NOT_FOUND");
        const updateQuery = `
            UPDATE product_reviews
            SET rating = ?, title = ?, comment = ?, attributes_json = ?
            WHERE review_id = ?
        `;
        await db2.execute(updateQuery, [safeRating, title || null, comment || null, serializeAttributes(attributes), review_id]);
        await insertReviewMedia(review_id, mediaFiles);
        return true;
      } catch (err) {
        throw err;
      }
    };
    var deleteReviewFromDB = async (review_id, user_id) => {
      try {
        const checkQuery = `SELECT review_id FROM product_reviews WHERE review_id = ? AND user_id = ?`;
        const [checkRes] = await db2.execute(checkQuery, [review_id, user_id]);
        if (checkRes.length === 0) throw new Error("UNAUTHORIZED_OR_NOT_FOUND");
        await db2.execute(`DELETE FROM review_media WHERE review_id = ?`, [review_id]);
        await db2.execute(`DELETE FROM product_reviews WHERE review_id = ?`, [review_id]);
        return true;
      } catch (err) {
        throw err;
      }
    };
    module2.exports = {
      addReviewInDB,
      getReviewsFromDB,
      incrementHelpfulCount,
      getPaginatedReviewsFromDB,
      updateReviewInDB,
      deleteReviewFromDB
    };
  }
});

// src/controllers/review.js
var require_review = __commonJS({
  "src/controllers/review.js"(exports2, module2) {
    var {
      addReviewInDB,
      getReviewsFromDB,
      incrementHelpfulCount,
      getPaginatedReviewsFromDB,
      updateReviewInDB,
      deleteReviewFromDB
    } = require_reviewservice();
    var addReview = async (req, res) => {
      try {
        const product_id = req.params.product_id;
        const user_id = req.user.id;
        const { rating, title, comment, attributes } = req.body;
        const mediaFiles = req.files || [];
        console.log(`[REVIEW_CONTROLLER] \u{1F4DD} User ID ${user_id} adding review for Product ID ${product_id}`);
        if (!rating || rating < 1 || rating > 5) {
          return res.status(400).json({ success: false, message: "Valid rating (1-5) is required." });
        }
        const review_id = await addReviewInDB(product_id, user_id, rating, title, comment, attributes, mediaFiles);
        res.status(201).json({ success: true, message: "Review posted successfully!", review_id });
      } catch (error) {
        console.error("[REVIEW_CONTROLLER] \u274C Error adding review:", error.message);
        res.status(500).json({ success: false, message: "Failed to post review." });
      }
    };
    var getProductReviews = async (req, res) => {
      try {
        const { product_id } = req.params;
        console.log(`[REVIEW_CONTROLLER] \u{1F4CA} Fetching summary reviews for Product ID ${product_id}`);
        const result = await getReviewsFromDB(product_id);
        res.status(200).json({ success: true, ...result });
      } catch (error) {
        console.error("[REVIEW_CONTROLLER] \u274C Error fetching summary reviews:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch reviews." });
      }
    };
    var getAllProductReviews = async (req, res) => {
      try {
        const { product_id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || "recent";
        const filterRating = req.query.filterRating || null;
        const withMedia = req.query.withMedia === "true";
        console.log(`[REVIEW_CONTROLLER] \u{1F4DC} Fetching paginated reviews (Page: ${page}) for Product ID ${product_id}`);
        const result = await getPaginatedReviewsFromDB(product_id, page, limit, sortBy, filterRating, withMedia);
        res.status(200).json({ success: true, ...result });
      } catch (error) {
        console.error("[REVIEW_CONTROLLER] \u274C Error fetching paginated reviews:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch paginated reviews." });
      }
    };
    var markHelpful = async (req, res) => {
      try {
        const { review_id } = req.params;
        console.log(`[REVIEW_CONTROLLER] \u{1F44D} Marking review ID ${review_id} as helpful`);
        await incrementHelpfulCount(review_id);
        res.status(200).json({ success: true, message: "Review marked as helpful." });
      } catch (error) {
        console.error("[REVIEW_CONTROLLER] \u274C Error voting helpful:", error.message);
        res.status(500).json({ success: false, message: "Failed to update helpful votes." });
      }
    };
    var editReview = async (req, res) => {
      try {
        const { review_id } = req.params;
        const user_id = req.user.id;
        const { rating, title, comment, attributes } = req.body;
        const mediaFiles = req.files || [];
        console.log(`[REVIEW_CONTROLLER] \u270F\uFE0F User ID ${user_id} attempting to edit Review ID ${review_id}`);
        if (!rating || rating < 1 || rating > 5) {
          return res.status(400).json({ success: false, message: "Valid rating (1-5) is required." });
        }
        await updateReviewInDB(review_id, user_id, rating, title, comment, attributes, mediaFiles);
        res.status(200).json({ success: true, message: "Review updated successfully!" });
      } catch (error) {
        console.error("[REVIEW_CONTROLLER] \u274C Error editing review:", error.message);
        if (error.message === "UNAUTHORIZED_OR_NOT_FOUND") {
          return res.status(403).json({ success: false, message: "You are not authorized to edit this review." });
        }
        res.status(500).json({ success: false, message: "Failed to update review." });
      }
    };
    var deleteReview = async (req, res) => {
      try {
        const { review_id } = req.params;
        const user_id = req.user.id;
        console.log(`[REVIEW_CONTROLLER] \u{1F5D1}\uFE0F User ID ${user_id} attempting to delete Review ID ${review_id}`);
        await deleteReviewFromDB(review_id, user_id);
        res.status(200).json({ success: true, message: "Review deleted successfully!" });
      } catch (error) {
        console.error("[REVIEW_CONTROLLER] \u274C Error deleting review:", error.message);
        if (error.message === "UNAUTHORIZED_OR_NOT_FOUND") {
          return res.status(403).json({ success: false, message: "You are not authorized to delete this review." });
        }
        res.status(500).json({ success: false, message: "Failed to delete review." });
      }
    };
    module2.exports = {
      addReview,
      getProductReviews,
      getAllProductReviews,
      markHelpful,
      editReview,
      deleteReview
    };
  }
});

// src/router/review.js
var require_review2 = __commonJS({
  "src/router/review.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var {
      addReview,
      getProductReviews,
      getAllProductReviews,
      markHelpful,
      editReview,
      // 👈 Imported new controller
      deleteReview
    } = require_review();
    var { verifyToken } = require_authmiddleware();
    var upload = require_uploads();
    router.use((req, res, next) => {
      console.log(`[REVIEW_ROUTE] \u{1F6A6} [${req.method}] ${req.originalUrl}`);
      next();
    });
    router.get("/product/:product_id", getProductReviews);
    router.get("/product/:product_id/all", getAllProductReviews);
    router.put("/:review_id/helpful", markHelpful);
    router.post("/product/:product_id", verifyToken, upload.array("review_media", 5), addReview);
    router.put("/:review_id", verifyToken, upload.array("review_media", 5), editReview);
    router.delete("/:review_id", verifyToken, deleteReview);
    module2.exports = router;
  }
});

// src/router/checkout.js
var require_checkout2 = __commonJS({
  "src/router/checkout.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var checkoutController = require_checkout();
    var { verifyToken } = require_authmiddleware();
    router.use((req, res, next) => {
      console.log(`[CHECKOUT_ROUTES] \u{1F6E3}\uFE0F API Traffic Hit: [${req.method}] ${req.originalUrl}`);
      next();
    });
    console.log("[CHECKOUT_ROUTES] \u{1F6D2} Standalone Checkout Route Initialized!");
    router.post("/", verifyToken, (req, res, next) => {
      console.log(`[CHECKOUT_ROUTES] \u{1F680} Standalone Checkout POST hit.`);
      checkoutController.processCheckout(req, res, next);
    });
    module2.exports = router;
  }
});

// src/services/paymentservice.js
var require_paymentservice = __commonJS({
  "src/services/paymentservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var crypto = require("crypto");
    var { sendInvoiceEmail } = require_emailService();
    var myCache2 = require_cache();
    var verifyPaymentbydb = async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
      console.log(`[PAYMENT-SERVICE] \u{1F510} Verifying payment signature for Razorpay Order ID: ${razorpay_order_id}`);
      const connection = await db2.getConnection();
      try {
        const generated_signature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
        if (generated_signature !== razorpay_signature) {
          console.warn(`[PAYMENT-SERVICE] \u274C Invalid signature detected! Possible tampering for Order ID: ${razorpay_order_id}`);
          await connection.execute(
            "UPDATE orders SET payment_status = 'failed' WHERE razorpay_order_id = ?",
            [razorpay_order_id]
          );
          connection.release();
          return {
            success: false,
            reason: "invalid_signature",
            message: "Invalid signature, payment verification failed"
          };
        }
        console.log(`[PAYMENT-SERVICE] \u2705 Signature verified successfully! Finding internal order...`);
        await connection.beginTransaction();
        const [rows] = await connection.execute(
          "SELECT order_id, user_id FROM orders WHERE razorpay_order_id = ?",
          [razorpay_order_id]
        );
        if (rows.length === 0) {
          await connection.rollback();
          console.error(`[PAYMENT-SERVICE] \u274C No matching internal order found for Razorpay Order ID: ${razorpay_order_id}`);
          return {
            success: false,
            reason: "order_not_found",
            message: "No matching order found"
          };
        }
        const internalOrderId = rows[0].order_id;
        const userId = rows[0].user_id;
        console.log(`[PAYMENT-SERVICE] \u{1F504} Updating internal Order ID: ${internalOrderId} as PAID.`);
        await connection.execute(
          "UPDATE orders SET payment_status = 'paid', payment_id = ? WHERE razorpay_order_id = ?",
          [razorpay_payment_id, razorpay_order_id]
        );
        const [orderItems] = await connection.execute(
          "SELECT product_id, quantity FROM orderitems WHERE order_id = ?",
          [internalOrderId]
        );
        console.log(`[PAYMENT-SERVICE] \u{1F4E6} Deducting stock for Order ID: ${internalOrderId}...`);
        for (const item of orderItems) {
          await connection.execute(
            `UPDATE products SET stock_qty = GREATEST(0, stock_qty - ?) WHERE product_id = ?`,
            [item.quantity, item.product_id]
          );
          if (myCache2) {
            myCache2.del(`product_${item.product_id}`);
          }
        }
        console.log(`[PAYMENT-SERVICE] \u{1F5D1}\uFE0F Clearing cart for User ID: ${userId}...`);
        await connection.execute("DELETE FROM cart WHERE user_id = ?", [userId]);
        await connection.execute(
          `INSERT INTO order_tracking (order_id, status, status_message)
             VALUES (?, 'Payment Confirmed', 'Your payment has been successfully verified. We are processing your order.')`,
          [internalOrderId]
        );
        await connection.commit();
        console.log(`[PAYMENT-SERVICE] \u{1F389} Transaction committed successfully for Order ID: ${internalOrderId}`);
        console.log(`[PAYMENT-SERVICE] \u{1F4E7} Triggering invoice email for Order ID: ${internalOrderId}...`);
        sendInvoiceEmail(internalOrderId).catch(
          (err) => console.error(`[PAYMENT-SERVICE] \u274C Invoice email failed -- order_id: ${internalOrderId}:`, err.message)
        );
        return {
          success: true,
          message: "Payment successful"
        };
      } catch (err) {
        await connection.rollback();
        console.error(`[PAYMENT-SERVICE] \u274C Error in verifyPaymentbydb:`, err.message);
        throw err;
      } finally {
        connection.release();
      }
    };
    module2.exports = { verifyPaymentbydb };
  }
});

// src/controllers/payment.js
var require_payment = __commonJS({
  "src/controllers/payment.js"(exports2, module2) {
    var { verifyPaymentbydb } = require_paymentservice();
    var verifyPayment = async (req, res) => {
      try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const result = await verifyPaymentbydb(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (result.success) {
          return res.status(200).json(result);
        }
        if (result.reason === "order_not_found") {
          return res.status(404).json(result);
        }
        return res.status(400).json(result);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Payment verification failed",
          error: error.message
        });
      }
    };
    module2.exports = {
      verifyPayment
    };
  }
});

// src/router/payment.js
var require_payment2 = __commonJS({
  "src/router/payment.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { verifyPayment } = require_payment();
    var { razorpayWebhook: razorpayWebhook2 } = require_webhook();
    var { verifyToken } = require_authmiddleware();
    router.use((req, res, next) => {
      console.log(`[PAYMENT_ROUTES] \u{1F6E3}\uFE0F API Traffic Hit: [${req.method}] ${req.originalUrl}`);
      next();
    });
    console.log("[PAYMENT_ROUTES] \u{1F4B3} Webhook & Payment Verification Routes Initialized!");
    router.post("/webhook", (req, res, next) => {
      console.log(`[PAYMENT_ROUTES] \u{1F514} Webhook Route Hit from Razorpay Servers.`);
      razorpayWebhook2(req, res, next);
    });
    router.post("/verify", verifyToken, (req, res, next) => {
      console.log(`[PAYMENT_ROUTES] \u{1F510} Payment Verification Route Hit by User.`);
      verifyPayment(req, res, next);
    });
    module2.exports = router;
  }
});

// src/router/tracking.js
var require_tracking2 = __commonJS({
  "src/router/tracking.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var {
      getOrderTracking,
      updateOrderStatus
    } = require_tracking();
    router.get("/:orderId", getOrderTracking);
    router.post("/update", updateOrderStatus);
    module2.exports = router;
  }
});

// src/services/locationService.js
var require_locationService = __commonJS({
  "src/services/locationService.js"(exports2, module2) {
    var indiaData = {
      "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
      "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Sri Potti Sriramulu Nellore", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
      "Arunachal Pradesh": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey", "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", "Siang", "Upper Siang", "Lower Dibang Valley", "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"],
      "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup Metropolitan", "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
      "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
      "Chandigarh": ["Chandigarh"],
      "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
      "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
      "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
      "Goa": ["North Goa", "South Goa"],
      "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
      "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
      "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
      "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
      "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
      "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
      "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
      "Ladakh": ["Kargil", "Leh"],
      "Lakshadweep": ["Lakshadweep"],
      "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
      "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
      "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
      "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
      "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"],
      "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
      "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
      "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"],
      "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Tarn Taran"],
      "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
      "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
      "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
      "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
      "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
      "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
      "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
      "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"]
    };
    var getIndiaDataService = () => {
      return indiaData;
    };
    module2.exports = { getIndiaDataService };
  }
});

// src/controllers/location.js
var require_location = __commonJS({
  "src/controllers/location.js"(exports2, module2) {
    var { getIndiaDataService } = require_locationService();
    var getStatesDistricts = (req, res) => {
      try {
        const data = getIndiaDataService();
        return res.status(200).json(data);
      } catch (error) {
        console.error("[LOCATION] Error:", error);
        return res.status(500).json({ message: "Data fetch fail ho gaya" });
      }
    };
    module2.exports = {
      getStatesDistricts
    };
  }
});

// src/router/Location.js
var require_Location = __commonJS({
  "src/router/Location.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var locationController = require_location();
    router.get("/states-districts", locationController.getStatesDistricts);
    module2.exports = router;
  }
});

// src/services/addressservice.js
var require_addressservice = __commonJS({
  "src/services/addressservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var addressindb = async (userId, addressData) => {
      const {
        fullName,
        phone,
        alternatePhone,
        pincode,
        state,
        city,
        houseNo,
        roadArea,
        landmark
      } = addressData;
      const [existingAddress] = await db2.execute(
        `SELECT address_id FROM addresses 
         WHERE user_id = ? AND pincode = ? AND phone = ?`,
        [userId, pincode, phone]
      );
      if (existingAddress.length > 0) {
        console.log(`[ADDRESS] Duplicate found \u2014 reusing address_id: ${existingAddress[0].address_id} for user_id: ${userId}`);
        return { insertId: existingAddress[0].address_id, action: "reused" };
      }
      const [result] = await db2.execute(
        `INSERT INTO addresses
            (user_id, full_name, phone, alternate_phone, pincode, state, city, house_no, road_area, landmark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, fullName, phone, alternatePhone || null, pincode, state, city, houseNo, roadArea, landmark || null]
      );
      console.log(`[ADDRESS] New address saved \u2014 address_id: ${result.insertId}, user_id: ${userId}`);
      return { insertId: result.insertId, action: "inserted" };
    };
    var getmyaddressbydb = async (user_id) => {
      const [addresses] = await db2.execute(
        "SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
        [user_id]
      );
      console.log(`[ADDRESS] Found ${addresses.length} address(es) for user_id: ${user_id}`);
      return addresses;
    };
    var getaddressbyidindb = async (user_id, addressId) => {
      const [rows] = await db2.execute(
        "SELECT * FROM addresses WHERE address_id = ? AND user_id = ?",
        [addressId, user_id]
      );
      if (rows.length === 0) {
        console.warn(`[ADDRESS] Not found \u2014 address_id ${addressId} for user_id ${user_id}`);
        throw new Error("ADDRESS_NOT_FOUND");
      }
      ;
      return rows[0];
    };
    module2.exports = {
      addressindb,
      getaddressbyidindb,
      getmyaddressbydb
    };
  }
});

// src/controllers/Addresses.js
var require_Addresses = __commonJS({
  "src/controllers/Addresses.js"(exports2, module2) {
    var { addressindb, getaddressbyidindb, getmyaddressbydb } = require_addressservice();
    var addAddress = async (req, res) => {
      const userId = req.user.id;
      const data = req.body;
      const { fullName, phone, pincode, state, city, houseNo, roadArea } = data;
      console.log(`[ADDRESS] Add address \u2014 user_id: ${userId}, city: ${city}, pincode: ${pincode}`);
      if (!fullName || !phone || !pincode || !state || !city || !houseNo || !roadArea) {
        console.warn(`[ADDRESS] Add address failed \u2014 missing required fields (user_id: ${userId})`);
        return res.status(400).json({ success: false, message: "Please fill in all required address fields." });
      }
      try {
        const result = await addressindb(userId, data);
        console.log(`[ADDRESS] Address saved \u2014 address_id: ${result.insertId}, user_id: ${userId}`);
        return res.status(201).json({ success: true, addressId: result.insertId });
      } catch (error) {
        console.error(`[ADDRESS] Save error (user_id: ${userId}):`, error.message);
        return res.status(500).json({ success: false, message: "Failed to save address." });
      }
    };
    var getMyAddresses = async (req, res) => {
      const user_id = req.user.id;
      console.log(`[ADDRESS] Fetching all addresses \u2014 user_id: ${user_id}`);
      try {
        const addresses = await getmyaddressbydb(user_id);
        return res.status(200).json({ success: true, addresses });
      } catch (error) {
        console.error(`[ADDRESS] Fetch-all error (user_id: ${user_id}):`, error.message);
        return res.status(500).json({ success: false, message: "Failed to load addresses." });
      }
    };
    var getAddressById = async (req, res) => {
      const userId = req.user.id;
      const { addressId } = req.params;
      console.log(`[ADDRESS] Fetching address \u2014 user_id: ${userId}, address_id: ${addressId}`);
      try {
        const address = await getaddressbyidindb(userId, addressId);
        return res.status(200).json({ success: true, address });
      } catch (error) {
        console.error(`[ADDRESS] Fetch-by-id error (user_id: ${userId}):`, error.message);
        if (error.message === "ADDRESS_NOT_FOUND") {
          return res.status(404).json({ success: false, message: "Address not found or access denied." });
        }
        return res.status(500).json({ success: false, message: "Failed to load address." });
      }
    };
    module2.exports = { addAddress, getMyAddresses, getAddressById };
  }
});

// src/router/Addresses.js
var require_Addresses2 = __commonJS({
  "src/router/Addresses.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { addAddress, getMyAddresses, getAddressById } = require_Addresses();
    var { verifyToken } = require_authmiddleware();
    router.post("/", verifyToken, addAddress);
    router.get("/", verifyToken, getMyAddresses);
    router.get("/:addressId", verifyToken, getAddressById);
    module2.exports = router;
  }
});

// src/controllers/currency.js
var require_currency = __commonJS({
  "src/controllers/currency.js"(exports2, module2) {
    if (process.env.NODE_ENV !== "production") {
      require("dotenv").config();
    }
    var CURRENCY_API_URL = process.env.CURRENCY_API_URL || "https://fxapi.app/api/INR.json";
    var FLAG_CDN_BASE_URL = process.env.FLAG_CDN_BASE_URL || "https://flagcdn.com/w20";
    var currencychange = async (req, res) => {
      console.log(`[CURRENCY] Fetching rates from ${CURRENCY_API_URL}`);
      try {
        const response = await fetch(CURRENCY_API_URL);
        if (!response.ok) {
          throw new Error(`External API failed to load data with status: ${response.status}`);
        }
        const data = await response.json();
        const formattedData = {};
        for (const currencyCode in data.rates) {
          const currentRate = data.rates[currencyCode];
          const countryCode = currencyCode.slice(0, 2).toLowerCase();
          const flagUrl = `${FLAG_CDN_BASE_URL}/${countryCode}.png`;
          formattedData[currencyCode] = {
            rate: currentRate,
            flag: flagUrl
          };
        }
        console.log(`[CURRENCY] Success -- ${Object.keys(formattedData).length} currencies loaded`);
        return res.status(200).json(formattedData);
      } catch (error) {
        console.error("[CURRENCY] Fetch error:", error.message);
        return res.status(500).json({
          success: false,
          message: "There was a server error while fetching currency rates.",
          error: error.message
        });
      }
    };
    module2.exports = { currencychange };
  }
});

// src/router/currency.js
var require_currency2 = __commonJS({
  "src/router/currency.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { currencychange } = require_currency();
    router.get("/Rate-change", currencychange);
    module2.exports = router;
  }
});

// src/router/Email.js
var require_Email2 = __commonJS({
  "src/router/Email.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { sendContactEmail, sendOrderStatusEmail } = require_Email();
    router.post("/", sendContactEmail);
    router.post("/order-status", sendOrderStatusEmail);
    module2.exports = router;
  }
});

// src/services/bannerservice.js
var require_bannerservice = __commonJS({
  "src/services/bannerservice.js"(exports2, module2) {
    var db2 = require_mysql();
    var { getFullImageUrl } = require_imageUtils();
    var getbannerbydb = async () => {
      console.log("[BANNER_SERVICE] \u{1F5C4}\uFE0F Executing query to fetch active banners...");
      try {
        const [ROWS] = await db2.execute(
          "SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC"
        );
        const formattbanner = ROWS.map((banner) => ({
          ...banner,
          image_url: getFullImageUrl(banner.image_url),
          mobile_image_url: banner.mobile_image_url ? getFullImageUrl(banner.mobile_image_url) : null
        }));
        console.log(`[BANNER_SERVICE] \u2705 Formatted ${formattbanner.length} active banners.`);
        return formattbanner;
      } catch (err) {
        console.error("[BANNER_SERVICE] \u274C Error in getbannerbydb:", err.message);
        throw err;
      }
    };
    var getALLbannersAdminbydb = async () => {
      console.log("[BANNER_SERVICE] \u{1F5C4}\uFE0F Executing query to fetch all banners for admin...");
      try {
        const [ROWS] = await db2.execute(
          "SELECT * FROM banners ORDER BY display_order ASC"
        );
        const formattedBanners = ROWS.map((banner) => ({
          ...banner,
          image_url: getFullImageUrl(banner.image_url),
          mobile_image_url: banner.mobile_image_url ? getFullImageUrl(banner.mobile_image_url) : null
        }));
        console.log(`[BANNER_SERVICE] \u2705 Formatted ${formattedBanners.length} banners for admin.`);
        return formattedBanners;
      } catch (err) {
        console.error("[BANNER_SERVICE] \u274C Error in getALLbannersAdminbydb:", err.message);
        throw err;
      }
    };
    var createbannerindb = async (bannerdata, image_url, mobile_image_url) => {
      console.log("[BANNER_SERVICE] \u{1F5C4}\uFE0F Inserting new banner into database...");
      try {
        const { title, subtitle, button_text, button_link, display_order } = bannerdata;
        const [result] = await db2.execute(
          "INSERT INTO banners (image_url, mobile_image_url, title, subtitle, button_text, button_link, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            image_url,
            mobile_image_url || null,
            title || null,
            subtitle || null,
            button_text || null,
            button_link || null,
            display_order || 0,
            1
          ]
        );
        console.log(`[BANNER_SERVICE] \u2705 Banner inserted successfully. Insert ID: ${result.insertId}`);
        return result.insertId;
      } catch (err) {
        console.error("[BANNER_SERVICE] \u274C Error in createbannerindb:", err.message);
        throw err;
      }
    };
    var updatebannerindb = async (id, bannerdata, image_url, mobile_image_url) => {
      console.log(`[BANNER_SERVICE] \u{1F5C4}\uFE0F Updating banner ID: ${id} in database...`);
      try {
        const { title, subtitle, button_text, button_link, display_order, is_active } = bannerdata;
        let query = `UPDATE banners SET title=?, subtitle=?, button_text=?, button_link=?, display_order=?, is_active=?`;
        let params = [
          title || null,
          subtitle || null,
          button_text || null,
          button_link || null,
          display_order || 0,
          is_active ?? 1
        ];
        if (image_url) {
          console.log("[BANNER_SERVICE] Including new image_url in update query.");
          query += `, image_url=?`;
          params.push(image_url);
        }
        if (mobile_image_url) {
          console.log("[BANNER_SERVICE] Including new mobile_image_url in update query.");
          query += `, mobile_image_url=?`;
          params.push(mobile_image_url);
        }
        query += ` WHERE banner_id=?`;
        params.push(Number(id));
        const [result] = await db2.execute(query, params);
        if (result.affectedRows === 0) {
          console.warn(`[BANNER_SERVICE] \u26A0\uFE0F Banner not found for update with ID: ${id}`);
          throw new Error("BANNER_NOT_FOUND");
        }
        console.log(`[BANNER_SERVICE] \u2705 Banner ID ${id} updated successfully.`);
        return true;
      } catch (err) {
        console.error(`[BANNER_SERVICE] \u274C Error in updatebannerindb for ID ${id}:`, err.message);
        throw err;
      }
    };
    var deleteBannerindb = async (id) => {
      console.log(`[BANNER_SERVICE] \u{1F5C4}\uFE0F Deleting banner ID: ${id} from database...`);
      try {
        const [result] = await db2.execute("DELETE FROM banners WHERE banner_id = ?", [id]);
        if (result.affectedRows === 0) {
          console.warn(`[BANNER_SERVICE] \u26A0\uFE0F Banner not found for deletion with ID: ${id}`);
          throw new Error("BANNER_NOT_FOUND");
        }
        console.log(`[BANNER_SERVICE] \u2705 Banner ID ${id} deleted successfully.`);
        return true;
      } catch (err) {
        console.error(`[BANNER_SERVICE] \u274C Error in deleteBannerindb for ID ${id}:`, err.message);
        throw err;
      }
    };
    module2.exports = {
      deleteBannerindb,
      updatebannerindb,
      createbannerindb,
      getALLbannersAdminbydb,
      getbannerbydb
    };
  }
});

// src/controllers/banner.js
var require_banner = __commonJS({
  "src/controllers/banner.js"(exports2, module2) {
    var imagekit = require_imagekit();
    var {
      getbannerbydb,
      getALLbannersAdminbydb,
      createbannerindb,
      updatebannerindb,
      deleteBannerindb
    } = require_bannerservice();
    var uploadToImageKit = async (fileBuffer, fileName, folderPath) => {
      console.log(`[BANNER_CONTROLLER] \u{1F4E1} Starting ImageKit upload for: ${fileName}`);
      const base64String = fileBuffer.toString("base64");
      const uploadPromise = imagekit.files.upload({
        file: base64String,
        fileName,
        folder: folderPath
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("IMAGEKIT_TIMEOUT")), 15e3);
      });
      try {
        const result = await Promise.race([uploadPromise, timeoutPromise]);
        console.log(`[BANNER_CONTROLLER] \u2705 ImageKit upload success: ${result.url}`);
        return result;
      } catch (err) {
        console.error(`[BANNER_CONTROLLER] \u274C ImageKit upload failed:`, err.message);
        throw err;
      }
    };
    var getALLbanners = async (req, res) => {
      console.log("[BANNER_CONTROLLER] \u{1F4E1} Fetching active banners for frontend...");
      try {
        const ROWS = await getbannerbydb();
        console.log(`[BANNER_CONTROLLER] \u2705 Fetched ${ROWS.length} active banner(s)`);
        return res.status(200).json({ success: true, data: ROWS });
      } catch (err) {
        console.error("[BANNER_CONTROLLER] \u274C getALLbanners error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    };
    var getALLbannersAdmin = async (req, res) => {
      console.log("[BANNER_CONTROLLER] \u{1F4E1} Fetching all banners for Admin...");
      try {
        const ROWS = await getALLbannersAdminbydb();
        console.log(`[BANNER_CONTROLLER] \u2705 Fetched ${ROWS.length} total banner(s) for admin`);
        return res.status(200).json({ success: true, data: ROWS });
      } catch (err) {
        console.error("[BANNER_CONTROLLER] \u274C getALLbannersAdmin error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    };
    var createbanner = async (req, res) => {
      console.log("[BANNER_CONTROLLER] \u{1F4E1} Attempting to create new banner...");
      try {
        const desktopFile = req.files?.image?.[0] || req.file;
        const mobileFile = req.files?.mobile_image?.[0];
        if (!desktopFile) {
          console.warn("[BANNER_CONTROLLER] \u26A0\uFE0F Create failed -- desktop banner image is missing");
          return res.status(400).json({ success: false, message: "Desktop banner image is required" });
        }
        const desktopUploaded = await uploadToImageKit(
          desktopFile.buffer,
          `desktop-${Date.now()}-${desktopFile.originalname}`,
          "/arzoo-saree/banners"
        );
        const image_url = desktopUploaded.url;
        let mobile_image_url = null;
        if (mobileFile) {
          const mobileUploaded = await uploadToImageKit(
            mobileFile.buffer,
            `mobile-${Date.now()}-${mobileFile.originalname}`,
            "/arzoo-saree/banners"
          );
          mobile_image_url = mobileUploaded.url;
        }
        console.log("[BANNER_CONTROLLER] Saving banner data to database...");
        const insertId = await createbannerindb(req.body, image_url, mobile_image_url);
        console.log(`[BANNER_CONTROLLER] \u2705 Create success -- banner_id: ${insertId}`);
        return res.status(201).json({
          success: true,
          banner_id: insertId,
          message: "Banner successfully created with desktop & mobile assets!"
        });
      } catch (err) {
        console.error("[BANNER_CONTROLLER] \u274C createbanner error:", err.message);
        if (err.message === "IMAGEKIT_TIMEOUT") {
          return res.status(504).json({ success: false, message: "Image upload took too long. Please try a smaller image." });
        }
        return res.status(500).json({
          success: false,
          error: err.message,
          message: "Failed to create banner"
        });
      }
    };
    var updatebanner = async (req, res) => {
      const id = req.params.id;
      console.log(`[BANNER_CONTROLLER] \u{1F4E1} Attempting to update banner -- id: ${id}`);
      try {
        let image_url = null;
        let mobile_image_url = null;
        const desktopFile = req.files?.image?.[0] || req.file;
        const mobileFile = req.files?.mobile_image?.[0];
        if (desktopFile) {
          console.log(`[BANNER_CONTROLLER] New desktop image detected for update. Uploading to ImageKit...`);
          const uploaded = await uploadToImageKit(
            desktopFile.buffer,
            `desktop-${Date.now()}-${desktopFile.originalname}`,
            "/arzoo-saree/banners"
          );
          image_url = uploaded.url;
        } else {
          console.log(`[BANNER_CONTROLLER] \u2139\uFE0F Keeping existing desktop banner image.`);
        }
        if (mobileFile) {
          console.log(`[BANNER_CONTROLLER] New mobile image detected for update. Uploading to ImageKit...`);
          const uploaded = await uploadToImageKit(
            mobileFile.buffer,
            `mobile-${Date.now()}-${mobileFile.originalname}`,
            "/arzoo-saree/banners"
          );
          mobile_image_url = uploaded.url;
        } else {
          console.log(`[BANNER_CONTROLLER] \u2139\uFE0F Keeping existing mobile banner image.`);
        }
        await updatebannerindb(id, req.body, image_url, mobile_image_url);
        console.log(`[BANNER_CONTROLLER] \u2705 Update success -- banner_id: ${id}`);
        return res.status(200).json({
          success: true,
          message: "Banner updated successfully"
        });
      } catch (err) {
        console.error("[BANNER_CONTROLLER] \u274C updatebanner error:", err.message);
        if (err.message === "BANNER_NOT_FOUND") {
          return res.status(404).json({ success: false, message: "Banner not found" });
        }
        if (err.message === "IMAGEKIT_TIMEOUT") {
          return res.status(504).json({ success: false, message: "Image upload took too long. Please try again." });
        }
        return res.status(500).json({
          success: false,
          error: err.message,
          message: "Failed to update banner"
        });
      }
    };
    var deleteBanner = async (req, res) => {
      const { id } = req.params;
      console.log(`[BANNER_CONTROLLER] \u{1F4E1} Attempting to delete banner -- id: ${id}`);
      try {
        await deleteBannerindb(id);
        console.log(`[BANNER_CONTROLLER] \u2705 Delete success -- banner_id: ${id}`);
        return res.status(200).json({ success: true, message: "Banner deleted successfully" });
      } catch (err) {
        console.error(`[BANNER_CONTROLLER] \u274C Delete banner error (id: ${id}):`, err.message);
        if (err.message === "BANNER_NOT_FOUND") {
          return res.status(404).json({ success: false, message: "Banner not found or already deleted" });
        }
        return res.status(500).json({ success: false, message: "Failed to delete banner", error: err.message });
      }
    };
    module2.exports = {
      deleteBanner,
      updatebanner,
      createbanner,
      getALLbannersAdmin,
      getALLbanners
    };
  }
});

// src/router/banner.js
var require_banner2 = __commonJS({
  "src/router/banner.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var multer2 = require("multer");
    var bannercontroller = require_banner();
    var storage = multer2.memoryStorage();
    var upload = multer2({ storage });
    var uploadBannerFiles = upload.fields([
      { name: "image", maxCount: 1 },
      // Desktop Banner Image
      { name: "mobile_image", maxCount: 1 }
      // Mobile Banner Image
    ]);
    router.get("/", (req, res, next) => {
      console.log("[BANNER_ROUTER] \u{1F4E5} GET /api/banners -- Request received for active banners");
      next();
    }, bannercontroller.getALLbanners);
    router.get("/all", (req, res, next) => {
      console.log("[BANNER_ROUTER] \u{1F4E5} GET /api/banners/all -- Request received for admin banners");
      next();
    }, bannercontroller.getALLbannersAdmin);
    router.post("/", (req, res, next) => {
      console.log("[BANNER_ROUTER] \u{1F4E5} POST /api/banners -- Request received to create a new banner");
      next();
    }, uploadBannerFiles, bannercontroller.createbanner);
    router.put("/:id", (req, res, next) => {
      console.log(`[BANNER_ROUTER] \u{1F4E5} PUT /api/banners/${req.params.id} -- Request received to update banner`);
      next();
    }, uploadBannerFiles, bannercontroller.updatebanner);
    router.delete("/:id", (req, res, next) => {
      console.log(`[BANNER_ROUTER] \u{1F4E5} DELETE /api/banners/${req.params.id} -- Request received to delete banner`);
      next();
    }, bannercontroller.deleteBanner);
    module2.exports = router;
  }
});

// src/services/translationservice.js
var require_translationservice = __commonJS({
  "src/services/translationservice.js"(exports2, module2) {
    var NodeCache = require("node-cache");
    var { translate } = require("@vitalets/google-translate-api");
    var myCache2 = new NodeCache({ stdTTL: 86400 });
    var translateTextService = async (text, targetLanguage) => {
      const cacheKey = `trans_${targetLanguage}_${text}`;
      if (myCache2.has(cacheKey)) {
        console.log(`[TRANSLATE-SERVICE] Success (Served from CACHE) -- ${text.length} chars to ${targetLanguage}`);
        return { translatedText: myCache2.get(cacheKey) };
      }
      const result = await translate(text, { to: targetLanguage });
      console.log(`[TRANSLATE-SERVICE] Success (Fetched from API) -- ${text.length} chars translated to ${targetLanguage}`);
      myCache2.set(cacheKey, result.text);
      return { translatedText: result.text };
    };
    module2.exports = { translateTextService };
  }
});

// src/controllers/translation.js
var require_translation = __commonJS({
  "src/controllers/translation.js"(exports2, module2) {
    var { translateTextService } = require_translationservice();
    var translatetext = async (req, res) => {
      const { text, targetLanguage } = req.body;
      console.log(`[TRANSLATE] Request -- targetLanguage: ${targetLanguage}, textLength: ${text ? text.length : 0}`);
      try {
        if (!text || !targetLanguage) {
          console.warn("[TRANSLATE] Failed -- missing text or targetLanguage");
          return res.status(400).json({
            success: false,
            message: "Please provide both 'text' and 'targetLanguage'"
          });
        }
        const { translatedText } = await translateTextService(text, targetLanguage);
        return res.status(200).json({
          success: true,
          originalText: text,
          translatedText
        });
      } catch (error) {
        console.error(`[TRANSLATE] Error (targetLanguage: ${targetLanguage}):`, error.message);
        return res.status(500).json({
          success: false,
          message: "Server failed to translate text",
          error: error.message
        });
      }
    };
    module2.exports = { translatetext };
  }
});

// src/router/translate.js
var require_translate = __commonJS({
  "src/router/translate.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { translatetext } = require_translation();
    router.post("/", translatetext);
    module2.exports = router;
  }
});

// src/controllers/whatsapp.js
var require_whatsapp = __commonJS({
  "src/controllers/whatsapp.js"(exports2, module2) {
    var API_BASE_URL = process.env.VITE_API_URL || "https://arzoo-abjn.onrender.com";
    var sendFreeWhatsAppNotification = async (message) => {
      const phoneNumber = "919530060288";
      const apiKey = "YOUR_CALLMEBOT_API_KEY";
      try {
        const encodedMessage = encodeURIComponent(message);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodedMessage}&apikey=${apiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          console.log("[WHATSAPP] Free notification sent successfully!");
        } else {
          console.error("[WHATSAPP] Failed to send notification");
        }
      } catch (err) {
        console.error("[WHATSAPP] Error:", err.message);
      }
    };
    var registerUser = async (req, res) => {
      try {
        const { name, email, password } = req.body;
        await sendFreeWhatsAppNotification(
          `\u{1F464} *New User Signup!*

\u2022 Name: ${name}
\u2022 Email: ${email}`
        );
        return res.status(201).json({ success: true, message: "User registered successfully!" });
      } catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
    };
    var placeOrder = async (req, res) => {
      try {
        const { order_id, customer_name, total_amount } = req.body;
        await sendFreeWhatsAppNotification(
          `\u{1F6CD}\uFE0F *New Order Received!*

\u2022 Order ID: #${order_id}
\u2022 Customer: ${customer_name}
\u2022 Total: \u20B9${total_amount}`
        );
        return res.status(200).json({ success: true, message: "Order placed successfully!" });
      } catch (err) {
        console.error("Order error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
    };
    var redirectWhatsApp = (req, res) => {
      try {
        const phoneNumber = "919166293202";
        const productName = req.query.product || "Arzoo Saree";
        const productPrice = req.query.price || "";
        const productImage = req.query.image || "";
        const customText = req.query.text || "";
        let formattedMessage = `Hello! I am inquiring about this product:

`;
        formattedMessage += `\u{1F6CD}\uFE0F *Product:* ${productName}
`;
        if (productPrice) {
          formattedMessage += `\u{1F4B0} *Price:* ${productPrice}
`;
        }
        if (productImage) {
          formattedMessage += `\u{1F5BC}\uFE0F *Image Link:* ${productImage}
`;
        }
        if (customText) {
          formattedMessage += `
\u{1F4DD} *Details:* ${customText}
`;
        }
        const encodedMessage = encodeURIComponent(formattedMessage);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        res.redirect(whatsappUrl);
      } catch (error) {
        console.error("[WhatsApp API] Error:", error);
        res.status(500).send("Server Error");
      }
    };
    module2.exports = {
      redirectWhatsApp,
      sendFreeWhatsAppNotification,
      registerUser,
      placeOrder
    };
  }
});

// src/router/whatsapp.js
var require_whatsapp2 = __commonJS({
  "src/router/whatsapp.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { redirectWhatsApp } = require_whatsapp();
    router.get("/redirect", redirectWhatsApp);
    module2.exports = router;
  }
});

// src/services/Likes.service.js
var require_Likes_service = __commonJS({
  "src/services/Likes.service.js"(exports2, module2) {
    var db2 = require_mysql();
    var toggleLikeService = async (product_id, user_id) => {
      const [existing] = await db2.execute(
        "SELECT like_id FROM product_likes WHERE product_id = ? AND user_id = ?",
        [product_id, user_id]
      );
      let liked;
      if (existing.length > 0) {
        await db2.execute(
          "DELETE FROM product_likes WHERE product_id = ? AND user_id = ?",
          [product_id, user_id]
        );
        liked = false;
        console.log(`[LIKES] Unliked -- product_id: ${product_id}, user_id: ${user_id}`);
      } else {
        await db2.execute(
          "INSERT INTO product_likes (product_id, user_id) VALUES (?, ?)",
          [product_id, user_id]
        );
        liked = true;
        console.log(`[LIKES] Liked -- product_id: ${product_id}, user_id: ${user_id}`);
      }
      const [countResult] = await db2.execute(
        "SELECT COUNT(*) as total FROM product_likes WHERE product_id = ?",
        [product_id]
      );
      return { liked, totalLikes: countResult[0].total };
    };
    var getLikeStatusService = async (product_id, user_id) => {
      const [existing] = await db2.execute(
        "SELECT like_id FROM product_likes WHERE product_id = ? AND user_id = ?",
        [product_id, user_id]
      );
      const [countResult] = await db2.execute(
        "SELECT COUNT(*) as total FROM product_likes WHERE product_id = ?",
        [product_id]
      );
      return { liked: existing.length > 0, totalLikes: countResult[0].total };
    };
    module2.exports = { toggleLikeService, getLikeStatusService };
  }
});

// src/controllers/like.js
var require_like = __commonJS({
  "src/controllers/like.js"(exports2, module2) {
    var { toggleLikeService, getLikeStatusService } = require_Likes_service();
    var toggleLike = async (req, res) => {
      try {
        const { product_id } = req.params;
        const user_id = req.user.user_id || req.user.id;
        const result = await toggleLikeService(product_id, user_id);
        return res.status(200).json({
          success: true,
          message: result.liked ? "Liked" : "Unliked",
          isLiked: result.liked,
          totalLikes: result.totalLikes
        });
      } catch (error) {
        console.error("[LIKE CONTROLLER] Error toggling like:", error.message);
        return res.status(500).json({ success: false, message: "Server error" });
      }
    };
    var getLikeStatus = async (req, res) => {
      try {
        const { product_id } = req.params;
        const user_id = req.user ? req.user.user_id || req.user.id : 0;
        const result = await getLikeStatusService(product_id, user_id);
        return res.status(200).json({
          success: true,
          isLiked: result.liked,
          totalLikes: result.totalLikes
        });
      } catch (error) {
        console.error("[LIKE CONTROLLER] Error fetching status:", error.message);
        return res.status(500).json({ success: false, message: "Server error" });
      }
    };
    module2.exports = { toggleLike, getLikeStatus };
  }
});

// src/router/like.js
var require_like2 = __commonJS({
  "src/router/like.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { toggleLike, getLikeStatus } = require_like();
    var { verifyToken } = require_authmiddleware();
    router.post("/:product_id/like", verifyToken, toggleLike);
    router.get("/:product_id/like", verifyToken, getLikeStatus);
    module2.exports = router;
  }
});

// src/services/Comments.service.js
var require_Comments_service = __commonJS({
  "src/services/Comments.service.js"(exports2, module2) {
    var db2 = require_mysql();
    var addCommentService = async (product_id, user_id, comment_text) => {
      const [result] = await db2.execute(
        "INSERT INTO product_comments (product_id, user_id, comment_text) VALUES (?, ?, ?)",
        [product_id, user_id, comment_text]
      );
      console.log(`[COMMENTS] Added -- comment_id: ${result.insertId}, product_id: ${product_id}`);
      const [rows] = await db2.execute(
        `SELECT c.comment_id, c.product_id, c.user_id, u.name AS user_name, c.comment_text, c.created_at
         FROM product_comments c
         JOIN users u ON c.user_id = u.user_id
         WHERE c.comment_id = ?`,
        [result.insertId]
      );
      return rows[0];
    };
    var getCommentsService = async (product_id) => {
      const [rows] = await db2.execute(
        `SELECT c.comment_id, c.product_id, c.user_id, u.name AS user_name, c.comment_text, c.created_at
         FROM product_comments c
         JOIN users u ON c.user_id = u.user_id
         WHERE c.product_id = ?
         ORDER BY c.created_at DESC`,
        [product_id]
      );
      console.log(`[COMMENTS] Fetched ${rows.length} comment(s) -- product_id: ${product_id}`);
      return rows;
    };
    var deleteCommentService = async (comment_id, userId, userRole) => {
      const [comments] = await db2.execute(
        "SELECT user_id FROM product_comments WHERE comment_id = ?",
        [comment_id]
      );
      if (comments.length === 0) {
        return { success: false, message: "Comment not found." };
      }
      const commentOwnerId = comments[0].user_id;
      if (commentOwnerId !== userId && userRole !== "admin") {
        return { success: false, message: "Unauthorized to delete this comment." };
      }
      await db2.execute("DELETE FROM product_comments WHERE comment_id = ?", [comment_id]);
      console.log(`[COMMENTS] Deleted -- comment_id: ${comment_id}`);
      return { success: true };
    };
    module2.exports = { addCommentService, getCommentsService, deleteCommentService };
  }
});

// src/controllers/comments.js
var require_comments = __commonJS({
  "src/controllers/comments.js"(exports2, module2) {
    var { addCommentService, getCommentsService } = require_Comments_service();
    var addComment = async (req, res) => {
      const { product_id } = req.params;
      const user_id = req.user.id;
      const { comment_text } = req.body;
      console.log(`[COMMENTS] Add -- product_id: ${product_id}, user_id: ${user_id}`);
      if (!comment_text || !comment_text.trim()) {
        console.warn("[COMMENTS] Add failed -- empty comment_text");
        return res.status(400).json({ success: false, message: "Comment text is required." });
      }
      try {
        const comment = await addCommentService(product_id, user_id, comment_text.trim());
        return res.status(201).json({ success: true, comment });
      } catch (error) {
        console.error(`[COMMENTS] Add error (product_id: ${product_id}):`, error.message);
        return res.status(500).json({ success: false, message: "Failed to add comment.", error: error.message });
      }
    };
    var getComments = async (req, res) => {
      const { product_id } = req.params;
      console.log(`[COMMENTS] Fetch -- product_id: ${product_id}`);
      try {
        const comments = await getCommentsService(product_id);
        return res.status(200).json({ success: true, comments });
      } catch (error) {
        console.error(`[COMMENTS] Fetch error (product_id: ${product_id}):`, error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch comments.", error: error.message });
      }
    };
    module2.exports = { addComment, getComments };
  }
});

// src/router/comments.js
var require_comments2 = __commonJS({
  "src/router/comments.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { addComment, getComments } = require_comments();
    var { verifyToken } = require_authmiddleware();
    router.post("/:product_id/comments", verifyToken, addComment);
    router.get("/:product_id/comments", getComments);
    module2.exports = router;
  }
});

// src/services/dealer.Service.js
var require_dealer_Service = __commonJS({
  "src/services/dealer.Service.js"(exports2, module2) {
    var db2 = require_mysql();
    var { getFullImageUrl } = require_imageUtils();
    var getBasicDealerListDB = async () => {
      console.log("[DEALER_SERVICE] \u{1F4CB} [START] Fetching basic dealer list...");
      try {
        const [dealers] = await db2.execute(
          `SELECT dealer_id, name, email, phone, status, commission_percentage, image_url FROM dealers ORDER BY name ASC`
        );
        console.log(`[DEALER_SERVICE] \u{1F504} Formatting image URLs for ${dealers.length} dealers...`);
        const formattedDealers = dealers.map((dealer) => ({
          ...dealer,
          image_url: getFullImageUrl(dealer.image_url)
        }));
        console.log(`[DEALER_SERVICE] \u2705 [END] Successfully fetched and formatted ${formattedDealers.length} dealer(s).`);
        return formattedDealers;
      } catch (err) {
        console.error("[DEALER_SERVICE] \u274C Error in getBasicDealerListDB:", err.message);
        throw err;
      }
    };
    var fetchAdminDealerDetailService = async (dealerId) => {
      console.log(`[DEALER_SERVICE_DETAIL] \u{1F50D} [START] Fetching profile & inventory for Dealer ID: ${dealerId}...`);
      try {
        const [dealers] = await db2.execute(
          `SELECT dealer_id, name, email, phone, razorpay_linked_account_id, commission_percentage, status, created_at, image_url 
             FROM dealers WHERE dealer_id = ?`,
          [dealerId]
        );
        if (dealers.length === 0) {
          console.warn(`[DEALER_SERVICE_DETAIL] \u26A0\uFE0F Dealer not found with ID: ${dealerId}. Aborting service.`);
          return null;
        }
        const dealer = dealers[0];
        dealer.image_url = getFullImageUrl(dealer.image_url);
        const [products] = await db2.execute(
          `SELECT p.product_id, p.name, p.price, p.dealer_base_price, p.packaging_cost, p.stock_qty, p.image_url, 
                    p.mrp, p.discount_percentage, p.is_returnable, 
                    MAX(c.name) as category_name, 
                    MAX(sc.subcategory_name) as subcategory_name, 
                    MAX(oi.order_id) as order_id
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.category_id
             LEFT JOIN subcategories sc ON p.subcategory_id = sc.subcategory_id
             LEFT JOIN orderitems oi ON p.product_id = oi.product_id
             WHERE p.dealer_id = ?
             GROUP BY p.product_id, p.name, p.price, p.dealer_base_price, p.packaging_cost, p.stock_qty, p.image_url, 
                      p.mrp, p.discount_percentage, p.is_returnable`,
          [dealerId]
        );
        let total_inventory_mrp = 0;
        let total_dealer_base_value = 0;
        let total_potential_admin_profit = 0;
        const formattedProducts = products.map((prod) => {
          const stockQty = Number(prod.stock_qty || 0);
          const sellingPrice = Number(prod.price || 0);
          const packingCost = Number(prod.packaging_cost || 0);
          const dealerBase = Number(prod.dealer_base_price || 0);
          const razorpayFee = sellingPrice * 0.024;
          const remainingNetProfit = sellingPrice - (razorpayFee + packingCost + dealerBase);
          const adminShare = remainingNetProfit > 0 ? remainingNetProfit / 2 : 0;
          const dealerProfitShare = remainingNetProfit > 0 ? remainingNetProfit / 2 : 0;
          if (stockQty > 0) {
            total_inventory_mrp += sellingPrice * stockQty;
            total_dealer_base_value += dealerBase * stockQty;
            total_potential_admin_profit += adminShare * stockQty;
          }
          return {
            ...prod,
            dealer_base_price: dealerBase,
            packaging_cost: packingCost,
            breakdown: {
              selling_price: sellingPrice.toFixed(2),
              razorpay_fee_cut: razorpayFee.toFixed(2),
              packaging_cut: packingCost.toFixed(2),
              base_price_cut: dealerBase.toFixed(2),
              net_remaining_profit: remainingNetProfit.toFixed(2),
              admin_profit_50: adminShare.toFixed(2),
              dealer_profit_50: dealerProfitShare.toFixed(2),
              total_dealer_payout: (dealerBase + dealerProfitShare).toFixed(2)
            },
            image_url: getFullImageUrl(prod.image_url)
          };
        });
        console.log(`[DEALER_SERVICE_DETAIL] \u{1F9EE} Calculating Sold Items Accountability Summary...`);
        const [soldItemsResult] = await db2.execute(
          `SELECT 
                SUM(oi.quantity) as total_products_sold,
                SUM(oi.unit_price * oi.quantity) as total_revenue_sold,
                SUM(p.dealer_base_price * oi.quantity) as total_sold_dealer_payout
             FROM orderitems oi
             INNER JOIN products p ON oi.product_id = p.product_id
             INNER JOIN orders o ON oi.order_id = o.order_id
             WHERE p.dealer_id = ? AND o.status NOT IN ('cancelled', 'refunded')`,
          [dealerId]
        );
        const soldData = soldItemsResult[0] || {};
        const total_products_sold = Number(soldData.total_products_sold || 0);
        const total_revenue_sold = Number(soldData.total_revenue_sold || 0);
        const total_sold_dealer_payout = Number(soldData.total_sold_dealer_payout || 0);
        const total_gateway_fees_cut = total_revenue_sold * 0.02 * 1.18;
        const total_net_profit_sold = total_revenue_sold - total_sold_dealer_payout;
        console.log(`[DEALER_SERVICE_DETAIL] \u2705 Sold Summary -> Sold Qty: ${total_products_sold}, Revenue: \u20B9${total_revenue_sold}, Payout: \u20B9${total_sold_dealer_payout}, Razorpay Cut: \u20B9${total_gateway_fees_cut}, Gross Profit: \u20B9${total_net_profit_sold}`);
        return {
          dealer,
          products: formattedProducts,
          financial_summary: {
            total_inventory_mrp,
            total_dealer_base_value,
            total_potential_admin_profit
          },
          sold_financial_summary: {
            total_products_sold,
            total_revenue_sold,
            total_sold_dealer_payout,
            total_net_profit_sold,
            total_gateway_fees_cut
            // Passed to frontend to display
          }
        };
      } catch (err) {
        console.error(`[DEALER_SERVICE_DETAIL] \u274C Error processing details for dealer ${dealerId}:`, err.message);
        throw err;
      }
    };
    var addDealerDB = async (dealerData) => {
      console.log(`[DEALER_SERVICE] \u2795 Adding new dealer: ${dealerData.email}`);
      try {
        const { name, email, phone, razorpay_linked_account_id, commission_percentage, status, image_url } = dealerData;
        const [existingDealer] = await db2.execute(`SELECT email FROM dealers WHERE email = ?`, [email]);
        if (existingDealer.length > 0) {
          console.warn(`[DEALER_SERVICE] \u26A0\uFE0F Dealer with email ${email} already exists.`);
          throw new Error("A dealer with this email already exists in the system.");
        }
        const [result] = await db2.execute(
          `INSERT INTO dealers (name, email, phone, razorpay_linked_account_id, commission_percentage, status, image_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, email, phone || null, razorpay_linked_account_id || null, commission_percentage || 0, status || "active", image_url || null]
        );
        console.log(`[DEALER_SERVICE] \u2705 Dealer successfully added. ID: ${result.insertId}`);
        return result.insertId;
      } catch (err) {
        console.error("[DEALER_SERVICE] \u274C Error in addDealerDB:", err.message);
        throw err;
      }
    };
    var updateDealerDB = async (dealerId, dealerData) => {
      console.log(`[DEALER_SERVICE] \u{1F504} Updating dealer ID: ${dealerId}`);
      try {
        const { name, email, phone, razorpay_linked_account_id, commission_percentage, status, image_url } = dealerData;
        const [existing] = await db2.execute(`SELECT dealer_id FROM dealers WHERE dealer_id = ?`, [dealerId]);
        if (existing.length === 0) {
          throw new Error("Dealer not found in the system.");
        }
        if (image_url) {
          await db2.execute(
            `UPDATE dealers SET name = ?, email = ?, phone = ?, razorpay_linked_account_id = ?, commission_percentage = ?, status = ?, image_url = ? WHERE dealer_id = ?`,
            [name, email, phone || null, razorpay_linked_account_id || null, commission_percentage || 0, status || "active", image_url, dealerId]
          );
        } else {
          await db2.execute(
            `UPDATE dealers 
                 SET name = ?, email = ?, phone = ?, razorpay_linked_account_id = ?, commission_percentage = ?, status = ? 
                 WHERE dealer_id = ?`,
            [name, email, phone || null, razorpay_linked_account_id || null, commission_percentage || 0, status || "active", dealerId]
          );
        }
        console.log(`[DEALER_SERVICE] \u2705 Dealer ID: ${dealerId} successfully updated.`);
        return true;
      } catch (err) {
        console.error(`[DEALER_SERVICE] \u274C Error in updateDealerDB for ID ${dealerId}:`, err.message);
        throw err;
      }
    };
    module2.exports = {
      getBasicDealerListDB,
      fetchAdminDealerDetailService,
      addDealerDB,
      updateDealerDB
    };
  }
});

// src/controllers/dealer.js
var require_dealer = __commonJS({
  "src/controllers/dealer.js"(exports2, module2) {
    var dealerService = require_dealer_Service();
    var imagekit = require_imagekit();
    var uploadToImageKit = async (fileBuffer, fileName, folderPath) => {
      console.log(`[IMAGEKIT] Starting upload for file: ${fileName} to folder: ${folderPath}`);
      const base64String = fileBuffer.toString("base64");
      const uploadPromise = imagekit.files.upload({
        file: base64String,
        fileName,
        folder: folderPath
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("IMAGEKIT_TIMEOUT")), 15e3);
      });
      try {
        const result = await Promise.race([uploadPromise, timeoutPromise]);
        console.log(`[IMAGEKIT] \u2705 Upload success: ${result.url}`);
        return result;
      } catch (err) {
        console.error(`[IMAGEKIT] \u274C Upload failed for ${fileName}:`, err.message);
        throw err;
      }
    };
    var getBasicDealerList = async (req, res) => {
      console.log("[DEALER_CONTROLLER] \u{1F680} HTTP GET request received for basic dealer list.");
      try {
        const dealers = await dealerService.getBasicDealerListDB();
        console.log(`[DEALER_CONTROLLER] \u2705 Response: Returning ${dealers.length} dealer(s).`);
        return res.status(200).json({ success: true, dealers });
      } catch (error) {
        console.error("[DEALER_CONTROLLER] \u274C Server Exception in getBasicDealerList:", error.message);
        console.error("[DEALER_CONTROLLER] Stack Trace:", error.stack);
        return res.status(500).json({ success: false, message: "Failed to fetch dealers", error: error.message });
      }
    };
    var getAdminDealerDetail = async (req, res) => {
      const dealerId = req.params.id;
      console.log(`[DEALER_CONTROLLER] \u{1F680} HTTP GET request received for Admin Dealer Detail. ID: ${dealerId}`);
      if (!dealerId || isNaN(dealerId)) {
        console.warn(`[DEALER_CONTROLLER] \u26A0\uFE0F Invalid Dealer ID provided: ${dealerId}`);
        return res.status(400).json({ success: false, message: "Invalid or missing Dealer ID." });
      }
      try {
        console.log(`[DEALER_CONTROLLER] \u{1F504} Calling fetchAdminDealerDetailService...`);
        const result = await dealerService.fetchAdminDealerDetailService(dealerId);
        if (!result) {
          console.warn(`[DEALER_CONTROLLER] \u26A0\uFE0F Response: Dealer not found for ID: ${dealerId}`);
          return res.status(404).json({ success: false, message: "Dealer not found" });
        }
        console.log(`[DEALER_CONTROLLER] \u2705 Response: Successfully sending dealer profile & inventory data.`);
        return res.status(200).json({
          success: true,
          data: result
        });
      } catch (err) {
        console.error(`[DEALER_CONTROLLER] \u274C Server Exception in getAdminDealerDetail for ID ${dealerId}:`, err.message);
        console.error("[DEALER_CONTROLLER] Stack Trace:", err.stack);
        return res.status(500).json({
          success: false,
          message: "Server error while fetching dealer details",
          error: err.message
        });
      }
    };
    var createNewDealer = async (req, res) => {
      console.log("[DEALER_CONTROLLER] \u{1F680} HTTP POST request received to Add New Dealer.");
      console.log("[DEALER_CONTROLLER] \u{1F4E6} Payload received:", req.body);
      console.log("[DEALER_CONTROLLER] \u{1F5BC}\uFE0F File received:", req.file ? req.file.originalname : "none");
      const { name, email } = req.body;
      if (!name || !email) {
        console.warn("[DEALER_CONTROLLER] \u26A0\uFE0F Validation Failed: Name and Email are required.");
        return res.status(400).json({ success: false, message: "Dealer Name and Email are required." });
      }
      try {
        let image_url = null;
        if (req.file) {
          console.log("[DEALER_CONTROLLER] \u{1F504} Uploading dealer image to ImageKit...");
          const uploadResponse = await uploadToImageKit(
            req.file.buffer,
            `dealer_${Date.now()}-${req.file.originalname}`,
            "/arzoo-saree/dealers"
          );
          image_url = uploadResponse.url;
        } else {
          console.log("[DEALER_CONTROLLER] \u2139\uFE0F No image file provided -- dealer will have no photo.");
        }
        const dealerPayload = { ...req.body, image_url };
        console.log("[DEALER_CONTROLLER] \u{1F504} Calling addDealerDB service...");
        const newDealerId = await dealerService.addDealerDB(dealerPayload);
        console.log(`[DEALER_CONTROLLER] \u2705 Response: Dealer created successfully. ID: ${newDealerId}`);
        return res.status(201).json({
          success: true,
          message: "Dealer added successfully!",
          dealerId: newDealerId
        });
      } catch (error) {
        console.error("[DEALER_CONTROLLER] \u274C Server Exception in createNewDealer:", error.message);
        console.error("[DEALER_CONTROLLER] Stack Trace:", error.stack);
        if (error.message === "IMAGEKIT_TIMEOUT") {
          return res.status(504).json({ success: false, message: "Image upload took too long. Please try a smaller image." });
        }
        if (error.message.includes("already exists")) {
          return res.status(409).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: "Server error while adding new dealer.", error: error.message });
      }
    };
    var updateExistingDealer = async (req, res) => {
      const dealerId = req.params.id;
      console.log(`[DEALER_CONTROLLER] \u{1F680} HTTP PUT request received to Update Dealer ID: ${dealerId}`);
      console.log("[DEALER_CONTROLLER] \u{1F4E6} Payload received:", req.body);
      console.log("[DEALER_CONTROLLER] \u{1F5BC}\uFE0F New File received:", req.file ? req.file.originalname : "none");
      const { name, email } = req.body;
      if (!dealerId || isNaN(dealerId)) {
        console.warn(`[DEALER_CONTROLLER] \u26A0\uFE0F Invalid Dealer ID provided: ${dealerId}`);
        return res.status(400).json({ success: false, message: "Invalid or missing Dealer ID." });
      }
      if (!name || !email) {
        console.warn("[DEALER_CONTROLLER] \u26A0\uFE0F Validation Failed: Name and Email are required.");
        return res.status(400).json({ success: false, message: "Dealer Name and Email are required." });
      }
      try {
        let image_url = null;
        if (req.file) {
          console.log("[DEALER_CONTROLLER] \u{1F504} Uploading new dealer image to ImageKit...");
          const uploadResponse = await uploadToImageKit(
            req.file.buffer,
            `dealer_update_${Date.now()}-${req.file.originalname}`,
            "/arzoo-saree/dealers"
          );
          image_url = uploadResponse.url;
        }
        const dealerPayload = { ...req.body, image_url };
        await dealerService.updateDealerDB(dealerId, dealerPayload);
        console.log(`[DEALER_CONTROLLER] \u2705 Response: Dealer ID ${dealerId} updated successfully.`);
        return res.status(200).json({
          success: true,
          message: "Dealer updated successfully!"
        });
      } catch (error) {
        console.error(`[DEALER_CONTROLLER] \u274C Server Exception in updateExistingDealer for ID ${dealerId}:`, error.message);
        console.error("[DEALER_CONTROLLER] Stack Trace:", error.stack);
        if (error.message === "IMAGEKIT_TIMEOUT") {
          return res.status(504).json({ success: false, message: "Image upload timeout. Please try again." });
        }
        if (error.message.includes("not found")) {
          return res.status(404).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: "Server error while updating dealer.", error: error.message });
      }
    };
    module2.exports = {
      getBasicDealerList,
      getAdminDealerDetail,
      createNewDealer,
      updateExistingDealer
    };
  }
});

// src/router/dealer.js
var require_dealer2 = __commonJS({
  "src/router/dealer.js"(exports2, module2) {
    var express2 = require("express");
    var router = express2.Router();
    var { verifyToken, verifyAdmin } = require_authmiddleware();
    var {
      getBasicDealerList,
      getAdminDealerDetail,
      createNewDealer,
      updateExistingDealer
    } = require_dealer();
    var multer2 = require("multer");
    var storage = multer2.memoryStorage();
    var upload = multer2({ storage });
    router.use((req, res, next) => {
      console.log(`[DEALER_ROUTER] \u{1F310} Incoming Request -> Method: ${req.method} | URL: ${req.originalUrl}`);
      next();
    });
    router.get("/admin/all", verifyToken, verifyAdmin, (req, res, next) => {
      console.log(`[DEALER_ROUTER] \u{1F6E1}\uFE0F Admin route triggered: Fetching Master Dealer Report.`);
      next();
    }, getBasicDealerList);
    router.get("/admin/dealer/:id", verifyToken, verifyAdmin, (req, res, next) => {
      console.log(`[DEALER_ROUTER] \u{1F6E1}\uFE0F Admin route triggered for Dealer ID: ${req.params.id}`);
      next();
    }, getAdminDealerDetail);
    router.post("/admin/add", verifyToken, verifyAdmin, upload.single("image"), (req, res, next) => {
      console.log(`[DEALER_ROUTER] \u{1F6E1}\uFE0F Admin route triggered: Add New Dealer with Image`);
      next();
    }, createNewDealer);
    router.put("/admin/update/:id", verifyToken, verifyAdmin, upload.single("image"), (req, res, next) => {
      console.log(`[DEALER_ROUTER] \u{1F6E1}\uFE0F Admin route triggered: Update Dealer ID: ${req.params.id}`);
      next();
    }, updateExistingDealer);
    module2.exports = router;
  }
});

// server.js
require("dotenv").config();
var express = require("express");
var morgan = require("morgan");
var cors = require("cors");
var path = require("path");
var http = require("http");
var { Server } = require("socket.io");
var helmet = require("helmet");
var rateLimit = require("express-rate-limit");
var db = require_mysql();
var { razorpayWebhook } = require_webhook();
var app = express();
var server = http.createServer(app);
var io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes("/webhook")) {
      req.rawBody = buf;
    }
  }
}));
app.set("io", io);
io.on("connection", (socket) => {
  console.log("[SOCKET] Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("[SOCKET] Client disconnected:", socket.id);
  });
});
if (!process.env.FRONTEND_URL) {
  console.error("\u26A0\uFE0F [SERVER WARNING] Missing FRONTEND_URL. Defaulting to wildcard CORS.");
}
app.use((req, res, next) => {
  console.log(`[NETWORK] ${req.method} request made to: ${req.url}`);
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    console.log(`[PAYLOAD] Data received:`, req.body);
  }
  next();
});
app.use(helmet());
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
var globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 100,
  // Limit each IP to 100 requests per minute
  message: { success: false, message: "Server is busy. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);
app.use((req, res, next) => {
  console.log(`[SERVER] \u{1F4E5} Incoming [${req.method}] request to: ${req.url}`);
  next();
});
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);
app.use((req, res, next) => {
  req.setTimeout(2e4, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: "Gateway Timeout: The server took too long to process your request."
      });
    }
  });
  next();
});
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
db.execute("ALTER TABLE orders ADD COLUMN tracking_ref VARCHAR(50) NULL DEFAULT NULL;").then(() => console.log("\u2705 [DB] 'tracking_ref' column ensured in orders table.")).catch((err) => console.log("\u2139\uFE0F [DB] Column setup note (ignore if already exists)."));
var authRouter = require_auth2();
var categoryRouter = require_category2();
var productRouter = require_product2();
var cartRouter = require_cart2();
var orderRouter = require_order2();
var reviewRouter = require_review2();
var checkoutRouter = require_checkout2();
var paymentRouter = require_payment2();
var trackingRouter = require_tracking2();
var locationRouter = require_Location();
var addressRouter = require_Addresses2();
var currencyRouter = require_currency2();
var emailRouter = require_Email2();
var bannersRouter = require_banner2();
var translationRouter = require_translate();
var whatsappRoutes = require_whatsapp2();
var likeRoutes = require_like2();
var commentRoutes = require_comments2();
var dealerRoutes = require_dealer2();
console.log(`[SERVER] \u{1F50C} Registering and mounting Dealer Routes at endpoint prefix: /api/dealers...`);
app.get("/test", (req, res) => {
  console.log("[SERVER] GET /test -- Health check hit");
  res.status(200).send("Server is running with Pro-Security \u{1F6E1}\uFE0F!");
});
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("[MULTER ERROR]:", err);
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  } else if (err) {
    console.error("[UNKNOWN SERVER ERROR]:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
  next();
});
app.use("/api/dealer", dealerRoutes);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/tracking", trackingRouter);
app.use("/api/location", locationRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/Currency", currencyRouter);
app.use("/api/contact", emailRouter);
app.use("/api/banners", bannersRouter);
app.use("/api/translate", translationRouter);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);
app.get("/api/products-raw", async (req, res) => {
  console.log("[SERVER] GET /api/products-raw");
  try {
    const [results] = await db.execute("SELECT * FROM products");
    const dynamicProducts = results.map((product) => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      "more-detail": product["more-detail"] ? JSON.parse(product["more-detail"]) : {},
      measurement: product.measurement ? JSON.parse(product.measurement) : {}
    }));
    return res.json(dynamicProducts);
  } catch (err) {
    console.error("[SERVER] /api/products-raw error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});
app.get("/", (req, res) => {
  res.send("Backend Server is Running Successfully!");
});
app.post("/data", async (req, res) => {
  const dataArray = req.body;
  if (!Array.isArray(dataArray)) {
    return res.status(400).json({ error: "Request body must be an array" });
  }
  const sqlQuery = `INSERT INTO sarees_detailed (id, title, price, thumbnail, primary_color, other_color, border_type, pattern, craft, weave, zari_type, blouse, border_motifs, origin, fabric_material, khats, product_weight, blouse_length, saree_length, saree_width) VALUES ?`;
  const values = dataArray.map((saree) => {
    const detail = saree["more-detail"] || {};
    const measurement = saree.measurement || {};
    return [
      saree.id,
      saree.title,
      saree.price,
      saree.thumbnail,
      detail["primary color"] || "none",
      detail["other color"] || "none",
      detail["border type"] || "none",
      detail.pattern || "none",
      detail.Craft || "none",
      detail.weave || "none",
      detail["zari type"] || "none",
      detail.blouse || "none",
      detail["border motifs"] || "none",
      detail.origin || "none",
      detail["fabric/material"] || "none",
      detail.khats || "none",
      measurement["product weight"] || "none",
      measurement["blouse length"] || "none",
      measurement["saree length"] || "none",
      measurement["saree width"] || "none"
    ];
  });
  try {
    const [result] = await db.query(sqlQuery, [values]);
    return res.status(201).json({ message: `Success! ${result.affectedRows} sarees added.` });
  } catch (err) {
    console.error("[SERVER] POST /data error:", err.message);
    return res.status(500).json({ error: "Bulk insert error", details: err.message });
  }
});
app.get("/data", async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM sarees_detailed");
    return res.status(200).json({ message: "Success", data: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.use("/*splat", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR]", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});
var PORT = process.env.PORT || 8e3;
server.listen(PORT, () => {
  console.log(`\u{1F680} [SERVER] Running smoothly on port ${PORT}`);
});
module.exports = app;
