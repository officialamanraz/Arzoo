const db = require('../DATABASE/mysql');
const { getFullImageUrl } = require('../utils/imageUtils');

// Helper to create a URL-friendly slug
const generateSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-');
};

const Addcategoryindb = async (name, slug = null) => {
    try {
        if (!name || typeof name !== 'string' || !name.trim()) {
            throw new Error(`[CATEGORY_SERVICE] Invalid category name provided: "${name}"`);
        }

        const categorySlug = slug || generateSlug(name);

        console.log(`[CATEGORY_SERVICE] Inserting category -> Name: "${name.trim()}", Slug: "${categorySlug}"`);

        // Fixed column name from 'category_name' to 'name'
        const [result] = await db.execute(
            'INSERT INTO categories (name, slug) VALUES (?, ?)',
            [name.trim(), categorySlug]
        );

        console.log(`[CATEGORY_SERVICE] Category saved successfully -> ID: ${result.insertId}`);
        return result;
    } catch (error) {
        console.error('[CATEGORY_SERVICE] Error in Addcategoryindb:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
        throw error;
    }
};

const getcategorybydb = async () => {
    try {
        console.log('[CATEGORY_SERVICE] Fetching all categories...');
        const [rows] = await db.execute('SELECT * FROM categories');
        console.log(`[CATEGORY_SERVICE] Fetched ${rows.length} category(ies)`);
        return rows;
    } catch (error) {
        console.error('[CATEGORY_SERVICE] Error in getcategorybydb:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
        throw error;
    }
};

const Addsubcategorybydb = async (category_id, subcategory_name) => {
    try {
        const catId = parseInt(category_id, 10);
        if (isNaN(catId) || catId <= 0) {
            throw new Error(`[CATEGORY_SERVICE] Invalid category_id provided: "${category_id}"`);
        }
        if (!subcategory_name || typeof subcategory_name !== 'string' || !subcategory_name.trim()) {
            throw new Error(`[CATEGORY_SERVICE] Invalid subcategory_name provided: "${subcategory_name}"`);
        }

        console.log(`[CATEGORY_SERVICE] Inserting subcategory -> category_id: ${catId}, name: "${subcategory_name.trim()}"`);

        const [result] = await db.execute(
            'INSERT INTO subcategories (category_id, subcategory_name, is_active) VALUES (?, ?, 1)',
            [catId, subcategory_name.trim()]
        );

        console.log(`[CATEGORY_SERVICE] Subcategory added successfully -> subcategory_id: ${result.insertId}, category_id: ${catId}`);
        return result;
    } catch (error) {
        console.error('[CATEGORY_SERVICE] Error in Addsubcategorybydb:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
        throw error;
    }
};

const getProductsBySubcategoryFromDB = async (raw_subcategory_id) => {
    try {
        console.log(`\n--- [DEBUG: getProductsBySubcategoryFromDB START] ---`);
        console.log(`[PARAM RECEIVED] raw_subcategory_id:`, raw_subcategory_id, `(type: ${typeof raw_subcategory_id})`);

        const subcategory_id = parseInt(raw_subcategory_id, 10);

        if (isNaN(subcategory_id) || subcategory_id <= 0) {
            console.warn(`[WARNING] Invalid subcategory_id parsed: ${subcategory_id}. Returning empty result.`);
            return {
                subcategory_name: 'Products',
                products: []
            };
        }

        // 1. Fetch subcategory metadata
        console.log(`[SQL 1] Checking subcategory existence for ID: ${subcategory_id}...`);
        const [subcatRows] = await db.execute(
            'SELECT subcategory_name, category_id, is_active FROM subcategories WHERE subcategory_id = ?',
            [subcategory_id]
        );

        if (subcatRows.length === 0) {
            console.warn(`[WARNING] No subcategory found in DB for subcategory_id = ${subcategory_id}`);
        } else {
            console.log(`[SUBCATEGORY INFO] Found:`, subcatRows[0]);
        }

        const subcategory_name = subcatRows.length > 0 ? subcatRows[0].subcategory_name : 'Products';

        // 2. Fetch the matching products
        // 2. Fetch the matching products (Checking BOTH columns to be safe)
console.log(`[SQL 2] Querying products for subcategory_id = ${subcategory_id}...`);
const [products] = await db.execute(
    `SELECT * FROM products 
     WHERE subcategory_id = ? 
     OR JSON_CONTAINS(subcategory_ids, CAST(? AS JSON))`,
    [subcategory_id, String(subcategory_id)]
);

        console.log(`[PRODUCTS FOUND] Count: ${products.length} product(s) matching subcategory_id = ${subcategory_id}`);

        if (products.length > 0) {
            console.log(`[SAMPLE PRODUCT] First item ID: ${products[0].product_id}, Name: "${products[0].name}"`);
        } else {
            console.warn(`[NOTICE] Query returned 0 products. Verify if any row in 'products' has subcategory_id = ${subcategory_id}`);
        }

        // 3. Format product images safely
        const formattedProducts = products.map((product) => {
            const rawUrl = product.image_url || '';
            const processedUrl = typeof getFullImageUrl === 'function' ? getFullImageUrl(rawUrl) : rawUrl;
            return {
                ...product,
                image_url: processedUrl
            };
        });

        console.log(`--- [DEBUG: getProductsBySubcategoryFromDB END] ---\n`);

        return {
            subcategory_name,
            products: formattedProducts
        };
    } catch (error) {
        console.error('[CATEGORY_SERVICE] Error in getProductsBySubcategoryFromDB:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
        throw error;
    }
};

const getSubcategoriesByCategoryFromDB = async (raw_category_id) => {
    try {
        const category_id = parseInt(raw_category_id, 10);
        console.log(`[CATEGORY_SERVICE] Fetching subcategories for category_id: ${category_id}`);

        if (isNaN(category_id) || category_id <= 0) {
            console.warn(`[WARNING] Invalid category_id: ${raw_category_id}. Returning empty array.`);
            return [];
        }

        const [rows] = await db.execute(
            'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1',
            [category_id]
        );

        console.log(`[CATEGORY_SERVICE] Found ${rows.length} active subcategory(ies) for category_id: ${category_id}`);
        return rows;
    } catch (error) {
        console.error('[CATEGORY_SERVICE] Error in getSubcategoriesByCategoryFromDB:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
        throw error;
    }
};
const getCategoryCardsFromDB = async () => {
    try {
        console.log('[CATEGORY_SERVICE] Fetching category cards with representative images...');
        
        // This query fetches categories and dynamically pulls the first available product image for each category
        const query = `
            SELECT 
                c.category_id, 
                c.name, 
                c.slug,
                (
                    SELECT p.image_url 
                    FROM products p 
                    WHERE p.category_id = c.category_id AND p.image_url IS NOT NULL 
                    LIMIT 1
                ) AS category_image
            FROM categories c
        `;
        
        const [rows] = await db.execute(query);
        console.log(`[CATEGORY_SERVICE] Successfully fetched ${rows.length} category card(s).`);

        // Format image URLs using your centralized image utility
        return rows.map(cat => ({
            ...cat,
            category_image: getFullImageUrl(cat.category_image || '/saare_1.jpeg')
        }));
    } catch (error) {
        console.error('[CATEGORY_SERVICE] Error in getCategoryCardsFromDB:', error.message);
        throw error;
    }
};

// 🌟 NEW FUNCTION: Fetch products using the main category_id
const getProductsByCategoryFromDB = async (raw_category_id) => {
    try {
        const category_id = parseInt(raw_category_id, 10);
        if (isNaN(category_id) || category_id <= 0) {
            return { category_name: 'Products', products: [] };
        }

        // Get category name for the frontend title
        const [catRows] = await db.execute('SELECT name FROM categories WHERE category_id = ?', [category_id]);
        const category_name = catRows.length > 0 ? catRows[0].name : 'Products';

        // Get products matching the main category
        const [products] = await db.execute('SELECT * FROM products WHERE category_id = ?', [category_id]);

        const formattedProducts = products.map((product) => ({
            ...product,
            image_url: typeof getFullImageUrl === 'function' ? getFullImageUrl(product.image_url || '') : (product.image_url || '')
        }));

        return {
            category_name,
            products: formattedProducts
        };
    } catch (error) {
        console.error('[CATEGORY_SERVICE] Error in getProductsByCategoryFromDB:', error);
        throw error;
    }
};

// Ensure you add it to the exports at the very bottom!
module.exports = {
    Addcategoryindb,
    getcategorybydb,
    Addsubcategorybydb,
    getProductsBySubcategoryFromDB,
    getSubcategoriesByCategoryFromDB,
    getCategoryCardsFromDB,
    getProductsByCategoryFromDB // 👈 ADDED HERE
};
