const db = require('../DATABASE/mysql');
const { getFullImageUrl } = require('../utils/imageUtils');
const productsearch = async(keyword,minprice,maxprice) =>{
    const searchvalue = '%' + keyword + '%';
    let sqlquery = 'SELECT * FROM products WHERE (name LIKE ? OR description LIKE ?)';
    let queryvalue = [searchvalue,searchvalue];

    if(minprice){
        sqlquery = 'and price >=?'
        queryvalue.push(Number(minprice))
    }
    if(maxprice){
        sqlquery = 'and price <=?';
        queryvalue.push(Number(maxprice))
    }

    const [result] = await db.execute(sqlquery,queryvalue)
    return result.map(product =>({
        ...product,
        image_url:getFullImageUrl(product.image_url)
    }))
};
const productdelete = async(product_id) =>{
    const deleteImagesQuery = 'DELETE FROM product_images WHERE product_id = ?';
    await db.execute(deleteImagesQuery, [product_id]);
    const deletequery = 'DELETE FROM products WHERE product_id = ?';
    const [result] = await db.execute(deletequery, [product_id]);

    return result;
};
const allproductget = async(minPrice, maxPrice, limit, offset)=>{
    let query = `SELECT * FROM products`;
    let queryParams = [];
if (minPrice !== null && maxPrice !== null && !isNaN(minPrice) && !isNaN(maxPrice)) {
      query += ` WHERE price >= ? AND price <= ?`;
      queryParams.push(minPrice, maxPrice);
    }
    
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const [results] = await db.execute(query, queryParams);
    return results.map(product => ({
        ...product,
        image_url: getFullImageUrl(product.image_url)
    }));// Result wapas bhej
};

const productrecomendution = async(product_id, category_id, subcategory_id)=>{
    const RECOMMENDATION_LIMIT = 6;
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
          return results.map(product => ({
            ...product,
            image_url: getFullImageUrl(product.image_url)
        }));
     }
     else {
           const query = `
             SELECT product_id, name, price, image_url, subcategory_id
             FROM products 
             WHERE category_id = ? AND product_id != ? AND stock_qty > 0
             ORDER BY RAND()
             LIMIT ${RECOMMENDATION_LIMIT}
           `;
     
           const [results] = await db.execute(query, [category_id, product_id]);
          return results.map(product => ({
            ...product,
            image_url: getFullImageUrl(product.image_url)
        }));
     };
};

const getproduct = async()=>{
    const query = 'SELECT * FROM products';
    const [result] = await db.execute(query);
    return result;
};
const getbyidproduct = async (productId) => {
    // 1. Fetch Product
    const productQuery = `SELECT * FROM products WHERE product_id = ?`;
    const [productResults] = await db.execute(productQuery, [productId]);

    // Agar product nahi mila toh null return kar do
    if (productResults.length === 0) {
        return null; 
    }
    const product = productResults[0];

    // 2. Fetch Images
    const imagesQuery = `SELECT image_url FROM product_images WHERE product_id = ?`;
    const [imageResults] = await db.execute(imagesQuery, [productId]);

    // 3. Data Formatting (Images ko array mein daalna)
    const allImages = [];
    if (product.image_url) {
        allImages.push(getFullImageUrl(product.image_url));
    }
    if (imageResults && imageResults.length > 0) {
        imageResults.forEach(img => {
            allImages.push(getFullImageUrl(img.image_url));
        });
    }
    product.images = allImages;
    product.image_url = getFullImageUrl(product.image_url);

    // 4. Ekdum ready product object return karo
    return product;
};
// File: src/services/productService.js
// File: src/services/productService.js
// (Upar const db = require('../../config/db'); zaroor rakhna)

const addProductToDB = async (productData) => {
    const {
        name, price, description, base_color, category_id, stock_qty, is_active, mainImage,
        primary_color, other_color, border_type, pattern, craft, weave, zari_type, 
        blouse, border_motifs, origin, fabric, khats, weight, blouse_length, producer, maker,
        extraImagesUrls // Yeh naya array hai extra images ki URL ke liye
    } = productData;

    // 1. Check Category Exists
    const categoryQuery = 'SELECT category_id FROM categories WHERE category_id = ?';
    const [categoryResult] = await db.execute(categoryQuery, [category_id]);
    
    if (categoryResult.length === 0) {
        throw new Error('CATEGORY_NOT_FOUND'); // Controller ko batayenge
    }

    // 2. Check Duplicate Product
    const duplicateQuery = 'SELECT product_id FROM products WHERE name = ? AND category_id = ?';
    const [productResult] = await db.execute(duplicateQuery, [name, category_id]);
    
    if (productResult.length > 0) {
        throw new Error('DUPLICATE_PRODUCT'); // Controller ko batayenge
    }

    // 3. Insert Product Data
    const insertProductQuery = `
      INSERT INTO products (
        name, price, description, base_color, category_id, stock_qty, is_active, image_url,
        primary_color, other_color, border_type, pattern, craft, weave, zari_type, 
        blouse, border_motifs, origin, fabric, khats, weight, blouse_length, producer, maker
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      name, Number(price), description || null, base_color || null, Number(category_id), Number(stock_qty), Number(is_active), mainImage || null,
      primary_color || null, other_color || null, border_type || null, pattern || null, 
      craft || null, weave || null, zari_type || null, blouse || null, border_motifs || null, 
      origin || null, fabric || null, khats || null, weight || null, blouse_length || null, 
      producer || null, maker || null
    ];

    const [result] = await db.execute(insertProductQuery, values);
    const newProductId = result.insertId;

    // 4. Insert Extra Images (Agar user ne di hain toh)
    if (extraImagesUrls && extraImagesUrls.length > 0) {
        const insertImagesQuery = `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?`;
        // Array ko SQL format mein change kar rahe hain
        const imageValues = extraImagesUrls.map(url => [newProductId, url, false]);
        
        await db.query(insertImagesQuery, [imageValues]); // Bulk insert ke liye .query use hota hai
    }

    // Sab kuch theek raha toh nayi ID wapas bhej do
    return newProductId;
};
// File: src/services/productService.js

const updateProductInDB = async (product_id, updateData) => {
    // 1. Check karo ki product database mein hai ya nahi
    const checkQuery = 'SELECT product_id FROM products WHERE product_id=?';
    const [checkResult] = await db.execute(checkQuery, [product_id]);
    
    if (checkResult.length === 0) {
        throw new Error('PRODUCT_NOT_FOUND'); // Controller ko error bhej do
    }

    // 2. Data extract karo (jo controller ne 'updateData' mein bheja hai)
    const { 
        category_id, name, description, price, stock_qty, is_active,
        base_color, primary_color, other_color, border_type, pattern, 
        craft, weave, zari_type, blouse, border_motifs, origin, 
        fabric, khats, weight, blouse_length, producer, maker 
    } = updateData;

    // 3. Update SQL Query
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

    // 4. Query execute karo (Yahan insertId ki zaroorat nahi hai)
    await db.execute(updateQuery, values);
    
    return true; // Sab theek raha toh bas true wapas bhej do
};// module.exports mein 'addProductToDB' add karna mat bhoolna

const addimageindb = async(product_id,uploadedImages) =>{
    const insertImagesQuery = 'INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?';
    const imageValues = uploadedImages.map(uploaded => [product_id, uploaded.url, false]);
     const [result] = await db.query(insertImagesQuery, [imageValues]); 
     return result;
};

const deleteimageindb = async(image_id) =>{
     const deleteQuery = 'DELETE FROM product_images WHERE image_id = ?';
      const [result] = await db.execute(deleteQuery, [image_id]);
      return result
}

module.exports = {
    productsearch,
    productdelete,
    allproductget,
    productrecomendution,
    getproduct,
    getbyidproduct,
    addProductToDB,
   updateProductInDB,
   addimageindb,
   deleteimageindb 
}