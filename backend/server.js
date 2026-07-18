const express = require('express');
const cors = require('cors'); // CORS zaruri hai
const app = express(); // Sirf ek hi baar app banega

// 1. MIDDLEWARE: Sabse upar, routes se PEHLE
// Sirf EK cors() config rakho — specific origins ke saath, credentials support ke liye
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Quick sanity check route
app.get('/test', (req, res) => {
  res.send('Bhai server mast chal raha hai!');
});

// 2. ROUTES: Middleware ke baad
const categoryRouter = require('./src/router/category.router')
// const subcategoryRouter = require('./src/router/subcategory.router');
const productrouter = require('./src/router/product.router');
const authRoutes = require('./src/router/auth.router');
const locationRouter = require('./src/router/Location.router'); // Naam apne hisaab se check kar lena
const currencyRouter = require('./src/router/currency.router');
const cartrouter = require('./src/router/cart.router');
const orderRouter = require('./src/router/order.router');
const reviewRouter = require('./src/router/review.router');
const checkoutRouter = require('./src/router/checkout.router');
const trackingRouter = require('./src/router/tracking.router');
const addressRouter = require('./src/router/Addresses.router');
const emailRouter = require('./src/router/Email.router');

app.use('/api/orders', orderRouter);
app.use('/api/location', locationRouter);
app.use('/api/Currency', currencyRouter);
app.use("/api/reviews", reviewRouter);
app.use('/api/category',categoryRouter)
// app.use('/api/subcategories', subcategoryRouter);
app.use('/api/cart', cartrouter);
app.use('/api/products', productrouter);
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/Email', emailRouter);

// 3. LISTEN: Sabse aakhir mein — Render ka dynamic PORT use karo, hardcode mat karo
// Render environment variable PORT ko priority dega, 
// nahi toh local ke liye 5000 use karega
const PORT = process.env.db_port;
app.listen(PORT, () => {
  console.log(`Server is running beautifully on port ${PORT}`);
});
module.exports = app;