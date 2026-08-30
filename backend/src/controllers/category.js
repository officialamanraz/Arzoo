const db = require('../DATABASE/mysql');
const {Addcategoryindb,
    getcategorybydb,
    Addsubcategorybydb,
    getProductsBySubcategoryFromDB,
    getSubcategoriesByCategoryFromDB}= require('../services/categoryservice')
// ==========================================
// 1. ADD CATEGORY
// ==========================================
const Addcategory = async (req, res) => {
  const { category_name } = req.body;
  console.log('[CATEGORY] Add category -- body:', req.body);

  if (!category_name) {
    console.warn('[CATEGORY] Add failed -- missing category_name');
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }

  try {
    const result = await Addcategoryindb(category_name)
    return res.status(200).json({ success: true, message: 'Category saved successfully.',result:result });
  } catch (error) {
    console.error(`[CATEGORY] Add error (name: ${category_name}):`, error.message);
    return res.status(500).json({ success: false, message: 'There is an issue with the database.', error: error.message });
  }
};

// ==========================================
// 2. GET ALL CATEGORIES
// ==========================================
const getcategory = async (req, res) => {
  console.log('[CATEGORY] Fetching all categories');
  try {
   const categoriesData = await getcategorybydb();
    return res.status(200).json({
      success: true,
      message: 'All categories fetched successfully.',
     categories: categoriesData
    });
  } catch (error) {
    console.error('[CATEGORY] Fetch error:', error.message);
    return res.status(500).json({ success: false, message: 'There is a problem with the database.', error: error.message });
  }
};

// ==========================================
// 3. ADD SUBCATEGORY
// ==========================================
const Addsubcategory = async (req, res) => {
  const { category_id, subcategory_name } = req.body;
  console.log('[SUBCATEGORY] Add subcategory -- body:', req.body);

  if (!category_id || !subcategory_name) {
    console.warn('[SUBCATEGORY] Add failed -- missing category_id or subcategory_name');
    return res.status(400).json({ success: false, message: 'category_id and subcategory_name are required.' });
  }

  try {
    const result = await Addsubcategorybydb (category_id, subcategory_name)
    return res.status(201).json({ success: true, message: 'Subcategory added successfully.',result:result });
  } catch (error) {
    console.error(`[SUBCATEGORY] Add error (category_id: ${category_id}):`, error.message);
    return res.status(500).json({ success: false, message: 'Failed to add subcategory.', error: error.message });
  }
};

// ==========================================
// 4. GET PRODUCTS BY SUBCATEGORY
// ==========================================
const getProductsBySubcategory = async (req, res) => {
  const { subcategory_id } = req.params;
  console.log(`[SUBCATEGORY] Fetching products -- subcategory_id: ${subcategory_id}`);

  if (!subcategory_id) {
    console.warn('[SUBCATEGORY] Fetch products failed -- missing subcategory_id');
    return res.status(400).json({ success: false, message: 'subcategory_id is required.' });
  }

  try {
    // Call the service layer
    const { subcategory_name, products } = await getProductsBySubcategoryFromDB(subcategory_id);

    console.log(`[SUBCATEGORY] Found ${products.length} product(s) for subcategory: ${subcategory_name}`);
    
    return res.status(200).json({
      success: true,
      subcategory_name: subcategory_name, // Now dynamic for your frontend!
      total_found: products.length,
      data: products
    });
  } catch (error) {
    console.error(`[SUBCATEGORY] Fetch products error (subcategory_id: ${subcategory_id}):`, error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ==========================================
// 5. GET SUBCATEGORIES BY CATEGORY
// ==========================================
const getSubcategoriesByCategory = async (req, res) => {
  const { category_id } = req.params;
  console.log(`[SUBCATEGORY] Fetching subcategories -- category_id: ${category_id}`);

  try {
    const rows = await getSubcategoriesByCategoryFromDB(category_id);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error(`[SUBCATEGORY] Fetch error (category_id: ${category_id}):`, error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  Addcategory,
  getcategory,
  Addsubcategory,
  getProductsBySubcategory,
  getSubcategoriesByCategory
};