const db = require('../DATABASE/mysql');
const { getFullImageUrl } = require('../utils/imageUtils'); //
const Addcategoryindb = async(category_name) =>{
    const [result] = await db.execute('INSERT INTO categories (category_name) VALUES (?)', [category_name]);
    console.log(`[CATEGORY] Saved -- category_id: ${result.insertId}, name: ${category_name}`);
    return result
};

const getcategorybydb = async() =>{
    const [rows] = await db.execute('SELECT * FROM categories');
    console.log(`[CATEGORY] Fetch success -- ${rows.length} category(ies)`);
    return rows
};

const Addsubcategorybydb = async(category_id, subcategory_name) =>{
    const [result] = await db.execute(
      'INSERT INTO subcategories (category_id, subcategory_name) VALUES (?, ?)',
      [category_id, subcategory_name]
    );
    console.log(`[SUBCATEGORY] Added -- subcategory_id: ${result.insertId}, category_id: ${category_id}`);
    return result
};

const getProductsBySubcategoryFromDB = async (subcategory_id) => {
    // 1. Fetch the subcategory name
    const [subcatRows] = await db.execute(
        'SELECT subcategory_name FROM subcategories WHERE subcategory_id = ?',
        [subcategory_id]
    );
    const subcategory_name = subcatRows.length > 0 ? subcatRows[0].subcategory_name : 'Products';

    // 2. Fetch the products belonging to this subcategory
    const [products] = await db.execute(
        'SELECT * FROM products WHERE subcategory_id = ?',
        [subcategory_id]
    );
    
    // 3. Format product images using your centralized utility
    const formattedProducts = products.map(product => ({
        ...product,
        image_url: getFullImageUrl(product.image_url)
    }));

    return {
        subcategory_name,
        products: formattedProducts
    };
};
const getSubcategoriesByCategoryFromDB = async (category_id) => {
    const [rows] = await db.execute(
        'SELECT * FROM subcategories WHERE category_id = ?',
        [category_id]
    );
    console.log(`[SUBCATEGORY] Found ${rows.length} subcategory(ies) for category_id: ${category_id}`);
    return rows;
};

module.exports = {
    Addcategoryindb,
    getcategorybydb,
    Addsubcategorybydb,
    getProductsBySubcategoryFromDB,
    getSubcategoriesByCategoryFromDB
};