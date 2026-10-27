const {
  Addcategoryindb,
  getcategorybydb,
  Addsubcategorybydb,
  getProductsBySubcategoryFromDB,
  getSubcategoriesByCategoryFromDB,
  getCategoryCardsFromDB
} = require('../services/categoryservice');

// ==========================================
// 1. ADD CATEGORY
// ==========================================
const Addcategory = async (req, res) => {
  console.log('\n--- [CONTROLLER: Addcategory START] ---');
  console.log('[CATEGORY] Request body:', req.body);

  // Accept category_name or name from payload, and optional slug
  const category_name = req.body?.category_name || req.body?.name;
  const slug = req.body?.slug || null;

  if (!category_name || typeof category_name !== 'string' || !category_name.trim()) {
    console.warn('[CATEGORY] Add failed: category_name/name is missing or invalid.');
    return res.status(400).json({
      success: false,
      message: 'Category name is required and must be a valid non-empty string.'
    });
  }

  try {
    const result = await Addcategoryindb(category_name.trim(), slug);
    console.log(`[CATEGORY] Added successfully -> insertedId: ${result.insertId}`);
    console.log('--- [CONTROLLER: Addcategory END] ---\n');

    return res.status(201).json({
      success: true,
      message: 'Category saved successfully.',
      category_id: result.insertId,
      result
    });
  } catch (error) {
    console.error(`[CATEGORY] Add error (name: ${category_name}):`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save category into the database.',
      error: error.message
    });
  }
};

// ==========================================
// 2. GET ALL CATEGORIES
// ==========================================
const getcategory = async (req, res) => {
  console.log('\n--- [CONTROLLER: getcategory START] ---');
  try {
    const categoriesData = await getcategorybydb();
    console.log(`[CATEGORY] Successfully fetched ${categoriesData.length} category records.`);
    console.log('--- [CONTROLLER: getcategory END] ---\n');

    return res.status(200).json({
      success: true,
      message: 'All categories fetched successfully.',
      total_categories: categoriesData.length,
      categories: categoriesData
    });
  } catch (error) {
    console.error('[CATEGORY] Fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories from the database.',
      error: error.message
    });
  }
};

// ==========================================
// 3. ADD SUBCATEGORY
// ==========================================
const Addsubcategory = async (req, res) => {
  console.log('\n--- [CONTROLLER: Addsubcategory START] ---');
  console.log('[SUBCATEGORY] Request body:', req.body);

  const { category_id, subcategory_name } = req.body || {};

  if (!category_id || !subcategory_name) {
    console.warn('[SUBCATEGORY] Add failed: category_id or subcategory_name is missing.');
    return res.status(400).json({
      success: false,
      message: 'Both category_id and subcategory_name are required.'
    });
  }

  try {
    const result = await Addsubcategorybydb(category_id, subcategory_name);
    console.log(`[SUBCATEGORY] Subcategory created -> ID: ${result.insertId}`);
    console.log('--- [CONTROLLER: Addsubcategory END] ---\n');

    return res.status(201).json({
      success: true,
      message: 'Subcategory added successfully.',
      subcategory_id: result.insertId,
      result
    });
  } catch (error) {
    console.error(`[SUBCATEGORY] Add error (category_id: ${category_id}):`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add subcategory.',
      error: error.message
    });
  }
};

// ==========================================
// 4. GET PRODUCTS BY SUBCATEGORY
// ==========================================
const getProductsBySubcategory = async (req, res) => {
  console.log('\n--- [CONTROLLER: getProductsBySubcategory START] ---');
  console.log('[SUBCATEGORY] Route params:', req.params);
  console.log('[SUBCATEGORY] Query params:', req.query);

  // Extract from params first (e.g. /subcategories/:subcategory_id/products), fallback to query (?subcategoryId= or ?subcategory_id=)
  const rawSubcategoryId =
    req.params?.subcategory_id ||
    req.query?.subcategory_id ||
    req.query?.subcategoryId;

  console.log(`[SUBCATEGORY] Extracted raw subcategory ID: "${rawSubcategoryId}"`);

  if (!rawSubcategoryId || rawSubcategoryId === 'undefined' || rawSubcategoryId === 'null') {
    console.warn('[SUBCATEGORY] Missing or invalid subcategory identifier.');
    return res.status(400).json({
      success: false,
      message: 'A valid subcategory_id parameter or query is required.'
    });
  }

  try {
    const { subcategory_name, products } = await getProductsBySubcategoryFromDB(rawSubcategoryId);

    console.log(`[SUBCATEGORY] Done. Returning ${products.length} product(s) for "${subcategory_name}".`);
    console.log('--- [CONTROLLER: getProductsBySubcategory END] ---\n');

    return res.status(200).json({
      success: true,
      subcategory_name,
      total_found: products.length,
      data: products
    });
  } catch (error) {
    console.error(`[SUBCATEGORY] Fetch products error for ID "${rawSubcategoryId}":`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve products for the requested subcategory.',
      error: error.message
    });
  }
};

// ==========================================
// 5. GET SUBCATEGORIES BY CATEGORY
// ==========================================
const getSubcategoriesByCategory = async (req, res) => {
  console.log('\n--- [CONTROLLER: getSubcategoriesByCategory START] ---');
  console.log('[SUBCATEGORY] Route params:', req.params);
  console.log('[SUBCATEGORY] Query params:', req.query);

  const rawCategoryId =
    req.params?.category_id ||
    req.query?.category_id ||
    req.query?.categoryId;

  if (!rawCategoryId || rawCategoryId === 'undefined' || rawCategoryId === 'null') {
    console.warn('[SUBCATEGORY] Missing or invalid category identifier.');
    return res.status(400).json({
      success: false,
      message: 'A valid category_id parameter or query is required.'
    });
  }

  try {
    const rows = await getSubcategoriesByCategoryFromDB(rawCategoryId);
    console.log(`[SUBCATEGORY] Found ${rows.length} subcategories for category ${rawCategoryId}.`);
    console.log('--- [CONTROLLER: getSubcategoriesByCategory END] ---\n');

    return res.status(200).json({
      success: true,
      total_found: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(`[SUBCATEGORY] Fetch subcategories error for category "${rawCategoryId}":`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve subcategories for the requested category.',
      error: error.message
    });
  }
};
const getCategoryCards = async (req, res) => {
  console.log('\n--- [CONTROLLER: getCategoryCards START] ---');
  try {
    const cards = await getCategoryCardsFromDB();
    console.log(`[CATEGORY] Returning ${cards.length} category cards to frontend.`);
    console.log('--- [CONTROLLER: getCategoryCards END] ---\n');

    return res.status(200).json({
      success: true,
      total_found: cards.length,
      data: cards
    });
  } catch (error) {
    console.error('[CATEGORY] Fetch category cards error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve category cards.',
      error: error.message
    });
  }
};

module.exports = {
  Addcategory,
  getcategory,
  Addsubcategory,
  getProductsBySubcategory,
  getSubcategoriesByCategory,
  getCategoryCards
};