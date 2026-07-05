const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const db = require('./DATABASE/mysql'); // Tera db setup

// 1. App Engine Start
const app = express();

// 2. Middlewares (Global)
app.use(cors());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Ek hi baar lagana kaafi hai
// Keep it simple: use the cors() function properly
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://arzoo-engd.onrender.com'
  ],
  credentials: true
}));
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
const productrouter = require('./router/product.router'); // Naya import
const ordersRouter = require('./router/order.router');
const reviewRouter = require("./routes/review.router");
const checkoutRouter = require('./router/checkout.router');
const addressRouter = require('./src/router/addresses.router');
// 5. Routes Attachments
app.use('/api/order', ordersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authrouter);
app.use('/api/cart', cartrouter);
app.use('/api/orders', orderRouter);
app.use('/api/categories', categoryRoutes);
app.use('/api/location', locationRoute);
app.use('/api/Currency', currencyRoute);
app.use('/api/translate', translationRouter);
app.use('/api/products', productrouter); // Tere file ke end me tha
app.use("/api/reviews", reviewRouter);
app.use("/api/checkout",checkoutRouter);
app.use('/api/addresses', addressRouter);
// ==========================================
// API LOGICS (Direct yahan likhne ki bajaye, inhe bhi routes folder me dalna seekh)
// ==========================================

app.get('/api/products-raw', (req, res) => { // Route name badla taaki router file se clash na ho
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const dynamicProducts = results.map((product) => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      'more-detail': product['more-detail'] ? JSON.parse(product['more-detail']) : {},
      measurement: product.measurement ? JSON.parse(product.measurement) : {},
    }));
    res.json(dynamicProducts);
  });
});

app.get('/test', (req, res) => {
  res.send('Bhai server mast chal raha hai!');
});

app.post('/data', (req, res) => {
  const dataArray = req.body; // YAHAN SE DYNAMIC HAI
  if (!Array.isArray(dataArray)) {
    return res.status(400).json({ error: 'Data array format [...] me hona chahiye.' });
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

  db.query(sqlQuery, [values], (err, result) => {
    if (err) return res.status(500).json({ error: 'Bulk insert error', details: err.message });
    res.status(201).json({ message: `Success! ${result.affectedRows} sarees added.` });
  });
});

app.get('/data', (req, res) => {
  db.query('SELECT * FROM sarees_detailed', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const formattedData = results.map((saree) => ({
      id: saree.id, title: saree.title, price: saree.price, thumbnail: saree.thumbnail,
      'more-detail': { /* ... tera logic as it is hai ... */ },
      measurement: { /* ... tera logic as it is hai ... */ }
    }));
    res.status(200).json({ message: 'Success', data: formattedData });
  });
});

// ==========================================
// 6. SERVER START LOGIC (100% Dynamic Port)
// ==========================================

// 🚨 YAHAN DHYAN DE: Port ko process.env se aane de, nahi toh 5000 fallback kar
const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => {
  console.log(`Server is running beautifully on PORT ${PORT} 🚀`);
});

module.exports = app;