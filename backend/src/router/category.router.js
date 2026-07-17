const express = require('express');
const router = express.Router();

// The names match exactly with the controller functions
const {
  Addcategory,
  getcategory,
  Addsubcategory,
  getProductsBySubcategory,
  getSubcategoriesByCategory
} = require('../controllers/category.controller');

router.post('/add-category', Addcategory);
router.get('/get-categories', getcategory);
router.post('/add-subcategory', Addsubcategory);
router.get('/subcategory-products/:subcategory_id', getProductsBySubcategory);
router.get('/get-subcategories/:category_id', getSubcategoriesByCategory);
module.exports = router;