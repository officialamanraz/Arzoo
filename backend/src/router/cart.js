const express = require('express');
const { verifyToken } = require('../middleware/authmiddleware');

const router = express.Router();
const {
  AddToCart,
  getCart,
  RemoveFromCart,
  clearCart,
  updateCartItemQuantity // 🚨 YEH MISSING THA!
} = require('../controllers/cart');

// ==========================================
// CUSTOM ROUTER LOGGER (Har request par chalega)
// ==========================================
const cartLogger = (req, res, next) => {
    console.log(`[CART ROUTER] 🚀 ${req.method} Request at: ${req.originalUrl}`);
    next(); // next() likhna zaroori hai, warna request yahi atak jayegi
};

// Logger ko router me apply kar diya
router.use(cartLogger);

// ==========================================
// CART ROUTES (Secured with verifyToken)
// ==========================================
router.post('/add', verifyToken, AddToCart);
router.get('/data', verifyToken, getCart);
router.put('/update', verifyToken, updateCartItemQuantity);
router.delete('/remove/:cart_id', verifyToken, RemoveFromCart);
router.delete('/clear', verifyToken, clearCart);

module.exports = router;