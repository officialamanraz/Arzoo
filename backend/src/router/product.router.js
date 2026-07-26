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
router.post('/product', verifyToken, upload.array('image', 10), addproducts);
router.delete('/product/:id', verifyToken, deleteproduct);
router.put('/product/:id', verifyToken, upload.array('image',10), updateproduct);
router.post('/product/:id/images', verifyToken, upload.array('image', 10), addNewImagesToProduct); 
router.delete('/product/image/:image_id', verifyToken, deleteSingleImage);

module.exports = router;