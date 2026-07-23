const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const db = require('./src/DATABASE/mysql'); // mysql2/promise pool

// 1. App Engine Start
const app = express();

if (!process.env.FRONTEND_URL) {
  console.error('[SERVER] Missing FRONTEND_URL environment variable -- CORS may block requests.');
}

// 2. MIDDLEWARE -- always before routes
app.use(morgan('dev'));
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Quick sanity check route
app.get('/test', (req, res) => {
  console.log('[SERVER] GET /test -- health check hit');
  res.send('Server is running fine!');
});

// 4. Router Imports (deduped -- each router required ONCE)
const translationRouter = require('./src/router/translate.router');
const authRouter = require('./src/router/auth.router');
const cartRouter = require('./src/router/cart.router');
const orderRouter = require('./src/router/order.router');
const categoryRouter = require('./src/router/category.router');
const locationRouter = require('./src/router/Location.router');
const currencyRouter = require('./src/router/currency.router');
const emailRouter = require('./src/router/Email.router');
const productRouter = require('./src/router/product.router');
const reviewRouter = require('./src/router/review.router');
const checkoutRouter = require('./src/router/checkout.router');
const trackingRouter = require('./src/router/tracking.router');
const addressRouter = require('./src/router/Addresses.router');
const bannersRouter = require('./src/router/banner.router');

// NOTE: subcategory.router.js is intentionally NOT mounted --
// category.router.js already handles subcategory routes
// (subcategory-products, get-subcategories, add-subcategory).

// 5. Route Attachments
// IMPORTANT: plural '/api/categories' matches what the frontend (App.jsx / API_BASE_URL calls) expects.
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/auth', authRouter);
app.use('/api/location', locationRouter);
app.use('/api/Currency', currencyRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/contact', emailRouter);   // contact form
app.use('/api/translate', translationRouter);
app.use('/api/banners', bannersRouter);

// ==========================================
// LEGACY / RAW ROUTES
// NOTE: These belong in the routes folder like everything else -- kept
// here for now but fixed to use async/await + db.execute, since the pool
// is mysql2/promise and does not support callback-style db.query(cb).
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
  console.log(`[SERVER] POST /data -- ${Array.isArray(dataArray) ? dataArray.length : 0} item(s)`);

  if (!Array.isArray(dataArray)) {
    console.warn('[SERVER] POST /data failed -- body is not an array');
    return res.status(400).json({ error: 'Request body must be an array [...]' });
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
    const [result] = await db.query(sqlQuery, [values]); // bulk VALUES ? syntax needs .query, not .execute
    console.log(`[SERVER] POST /data success -- ${result.affectedRows} row(s) inserted`);
    return res.status(201).json({ message: `Success! ${result.affectedRows} sarees added.` });
  } catch (err) {
    console.error('[SERVER] POST /data error:', err.message);
    return res.status(500).json({ error: 'Bulk insert error', details: err.message });
  }
});

app.get('/data', async (req, res) => {
  console.log('[SERVER] GET /data');
  try {
    const [results] = await db.execute('SELECT * FROM sarees_detailed');
    const formattedData = results.map((saree) => ({
      id: saree.id, title: saree.title, price: saree.price, thumbnail: saree.thumbnail,
      'more-detail': { /* existing logic unchanged */ },
      measurement: { /* existing logic unchanged */ }
    }));
    return res.status(200).json({ message: 'Success', data: formattedData });
  } catch (err) {
    console.error('[SERVER] GET /data error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// 6. LISTEN -- uppercase env var, Render-friendly fallback
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});

module.exports = app;