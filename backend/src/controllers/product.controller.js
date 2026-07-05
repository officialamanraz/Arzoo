const db = require('../../config/db');

// ==========================================
// 1. GET ALL PRODUCTS (Basic)
// ==========================================
const product = async (req, res) => {
  const showproduct = 'SELECT * FROM products';

  try {
    const [result] = await db.query(showproduct);
    return res.status(200).json({
      success: true,
      message: 'Data fetched successfully',
      data: result,
    });
  } catch (err) {
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
    // 1st Query: Get basic product details (this automatically includes all new columns)
    const productQuery = `SELECT * FROM products WHERE product_id = ?`;
    const [productResults] = await db.query(productQuery, [productId]);

    if (productResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = productResults[0];

    // 2nd Query: Get extra images from new table
    const imagesQuery = `SELECT image_url FROM product_images WHERE product_id = ?`;
    const [imageResults] = await db.query(imagesQuery, [productId]);

    const allImages = [];

    // Push main image first (from products table)
    if (product.image_url) {
      allImages.push(product.image_url);
    }

    // Push extra images (from product_images table)
    if (imageResults && imageResults.length > 0) {
      imageResults.forEach(img => {
        allImages.push(img.image_url);
      });
    }

    product.images = allImages;

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error fetching product details', error: err.message });
  }
};

// ==========================================
// 3. ADD PRODUCT (Handles Dynamic Multiple Images + All New Columns)
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
  if (price <= 0) {
    return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
  }
  if (stock_qty < 0) {
    return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative' });
  }

  // Handle Uploaded Files
  if (req.files && req.files.length > 0) {
    mainImage = req.files[0].filename; 
    if (req.files.length > 1) {
      extraImages = req.files.slice(1); 
    }
  }

  try {
    const categoryQuery = 'SELECT * FROM Categories WHERE category_id = ?';
    const [categoryResult] = await db.query(categoryQuery, [category_id]);
    if (categoryResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Provided Category ID does not exist' });
    }

    const duplicateQuery = 'SELECT * FROM products WHERE name = ? AND category_id = ?';
    const [productResult] = await db.query(duplicateQuery, [name, category_id]);
    if (productResult.length > 0) {
      return res.status(409).json({ success: false, message: 'Product already exists in this category' });
    }

    // UPDATED QUERY: Now inserts all 14 new columns safely
    const insertProductQuery = `
      INSERT INTO products (
        name, price, description, base_color, category_id, stock_qty, is_active, image_url,
        primary_color, other_color, border_type, pattern, craft, weave, zari_type, 
        blouse, border_motifs, origin, fabric, khats, weight, blouse_length, producer, maker
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Values array perfectly matches the query above. (|| null prevents SQL crashes if a field is empty)
    const values = [
      name, price, description || null, base_color || null, category_id, stock_qty, is_active, mainImage,
      primary_color || null, other_color || null, border_type || null, pattern || null, 
      craft || null, weave || null, zari_type || null, blouse || null, border_motifs || null, 
      origin || null, fabric || null, khats || null, weight || null, blouse_length || null, 
      producer || null, maker || null
    ];

    const [result] = await db.query(insertProductQuery, values);
    const newProductId = result.insertId;

    if (extraImages.length > 0) {
      const insertImagesQuery = `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?`;
      const imageValues = extraImages.map(file => [newProductId, '/uploads/' + file.filename, false]);
      
      try {
        await db.query(insertImagesQuery, [imageValues]);
      } catch (err4) {
        console.error("Error saving extra images:", err4.message);
      }
    }

    return res.status(201).json({ success: true, message: 'Product successfully added.', product_id: newProductId });
  } catch (err) {
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
    return res.status(500).json({ success: false, message: 'Database search error.', error: err.message });
  }
};

// ==========================================
// 5. UPDATE PRODUCT (Now handles ALL new columns)
// ==========================================
const updateproduct = async (req, res) => {
  const product_id = req.params.id;
  
  // Extract all fields, including the newly added ones
  const { 
    category_id, name, description, price, stock_qty, is_active,
    base_color, primary_color, other_color, border_type, pattern, 
    craft, weave, zari_type, blouse, border_motifs, origin, 
    fabric, khats, weight, blouse_length, producer, maker 
  } = req.body;

  try {
    const checkproduct = 'SELECT * FROM products WHERE product_id=?';
    const [result] = await db.query(checkproduct, [product_id]);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // UPDATED QUERY: Now updates all specific detail columns
    const update = `
      UPDATE products SET 
        category_id=?, name=?, description=?, price=?, stock_qty=?, is_active=?,
        base_color=?, primary_color=?, other_color=?, border_type=?, pattern=?, 
        craft=?, weave=?, zari_type=?, blouse=?, border_motifs=?, origin=?, 
        fabric=?, khats=?, weight=?, blouse_length=?, producer=?, maker=?
      WHERE product_id=?
    `;
    
    const values = [
      category_id, name, description || null, price, stock_qty, is_active,
      base_color || null, primary_color || null, other_color || null, border_type || null, pattern || null,
      craft || null, weave || null, zari_type || null, blouse || null, border_motifs || null, origin || null,
      fabric || null, khats || null, weight || null, blouse_length || null, producer || null, maker || null,
      product_id
    ];

    await db.query(update, values);
    return res.status(200).json({ success: true, message: 'Product details updated successfully' });
  } catch (err) {
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
    return res.status(500).json({ success: false, message: 'Error deleting product', error: err.message });
  }
};

// ==========================================
// 7. GET ALL PRODUCTS (Paginated + Filtered)
// ==========================================
const getallproduct = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;

  const minPrice = req.query.min;
  const maxPrice = req.query.max;

  let query = `SELECT * FROM products`;
  let queryParams = [];

  if (minPrice && maxPrice) {
    query += ` WHERE price >= ? AND price <= ?`;
    queryParams.push(Number(minPrice), Number(maxPrice));
  }

  query += ` LIMIT ? OFFSET ?`;
  queryParams.push(limit, offset);

  try {
    const [results] = await db.query(query, queryParams);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server Error fetching product list", error: err.message });
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
    console.error("Recommendations Error:", err);
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