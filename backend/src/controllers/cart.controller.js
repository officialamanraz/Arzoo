const db = require('../DATABASE/mysql');

// ==========================================
// 1. ADD TO CART (Dynamic UPSERT: Update or Insert)
// ==========================================
const AddToCart = async (req, res) => {
  const user_id = req.user.id;
  const { product_id, quantity } = req.body;

  if (!product_id) {
    return res.status(400).json({ success: false, message: 'Product ID missing' });
  }

  const q = quantity || 1;

  try {
    // Pehle check karo: Kya yeh Saree already cart mein hai?
    const checkQuery = 'SELECT * FROM Cart WHERE user_id = ? AND product_id = ?';
    const [results] = await db.query(checkQuery, [user_id, product_id]);

    if (results.length > 0) {
      // Agar pehle se hai, toh sirf Quantity badhao (Dynamic Update)
      const updateQuery = 'UPDATE Cart SET quantity = quantity + ?, updated_at = NOW() WHERE user_id = ? AND product_id = ?';
      await db.query(updateQuery, [q, user_id, product_id]);
      return res.status(200).json({ success: true, message: 'Cart mein saree ki quantity badha di gayi!' });
    } else {
      // Agar nahi hai, toh fresh add karo
      const insertQuery = `INSERT INTO Cart (user_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`;
      await db.query(insertQuery, [user_id, product_id, q]);
      return res.status(201).json({ success: true, message: 'Nayi saree cart mein add ho gayi!' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'DB Error', error: err.message });
  }
};

// ==========================================
// 2. GET CART (Linked with new 'product_images' table)
// ==========================================
const getCart = async (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT c.cart_id, c.user_id, c.product_id, c.quantity, 
           p.name, p.price, p.stock_qty, p.image_url 
    FROM Cart c
    INNER JOIN products p ON c.product_id = p.product_id
    WHERE c.user_id = ?
  `;

  try {
    const [results] = await db.query(query, [userId]);

    const formattedData = results.map((item) => ({
      cart_id: item.cart_id,
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      // Use image_url from products table, fallback to default
      image_url: item.image_url || 'saare_1.jpeg',
      item_total: item.price * item.quantity,
      in_stock: item.stock_qty >= item.quantity
    }));

    return res.status(200).json({ success: true, data: formattedData });
  } catch (err) {
    console.error('SQL CRASH ERROR:', err.message);
    return res.status(500).json({ success: false, message: 'Database fetching error', error: err.message });
  }
};

// ==========================================
// 3. REMOVE FROM CART (Hacker-Proof)
// ==========================================
const RemoveFromCart = async (req, res) => {
  const user_id = req.user.id;
  const cart_id = req.params.cart_id;

  try {
    // Sirf WAHI item delete hoga jo logged-in user ka ho (Hacker proof)
    const [result] = await db.query('DELETE FROM Cart WHERE cart_id = ? AND user_id = ?', [cart_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item nahi mila ya aapka nahi hai!' });
    }

    return res.status(200).json({ success: true, message: 'Item successfully cart se hata diya gaya' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { AddToCart, getCart, RemoveFromCart };