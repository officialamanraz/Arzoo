const express = require('express');
const router = express.Router();

// The names match exactly with the controller functions
const {
  Addcategory,
  getcategory,
  Addsubcategory,
  getsubcategories,
} = require('../controllers/category.controller');

router.post('/add-category', Addcategory);
router.get('/get-categories', getcategory);
router.post('/add-subcategory', Addsubcategory);
router.get('/get-subcategories/:category_id', getsubcategories);

module.exports = router;