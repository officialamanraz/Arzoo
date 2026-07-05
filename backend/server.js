const express = require('express');
const cors = require('cors'); // CORS zaruri hai
const app = express(); // Sirf ek hi baar app banega

// 1. MIDDLEWARE: Sabse upar hona chahiye
app.use(cors()); 
app.use(express.json()); 
app.use('/uploads', express.static('uploads'));

// 2. ROUTES: Middleware ke baad// Add this with other route imports:
const subcategoryRouter = require('./src/router/subcategory.router');
const productrouter = require('./src/router/product.router');
const authRoutes = require('./src/router/auth.router');
const locationRouter = require('./src/router/location.router'); // Naam apne hisaab se check kar lena
const currencyRouter = require('./src/router/currency.router');
const cartrouter = require('./src/router/cart.router')
const orderRouter = require('./src/router/order.router');
const reviewRouter = require('./src/router/review.router')
const checkoutRouter = require('./src/router/checkout.router');
const trackingRouter = require('./src/router/tracking.router');
const addressRouter = require('./src/router/addresses.router');

app.use('/api/orders', orderRouter);
app.use('/api/location', locationRouter);
app.use('/api/Currency', currencyRouter);
app.use("/api/reviews", reviewRouter);
app.use('/api/subcategories', subcategoryRouter);
app.use('/api/cart', cartrouter);
app.use('/api/products', productrouter);
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/addresses', addressRouter);

// 3. LISTEN: Sabse aakhir mein
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});