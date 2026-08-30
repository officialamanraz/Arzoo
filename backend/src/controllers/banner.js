
const imagekit = require('../../config/imagekit'); // Apna sahi path lagao
const { 
    getbannerbydb, 
    getALLbannersAdminbydb, 
    createbannerindb, 
    updatebannerindb, 
    deleteBannerindb 
} = require('../services/bannerservice'); // Service import karna zaroori hai

const getALLbanners = async(req, res) => {
    try {
        const ROWS = await getbannerbydb();
        return res.status(200).json({ 
            success: true,
            data: ROWS
        });
    } catch(err) {
        console.error("[BANNER] getALLbanners error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const getALLbannersAdmin = async(req, res) => {
    try {
        const ROWS = await getALLbannersAdminbydb();
        return res.status(200).json({ 
            success: true,
            data: ROWS
        });
    } catch(err) {
        console.error("[BANNER] getAllbanners error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const createbanner = async(req, res) => {
    console.log("[BANNER] Attempting to create new banner...");
    try {
        if (!req.file) {
            console.warn('[BANNER] Create failed -- image is missing');
            return res.status(400).json({ success: false, message: "Banner image is required" });
        } 
        
        const uploaded = await imagekit.files.upload({
            file: req.file.buffer,
            fileName: `${Date.now()}-${req.file.originalname}`,
            folder: '/arzoo-saree/banners',
        });
        
        // FIX 1: 'const' add kiya
        const image_url = uploaded.url; 

        // FIX 2: insertId sahi se variable mein liya
        const insertId = await createbannerindb(req.body, image_url);
        console.log(`[BANNER] Create success -- banner_id: ${insertId}`);
        
        return res.status(201).json({
            success: true,
            banner_id: insertId, // FIX 3: result.insertId ki jagah insertId aayega
            message: "Banner successfully created",   
        });
    } catch(err) {
        console.error("[BANNER] createbanner error:", err.message);
        return res.status(500).json({
            success: false,
            error: err.message,
            message: "Failed to create banner",
        });
    }
};

const updatebanner = async(req, res) => {
    const id = req.params.id; 
    console.log(`[BANNER] Attempting to update banner -- id: ${id}`);
    
    try {
        let image_url = null;
       
        if(req.file) {
            const uploaded = await imagekit.files.upload({
                file: req.file.buffer,
                fileName: `${Date.now()}-${req.file.originalname}`,
                folder: '/arzoo-saree/banners',
            });
            image_url = uploaded.url;
        }

        await updatebannerindb(id, req.body, image_url);
        console.log(`[BANNER] Update success -- banner_id: ${id}`);
        
        // FIX 4: Yahan success response aayega!
        return res.status(200).json({ 
            success: true, 
            message: "Banner updated successfully" 
        });

    } catch(err) {
        console.error("[BANNER] updatebanners error:", err.message);
        
        if (err.message === 'BANNER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }
        
        // FIX 5: Yahan se success wala message hata diya!
        return res.status(500).json({
            success: false,
            error: err.message,
            message: "Failed to update banner"
        });
    }
};

const deleteBanner = async (req, res) => {
    const { id } = req.params;
    console.log(`[BANNER] Attempting to delete banner -- id: ${id}`);

    try {
        await deleteBannerindb(id);
        
        console.log(`[BANNER] Delete success -- banner_id: ${id}`);
        return res.status(200).json({ success: true, message: 'Banner deleted successfully' });

    } catch (err) {
        console.error(`[BANNER] Delete banner error (id: ${id}):`, err.message);

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