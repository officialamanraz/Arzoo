const db = require('../DATABASE/mysql'); 

const addressindb = async (userId, addressData) => {
    const { 
        fullName, phone, alternatePhone,
        pincode, state, city, houseNo, roadArea, landmark 
    } = addressData;

    // 1. DUPLICATE CHECK LOGIC (Ekdum smart)
    // Hum check kar rahe hain ki kya same user ka same house, city, aur pincode pehle se hai?
    // 1. DUPLICATE CHECK LOGIC (STRICTER)
    // If the same user uses the same phone number in the same pincode, we consider it a duplicate!
    // 1. DUPLICATE CHECK LOGIC (STRICTER)
    // If the same user uses the same phone number in the same pincode, we consider it a duplicate!
    const [existingAddress] = await db.execute(
        `SELECT address_id FROM addresses 
         WHERE user_id = ? AND pincode = ? AND phone = ?`,
        [userId, pincode, phone]
    );

    if (existingAddress.length > 0) {
        console.log(`[ADDRESS] Duplicate found — reusing address_id: ${existingAddress[0].address_id} for user_id: ${userId}`);
        // Return the existing ID to prevent saving a new row
        return { insertId: existingAddress[0].address_id, action: 'reused' };
    }

    // 2. AGAR DUPLICATE NAHI HAI, TOH NAYA INSERT KARO
    const [result] = await db.execute(
        `INSERT INTO addresses
            (user_id, full_name, phone, alternate_phone, pincode, state, city, house_no, road_area, landmark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, fullName, phone, alternatePhone || null, pincode, state, city, houseNo, roadArea, landmark || null]
    );
    
    console.log(`[ADDRESS] New address saved — address_id: ${result.insertId}, user_id: ${userId}`);
    return { insertId: result.insertId, action: 'inserted' };
};

const getmyaddressbydb = async (user_id) => {
    const [addresses] = await db.execute(
        'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
        [user_id]
    );
    console.log(`[ADDRESS] Found ${addresses.length} address(es) for user_id: ${user_id}`);
    return addresses;
};

const getaddressbyidindb = async (user_id, addressId) => {
    const [rows] = await db.execute(
        'SELECT * FROM addresses WHERE address_id = ? AND user_id = ?',
        [addressId, user_id]
    );

    if (rows.length === 0) {
        console.warn(`[ADDRESS] Not found — address_id ${addressId} for user_id ${user_id}`);
        throw new Error('ADDRESS_NOT_FOUND');
    };
    return rows[0];
}

module.exports = {
    addressindb,
    getaddressbyidindb,
    getmyaddressbydb 
}