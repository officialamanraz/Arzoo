const db = require('../DATABASE/mysql');

// ==========================================
// 1. ADD CATEGORY
// ==========================================
const Addcategory = async (req, res) => {
  const { category_name } = req.body;

  if (!category_name) {
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }

  try {
    await db.execute('INSERT INTO categories (category_name) VALUES (?)', [category_name]);
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
  try {
    const [rows] = await db.execute('SELECT * FROM categories');
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

  if (!category_id || !subcategory_name) {
    return res.status(400).json({ success: false, message: 'category_id and subcategory_name are required.' });
  }

  try {
    await db.execute(
      'INSERT INTO subcategories (category_id, subcategory_name) VALUES (?, ?)',
      [category_id, subcategory_name]
    );
    return res.status(201).json({ success: true, message: 'Subcategory added successfully.' });
  } catch (error) {
    console.error('Add subcategory error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to add subcategory.', error: error.message });
  }
};

// ==========================================
// 4. GET SUBCATEGORIES FOR A GIVEN CATEGORY
// ==========================================
const getsubcategories = async (req, res) => {
  const { category_id } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT * FROM subcategories WHERE category_id = ?',
      [category_id]
    );
    return res.status(200).json({
      success: true,
      message: 'Subcategories fetched successfully.',
      data: rows
    });
  } catch (error) {
    console.error('Get subcategories error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  Addcategory,
  getcategory,
  Addsubcategory,
  getsubcategories,
};