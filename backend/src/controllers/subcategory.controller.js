const db = require('../DATABASE/mysql'); // FIXED: was '../../config/db', which doesn't exist in this project
                                          // and was using callback-style db.query, not the mysql2/promise pool.

// ==========================================
// GET SUBCATEGORIES BY CATEGORY (query param version)
// ==========================================
const getSubcategories = async (req, res) => {
  const { category_id } = req.query;
  console.log(`[SUBCATEGORY-2] Fetching -- category_id: ${category_id}`);

  if (!category_id) {
    console.warn('[SUBCATEGORY-2] Fetch failed -- missing category_id');
    return res.status(400).json({
      success: false,
      message: 'category_id is required'
    });
  }

  try {
    // NOTE: removed the `is_active = 1` filter -- confirm this column
    // actually exists on your `subcategories` table before adding it back.
    const [results] = await db.execute(
      `SELECT subcategory_id, subcategory_name, category_id
       FROM subcategories
       WHERE category_id = ?
       ORDER BY subcategory_name ASC`,
      [category_id]
    );

    console.log(`[SUBCATEGORY-2] Found ${results.length} subcategory(ies)`);
    return res.status(200).json({
      success: true,
      data: results || []
    });
  } catch (error) {
    console.error(`[SUBCATEGORY-2] Fetch error (category_id: ${category_id}):`, error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// ADD SUBCATEGORY
// ==========================================
const addSubcategory = async (req, res) => {
  const { subcategory_name, category_id } = req.body;
  console.log('[SUBCATEGORY-2] Add -- body:', req.body);

  if (!subcategory_name || !category_id) {
    console.warn('[SUBCATEGORY-2] Add failed -- missing subcategory_name or category_id');
    return res.status(400).json({
      success: false,
      message: 'Subcategory name and category ID are required'
    });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO subcategories (subcategory_name, category_id) VALUES (?, ?)',
      [subcategory_name, category_id]
    );

    console.log(`[SUBCATEGORY-2] Added -- subcategory_id: ${result.insertId}`);
    return res.status(201).json({
      success: true,
      message: 'Subcategory added successfully',
      subcategory_id: result.insertId
    });
  } catch (error) {
    console.error(`[SUBCATEGORY-2] Add error (category_id: ${category_id}):`, error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { getSubcategories, addSubcategory };