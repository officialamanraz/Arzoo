const { addressindb, getaddressbyidindb, getmyaddressbydb } = require('../services/addressservice');

// ==========================================
// Save a new delivery address for the logged-in user
// ==========================================
const addAddress = async (req, res) => {
    const userId = req.user.id;
    const data = req.body;
    
    // 🚨 FIX: We must destructure the variables out of 'data' (req.body) 
    // so JavaScript knows what 'city', 'pincode', etc. are.
    const { fullName, phone, pincode, state, city, houseNo, roadArea } = data;

    console.log(`[ADDRESS] Add address — user_id: ${userId}, city: ${city}, pincode: ${pincode}`);

    if (!fullName || !phone || !pincode || !state || !city || !houseNo || !roadArea) {
        console.warn(`[ADDRESS] Add address failed — missing required fields (user_id: ${userId})`);
        return res.status(400).json({ success: false, message: 'Please fill in all required address fields.' });
    }

    try {
       const result = await addressindb(userId, data);
       console.log(`[ADDRESS] Address saved — address_id: ${result.insertId}, user_id: ${userId}`);
       return res.status(201).json({ success: true, addressId: result.insertId });
    } catch (error) {
        console.error(`[ADDRESS] Save error (user_id: ${userId}):`, error.message);
        return res.status(500).json({ success: false, message: 'Failed to save address.' });
    }
};

// ==========================================
// Get all saved addresses for the logged-in user
// ==========================================
const getMyAddresses = async (req, res) => {
    const user_id = req.user.id;
    console.log(`[ADDRESS] Fetching all addresses — user_id: ${user_id}`);

    try {
       const addresses = await getmyaddressbydb(user_id);
       return res.status(200).json({ success: true, addresses });
    } catch (error) {
        console.error(`[ADDRESS] Fetch-all error (user_id: ${user_id}):`, error.message);
        return res.status(500).json({ success: false, message: 'Failed to load addresses.' });
    }
};

// ==========================================
// Get one specific saved address by ID (for the order summary page)
// ==========================================
const getAddressById = async (req, res) => {
    const userId = req.user.id;
    const { addressId } = req.params;
    console.log(`[ADDRESS] Fetching address — user_id: ${userId}, address_id: ${addressId}`);

    try {
        // 🚨 FIX: Your DB function already returns rows[0]. 
        // We just need to capture that object and return it as 'address'.
        const address = await getaddressbyidindb(userId, addressId);
        
        return res.status(200).json({ success: true, address: address });
    } catch (error) {
        console.error(`[ADDRESS] Fetch-by-id error (user_id: ${userId}):`, error.message);
        
        if (error.message === 'ADDRESS_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Address not found or access denied.' });
        }
        return res.status(500).json({ success: false, message: 'Failed to load address.' });
    }
};

module.exports = { addAddress, getMyAddresses, getAddressById };