const { 
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
} = require('../services/productservice');

const imagekit = require('../../config/imagekit'); 
const NodeCache = require("node-cache");

// File: src/controllers/productcontroller.js (Top par)
const myCache = require('../../config/cache');
// (Aur purani line `const myCache = new NodeCache(...)` ko hata dena)

// ==========================================
// 🛡️ IMAGEKIT TIMEOUT WRAPPER (MAX 15 SECONDS)
// ==========================================
const uploadToImageKit = async (fileBuffer, fileName, folderPath) => {
    console.log(`[IMAGEKIT] Starting upload for file: ${fileName} to folder: ${folderPath}`);
    const base64String = fileBuffer.toString("base64");

    const uploadPromise = imagekit.files.upload({
        file: base64String, 
        fileName: fileName,
        folder: folderPath,
    });

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('IMAGEKIT_TIMEOUT')), 15000); 
    });

    try {
        const result = await Promise.race([uploadPromise, timeoutPromise]);
        console.log(`[IMAGEKIT] ✅ Upload success: ${result.url}`);
        return result;
    } catch (err) {
        console.error(`[IMAGEKIT] ❌ Upload failed for ${fileName}:`, err.message);
        throw err;
    }
};

// ==========================================
// 1. GET ALL PRODUCTS (Basic)
// ==========================================
const product = async (req, res) => {
  console.log('[PRODUCT_CONTROLLER] 📡 Fetching all products (basic)');
  try {
    const result = await getproduct();
    console.log(`[PRODUCT_CONTROLLER] ✅ Fetch success -- ${result.length} product(s)`);
    return res.status(200).json({ success: true, message: 'Data fetched successfully', data: result });
  } catch (err) {
    console.error('[PRODUCT_CONTROLLER] ❌ Error fetching basic products:', err.message);
    console.error('[PRODUCT_CONTROLLER] Stack:', err.stack);
    return res.status(500).json({ success: false, message: 'Error fetching products', error: err.message });
  }
};

// ==========================================
// 2. GET PRODUCT BY ID
// ==========================================
const getProductById = async (req, res) => {
  const productId = req.params.id;
  console.log(`[PRODUCT_CONTROLLER] 📡 Fetching product by ID: ${productId}`);

  try {
    const cacheKey = `product_${productId}`;
    if (myCache.has(cacheKey)) {
        console.log(`[PRODUCT_CONTROLLER] ⚡ Success (Served from CACHE) -- product_id: ${productId}`);
        return res.status(200).json(myCache.get(cacheKey));
    }

    const foundProduct = await getbyidproduct(productId);
    if (!foundProduct) {
        console.warn(`[PRODUCT_CONTROLLER] ⚠️ Product not found -- product_id: ${productId}`);
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const responseData = { success: true, data: foundProduct };
    myCache.set(cacheKey, responseData);
    
    console.log(`[PRODUCT_CONTROLLER] ✅ Fetch success (Fetched from DB) -- product_id: ${productId}`);
    return res.status(200).json(responseData);
  } catch (err) {
    console.error(`[PRODUCT_CONTROLLER] ❌ Error fetching product by ID (${productId}):`, err.message);
    console.error('[PRODUCT_CONTROLLER] Stack:', err.stack);
    return res.status(500).json({ success: false, message: 'Database error fetching product details', error: err.message });
  }
};

// ==========================================
// 3. ADD PRODUCT
// ==========================================
const addproducts = async (req, res) => {
    console.log('[PRODUCT_CONTROLLER] 📡 Add product request received.');
    try {
        const data = req.body;
        console.log('[PRODUCT_CONTROLLER] Parsed body:', { name: data.name, category_id: data.category_id, price: data.price });

        if (!data.category_id || !data.name || !data.price) {
            console.warn('[PRODUCT_CONTROLLER] ⚠️ Add product failed: Missing required fields');
            return res.status(400).json({ success: false, message: 'Category ID, Name, and Price are required' });
        }
        if (Number(data.price) <= 0) return res.status(400).json({ success: false, message: 'Invalid price' });
        if (Number(data.stock_qty) < 0) return res.status(400).json({ success: false, message: 'Invalid stock_qty' });

        let mainImage = null;
        let extraImagesUrls = [];

        if (req.files && req.files.length > 0) {
            console.log(`[PRODUCT_CONTROLLER] Starting image upload. Total files attached: ${req.files.length}`);
            
            const uploadedMain = await uploadToImageKit(
                req.files[0].buffer,
                `${Date.now()}-${req.files[0].originalname}`,
                '/arzoo-saree/products'
            );
            mainImage = uploadedMain.url;

            if (req.files.length > 1) {
                const extraFiles = req.files.slice(1);
                console.log(`[PRODUCT_CONTROLLER] Uploading ${extraFiles.length} extra images...`);
                const uploadedExtras = await Promise.all(
                    extraFiles.map(file => uploadToImageKit(
                        file.buffer,
                        `${Date.now()}-${file.originalname}`,
                        '/arzoo-saree/products'
                    ))
                );
                extraImagesUrls = uploadedExtras.map(uploaded => uploaded.url); 
            }
        } else {
            console.log('[PRODUCT_CONTROLLER] ℹ️ No files uploaded with this request.');
        }

        const productData = {
            ...data,
            is_active: data.is_active ?? 1,
            mainImage,
            extraImagesUrls
        };

        const newProductId = await addProductToDB(productData);
        console.log(`[PRODUCT_CONTROLLER] ✅ Product successfully added with ID: ${newProductId}`);
        
        return res.status(201).json({ success: true, message: 'Product successfully added.', product_id: newProductId });

    } catch (err) {
        console.error(`[PRODUCT_CONTROLLER] ❌ Add Product Error:`, err.message);
        console.error('[PRODUCT_CONTROLLER] Stack:', err.stack);
        
        if (err.message === 'IMAGEKIT_TIMEOUT') {
            return res.status(504).json({ success: false, message: 'Image upload took too long. Please try smaller images.' });
        }
        if (err.message === 'CATEGORY_NOT_FOUND') return res.status(404).json({ success: false, message: 'Category does not exist' });
        if (err.message === 'DUPLICATE_PRODUCT') return res.status(409).json({ success: false, message: 'Product already exists' });
        
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

// ==========================================
// 4. SEARCH PRODUCT
// ==========================================
const searchproduct = async (req, res) => {
  const { keyword, minprice, maxprice } = req.query;
  console.log(`[PRODUCT_CONTROLLER] 📡 Search request -- keyword:${keyword}, min:${minprice}, max:${maxprice}`);

  if (!keyword) {
      console.warn('[PRODUCT_CONTROLLER] ⚠️ Search failed: Missing keyword');
      return res.status(400).json({ success: false, message: "Search keyword is required" });
  }
  
  try {
    const result = await productsearch(keyword, minprice, maxprice);
    console.log(`[PRODUCT_CONTROLLER] ✅ Search successful -- found ${result.length} result(s)`);
    return res.status(200).json({ success: true, total_found: result.length, data: result });
  } catch (err) {
    console.error(`[PRODUCT_CONTROLLER] ❌ Search error:`, err.message);
    console.error('[PRODUCT_CONTROLLER] Stack:', err.stack);
    return res.status(500).json({ success: false, message: 'Database search error.', error: err.message });
  }
};

// ==========================================
// 5. UPDATE PRODUCT (FIXED TO HANDLE NEW IMAGES)
// ==========================================
const updateproduct = async (req, res) => {
  const product_id = req.params.id;
  console.log(`[PRODUCT_CONTROLLER] 📡 Update request received for product ID: ${product_id}`);

  try {
    let mainImage = null;
    let extraImagesUrls = [];

    // 🚨 NAYA FIX: Agar Edit form mein nayi images aayi hain, toh unhe ImageKit par upload karo!
    if (req.files && req.files.length > 0) {
        console.log(`[PRODUCT_CONTROLLER] Processing ${req.files.length} uploaded file(s) for update...`);
        
        // Agar pehli file ko main image banana hai (ya optional hai)
        const uploadedMain = await uploadToImageKit(
            req.files[0].buffer,
            `${Date.now()}-${req.files[0].originalname}`,
            '/arzoo-saree/products'
        );
        mainImage = uploadedMain.url;

        // Baaki extra images
        if (req.files.length > 1) {
            const extraFiles = req.files.slice(1);
            const uploadedExtras = await Promise.all(
                extraFiles.map(file => uploadToImageKit(
                    file.buffer,
                    `${Date.now()}-${file.originalname}`,
                    '/arzoo-saree/products'
                ))
            );
            extraImagesUrls = uploadedExtras.map(uploaded => uploaded.url);
        }
    }

    // Update data object ready karo
    const updateData = {
        ...req.body,
        mainImage,
        extraImagesUrls
    };

    await updateProductInDB(product_id, updateData);

    // ⚡ Clear Cache so updated details show immediately
    myCache.del(`product_${product_id}`);
    console.log(`[PRODUCT_CONTROLLER] ⚡ Cache cleared for product ID: ${product_id}`);

    console.log(`[PRODUCT_CONTROLLER] ✅ Update success -- product_id: ${product_id}`);
    return res.status(200).json({ success: true, message: 'Product details and images updated successfully' });

  } catch (err) {
    console.error(`[PRODUCT_CONTROLLER] ❌ Update error (product_id: ${product_id}):`, err.message);
    console.error('[PRODUCT_CONTROLLER] Stack:', err.stack);
    
    if (err.message === 'PRODUCT_NOT_FOUND') return res.status(404).json({ success: false, message: 'Product not found' });
    if (err.message === 'IMAGEKIT_TIMEOUT') return res.status(504).json({ success: false, message: 'Image upload timeout.' });

    return res.status(500).json({ success: false, message: 'Failed to update product details', error: err.message });
  }
};

// ==========================================
// 6. DELETE PRODUCT
// ==========================================
const deleteproduct = async (req, res) => {
  const product_id = req.params.id;
  console.log(`[PRODUCT_CONTROLLER] 📡 Delete request for product ID: ${product_id}`);

  try {
    const result = await productdelete(product_id);
    if (result.affectedRows === 0) {
        console.warn(`[PRODUCT_CONTROLLER] ⚠️ Delete failed -- product ID ${product_id} not found`);
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    myCache.del(`product_${product_id}`);
    console.log(`[PRODUCT_CONTROLLER] ✅ Delete success -- product_id: ${product_id}`);
    return res.status(200).json({ success: true, message: 'Product and associated images successfully deleted.' });
  } catch (err) {
    console.error(`[PRODUCT_CONTROLLER] ❌ Delete error (product_id: ${product_id}):`, err.message);
    console.error('[PRODUCT_CONTROLLER] Stack:', err.stack);
    return res.status(500).json({ success: false, message: 'Error deleting product', error: err.message });
  }
};

// ==========================================
// 7. GET ALL PRODUCTS (Paginated)
// ==========================================
const getallproduct = async (req, res) => {
  console.log('[PRODUCT_CONTROLLER] 📡 Fetching paginated products -- query:', req.query);
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);
    const offset = (page - 1) * limit;
    const minPrice = req.query.min ? Number(req.query.min) : null;
    const maxPrice = req.query.max ? Number(req.query.max) : null;
    
    const results = await allproductget(minPrice, maxPrice, limit, offset);
    console.log(`[PRODUCT_CONTROLLER] ✅ Paginated fetch success -- page: ${page}, returned: ${results.length}`);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('[PRODUCT_CONTROLLER] ❌ Error fetching paginated products:', err.message);
    console.error('[PRODUCT_CONTROLLER] Stack:', err.stack);
    return res.status(500).json({ success: false, message: "Server Error fetching product list", error: err.message });
  }
};

// ==========================================
// 8. ADD NEW IMAGES TO EXISTING PRODUCT
// ==========================================
const addNewImagesToProduct = async (req, res) => {
  const product_id = req.params.id;
  console.log(`[PRODUCT_CONTROLLER] 📡 Adding new images to product ID: ${product_id}, Files count: ${req.files ? req.files.length : 0}`);

  if (!req.files || req.files.length === 0) {
    console.warn(`[PRODUCT_CONTROLLER] ⚠️ Add images failed: No files provided.`);
    return res.status(400).json({ success: false, message: 'At least one image file is required to upload.' });
  }

  try {
    const uploadedImages = await Promise.all(
      req.files.map(file => uploadToImageKit(
          file.buffer,
          `${Date.now()}-${file.originalname}`,
          '/arzoo-saree/products'
      ))
    );

    const imageUrls = uploadedImages.map(img => img.url);
    const result = await addimageindb(product_id, imageUrls);
    
    myCache.del(`product_${product_id}`);
    console.log(`[PRODUCT_CONTROLLER] ✅ ${result.affectedRows} image(s) successfully added to product ID: ${product_id}`);
    return res.status(201).json({ success: true, message: `${result.affectedRows} new image(s) successfully added.` });
  } catch (err) {
    console.error(`[PRODUCT_CONTROLLER] ❌ Error adding new images:`, err.message);
    console.error('[PRODUCT_CONTROLLER] Stack:', err.stack);
    
    if (err.message === 'IMAGEKIT_TIMEOUT') {
        return res.status(504).json({ success: false, message: 'Image upload took too long.' });
    }
    return res.status(500).json({ success: false, message: 'Error saving new images', error: err.message });
  }
};

// ==========================================
// 9. DELETE SINGLE EXTRA IMAGE
// ==========================================
const deleteSingleImage = async (req, res) => {
  const image_id = req.params.image_id;
  console.log(`[PRODUCT_CONTROLLER] 📡 Deleting single image ID: ${image_id}`);

  try {
    const result = await deleteimageindb(image_id);
    if (result.affectedRows === 0) {
        console.warn(`[PRODUCT_CONTROLLER] ⚠️ Image record not found for ID: ${image_id}`);
        return res.status(404).json({ success: false, message: 'Image record not found' });
    }
    
    console.log(`[PRODUCT_CONTROLLER] ✅ Image permanently deleted -- image_id: ${image_id}`);
    return res.status(200).json({ success: true, message: 'Image permanently deleted.' });
  } catch (err) {
    console.error(`[PRODUCT_CONTROLLER] ❌ Error deleting image:`, err.message);
    console.error('[PRODUCT_CONTROLLER] Stack:', err.stack);
    return res.status(500).json({ success: false, message: 'Error processing image deletion', error: err.message });
  }
};

// ==========================================
// 10. GET RECOMMENDED PRODUCTS
// ==========================================
const getRecommendedProducts = async (req, res) => {
  const { product_id, category_id, subcategory_id } = req.query;
  console.log(`[PRODUCT_CONTROLLER] 📡 Fetching recommendations for product_id: ${product_id}`);

  if (!product_id || !category_id) {
      console.warn('[PRODUCT_CONTROLLER] ⚠️ Recommendations failed: missing parameters');
      return res.status(400).json({ success: false, message: "product_id and category_id are required" });
  }

  try {
    const results = await productrecomendution(product_id, category_id, subcategory_id);
    console.log(`[PRODUCT_CONTROLLER] ✅ Recommendations success -- ${results.length} result(s)`);
    return res.status(200).json({ success: true, data: results || [] });
  } catch (err) {
    console.error(`[PRODUCT_CONTROLLER] ❌ Recommendations error:`, err.message);
    console.error('[PRODUCT_CONTROLLER] Stack:', err.stack);
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