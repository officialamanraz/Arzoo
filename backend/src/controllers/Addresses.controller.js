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

    if (!fullName || !phone || !pincode || !state || !city || !houseNo || !roadArea) {
        return res.status(400).json({ success: false, message: 'Please fill in all required address fields.' });
    }

    try {
        const [result] = await db.execute(
            `INSERT INTO addresses
                (user_id, full_name, phone, alternate_phone, pincode, state, city, house_no, road_area, landmark)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, fullName, phone, alternatePhone || null, pincode, state, city, houseNo, roadArea, landmark || null]
        );
        console.log('RAW RESULT:', result);   

        return res.status(201).json({ success: true, addressId: result.insertId });
    } catch (error) {
        console.error('Error saving address:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to save address.' });
    }
};

// ==========================================
// Get all saved addresses for the logged-in user
// ==========================================
const getMyAddresses = async (req, res) => {
    const user_id = req.user.id;

    try {
        const addresses= await db.execute(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [user_id]
        );
        return res.status(200).json({ success: true, addresses });
    } catch (error) {
        console.error('Error fetching addresses:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to load addresses.' });
    }
};

// ==========================================
// Get one specific saved address by ID (for the order summary page)
// ==========================================
const getAddressById = async (req, res) => {
    const user_id = req.user.id;
    const { addressId } = req.params;

    try {
        const [rows] = await db.execute(
            'SELECT * FROM addresses WHERE address_id = ? AND user_id = ?',
            [addressId, user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Address not found.' });
        }

        return res.status(200).json({ success: true, address: rows[0] });
    } catch (error) {
        console.error('Error fetching address:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to load address.' });
    }
};

module.exports = { addAddress, getMyAddresses, getAddressById };