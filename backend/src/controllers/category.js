const db = require('../DATABASE/mysql');

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
    const [result] = await db.execute('INSERT INTO categories (category_name) VALUES (?)', [category_name]);
    console.log(`[CATEGORY] Saved -- category_id: ${result.insertId}, name: ${category_name}`);
    return res.status(200).json({ success: true, message: 'Category saved successfully.' });
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
    const [rows] = await db.execute('SELECT * FROM categories');
    console.log(`[CATEGORY] Fetch success -- ${rows.length} category(ies)`);
    return res.status(200).json({
      success: true,
      message: 'All categories fetched successfully.',
      data: rows
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
    const [result] = await db.execute(
      'INSERT INTO subcategories (category_id, subcategory_name) VALUES (?, ?)',
      [category_id, subcategory_name]
    );
    console.log(`[SUBCATEGORY] Added -- subcategory_id: ${result.insertId}, category_id: ${category_id}`);
    return res.status(201).json({ success: true, message: 'Subcategory added successfully.' });
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
    const [rows] = await db.execute(
      'SELECT * FROM products WHERE subcategory_id = ?',
      [subcategory_id]
    );
    console.log(`[SUBCATEGORY] Found ${rows.length} product(s) for subcategory_id: ${subcategory_id}`);
    return res.status(200).json({
      success: true,
      total_found: rows.length,
      data: rows
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
    const [rows] = await db.execute(
      'SELECT * FROM subcategories WHERE category_id = ?',
      [category_id]
    );
    console.log(`[SUBCATEGORY] Found ${rows.length} subcategory(ies) for category_id: ${category_id}`);
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