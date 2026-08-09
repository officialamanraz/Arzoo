const db = require('../DATABASE/mysql'); // mysql2/promise pool

// ==========================================
// Save a new delivery address for the logged-in user
// ==========================================
const addAddress = async (req, res) => {
    const user_id = req.user.id;
    const {
        fullName, phone, alternatePhone,
        pincode, state, city, houseNo, roadArea, landmark
    } = req.body;
    console.log(`[ADDRESS] Add address — user_id: ${user_id}, city: ${city}, pincode: ${pincode}`);

    if (!fullName || !phone || !pincode || !state || !city || !houseNo || !roadArea) {
        console.warn(`[ADDRESS] Add address failed — missing required fields (user_id: ${user_id})`);
        return res.status(400).json({ success: false, message: 'Please fill in all required address fields.' });
    }

    try {
        const [result] = await db.execute(
            `INSERT INTO addresses
                (user_id, full_name, phone, alternate_phone, pincode, state, city, house_no, road_area, landmark)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, fullName, phone, alternatePhone || null, pincode, state, city, houseNo, roadArea, landmark || null]
        );
        console.log(`[ADDRESS] Address saved — address_id: ${result.insertId}, user_id: ${user_id}`);

        return res.status(201).json({ success: true, addressId: result.insertId });
    } catch (error) {
        console.error(`[ADDRESS] Save error (user_id: ${user_id}):`, error.message);
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
        const [addresses] = await db.execute(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [user_id]
        );
        console.log(`[ADDRESS] Found ${addresses.length} address(es) for user_id: ${user_id}`);
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
    const user_id = req.user.id;
    const { addressId } = req.params;
    console.log(`[ADDRESS] Fetching address — user_id: ${user_id}, address_id: ${addressId}`);

    try {
        const [rows] = await db.execute(
            'SELECT * FROM addresses WHERE address_id = ? AND user_id = ?',
            [addressId, user_id]
        );

        if (rows.length === 0) {
            console.warn(`[ADDRESS] Not found — address_id ${addressId} for user_id ${user_id}`);
            return res.status(404).json({ success: false, message: 'Address not found.' });
        }

        return res.status(200).json({ success: true, address: rows[0] });
    } catch (error) {
        console.error(`[ADDRESS] Fetch-by-id error (user_id: ${user_id}):`, error.message);
        return res.status(500).json({ success: false, message: 'Failed to load address.' });
    }
};

module.exports = { addAddress, getMyAddresses, getAddressById };