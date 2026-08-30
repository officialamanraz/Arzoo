const { productsearch,
    productdelete,
    allproductget,
    productrecomendution,
    getproduct,
    getbyidproduct,
    addProductToDB,
   updateProductInDB,
   addimageindb,
   deleteimageindb  } = require('../services/productservice');
const imagekit = require('../../config/imagekit');
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 600 });
const product = async (req, res) => {
  console.log('[PRODUCT] Fetching all products (basic)');
  try {
    const result = await getproduct ();
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
const getProductById = async (req, res) => {
  const productId = req.params.id;
  console.log(`[PRODUCT] Fetching by id: ${productId}`);

  try {
    // 1. CACHE LOGIC: Check memory first
    const cacheKey = `product_${productId}`;
    if (myCache.has(cacheKey)) {
      console.log(`[PRODUCT] Success (Served from CACHE) -- product_id: ${productId}`);
      return res.status(200).json(myCache.get(cacheKey));
    }

    // 2. YAHAN JADOO HAI - Service se ready-made product mangwaya
    const product = await getbyidproduct(productId);

    // Agar service ne null diya, matlab product nahi mila
    if (!product) {
      console.warn(`[PRODUCT] Not found -- product_id: ${productId}`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // 3. Final response object
    const responseData = { success: true, data: product };

    // 4. Save to CACHE for future requests
    myCache.set(cacheKey, responseData);

    console.log(`[PRODUCT] Fetch success (Fetched from DB) -- product_id: ${productId}`);
    return res.status(200).json(responseData);
    
  } catch (err) {
    console.error(`[PRODUCT] Error fetching product by id (${productId}):`, err.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Database error fetching product details', 
      error: err.message 
    });
  }
};
// 3. ADD PRODUCT
// ==========================================
const addproducts = async (req, res) => {
    try {
        const data = req.body;
        console.log('[PRODUCT] Add product -- name:', data.name, 'category_id:', data.category_id);

        // 1. Basic Validations
        if (!data.category_id || !data.name || !data.price) {
            return res.status(400).json({ success: false, message: 'Category ID, Name, and Price are required' });
        }
        if (Number(data.price) <= 0) return res.status(400).json({ success: false, message: 'Invalid price' });
        if (Number(data.stock_qty) < 0) return res.status(400).json({ success: false, message: 'Invalid stock_qty' });

        let mainImage = null;
        let extraImagesUrls = [];

        // 2. Upload Images to ImageKit (Pehle images network par jayengi)
        if (req.files && req.files.length > 0) {
            // Main image (index 0)
            const uploadedMain = await imagekit.files.upload({
                file: req.files[0].buffer,
                fileName: `${Date.now()}-${req.files[0].originalname}`,
                folder: '/arzoo-saree/products',
            });
            mainImage = uploadedMain.url;

            // Extra images (index 1 se aage)
            if (req.files.length > 1) {
                const extraFiles = req.files.slice(1);
                const uploadedExtras = await Promise.all(
                    extraFiles.map(file => imagekit.files.upload({
                        file: file.buffer,
                        fileName: `${Date.now()}-${file.originalname}`,
                        folder: '/arzoo-saree/products',
                    }))
                );
                // Sirf URLs nikal kar array bana liya
                extraImagesUrls = uploadedExtras.map(uploaded => uploaded.url); 
            }
        }

        // 3. Prepare data for Service
        const productData = {
            ...data, // req.body ka bacha hua saara data isme aa jayega
            is_active: data.is_active ?? 1,
            mainImage,
            extraImagesUrls
        };

        // 4. YAHAN JADOO HAI - Service ko saara data de diya
        const newProductId = await addProductToDB(productData);

        console.log(`[PRODUCT] Added -- product_id: ${newProductId}, name: ${data.name}`);
        return res.status(201).json({ success: true, message: 'Product successfully added.', product_id: newProductId });

    } catch (err) {
        console.error(`[PRODUCT] Add Error:`, err.message);

        // 5. Professional Error Handling (Service ne jo bataya, us hisaab se status bhejo)
        if (err.message === 'CATEGORY_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Category does not exist' });
        }
        if (err.message === 'DUPLICATE_PRODUCT') {
            return res.status(409).json({ success: false, message: 'Product already exists' });
        }

        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};
// ==========================================
// 4. SEARCH PRODUCT
// ==========================================
const searchproduct = async (req, res) => {
 const {keyword,minprice,maxprice} = req.query;
console.log(`[PRODUCTS] serach -- keyword:${keyword}, minprice:${minprice},maxprice:${maxprice}`);
if(!keyword){
  console.log('[PORDUCTS] search failde missing key word')
  return res.status(400).json({
    success:false,
    message:"serach keyword is required"
  })
}
try{
  const result = await productsearch(keyword,minprice,maxprice);
  console.log(`[PRODUCTS] search successfull -- ${result.length} result for "${keyword}"`);
  return res.status(200).json({
    success:true,
    total_found:result.length,
    data:result
  });
}catch(err){
  console.error(`[PRODUCT] Search error (keyword: ${keyword}):`, err.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Database search error.', 
      error: err.message 
    });
}
};

// ==========================================
// 5. UPDATE PRODUCT
// ==========================================
// File: src/controllers/productController.js
// Upar 'updateProductInDB' ko import zaroor kar lena

const updateproduct = async (req, res) => {
  const product_id = req.params.id;
  console.log(`[PRODUCT] Update -- product_id: ${product_id}`);

  try {
    // YAHAN JADOO HAI - ID aur req.body ka pura data service ko de diya
    await updateProductInDB(product_id, req.body);

    console.log(`[PRODUCT] Update success -- product_id: ${product_id}`);
    return res.status(200).json({ success: true, message: 'Product details updated successfully' });

  } catch (err) {
    console.error(`[PRODUCT] Update error (product_id: ${product_id}):`, err.message);

    // Professional Error Handling
    if (err.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

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
    const result = await productdelete(product_id);
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
    // 1. Controller ka kaam: Request se data nikalna aur set karna
    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 12;
    const page = Math.max(1, parseInt(req.query.page) || DEFAULT_PAGE);
    const limit = Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT);
    const offset = (page - 1) * limit;

    const minPrice = req.query.min ? Number(req.query.min) : null;
    const maxPrice = req.query.max ? Number(req.query.max) : null;
    const results = await allproductget(minPrice, maxPrice, limit, offset);
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

  try {
    // 1. Upload all files to ImageKit (Now safely inside try-catch)
    const uploadedImages = await Promise.all(
      req.files.map(file =>
        // Note: Check if you use imagekit.upload or imagekit.files.upload in your SDK setup
        imagekit.files.upload({
          file: file.buffer,
          fileName: `${Date.now()}-${file.originalname}`,
          folder: '/arzoo-saree/products',
        })
      )
    );

    // 2. Extract just the URLs or FilePaths from the ImageKit response
    // (ImageKit returns an object for each file, we need the 'url' or 'filePath')
    const imageUrls = uploadedImages.map(img => img.filePath); // Ya agar aap full link save karte ho toh img.url use karo

    // 3. 🚨 FIX: Pass the uploaded image paths to your database function!
    const result = await addimageindb(product_id, imageUrls);
    
    console.log(`[PRODUCT] ${result.affectedRows} image(s) added -- product_id: ${product_id}`);
    return res.status(201).json({ success: true, message: `${result.affectedRows} new images successfully added to product.` });
    
  } catch (err) {
    console.error(`[PRODUCT] Error adding new images (product_id: ${product_id}):`, err.message);
    return res.status(500).json({ success: false, message: 'Error saving new images', error: err.message });
  }
};
// ==========================================
// 9. DELETE SINGLE EXTRA IMAGE
// ==========================================
const deleteSingleImage = async (req, res) => {
  const image_id = req.params.image_id;
  console.log(`[PRODUCT] Delete single image -- image_id: ${image_id}`);
  try {
   const result = await deleteimageindb (image_id)
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
  
  if (!product_id || !category_id) {
    console.warn('[PRODUCT] Recommendations failed -- missing product_id or category_id');
    return res.status(400).json({ success: false, message: "product_id and category_id are required" });
  }

  try {
    // Service ko call kiya aur data 'results' variable mein liya
    const results = await productrecomendution(product_id, category_id, subcategory_id);
      
    // Bas ek single response bhejna hai, kyunki data pehle se hi filtered hai
    console.log(`[PRODUCT] Recommendations success -- ${results.length} result(s)`);
    return res.status(200).json({ success: true, data: results || [] });
    
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