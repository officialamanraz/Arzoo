const db = require('../DATABASE/mysql');
const { getFullImageUrl } = require('../utils/imageUtils');

const productsearch = async(keyword, minprice, maxprice) => {
    console.log(`[PRODUCT_SERVICE] Searching products with keyword: "${keyword}", min: ${minprice}, max: ${maxprice}`);
    try {
        const searchvalue = '%' + keyword + '%';
        let sqlquery = `
            SELECT *, 
            IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount 
            FROM products 
            WHERE (name LIKE ? OR description LIKE ?)
        `;
        let queryvalue = [searchvalue, searchvalue];

        if(minprice){
            sqlquery += ' AND price >= ?';
            queryvalue.push(Number(minprice));
        }
        if(maxprice){
            sqlquery += ' AND price <= ?';
            queryvalue.push(Number(maxprice));
        }

        const [result] = await db.execute(sqlquery, queryvalue);
        console.log(`[PRODUCT_SERVICE] Search found ${result.length} products.`);
        
        return result.map(product => ({
            ...product,
            discount_percentage: product.calculated_discount, // Override with real-time math
            image_url: getFullImageUrl(product.image_url)
        }));
    } catch (err) {
        console.error('[PRODUCT_SERVICE] ❌ Error in productsearch:', err.message);
        console.error('[PRODUCT_SERVICE] Stack:', err.stack);
        throw err;
    }
};

const productdelete = async(product_id) => {
    console.log(`[PRODUCT_SERVICE] Deleting product with ID: ${product_id}`);
    try {
        const deleteImagesQuery = 'DELETE FROM product_images WHERE product_id = ?';
        await db.execute(deleteImagesQuery, [product_id]);
        console.log(`[PRODUCT_SERVICE] Associated images deleted for product ID: ${product_id}`);

        const deletequery = 'DELETE FROM products WHERE product_id = ?';
        const [result] = await db.execute(deletequery, [product_id]);
        console.log(`[PRODUCT_SERVICE] ✅ Product deleted successfully. Affected rows: ${result.affectedRows}`);

        return result;
    } catch (err) {
        console.error(`[PRODUCT_SERVICE] ❌ Error deleting product ID ${product_id}:`, err.message);
        console.error('[PRODUCT_SERVICE] Stack:', err.stack);
        throw err;
    }
};

const allproductget = async(minPrice, maxPrice, limit, offset) => {
    console.log(`[PRODUCT_SERVICE] Fetching all products. Limit: ${limit}, Offset: ${offset}, Min: ${minPrice}, Max: ${maxPrice}`);
    try {
        let query = `
            SELECT *, 
            IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount 
            FROM products
        `;
        let queryParams = [];
        
        if (minPrice !== null && maxPrice !== null && !isNaN(minPrice) && !isNaN(maxPrice)) {
            query += ` WHERE price >= ? AND price <= ?`;
            queryParams.push(minPrice, maxPrice);
        }
        
        query += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

        const [results] = await db.execute(query, queryParams);
        console.log(`[PRODUCT_SERVICE] ✅ Fetched ${results.length} products successfully.`);
        
        return results.map(product => ({
            ...product,
            discount_percentage: product.calculated_discount,
            image_url: getFullImageUrl(product.image_url)
        }));
    } catch (err) {
        console.error('[PRODUCT_SERVICE] ❌ Error in allproductget:', err.message);
        console.error('[PRODUCT_SERVICE] Stack:', err.stack);
        throw err;
    }
};

const productrecomendution = async(product_id, category_id, subcategory_id) => {
    console.log(`[PRODUCT_SERVICE] Fetching recommendations for Product ID: ${product_id}, SubCat: ${subcategory_id}, Cat: ${category_id}`);
    const RECOMMENDATION_LIMIT = 6;
    try {
        if (subcategory_id) {
            const priceQuery = `SELECT price FROM products WHERE product_id = ?`;
            const [priceResult] = await db.execute(priceQuery, [product_id]);
            const currentPrice = priceResult[0]?.price || 0;
    
            const query = `
                SELECT product_id, name, price, mrp, image_url, subcategory_id,
                IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount
                FROM products 
                WHERE subcategory_id = ? AND product_id != ? AND stock_qty > 0
                ORDER BY RAND(), ABS(price - ?) ASC
                LIMIT ${RECOMMENDATION_LIMIT}
            `;
    
            const [results] = await db.execute(query, [subcategory_id, product_id, currentPrice]);
            console.log(`[PRODUCT_SERVICE] ✅ Subcategory recommendations found: ${results.length}`);
            
            return results.map(product => ({
                ...product,
                discount_percentage: product.calculated_discount,
                image_url: getFullImageUrl(product.image_url)
            }));
        } else {
            const query = `
                SELECT product_id, name, price, mrp, image_url, subcategory_id,
                IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount
                FROM products 
                WHERE category_id = ? AND product_id != ? AND stock_qty > 0
                ORDER BY RAND()
                LIMIT ${RECOMMENDATION_LIMIT}
            `;
     
            const [results] = await db.execute(query, [category_id, product_id]);
            console.log(`[PRODUCT_SERVICE] ✅ Category recommendations found: ${results.length}`);
            
            return results.map(product => ({
                ...product,
                discount_percentage: product.calculated_discount,
                image_url: getFullImageUrl(product.image_url)
            }));
        }
    } catch (err) {
        console.error('[PRODUCT_SERVICE] ❌ Error in productrecomendution:', err.message);
        console.error('[PRODUCT_SERVICE] Stack:', err.stack);
        throw err;
    }
};

const getproduct = async() => {
    console.log(`[PRODUCT_SERVICE] Fetching all raw products list...`);
    try {
        const query = `
            SELECT *, 
            IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount 
            FROM products
        `;
        const [result] = await db.execute(query);
        console.log(`[PRODUCT_SERVICE] ✅ Total raw products fetched: ${result.length}`);
        return result.map(product => ({
            ...product,
            discount_percentage: product.calculated_discount
        }));
    } catch (err) {
        console.error('[PRODUCT_SERVICE] ❌ Error in getproduct:', err.message);
        console.error('[PRODUCT_SERVICE] Stack:', err.stack);
        throw err;
    }
};

const getbyidproduct = async (productId) => {
    console.log(`[PRODUCT_SERVICE] Fetching product details for ID: ${productId}`);
    try {
        const productQuery = `
            SELECT *, 
            IF(mrp > price, ROUND(((mrp - price) / mrp) * 100), 0) AS calculated_discount 
            FROM products 
            WHERE product_id = ?
        `;
        const [productResults] = await db.execute(productQuery, [productId]);

        if (productResults.length === 0) {
            console.warn(`[PRODUCT_SERVICE] ⚠️ Product not found with ID: ${productId}`);
            return null; 
        }
        const product = productResults[0];
        
        // Enforce server-side computed discount calculation override
        product.discount_percentage = product.calculated_discount;

        const imagesQuery = `SELECT image_url FROM product_images WHERE product_id = ?`;
        const [imageResults] = await db.execute(imagesQuery, [productId]);
        console.log(`[PRODUCT_SERVICE] Found ${imageResults.length} extra images in product_images table for ID: ${productId}`);

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

        console.log(`[PRODUCT_SERVICE] ✅ Successfully built product object with ${allImages.length} total images.`);
        return product;
    } catch (err) {
        console.error(`[PRODUCT_SERVICE] ❌ Error in getbyidproduct for ID ${productId}:`, err.message);
        console.error('[PRODUCT_SERVICE] Stack:', err.stack);
        throw err;
    }
};

const addProductToDB = async (productData) => {
    console.log(`[PRODUCT_SERVICE] Attempting to add new product: "${productData?.name}"`);
    try {
        const {
            name, price, description, base_color, category_id, stock_qty, is_active = 1, mainImage,
            primary_color, other_color, border_type, pattern, craft, weave, zari_type, 
            blouse, border_motifs, origin, fabric, khats, weight, blouse_length, producer, maker,
            extraImagesUrls, mrp, dealer_base_price, packaging_cost, is_returnable, dealer_id
        } = productData;

        const parsedPrice = Number(price) || 0;
        const parsedMrp = Number(mrp) || 0;
        // Automatically compute precise server-side discount percentage
        const computedDiscount = (parsedMrp > parsedPrice) ? Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100) : 0;

        const categoryQuery = 'SELECT category_id FROM categories WHERE category_id = ?';
        const [categoryResult] = await db.execute(categoryQuery, [category_id]);
        
        if (categoryResult.length === 0) {
            console.warn(`[PRODUCT_SERVICE] ⚠️ Category not found with ID: ${category_id}`);
            throw new Error('CATEGORY_NOT_FOUND');
        }

        const duplicateQuery = 'SELECT product_id FROM products WHERE name = ? AND category_id = ?';
        const [productResult] = await db.execute(duplicateQuery, [name, category_id]);
        
        if (productResult.length > 0) {
            console.warn(`[PRODUCT_SERVICE] ⚠️ Duplicate product detected: "${name}" in category ID ${category_id}`);
            throw new Error('DUPLICATE_PRODUCT');
        }

        const insertProductQuery = `
          INSERT INTO products (
            name, price, description, base_color, category_id, stock_qty, is_active, image_url,
            primary_color, other_color, border_type, pattern, craft, weave, zari_type, 
            blouse, border_motifs, origin, fabric, khats, weight, blouse_length, producer, maker,
            mrp, discount_percentage, dealer_base_price, packaging_cost, is_returnable, dealer_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          name, 
          parsedPrice, 
          description || null, 
          base_color || null, 
          Number(category_id) || 0, 
          Number(stock_qty) || 10, 
          Number(is_active) || 1, 
          mainImage || null,
          primary_color || null, 
          other_color || null, 
          border_type || null, 
          pattern || null, 
          craft || null, 
          weave || null, 
          zari_type || null, 
          blouse || null, 
          border_motifs || null, 
          origin || null, 
          fabric || null, 
          khats || null, 
          weight || null, 
          blouse_length || null, 
          producer || null, 
          maker || null,
          parsedMrp ? parsedMrp : null,
          computedDiscount, // Server-computed accurate percentage
          dealer_base_price ? Number(dealer_base_price) : null,
          packaging_cost ? Number(packaging_cost) : null,
          is_returnable !== undefined ? Number(is_returnable) : 1, 
          dealer_id || null 
        ];

        const [result] = await db.execute(insertProductQuery, values);
        const newProductId = result.insertId;
        console.log(`[PRODUCT_SERVICE] ✅ Main product inserted successfully with ID: ${newProductId}`);

        if (extraImagesUrls && extraImagesUrls.length > 0) {
            console.log(`[PRODUCT_SERVICE] Inserting ${extraImagesUrls.length} extra images for new product ID: ${newProductId}`);
            const insertImagesQuery = `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?`;
            const imageValues = extraImagesUrls.map(url => [newProductId, url, false]);
            await db.query(insertImagesQuery, [imageValues]); 
            console.log(`[PRODUCT_SERVICE] ✅ Extra images inserted successfully.`);
        }

        return newProductId;
    } catch (err) {
        console.error(`[PRODUCT_SERVICE] ❌ Error in addProductToDB:`, err.message);
        console.error('[PRODUCT_SERVICE] Stack:', err.stack);
        throw err;
    }
};

const updateProductInDB = async (product_id, updateData) => {
    console.log(`[PRODUCT_SERVICE] Attempting to update product ID: ${product_id}`);
    try {
        const checkQuery = 'SELECT product_id FROM products WHERE product_id=?';
        const [checkResult] = await db.execute(checkQuery, [product_id]);
        
        if (checkResult.length === 0) {
            console.warn(`[PRODUCT_SERVICE] ⚠️ Update failed. Product not found with ID: ${product_id}`);
            throw new Error('PRODUCT_NOT_FOUND');
        }

        const { 
            category_id, name, description, price, stock_qty, is_active,
            base_color, primary_color, other_color, border_type, pattern, 
            craft, weave, zari_type, blouse, border_motifs, origin, 
            fabric, khats, weight, blouse_length, producer, maker,
            extraImagesUrls, mainImage, mrp, dealer_base_price, packaging_cost, is_returnable, dealer_id
        } = updateData;

        const parsedPrice = Number(price) || 0;
        const parsedMrp = Number(mrp) || 0;
        const computedDiscount = (parsedMrp > parsedPrice) ? Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100) : 0;

        let updateQuery = `
          UPDATE products SET 
            category_id=?, name=?, description=?, price=?, stock_qty=?, is_active=?,
            base_color=?, primary_color=?, other_color=?, border_type=?, pattern=?, 
            craft=?, weave=?, zari_type=?, blouse=?, border_motifs=?, origin=?, 
            fabric=?, khats=?, weight=?, blouse_length=?, producer=?, maker=?,
            mrp=?, discount_percentage=?, dealer_base_price=?, packaging_cost=?, is_returnable=?, dealer_id=?
        `;
        
        const values = [
            Number(category_id), name, description || null, parsedPrice, Number(stock_qty), Number(is_active),
            base_color || null, primary_color || null, other_color || null, border_type || null, pattern || null,
            craft || null, weave || null, zari_type || null, blouse || null, border_motifs || null, origin || null,
            fabric || null, khats || null, weight || null, blouse_length || null, producer || null, maker || null,
            parsedMrp ? parsedMrp : null,
            computedDiscount, // Computed dynamically on update
            dealer_base_price ? Number(dealer_base_price) : null,
            packaging_cost ? Number(packaging_cost) : null,
            is_returnable !== undefined ? Number(is_returnable) : 1,
            dealer_id || null
        ];

        if (mainImage) {
            console.log(`[PRODUCT_SERVICE] Updating main image for product ID: ${product_id}`);
            updateQuery += `, image_url=?`;
            values.push(mainImage);
        }

        updateQuery += ` WHERE product_id=?`;
        values.push(Number(product_id));

        await db.execute(updateQuery, values);
        console.log(`[PRODUCT_SERVICE] ✅ Main product data updated successfully for ID: ${product_id}`);
        
        if (extraImagesUrls && extraImagesUrls.length > 0) {
            console.log(`[PRODUCT_SERVICE] Adding ${extraImagesUrls.length} new extra images during update for product ID: ${product_id}`);
            const insertImagesQuery = `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?`;
            const imageValues = extraImagesUrls.map(url => [Number(product_id), url, false]);
            await db.query(insertImagesQuery, [imageValues]); 
            console.log(`[PRODUCT_SERVICE] ✅ Extra images added successfully during update.`);
        }
        
        return true; 
    } catch (err) {
        console.error(`[PRODUCT_SERVICE] ❌ Error in updateProductInDB for ID ${product_id}:`, err.message);
        console.error('[PRODUCT_SERVICE] Stack:', err.stack);
        throw err;
    }
};

const addimageindb = async(product_id, uploadedImages) => {
    console.log(`[PRODUCT_SERVICE] Adding ${uploadedImages.length} images via addimageindb for product ID: ${product_id}`);
    try {
        const insertImagesQuery = 'INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?';
        const imageValues = uploadedImages.map(uploaded => [product_id, uploaded.url, false]);
        const [result] = await db.query(insertImagesQuery, [imageValues]); 
        console.log(`[PRODUCT_SERVICE] ✅ Images inserted via addimageindb successfully.`);
        return result;
    } catch (err) {
        console.error(`[PRODUCT_SERVICE] ❌ Error in addimageindb:`, err.message);
        console.error('[PRODUCT_SERVICE] Stack:', err.stack);
        throw err;
    }
};

const deleteimageindb = async(image_id) => {
    console.log(`[PRODUCT_SERVICE] Deleting image record with image_id: ${image_id}`);
    try {
        const deleteQuery = 'DELETE FROM product_images WHERE image_id = ?';
        const [result] = await db.execute(deleteQuery, [image_id]);
        console.log(`[PRODUCT_SERVICE] ✅ Image deleted successfully. Affected rows: ${result.affectedRows}`);
        return result;
    } catch (err) {
        console.error(`[PRODUCT_SERVICE] ❌ Error in deleteimageindb for image_id ${image_id}:`, err.message);
        console.error('[PRODUCT_SERVICE] Stack:', err.stack);
        throw err;
    }
};

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
};