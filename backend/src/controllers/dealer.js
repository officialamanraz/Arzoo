const dealerService = require('../services/dealer.Service');
const imagekit = require('../../config/imagekit'); 

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
        return res.status(500).json({ success: false, message: 'Failed to fetch dealers.' });
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
        console.error(`[DEALER_CONTROLLER] ❌ Server Exception in getAdminDealerDetail:`, err.message);
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
 
        // Upload the dealer's photo to ImageKit BEFORE inserting the row
        if (req.file) {
            console.log('[DEALER_CONTROLLER] 🔄 Uploading dealer image to ImageKit...');
            const uploadResponse = await imagekit.files.upload({
                file: req.file.buffer.toString('base64'),
                fileName: `dealer_${Date.now()}-${req.file.originalname}`,
                folder: '/arzoo-saree/dealers'
            });
            image_url = uploadResponse.url;
            console.log(`[DEALER_CONTROLLER] ✅ Image uploaded -- url: ${image_url}`);
        } else {
            console.log('[DEALER_CONTROLLER] ℹ️ No image file provided -- dealer will have no photo.');
        }
 
        // Merge the uploaded URL into the payload the service expects
        const dealerPayload = { ...req.body, image_url };
 
        console.log('[DEALER_CONTROLLER] 🔄 Calling addDealerDB service...');
        const newDealerId = await dealerService.addDealerDB(dealerPayload);
 
        console.log(`[DEALER_CONTROLLER] ✅ Response: Dealer created successfully.`);
        return res.status(201).json({
            success: true,
            message: 'Dealer added successfully!',
            dealerId: newDealerId
        });
    } catch (error) {
        console.error('[DEALER_CONTROLLER] ❌ Server Exception in createNewDealer:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error while adding new dealer.'
        });
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
    if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Dealer Name and Email are required.' });
    }

    try {
        let image_url = null;

        if (req.file) {
            console.log('[DEALER_CONTROLLER] 🔄 Uploading new dealer image to ImageKit...');
            const uploadResponse = await imagekit.files.upload({
                file: req.file.buffer.toString('base64'),
                fileName: `dealer_update_${Date.now()}-${req.file.originalname}`,
                folder: '/arzoo-saree/dealers'
            });
            image_url = uploadResponse.url;
            console.log(`[DEALER_CONTROLLER] ✅ New Image uploaded -- url: ${image_url}`);
        }

        const dealerPayload = { ...req.body, image_url };
        await dealerService.updateDealerDB(dealerId, dealerPayload);

        return res.status(200).json({
            success: true,
            message: 'Dealer updated successfully!'
        });
    } catch (error) {
        console.error('[DEALER_CONTROLLER] ❌ Server Exception in updateExistingDealer:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating dealer.'
        });
    }
};

// Exporting all completely synced controllers
module.exports = {
    getBasicDealerList,
    getAdminDealerDetail,
    createNewDealer,
    updateExistingDealer 
};