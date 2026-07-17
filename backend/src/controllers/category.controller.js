const db = require('../DATABASE/mysql');

// ==========================================
// 1. ADD CATEGORY
// ==========================================
const Addcategory = async (req, res) => {
  const { category_name } = req.body;
  console.log('[Addcategory] Incoming request body:', req.body);

  if (!category_name) {
    console.warn('[Addcategory] Validation failed: Missing category_name.');
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }

  try {
    console.log('[Addcategory] Executing database insert for:', category_name);
    await db.execute('INSERT INTO categories (category_name) VALUES (?)', [category_name]);
    console.log('[Addcategory] Category saved successfully into database.');
    return res.status(200).json({ success: true, message: 'Category saved successfully.' });
  } catch (error) {
    console.error('Add category error:', error.message);
    return res.status(500).json({ success: false, message: 'There is an issue with the database.', error: error.message });
  }
};

// ==========================================
// 2. GET ALL CATEGORIES
// ==========================================
const getcategory = async (req, res) => {
  console.log('[getcategory] Fetching all categories from database...');
  try {
    const [rows] = await db.execute('SELECT * FROM categories');
    console.log('[getcategory] Fetch success. Total categories found:', rows.length);
    return res.status(200).json({
      success: true,
      message: 'All categories fetched successfully.',
      data: rows
    });
  } catch (error) {
    console.error('Get categories error:', error.message);
    return res.status(500).json({ success: false, message: 'There is a problem with the database.', error: error.message });
  }
};

// ==========================================
// 3. ADD SUBCATEGORY
// ==========================================
const Addsubcategory = async (req, res) => {
  const { category_id, subcategory_name } = req.body;
  console.log('[Addsubcategory] Incoming request body:', req.body);

  if (!category_id || !subcategory_name) {
    console.warn('[Addsubcategory] Validation failed: Missing category_id or subcategory_name.');
    return res.status(400).json({ success: false, message: 'category_id and subcategory_name are required.' });
  }

  try {
    console.log('[Addsubcategory] Executing insert for category_id:', category_id, 'and subcategory_name:', subcategory_name);
    await db.execute(
      'INSERT INTO subcategories (category_id, subcategory_name) VALUES (?, ?)',
      [category_id, subcategory_name]
    );
    console.log('[Addsubcategory] Subcategory added successfully into database.');
    return res.status(201).json({ success: true, message: 'Subcategory added successfully.' });
  } catch (error) {
    console.error('Add subcategory error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to add subcategory.', error: error.message });
  }
};

// ==========================================
// 4. GET PRODUCTS BY SUBCATEGORY
// ==========================================
const getProductsBySubcategory = async (req, res) => {
  const { subcategory_id } = req.params;
  console.log('[getProductsBySubcategory] Incoming request param subcategory_id:', subcategory_id);

  if (!subcategory_id) {
    console.warn('[getProductsBySubcategory] Validation failed: Missing subcategory_id.');
    return res.status(400).json({ success: false, message: 'subcategory_id is required.' });
  }

  try {
    console.log('[getProductsBySubcategory] Fetching products from database for subcategory_id:', subcategory_id);
    const [rows] = await db.execute(
      'SELECT * FROM products WHERE subcategory_id = ?',
      [subcategory_id]
    );
    console.log('[getProductsBySubcategory] Fetch success. Total products found:', rows.length);
    return res.status(200).json({
      success: true,
      total_found: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Get products by subcategory error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
const getSubcategoriesByCategory = async (req, res) => {
  const { category_id } = req.params;
  console.log('[getSubcategoriesByCategory] Fetching for category_id:', category_id);

  try {
    const [rows] = await db.execute(
      'SELECT * FROM subcategories WHERE category_id = ?',
      [category_id]
    );
    console.log('[getSubcategoriesByCategory] Found subcategories:', rows.length);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get subcategories error:', error.message);
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