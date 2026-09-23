const db = require('../DATABASE/mysql');
const { getFullImageUrl } = require('../utils/imageUtils');

const getbannerbydb = async () => {
    console.log("[BANNER_SERVICE] 🗄️ Executing query to fetch active banners...");
    try {
        const [ROWS] = await db.execute(
            'SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC'
        );
        const formattbanner = ROWS.map(banner => ({
            ...banner,
            image_url: getFullImageUrl(banner.image_url),
            mobile_image_url: banner.mobile_image_url ? getFullImageUrl(banner.mobile_image_url) : null
        }));
        console.log(`[BANNER_SERVICE] ✅ Formatted ${formattbanner.length} active banners.`);
        return formattbanner;
    } catch (err) {
        console.error("[BANNER_SERVICE] ❌ Error in getbannerbydb:", err.message);
        throw err;
    }
};

const getALLbannersAdminbydb = async () => {
    console.log("[BANNER_SERVICE] 🗄️ Executing query to fetch all banners for admin...");
    try {
        const [ROWS] = await db.execute(
            'SELECT * FROM banners ORDER BY display_order ASC'
        );
        const formattedBanners = ROWS.map(banner => ({
            ...banner,
            image_url: getFullImageUrl(banner.image_url),
            mobile_image_url: banner.mobile_image_url ? getFullImageUrl(banner.mobile_image_url) : null
        }));
        console.log(`[BANNER_SERVICE] ✅ Formatted ${formattedBanners.length} banners for admin.`);
        return formattedBanners;
    } catch (err) {
        console.error("[BANNER_SERVICE] ❌ Error in getALLbannersAdminbydb:", err.message);
        throw err;
    }
};

const createbannerindb = async (bannerdata, image_url, mobile_image_url) => {
    console.log("[BANNER_SERVICE] 🗄️ Inserting new banner into database...");
    try {
        const { title, subtitle, button_text, button_link, display_order } = bannerdata;
        const [result] = await db.execute(
            'INSERT INTO banners (image_url, mobile_image_url, title, subtitle, button_text, button_link, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                image_url, 
                mobile_image_url || null, 
                title || null, 
                subtitle || null, 
                button_text || null, 
                button_link || null, 
                display_order || 0, 
                1
            ]
        ); 
        console.log(`[BANNER_SERVICE] ✅ Banner inserted successfully. Insert ID: ${result.insertId}`);
        return result.insertId;
    } catch (err) {
        console.error("[BANNER_SERVICE] ❌ Error in createbannerindb:", err.message);
        throw err;
    }
};

const updatebannerindb = async (id, bannerdata, image_url, mobile_image_url) => {
    console.log(`[BANNER_SERVICE] 🗄️ Updating banner ID: ${id} in database...`);
    try {
        const { title, subtitle, button_text, button_link, display_order, is_active } = bannerdata;
        let query = `UPDATE banners SET title=?, subtitle=?, button_text=?, button_link=?, display_order=?, is_active=?`;
        let params = [
            title || null, 
            subtitle || null, 
            button_text || null, 
            button_link || null, 
            display_order || 0, 
            is_active ?? 1
        ];

        if (image_url) {
            console.log("[BANNER_SERVICE] Including new image_url in update query.");
            query += `, image_url=?`;
            params.push(image_url);
        }

        if (mobile_image_url) {
            console.log("[BANNER_SERVICE] Including new mobile_image_url in update query.");
            query += `, mobile_image_url=?`;
            params.push(mobile_image_url);
        }

        query += ` WHERE banner_id=?`;
        params.push(Number(id));

        const [result] = await db.execute(query, params);

        if (result.affectedRows === 0) {
            console.warn(`[BANNER_SERVICE] ⚠️ Banner not found for update with ID: ${id}`);
            throw new Error('BANNER_NOT_FOUND');
        }

        console.log(`[BANNER_SERVICE] ✅ Banner ID ${id} updated successfully.`);
        return true; 
    } catch (err) {
        console.error(`[BANNER_SERVICE] ❌ Error in updatebannerindb for ID ${id}:`, err.message);
        throw err;
    }
};

const deleteBannerindb = async (id) => {
    console.log(`[BANNER_SERVICE] 🗄️ Deleting banner ID: ${id} from database...`);
    try {
        const [result] = await db.execute('DELETE FROM banners WHERE banner_id = ?', [id]);
        
        if (result.affectedRows === 0) {
            console.warn(`[BANNER_SERVICE] ⚠️ Banner not found for deletion with ID: ${id}`);
            throw new Error('BANNER_NOT_FOUND');
        }
        
        console.log(`[BANNER_SERVICE] ✅ Banner ID ${id} deleted successfully.`);
        return true; 
    } catch (err) {
        console.error(`[BANNER_SERVICE] ❌ Error in deleteBannerindb for ID ${id}:`, err.message);
        throw err;
    }
};

module.exports = {
    deleteBannerindb,
    updatebannerindb,
    createbannerindb,
    getALLbannersAdminbydb,
    getbannerbydb
};