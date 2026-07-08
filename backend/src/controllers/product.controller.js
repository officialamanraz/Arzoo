const db = require('../../config/db');

// ==========================================
// 1. GET ALL PRODUCTS (Basic)
// ==========================================
const product = async (req, res) => {
  try {
    const query = 'SELECT * FROM products';
    const [result] = await db.query(query);
    
    return res.status(200).json({
      success: true,
      message: 'Data fetched successfully',
      data: result,
    });
  } catch (err) {
    console.error('[Error] Fetching basic products:', err.message);
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

  try {
    const productQuery = `SELECT * FROM products WHERE product_id = ?`;
    const [productResults] = await db.query(productQuery, [productId]);

    if (productResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = productResults[0];

    const imagesQuery = `SELECT image_url FROM product_images WHERE product_id = ?`;
    const [imageResults] = await db.query(imagesQuery, [productId]);

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

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error('[Error] Fetching product by ID:', err.message);
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

  let mainImage = null;
  let extraImages = [];
  const is_active = req.body.is_active || 1;

  if (!category_id || !name || !price) {
    return res.status(400).json({ success: false, message: 'Category ID, Name, and Price are required fields' });
  }
  if (Number(price) <= 0) {
    return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
  }
  if (Number(stock_qty) < 0) {
    return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative' });
  }

  if (req.files && req.files.length > 0) {
    mainImage = req.files[0].filename; 
    if (req.files.length > 1) {
      extraImages = req.files.slice(1); 
    }
  }

  try {
    const categoryQuery = 'SELECT category_id FROM categories WHERE category_id = ?';
    const [categoryResult] = await db.query(categoryQuery, [category_id]);
    if (categoryResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Provided Category ID does not exist' });
    }

    const duplicateQuery = 'SELECT product_id FROM products WHERE name = ? AND category_id = ?';
    const [productResult] = await db.query(duplicateQuery, [name, category_id]);
    if (productResult.length > 0) {
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

    if (extraImages.length > 0) {
      const insertImagesQuery = `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?`;
      const imageValues = extraImages.map(file => [newProductId, '/uploads/' + file.filename, false]);
      
      try {
        await db.query(insertImagesQuery, [imageValues]);
      } catch (imgErr) {
        console.error("[Error] Saving extra images:", imgErr.message);
      }
    }

    return res.status(201).json({ success: true, message: 'Product successfully added.', product_id: newProductId });
  } catch (err) {
    console.error('[Error] Adding product:', err.message);
    return res.status(500).json({ success: false, message: 'Database error while adding product', error: err.message });
  }
};

// ==========================================
// 4. SEARCH PRODUCT
// ==========================================
const searchproduct = async (req, res) => {
  const { keyword, minprice, maxprice } = req.query;

  if (!keyword) {
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
    const [result] = await db.query(sqlQuery, queryValues);
    return res.status(200).json({ success: true, total_found: result.length, data: result });
  } catch (err) {
    console.error('[Error] Searching products:', err.message);
    return res.status(500).json({ success: false, message: 'Database search error.', error: err.message });
  }
};

// ==========================================
// 5. UPDATE PRODUCT
// ==========================================
const updateproduct = async (req, res) => {
  const product_id = req.params.id;
  
  const { 
    category_id, name, description, price, stock_qty, is_active,
    base_color, primary_color, other_color, border_type, pattern, 
    craft, weave, zari_type, blouse, border_motifs, origin, 
    fabric, khats, weight, blouse_length, producer, maker 
  } = req.body;

  try {
    const checkproduct = 'SELECT product_id FROM products WHERE product_id=?';
    const [result] = await db.query(checkproduct, [product_id]);

    if (result.length === 0) {
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
    return res.status(200).json({ success: true, message: 'Product details updated successfully' });
  } catch (err) {
    console.error('[Error] Updating product:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update product details', error: err.message });
  }
};

// ==========================================
// 6. DELETE PRODUCT
// ==========================================
const deleteproduct = async (req, res) => {
  const product_id = req.params.id;

  try {
    const deleteImagesQuery = 'DELETE FROM product_images WHERE product_id = ?';
    await db.query(deleteImagesQuery, [product_id]);

    const deletequery = 'DELETE FROM products WHERE product_id = ?';
    const [result] = await db.query(deletequery, [product_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, message: 'Product and associated images successfully deleted.' });
  } catch (err) {
    console.error('[Error] Deleting product:', err.message);
    return res.status(500).json({ success: false, message: 'Error deleting product', error: err.message });
  }
};

// ==========================================
// 7. GET ALL PRODUCTS (Paginated + Filtered)
// ==========================================
// ==========================================
// 7. GET ALL PRODUCTS (Paginated + Filtered)
// ==========================================
// ==========================================
// 7. GET ALL PRODUCTS (Paginated + Filtered)
// ==========================================
const getallproduct = async (req, res) => {
  try {
    // 1. Strictly parse inputs
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);
    const offset = (page - 1) * limit;

    const minPrice = req.query.min ? Number(req.query.min) : null;
    const maxPrice = req.query.max ? Number(req.query.max) : null;

    let query = `SELECT * FROM products`;
    let queryParams = [];

    // 2. Build query dynamically
    if (minPrice !== null && maxPrice !== null) {
      query += ` WHERE price >= ? AND price <= ?`;
      queryParams.push(minPrice, maxPrice);
    }

    // 3. Add pagination securely
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    // 4. CRITICAL FIX: Use db.execute instead of db.query for arrays with numbers.
    // mysql2/promise handles number casting perfectly when using prepared statements (execute).
    const [results] = await db.execute(query, queryParams);
    
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    // Print the FULL error object to the Render console, not just the message
    console.error('[Error] Fetching paginated products:', err); 
    
    return res.status(500).json({ 
      success: false, 
      message: "Server Error fetching product list", 
      // Safely extract a string even if the error is a complex object
      error: err.sqlMessage || err.message || String(err) 
    });
  }
};
// ==========================================
// 8. ADD NEW IMAGES TO EXISTING PRODUCT
// ==========================================
const addNewImagesToProduct = async (req, res) => {
  const product_id = req.params.id;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one image file is required to upload.' });
  }

  const imageValues = req.files.map((file) => {
    const imageUrl = '/uploads/' + file.filename;
    return [product_id, imageUrl, false];
  });

  const insertImagesQuery = 'INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?';

  try {
    const [result] = await db.query(insertImagesQuery, [imageValues]);
    return res.status(201).json({ success: true, message: `${result.affectedRows} new images successfully added to product.` });
  } catch (err) {
    console.error('[Error] Adding new images:', err.message);
    return res.status(500).json({ success: false, message: 'Error saving new images to database', error: err.message });
  }
};

// ==========================================
// 9. DELETE SINGLE EXTRA IMAGE
// ==========================================
const deleteSingleImage = async (req, res) => {
  const image_id = req.params.image_id;

  const deleteQuery = 'DELETE FROM product_images WHERE image_id = ?';

  try {
    const [result] = await db.query(deleteQuery, [image_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Image record not found' });
    }

    return res.status(200).json({ success: true, message: 'Image permanently deleted.' });
  } catch (err) {
    console.error('[Error] Deleting single image:', err.message);
    return res.status(500).json({ success: false, message: 'Error processing image deletion', error: err.message });
  }
};

// ==========================================
// 10. GET RECOMMENDED PRODUCTS
// ==========================================
const getRecommendedProducts = async (req, res) => {
  const { product_id, category_id, subcategory_id } = req.query;

  if (!product_id || !category_id) {
    return res.status(400).json({ success: false, message: "product_id and category_id are required" });
  }

  try {
    if (subcategory_id) {
      const priceQuery = `SELECT price FROM products WHERE product_id = ?`;
      const [priceResult] = await db.query(priceQuery, [product_id]);
      const currentPrice = priceResult[0]?.price || 0;

      const query = `
        SELECT product_id, name, price, image_url, subcategory_id
        FROM products 
        WHERE subcategory_id = ? AND product_id != ? AND stock_qty > 0
        ORDER BY RAND(), ABS(price - ?) ASC
        LIMIT 6
      `;

      const [results] = await db.query(query, [subcategory_id, product_id, currentPrice]);
      return res.status(200).json({ success: true, data: results || [] });
    } else {
      const query = `
        SELECT product_id, name, price, image_url, subcategory_id
        FROM products 
        WHERE category_id = ? AND product_id != ? AND stock_qty > 0
        ORDER BY RAND()
        LIMIT 6
      `;

      const [results] = await db.query(query, [category_id, product_id]);
      return res.status(200).json({ success: true, data: results || [] });
    }
  } catch (err) {
    console.error("[Error] Fetching recommendations:", err.message);
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