const db = require('../DATABASE/mysql'); // FIXED: was '../../config/db' (path doesn't exist in this project)

// ==========================================
// 1. GET ALL PRODUCTS (Basic)
// ==========================================
const product = async (req, res) => {
  console.log('[PRODUCT] Fetching all products (basic)');
  try {
    const query = 'SELECT * FROM products';
    const [result] = await db.execute(query);

    console.log(`[PRODUCT] Fetch success -- ${result.length} product(s)`);
    return res.status(200).json({
      success: true,
      message: 'Data fetched successfully',
      data: result,
    });
  } catch (err) {
    console.error('[PRODUCT] Error fetching basic products:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: err.message,
    });
  }
};

// ==========================================
// 2. GET PRODUCT BY ID (With Multiple Images)
// ==========================================
const getProductById = async (req, res) => {
  const productId = req.params.id;
  console.log(`[PRODUCT] Fetching by id: ${productId}`);

  try {
    const productQuery = `SELECT * FROM products WHERE product_id = ?`;
    const [productResults] = await db.execute(productQuery, [productId]);

    if (productResults.length === 0) {
      console.warn(`[PRODUCT] Not found -- product_id: ${productId}`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = productResults[0];

    const imagesQuery = `SELECT image_url FROM product_images WHERE product_id = ?`;
    const [imageResults] = await db.execute(imagesQuery, [productId]);

    const allImages = [];

    if (product.image_url) {
      allImages.push(product.image_url);
    }

    if (imageResults && imageResults.length > 0) {
      imageResults.forEach(img => {
        allImages.push(img.image_url);
      });
    }

    product.images = allImages;

    console.log(`[PRODUCT] Fetch success -- product_id: ${productId}, ${allImages.length} image(s)`);
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error(`[PRODUCT] Error fetching product by id (${productId}):`, err.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Database error fetching product details', 
      error: err.message 
    });
  }
};

// ==========================================
// 3. ADD PRODUCT
// ==========================================
const addproducts = async (req, res) => {
  const {
    category_id, name, description, price, stock_qty, base_color,
    primary_color, other_color, border_type, pattern, craft, weave,
    zari_type, blouse, border_motifs, origin, fabric, khats, weight,
    blouse_length, producer, maker,
  } = req.body;

  console.log('[PRODUCT] Add product -- name:', name, 'category_id:', category_id);

  let mainImage = null;
  let extraImages = [];
  const DEFAULT_IS_ACTIVE = 1;
  const is_active = req.body.is_active ?? DEFAULT_IS_ACTIVE;

  if (!category_id || !name || !price) {
    console.warn('[PRODUCT] Add failed -- missing category_id, name, or price');
    return res.status(400).json({ success: false, message: 'Category ID, Name, and Price are required fields' });
  }
  if (Number(price) <= 0) {
    console.warn(`[PRODUCT] Add failed -- invalid price: ${price}`);
    return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
  }
  if (Number(stock_qty) < 0) {
    console.warn(`[PRODUCT] Add failed -- negative stock_qty: ${stock_qty}`);
    return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative' });
  }

  if (req.files && req.files.length > 0) {
    mainImage = req.files[0].filename;
    if (req.files.length > 1) {
      extraImages = req.files.slice(1);
    }
    console.log(`[PRODUCT] ${req.files.length} file(s) received -- main: ${mainImage}, extra: ${extraImages.length}`);
  }

  try {
    const categoryQuery = 'SELECT category_id FROM categories WHERE category_id = ?';
    const [categoryResult] = await db.execute(categoryQuery, [category_id]);
    if (categoryResult.length === 0) {
      console.warn(`[PRODUCT] Add failed -- category_id ${category_id} does not exist`);
      return res.status(404).json({ success: false, message: 'Provided Category ID does not exist' });
    }

    const duplicateQuery = 'SELECT product_id FROM products WHERE name = ? AND category_id = ?';
    const [productResult] = await db.execute(duplicateQuery, [name, category_id]);
    if (productResult.length > 0) {
      console.warn(`[PRODUCT] Add failed -- duplicate "${name}" in category ${category_id}`);
      return res.status(409).json({ success: false, message: 'Product already exists in this category' });
    }

    const insertProductQuery = `
      INSERT INTO products (
        name, price, description, base_color, category_id, stock_qty, is_active, image_url,
        primary_color, other_color, border_type, pattern, craft, weave, zari_type, 
        blouse, border_motifs, origin, fabric, khats, weight, blouse_length, producer, maker
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      name, Number(price), description || null, base_color || null, Number(category_id), Number(stock_qty), Number(is_active), mainImage,
      primary_color || null, other_color || null, border_type || null, pattern || null, 
      craft || null, weave || null, zari_type || null, blouse || null, border_motifs || null, 
      origin || null, fabric || null, khats || null, weight || null, blouse_length || null, 
      producer || null, maker || null
    ];

    const [result] = await db.execute(insertProductQuery, values);
    const newProductId = result.insertId;
    console.log(`[PRODUCT] Added -- product_id: ${newProductId}, name: ${name}`);

    if (extraImages.length > 0) {
      const insertImagesQuery = `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?`;
      const imageValues = extraImages.map(file => [newProductId, '/uploads/' + file.filename, false]);

      try {
        await db.query(insertImagesQuery, [imageValues]); // bulk VALUES ? syntax needs .query, not .execute
        console.log(`[PRODUCT] ${extraImages.length} extra image(s) saved -- product_id: ${newProductId}`);
      } catch (imgErr) {
        console.error(`[PRODUCT] Error saving extra images (product_id: ${newProductId}):`, imgErr.message);
      }
    }

    return res.status(201).json({ success: true, message: 'Product successfully added.', product_id: newProductId });
  } catch (err) {
    console.error(`[PRODUCT] Error adding product (name: ${name}):`, err.message);
    return res.status(500).json({ success: false, message: 'Database error while adding product', error: err.message });
  }
};

// ==========================================
// 4. SEARCH PRODUCT
// ==========================================
const searchproduct = async (req, res) => {
  const { keyword, minprice, maxprice } = req.query;
  console.log(`[PRODUCT] Search -- keyword: "${keyword}", minprice: ${minprice}, maxprice: ${maxprice}`);

  if (!keyword) {
    console.warn('[PRODUCT] Search failed -- missing keyword');
    return res.status(400).json({ success: false, message: 'Search keyword is required.' });
  }

  const searchvalue = '%' + keyword + '%';
  let sqlQuery = 'SELECT * FROM products WHERE (name LIKE ? OR description LIKE ?)';
  let queryValues = [searchvalue, searchvalue];

  if (minprice) {
    sqlQuery += ' AND price >= ?';
    queryValues.push(Number(minprice));
  }
  if (maxprice) {
    sqlQuery += ' AND price <= ?';
    queryValues.push(Number(maxprice));
  }

  try {
    const [result] = await db.execute(sqlQuery, queryValues);
    console.log(`[PRODUCT] Search success -- ${result.length} result(s) for "${keyword}"`);
    return res.status(200).json({ success: true, total_found: result.length, data: result });
  } catch (err) {
    console.error(`[PRODUCT] Search error (keyword: ${keyword}):`, err.message);
    return res.status(500).json({ success: false, message: 'Database search error.', error: err.message });
  }
};

// ==========================================
// 5. UPDATE PRODUCT
// ==========================================
const updateproduct = async (req, res) => {
  const product_id = req.params.id;
  console.log(`[PRODUCT] Update -- product_id: ${product_id}`);

  const { 
    category_id, name, description, price, stock_qty, is_active,
    base_color, primary_color, other_color, border_type, pattern, 
    craft, weave, zari_type, blouse, border_motifs, origin, 
    fabric, khats, weight, blouse_length, producer, maker 
  } = req.body;

  try {
    const checkproduct = 'SELECT product_id FROM products WHERE product_id=?';
    const [result] = await db.execute(checkproduct, [product_id]);

    if (result.length === 0) {
      console.warn(`[PRODUCT] Update failed -- product_id ${product_id} not found`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updateQuery = `
      UPDATE products SET 
        category_id=?, name=?, description=?, price=?, stock_qty=?, is_active=?,
        base_color=?, primary_color=?, other_color=?, border_type=?, pattern=?, 
        craft=?, weave=?, zari_type=?, blouse=?, border_motifs=?, origin=?, 
        fabric=?, khats=?, weight=?, blouse_length=?, producer=?, maker=?
      WHERE product_id=?
    `;

    const values = [
      Number(category_id), name, description || null, Number(price), Number(stock_qty), Number(is_active),
      base_color || null, primary_color || null, other_color || null, border_type || null, pattern || null,
      craft || null, weave || null, zari_type || null, blouse || null, border_motifs || null, origin || null,
      fabric || null, khats || null, weight || null, blouse_length || null, producer || null, maker || null,
      Number(product_id)
    ];

    await db.execute(updateQuery, values);
    console.log(`[PRODUCT] Update success -- product_id: ${product_id}`);
    return res.status(200).json({ success: true, message: 'Product details updated successfully' });
  } catch (err) {
    console.error(`[PRODUCT] Update error (product_id: ${product_id}):`, err.message);
    return res.status(500).json({ success: false, message: 'Failed to update product details', error: err.message });
  }
};

// ==========================================
// 6. DELETE PRODUCT
// ==========================================
const deleteproduct = async (req, res) => {
  const product_id = req.params.id;
  console.log(`[PRODUCT] Delete -- product_id: ${product_id}`);

  try {
    const deleteImagesQuery = 'DELETE FROM product_images WHERE product_id = ?';
    await db.execute(deleteImagesQuery, [product_id]);

    const deletequery = 'DELETE FROM products WHERE product_id = ?';
    const [result] = await db.execute(deletequery, [product_id]);

    if (result.affectedRows === 0) {
      console.warn(`[PRODUCT] Delete failed -- product_id ${product_id} not found`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    console.log(`[PRODUCT] Delete success -- product_id: ${product_id}`);
    return res.status(200).json({ success: true, message: 'Product and associated images successfully deleted.' });
  } catch (err) {
    console.error(`[PRODUCT] Delete error (product_id: ${product_id}):`, err.message);
    return res.status(500).json({ success: false, message: 'Error deleting product', error: err.message });
  }
};

// ==========================================
// 7. GET ALL PRODUCTS (Paginated)
// ==========================================
const getallproduct = async (req, res) => {
  console.log('[PRODUCT] Fetching paginated products -- query:', req.query);
  try {
    // Strictly parse inputs as Numbers
    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 12;
    const page = Math.max(1, parseInt(req.query.page) || DEFAULT_PAGE);
    const limit = Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT);
    const offset = (page - 1) * limit;

    const minPrice = req.query.min ? Number(req.query.min) : null;
    const maxPrice = req.query.max ? Number(req.query.max) : null;

    let query = `SELECT * FROM products`;
    let queryParams = [];

    // Build query dynamically for prices
    if (minPrice !== null && maxPrice !== null && !isNaN(minPrice) && !isNaN(maxPrice)) {
      query += ` WHERE price >= ? AND price <= ?`;
      queryParams.push(minPrice, maxPrice);
    }

    // LIMIT/OFFSET injected as sanitized numbers -- mysql2 prepared statements
    // don't support placeholders for LIMIT/OFFSET reliably, so they're
    // validated as integers above and interpolated directly (safe, not
    // user-controlled strings).
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const [results] = await db.execute(query, queryParams);
    console.log(`[PRODUCT] Paginated fetch success -- page: ${page}, limit: ${limit}, returned: ${results.length}`);

    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('[PRODUCT] Error fetching paginated products:', err.message);

    return res.status(500).json({ 
      success: false, 
      message: "Server Error fetching product list", 
      error: err.sqlMessage || err.message || String(err) 
    });
  }
};

// ==========================================
// 8. ADD NEW IMAGES TO EXISTING PRODUCT
// ==========================================
const addNewImagesToProduct = async (req, res) => {
  const product_id = req.params.id;
  console.log(`[PRODUCT] Add new images -- product_id: ${product_id}, files: ${req.files ? req.files.length : 0}`);

  if (!req.files || req.files.length === 0) {
    console.warn(`[PRODUCT] Add images failed -- no files (product_id: ${product_id})`);
    return res.status(400).json({ success: false, message: 'At least one image file is required to upload.' });
  }

  const imageValues = req.files.map((file) => {
    const imageUrl = '/uploads/' + file.filename;
    return [product_id, imageUrl, false];
  });

  const insertImagesQuery = 'INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?';

  try {
    const [result] = await db.query(insertImagesQuery, [imageValues]); // bulk VALUES ? syntax needs .query
    console.log(`[PRODUCT] ${result.affectedRows} image(s) added -- product_id: ${product_id}`);
    return res.status(201).json({ success: true, message: `${result.affectedRows} new images successfully added to product.` });
  } catch (err) {
    console.error(`[PRODUCT] Error adding new images (product_id: ${product_id}):`, err.message);
    return res.status(500).json({ success: false, message: 'Error saving new images to database', error: err.message });
  }
};

// ==========================================
// 9. DELETE SINGLE EXTRA IMAGE
// ==========================================
const deleteSingleImage = async (req, res) => {
  const image_id = req.params.image_id;
  console.log(`[PRODUCT] Delete single image -- image_id: ${image_id}`);

  const deleteQuery = 'DELETE FROM product_images WHERE image_id = ?';

  try {
    const [result] = await db.execute(deleteQuery, [image_id]);

    if (result.affectedRows === 0) {
      console.warn(`[PRODUCT] Delete image failed -- image_id ${image_id} not found`);
      return res.status(404).json({ success: false, message: 'Image record not found' });
    }

    console.log(`[PRODUCT] Image deleted -- image_id: ${image_id}`);
    return res.status(200).json({ success: true, message: 'Image permanently deleted.' });
  } catch (err) {
    console.error(`[PRODUCT] Error deleting image (image_id: ${image_id}):`, err.message);
    return res.status(500).json({ success: false, message: 'Error processing image deletion', error: err.message });
  }
};

// ==========================================
// 10. GET RECOMMENDED PRODUCTS
// ==========================================
const getRecommendedProducts = async (req, res) => {
  const { product_id, category_id, subcategory_id } = req.query;
  console.log(`[PRODUCT] Recommendations -- product_id: ${product_id}, category_id: ${category_id}, subcategory_id: ${subcategory_id}`);

  const RECOMMENDATION_LIMIT = 6;

  if (!product_id || !category_id) {
    console.warn('[PRODUCT] Recommendations failed -- missing product_id or category_id');
    return res.status(400).json({ success: false, message: "product_id and category_id are required" });
  }

  try {
    if (subcategory_id) {
      const priceQuery = `SELECT price FROM products WHERE product_id = ?`;
      const [priceResult] = await db.execute(priceQuery, [product_id]);
      const currentPrice = priceResult[0]?.price || 0;

      const query = `
        SELECT product_id, name, price, image_url, subcategory_id
        FROM products 
        WHERE subcategory_id = ? AND product_id != ? AND stock_qty > 0
        ORDER BY RAND(), ABS(price - ?) ASC
        LIMIT ${RECOMMENDATION_LIMIT}
      `;

      const [results] = await db.execute(query, [subcategory_id, product_id, currentPrice]);
      console.log(`[PRODUCT] Recommendations (by subcategory) -- ${results.length} result(s)`);
      return res.status(200).json({ success: true, data: results || [] });
    } else {
      const query = `
        SELECT product_id, name, price, image_url, subcategory_id
        FROM products 
        WHERE category_id = ? AND product_id != ? AND stock_qty > 0
        ORDER BY RAND()
        LIMIT ${RECOMMENDATION_LIMIT}
      `;

      const [results] = await db.execute(query, [category_id, product_id]);
      console.log(`[PRODUCT] Recommendations (by category) -- ${results.length} result(s)`);
      return res.status(200).json({ success: true, data: results || [] });
    }
  } catch (err) {
    console.error(`[PRODUCT] Recommendations error (product_id: ${product_id}):`, err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  product,
  getProductById,
  addproducts,
  searchproduct,
  updateproduct,
  deleteproduct,
  getallproduct,
  addNewImagesToProduct,
  deleteSingleImage,
  getRecommendedProducts
};