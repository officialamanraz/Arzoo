const dealerService = require('../services/dealer.Service');
const imagekit = require('../../config/imagekit'); 

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

/**
 * ============================================================================
 * CONTROLLER 1: Handle Admin Request for Master Dealer Financial Report
 * ============================================================================
 */
const getBasicDealerList = async (req, res) => {
    console.log('[DEALER_CONTROLLER] 🚀 HTTP GET request received for basic dealer list.');
 
    try {
        const dealers = await dealerService.getBasicDealerListDB();
        console.log(`[DEALER_CONTROLLER] ✅ Response: Returning ${dealers.length} dealer(s).`);
        return res.status(200).json({ success: true, dealers });
    } catch (error) {
        console.error('[DEALER_CONTROLLER] ❌ Server Exception in getBasicDealerList:', error.message);
        console.error('[DEALER_CONTROLLER] Stack Trace:', error.stack);
        return res.status(500).json({ success: false, message: 'Failed to fetch dealers', error: error.message });
    }
};

/**
 * ============================================================================
 * CONTROLLER 2: Handle Admin Request for Specific Dealer Details (Profile & Inventory)
 * ============================================================================
 */
const getAdminDealerDetail = async (req, res) => {
    const dealerId = req.params.id;
    console.log(`[DEALER_CONTROLLER] 🚀 HTTP GET request received for Admin Dealer Detail. ID: ${dealerId}`);

    if (!dealerId || isNaN(dealerId)) {
        console.warn(`[DEALER_CONTROLLER] ⚠️ Invalid Dealer ID provided: ${dealerId}`);
        return res.status(400).json({ success: false, message: 'Invalid or missing Dealer ID.' });
    }

    try {
        console.log(`[DEALER_CONTROLLER] 🔄 Calling fetchAdminDealerDetailService...`);
        const result = await dealerService.fetchAdminDealerDetailService(dealerId);

        if (!result) {
            console.warn(`[DEALER_CONTROLLER] ⚠️ Response: Dealer not found for ID: ${dealerId}`);
            return res.status(404).json({ success: false, message: 'Dealer not found' });
        }

        console.log(`[DEALER_CONTROLLER] ✅ Response: Successfully sending dealer profile & inventory data.`);
        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {
        console.error(`[DEALER_CONTROLLER] ❌ Server Exception in getAdminDealerDetail for ID ${dealerId}:`, err.message);
        console.error('[DEALER_CONTROLLER] Stack Trace:', err.stack);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching dealer details', 
            error: err.message 
        });
    }
};

/**
 * ============================================================================
 * CONTROLLER 3: Handle Admin Request to Add a New Dealer
 * ============================================================================
 */
const createNewDealer = async (req, res) => {
    console.log('[DEALER_CONTROLLER] 🚀 HTTP POST request received to Add New Dealer.');
    console.log('[DEALER_CONTROLLER] 📦 Payload received:', req.body);
    console.log('[DEALER_CONTROLLER] 🖼️ File received:', req.file ? req.file.originalname : 'none');
 
    const { name, email } = req.body;
    if (!name || !email) {
        console.warn('[DEALER_CONTROLLER] ⚠️ Validation Failed: Name and Email are required.');
        return res.status(400).json({ success: false, message: 'Dealer Name and Email are required.' });
    }
 
    try {
        let image_url = null;
 
        // Upload the dealer's photo to ImageKit securely using timeout wrapper
        if (req.file) {
            console.log('[DEALER_CONTROLLER] 🔄 Uploading dealer image to ImageKit...');
            const uploadResponse = await uploadToImageKit(
                req.file.buffer,
                `dealer_${Date.now()}-${req.file.originalname}`,
                '/arzoo-saree/dealers'
            );
            image_url = uploadResponse.url;
        } else {
            console.log('[DEALER_CONTROLLER] ℹ️ No image file provided -- dealer will have no photo.');
        }
 
        // Merge the uploaded URL into the payload the service expects
        const dealerPayload = { ...req.body, image_url };
 
        console.log('[DEALER_CONTROLLER] 🔄 Calling addDealerDB service...');
        const newDealerId = await dealerService.addDealerDB(dealerPayload);
 
        console.log(`[DEALER_CONTROLLER] ✅ Response: Dealer created successfully. ID: ${newDealerId}`);
        return res.status(201).json({
            success: true,
            message: 'Dealer added successfully!',
            dealerId: newDealerId
        });
    } catch (error) {
        console.error('[DEALER_CONTROLLER] ❌ Server Exception in createNewDealer:', error.message);
        console.error('[DEALER_CONTROLLER] Stack Trace:', error.stack);

        if (error.message === 'IMAGEKIT_TIMEOUT') {
            return res.status(504).json({ success: false, message: 'Image upload took too long. Please try a smaller image.' });
        }
        if (error.message.includes('already exists')) {
            return res.status(409).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'Server error while adding new dealer.', error: error.message });
    }
};

/**
 * ============================================================================
 * CONTROLLER 4: Handle Admin Request to Update Existing Dealer
 * ============================================================================
 */
const updateExistingDealer = async (req, res) => {
    const dealerId = req.params.id;
    console.log(`[DEALER_CONTROLLER] 🚀 HTTP PUT request received to Update Dealer ID: ${dealerId}`);
    console.log('[DEALER_CONTROLLER] 📦 Payload received:', req.body);
    console.log('[DEALER_CONTROLLER] 🖼️ New File received:', req.file ? req.file.originalname : 'none');

    const { name, email } = req.body;
    
    if (!dealerId || isNaN(dealerId)) {
        console.warn(`[DEALER_CONTROLLER] ⚠️ Invalid Dealer ID provided: ${dealerId}`);
        return res.status(400).json({ success: false, message: 'Invalid or missing Dealer ID.' });
    }

    if (!name || !email) {
        console.warn('[DEALER_CONTROLLER] ⚠️ Validation Failed: Name and Email are required.');
        return res.status(400).json({ success: false, message: 'Dealer Name and Email are required.' });
    }

    try {
        let image_url = null;

        if (req.file) {
            console.log('[DEALER_CONTROLLER] 🔄 Uploading new dealer image to ImageKit...');
            const uploadResponse = await uploadToImageKit(
                req.file.buffer,
                `dealer_update_${Date.now()}-${req.file.originalname}`,
                '/arzoo-saree/dealers'
            );
            image_url = uploadResponse.url;
        }

        const dealerPayload = { ...req.body, image_url };
        await dealerService.updateDealerDB(dealerId, dealerPayload);

        console.log(`[DEALER_CONTROLLER] ✅ Response: Dealer ID ${dealerId} updated successfully.`);
        return res.status(200).json({
            success: true,
            message: 'Dealer updated successfully!'
        });
    } catch (error) {
        console.error(`[DEALER_CONTROLLER] ❌ Server Exception in updateExistingDealer for ID ${dealerId}:`, error.message);
        console.error('[DEALER_CONTROLLER] Stack Trace:', error.stack);

        if (error.message === 'IMAGEKIT_TIMEOUT') {
            return res.status(504).json({ success: false, message: 'Image upload timeout. Please try again.' });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, message: error.message });
        }

        return res.status(500).json({ success: false, message: 'Server error while updating dealer.', error: error.message });
    }
};

// Exporting all completely synced controllers
module.exports = {
    getBasicDealerList,
    getAdminDealerDetail,
    createNewDealer,
    updateExistingDealer 
};