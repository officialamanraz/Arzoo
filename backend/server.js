const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Security Packages
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// NOTE: xss-clean and hpp removed -- both are unmaintained and directly
// reassign req.query, which Express 5 made a read-only getter. Using them
// crashes every request with "Cannot set property query...".

// Database
const db = require('./src/DATABASE/mysql');

// Webhook controller (Razorpay server-to-server confirmation)
const { razorpayWebhook } = require('./src/controllers/webhook.controller'); // adjust path if yours differs

// ==========================================
// 1. APP & SOCKET INITIALIZATION
// ==========================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('[SOCKET] Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('[SOCKET] Client disconnected:', socket.id);
  });
});

if (!process.env.FRONTEND_URL) {
  console.error('⚠️ [SERVER WARNING] Missing FRONTEND_URL. Defaulting to wildcard CORS.');
}

// ==========================================
// 2. SECURITY & GLOBAL MIDDLEWARES (The Shield)
// ==========================================
// Layer 1: Helmet for HTTP Header Security
app.use(helmet());

// Layer 2: Strict CORS
app.use(cors({
  origin:'*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Layer 3: Rate Limiting (DDoS Protection)
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: { success: false, message: "Server is busy. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Layer 4: Razorpay Webhook -- needs the RAW body for signature verification,
// so it's registered as its own standalone route with express.raw(),
// BEFORE the global express.json() parser below touches it.
app.post(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  razorpayWebhook
);

// Layer 5: Body Parser with Payload Limit & Data Sanitization
app.use(express.json({ limit: '10kb' })); // Prevents large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logger
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 3. DATABASE INITIALIZATION
// ==========================================
db.execute("ALTER TABLE orders ADD COLUMN tracking_ref VARCHAR(50) NULL DEFAULT NULL;")
  .then(() => console.log("✅ [DB] 'tracking_ref' column ensured in orders table."))
  .catch(err => console.log("ℹ️ [DB] Column setup note (ignore if already exists)."));

// ==========================================
// 4. ROUTE ATTACHMENTS
// ==========================================
const authRouter = require('./src/router/auth');
const categoryRouter = require('./src/router/category');
const productRouter = require('./src/router/product');
const cartRouter = require('./src/router/cart');
const orderRouter = require('./src/router/order');
const reviewRouter = require('./src/router/review');
const checkoutRouter = require('./src/router/checkout');
const paymentRouter = require('./src/router/payment');
const trackingRouter = require('./src/router/tracking');
const locationRouter = require('./src/router/Location');
const addressRouter = require('./src/router/Addresses');
const currencyRouter = require('./src/router/currency');
const emailRouter = require('./src/router/Email');
const bannersRouter = require('./src/router/banner');
const translationRouter = require('./src/router/translate');
const whatsappRoutes = require('./src/router/whatsapp');

// Health Check
app.get('/test', (req, res) => {
  console.log('[SERVER] GET /test -- Health check hit');
  res.status(200).send('Server is running with Pro-Security 🛡️!');
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/payment', paymentRouter); // handles /create-order and /verify (webhook is separate, above)
app.use('/api/tracking', trackingRouter);
app.use('/api/location', locationRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/Currency', currencyRouter);
app.use('/api/contact', emailRouter);
app.use('/api/banners', bannersRouter);
app.use('/api/translate', translationRouter);
app.use('/api/whatsapp', whatsappRoutes);

// ==========================================
// 5. LEGACY / RAW ROUTES
// ==========================================
app.get('/api/products-raw', async (req, res) => {
  console.log('[SERVER] GET /api/products-raw');
  try {
    const [results] = await db.execute('SELECT * FROM products');
    const dynamicProducts = results.map((product) => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      'more-detail': product['more-detail'] ? JSON.parse(product['more-detail']) : {},
      measurement: product.measurement ? JSON.parse(product.measurement) : {},
    }));
    return res.json(dynamicProducts);
  } catch (err) {
    console.error('[SERVER] /api/products-raw error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/data', async (req, res) => {
  const dataArray = req.body;
  if (!Array.isArray(dataArray)) {
    return res.status(400).json({ error: 'Request body must be an array' });
  }

  const sqlQuery = `INSERT INTO sarees_detailed (id, title, price, thumbnail, primary_color, other_color, border_type, pattern, craft, weave, zari_type, blouse, border_motifs, origin, fabric_material, khats, product_weight, blouse_length, saree_length, saree_width) VALUES ?`;
  const values = dataArray.map((saree) => {
    const detail = saree['more-detail'] || {};
    const measurement = saree.measurement || {};
    return [
      saree.id, saree.title, saree.price, saree.thumbnail,
      detail['primary color'] || 'none', detail['other color'] || 'none',
      detail['border type'] || 'none', detail.pattern || 'none',
      detail.Craft || 'none', detail.weave || 'none',
      detail['zari type'] || 'none', detail.blouse || 'none',
      detail['border motifs'] || 'none', detail.origin || 'none',
      detail['fabric/material'] || 'none', detail.khats || 'none',
      measurement['product weight'] || 'none', measurement['blouse length'] || 'none',
      measurement['saree length'] || 'none', measurement['saree width'] || 'none',
    ];
  });

  try {
    const [result] = await db.query(sqlQuery, [values]);
    return res.status(201).json({ message: `Success! ${result.affectedRows} sarees added.` });
  } catch (err) {
    console.error('[SERVER] POST /data error:', err.message);
    return res.status(500).json({ error: 'Bulk insert error', details: err.message });
  }
});

app.get('/data', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM sarees_detailed');
    return res.status(200).json({ message: 'Success', data: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. GLOBAL ERROR HANDLER (The Safety Net)
// ==========================================
// Express 5 uses path-to-regexp v6+, which no longer accepts a bare '*'.
// Use '/*splat' (a named wildcard) instead for a catch-all 404 route.
app.use('/*splat', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ==========================================
// 7. START SERVER
// ==========================================
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 [SERVER] Running smoothly on port ${PORT}`);
});

module.exports = app;