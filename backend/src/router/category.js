const express = require('express');
const router = express.Router();

// Import controller functions
const {
  Addcategory,
  getcategory,
  Addsubcategory,
  getProductsBySubcategory,
  getSubcategoriesByCategory,
  getCategoryCards,
  getProductsByCategory
} = require('../controllers/category');

// ==========================================
// ROUTER-LEVEL DEBUGGING MIDDLEWARE
// ==========================================
router.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n==================================================`);
    console.log(`[ROUTER TRACE] ${timestamp} | [${req.method}] ${req.originalUrl}`);
    
    if (req.params && Object.keys(req.params).length > 0) {
        console.log(`🔍 [PARAMS]:`, req.params);
    }
    if (req.query && Object.keys(req.query).length > 0) {
        console.log(`🔍 [QUERY]:`, req.query);
    }
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log(`📦 [BODY]:`, req.body);
    }
    console.log(`==================================================`);
    
    next(); // Pass control to the specific route handler
});

// ==========================================
// ROUTE DEFINITIONS
// ==========================================

// 1. Add a new category
router.post('/add-category', Addcategory);

// 2. Fetch all categories
router.get('/', getcategory);

// 3. Add a new subcategory
router.post('/add-subcategory', Addsubcategory);

// 4. Fetch products by subcategory
router.get('/subcategory-products/:subcategory_id', getProductsBySubcategory);

// 5. Fetch subcategories by category ID
router.get('/get-subcategories/:category_id', getSubcategoriesByCategory);

// Fetch categories formatted as visual cards with images
router.get('/products', getCategoryCards);
router.get('/:category_id/products', getProductsByCategory)
module.exports = router;