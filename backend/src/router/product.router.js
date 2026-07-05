const express = require('express');
const upload = require('../middleware/uploads');
const { verifyToken, verifyAdmin } = require('../middleware/authmiddleware');
const router = express.Router();

// 1. Sirf EK BAAR saare functions import karo (Naye image functions add kiye)
const {
  searchproduct,
  getProductById,
  addproducts,
  updateproduct,
  deleteproduct,
  getallproduct,
  bugdutfilter,
  product,
  addNewImagesToProduct, // 👈 Naya Add Kiya
  deleteSingleImage,
  getRecommendedProducts     // 👈 Naya Add Kiya
} = require('../controllers/product.controller');

// 2. Ab saare routes SIRF EK BAAR likho
router.get("/recommendations", getRecommendedProducts);
router.get('/search', searchproduct);
router.get('/product/:id', getProductById);
router.get('/all', getallproduct);      // Pagination wala // Budget Filter wala
router.post('/product', upload.array('image', 10), verifyToken, addproducts)
router.delete('/product/:id', deleteproduct,verifyToken);
router.put('/product/:id',upload.array('image',10), updateproduct,verifyToken);
router.get('/product', product);

// ==========================================
// 3. IMAGE MANAGEMENT ROUTES (Naye)
// ==========================================
// Kisi existing product me aur photos daalne ke liye
router.post('/product/:id/images', upload.array('image', 10),verifyToken, addNewImagesToProduct); 

// Kisi ek kharab/purani photo ko delete karne ke liye
router.delete('/product/image/:image_id', deleteSingleImage,verifyToken);

module.exports = router;