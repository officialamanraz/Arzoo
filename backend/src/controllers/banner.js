const imagekit = require('../../config/imagekit'); 
const { 
    getbannerbydb, 
    getALLbannersAdminbydb, 
    createbannerindb, 
    updatebannerindb, 
    deleteBannerindb 
} = require('../services/bannerservice'); 

// ==========================================
// 🛡️ IMAGEKIT TIMEOUT WRAPPER (MAX 15 SECONDS)
// ==========================================
const uploadToImageKit = async (fileBuffer, fileName, folderPath) => {
    console.log(`[BANNER_CONTROLLER] 📡 Starting ImageKit upload for: ${fileName}`);
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
        console.log(`[BANNER_CONTROLLER] ✅ ImageKit upload success: ${result.url}`);
        return result;
    } catch (err) {
        console.error(`[BANNER_CONTROLLER] ❌ ImageKit upload failed:`, err.message);
        throw err;
    }
};

const getALLbanners = async(req, res) => {
    console.log('[BANNER_CONTROLLER] 📡 Fetching active banners for frontend...');
    try {
        const ROWS = await getbannerbydb();
        console.log(`[BANNER_CONTROLLER] ✅ Fetched ${ROWS.length} active banner(s)`);
        return res.status(200).json({ success: true, data: ROWS });
    } catch(err) {
        console.error("[BANNER_CONTROLLER] ❌ getALLbanners error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const getALLbannersAdmin = async(req, res) => {
    console.log('[BANNER_CONTROLLER] 📡 Fetching all banners for Admin...');
    try {
        const ROWS = await getALLbannersAdminbydb();
        console.log(`[BANNER_CONTROLLER] ✅ Fetched ${ROWS.length} total banner(s) for admin`);
        return res.status(200).json({ success: true, data: ROWS });
    } catch(err) {
        console.error("[BANNER_CONTROLLER] ❌ getALLbannersAdmin error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const createbanner = async(req, res) => {
    console.log("[BANNER_CONTROLLER] 📡 Attempting to create new banner...");
    try {
        if (!req.file) {
            console.warn('[BANNER_CONTROLLER] ⚠️ Create failed -- image file is missing');
            return res.status(400).json({ success: false, message: "Banner image is required" });
        } 
        
        const uploaded = await uploadToImageKit(
            req.file.buffer,
            `${Date.now()}-${req.file.originalname}`,
            '/arzoo-saree/banners'
        );
        
        const image_url = uploaded.url; 
        console.log("[BANNER_CONTROLLER] Saving banner data to database...");
        
        const insertId = await createbannerindb(req.body, image_url);
        console.log(`[BANNER_CONTROLLER] ✅ Create success -- banner_id: ${insertId}`);
        
        return res.status(201).json({
            success: true,
            banner_id: insertId,
            message: "Banner successfully created",   
        });
    } catch(err) {
        console.error("[BANNER_CONTROLLER] ❌ createbanner error:", err.message);
        
        if (err.message === 'IMAGEKIT_TIMEOUT') {
            return res.status(504).json({ success: false, message: 'Image upload took too long. Please try a smaller image.' });
        }

        return res.status(500).json({
            success: false,
            error: err.message,
            message: "Failed to create banner",
        });
    }
};

const updatebanner = async(req, res) => {
    const id = req.params.id; 
    console.log(`[BANNER_CONTROLLER] 📡 Attempting to update banner -- id: ${id}`);
    
    try {
        let image_url = null;
       
        if(req.file) {
            console.log(`[BANNER_CONTROLLER] New image detected for update. Uploading to ImageKit...`);
            const uploaded = await uploadToImageKit(
                req.file.buffer,
                `${Date.now()}-${req.file.originalname}`,
                '/arzoo-saree/banners'
            );
            image_url = uploaded.url;
        } else {
            console.log(`[BANNER_CONTROLLER] ℹ️ No new image uploaded. Keeping existing banner image.`);
        }

        await updatebannerindb(id, req.body, image_url);
        console.log(`[BANNER_CONTROLLER] ✅ Update success -- banner_id: ${id}`);
        
        return res.status(200).json({ 
            success: true, 
            message: "Banner updated successfully" 
        });

    } catch(err) {
        console.error("[BANNER_CONTROLLER] ❌ updatebanner error:", err.message);
        
        if (err.message === 'BANNER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }
        if (err.message === 'IMAGEKIT_TIMEOUT') {
            return res.status(504).json({ success: false, message: 'Image upload took too long. Please try again.' });
        }
        
        return res.status(500).json({
            success: false,
            error: err.message,
            message: "Failed to update banner"
        });
    }
};

const deleteBanner = async (req, res) => {
    const { id } = req.params;
    console.log(`[BANNER_CONTROLLER] 📡 Attempting to delete banner -- id: ${id}`);

    try {
        await deleteBannerindb(id);
        console.log(`[BANNER_CONTROLLER] ✅ Delete success -- banner_id: ${id}`);
        return res.status(200).json({ success: true, message: 'Banner deleted successfully' });

    } catch (err) {
        console.error(`[BANNER_CONTROLLER] ❌ Delete banner error (id: ${id}):`, err.message);

        if (err.message === 'BANNER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Banner not found or already deleted' });
        }

        return res.status(500).json({ success: false, message: 'Failed to delete banner', error: err.message });
    }
};

module.exports = {
    deleteBanner,
    updatebanner,
    createbanner,
    getALLbannersAdmin,
    getALLbanners
};