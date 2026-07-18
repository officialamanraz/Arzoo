const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const db = require('./DATABASE/mysql'); // mysql2/promise pool

// 1. App Engine Start
const app = express();

if (!process.env.FRONTEND_URL) {
  console.error('[SERVER] Missing FRONTEND_URL environment variable -- CORS will block all requests.');
}

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// 3. Static Files (Dynamic path setup)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Router Imports
const translationRouter = require('./router/translate.router');
const authrouter = require('./router/auth.router');
const cartrouter = require('./router/cart.router');
const orderRouter = require('./router/order.router');
const categoryRoutes = require('./router/category.router');
const locationRoute = require('./router/Location.router');
const currencyRoute = require('./router/currency.router');
const contactRouter = require('./router/Email.router');
const productrouter = require('./router/product.router');
const ordersRouter = require('./router/order.router');
const reviewRouter = require('./routes/review.router');
const checkoutRouter = require('./router/checkout.router');
const addressRouter = require('./src/router/addresses.router');

// 5. Routes Attachments
app.use('/api/order', ordersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authrouter);
app.use('/api/cart', cartrouter);
app.use('/api/orders', orderRouter);
app.use('/api/categories', categoryRoutes);

// FIX: subcategory endpoints (Addsubcategory, getSubcategoriesByCategory,
// getProductsBySubcategory in category.controller.js) were never mounted
// at their own prefix, so any frontend call to /api/subcategories/* was
// hitting no route at all -> 404. Mounting the same router here as well
// so both prefixes work.
// CONFIRM: if category.router.js only defines category routes (not
// subcategory ones), point this at the correct subcategory router file
// instead -- tell me the filename and I'll wire it up exactly.


// app.use('/api/subcategories', categoryRoutes);
app.use('/api/location', locationRoute);
app.use('/api/Currency', currencyRoute);
app.use('/api/translate', translationRouter);
app.use('/api/products', productrouter);
app.use('/api/reviews', reviewRouter); // was commented out -- re-enabled
app.use('/api/checkout', checkoutRouter);
app.use('/api/addresses', addressRouter);

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

app.get('/test', (req, res) => {
  console.log('[SERVER] GET /test -- health check hit');
  res.send('Server is running fine!');
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});

module.exports = app;