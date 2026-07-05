const express = require('express');
const {verifyToken,verifyAdmin} = require('../middleware/authmiddleware');

const router = express.Router();
const {
  AddToCart,
  getCart,
  RemoveFromCart,
} = require('../controllers/cart.controller');

// Ab teeno routes fully secure hain!
// Cart routes — sirf login check (koi bhi logged-in user kar sakta hai)
router.post('/add', verifyToken, AddToCart);
router.get('/data', verifyToken, getCart);
router.delete('/remove/:cart_id', verifyToken, RemoveFromCart);

module.exports = router;