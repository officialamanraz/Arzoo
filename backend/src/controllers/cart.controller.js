const db = require('../DATABASE/mysql');

// Default product image shown when a product has no image_url set
const DEFAULT_PRODUCT_IMAGE = 'saare_1.jpeg';

// ==========================================
// 1. ADD TO CART (UPSERT: update quantity if it exists, otherwise insert)
// ==========================================
const AddToCart = async (req, res) => {
  const user_id = req.user.id;
  const { product_id, quantity } = req.body;

  if (!product_id) {
    return res.status(400).json({ success: false, message: 'Product ID is required.' });
  }

  const qty = Number(quantity) > 0 ? Number(quantity) : 1;

  try {
    // Check whether this product is already in the user's cart
    const [existing] = await db.execute(
      'SELECT cart_id FROM cart WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existing.length > 0) {
      // Already in cart — increment the quantity
      await db.execute(
        'UPDATE cart SET quantity = quantity + ?, updated_at = NOW() WHERE user_id = ? AND product_id = ?',
        [qty, user_id, product_id]
      );
      return res.status(200).json({ success: true, message: 'Cart quantity updated.' });
    }

    // Not in cart yet — insert a new row
    await db.execute(
      'INSERT INTO cart (user_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [user_id, product_id, qty]
    );
    return res.status(201).json({ success: true, message: 'Item added to cart.' });
  } catch (error) {
    console.error('Add to cart error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while updating cart.', error: error.message });
  }
};

// ==========================================
// 2. GET CART (joined with products for name/price/image/stock)
// ==========================================
const getCart = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [rows] = await db.execute(
      `SELECT c.cart_id, c.user_id, c.product_id, c.quantity,
              p.name, p.price, p.stock_qty, p.image_url
       FROM cart c
       INNER JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = ?`,
      [user_id]
    );

    const formatted = rows.map((item) => ({
      cart_id: item.cart_id,
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url || DEFAULT_PRODUCT_IMAGE,
      item_total: item.price * item.quantity,
      in_stock: item.stock_qty >= item.quantity
    }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Get cart error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while fetching cart.', error: error.message });
  }
};

// ==========================================
// 3. REMOVE FROM CART (scoped to the logged-in user)
// ==========================================
const RemoveFromCart = async (req, res) => {
  const user_id = req.user.id;
  const { cart_id } = req.params;

  try {
    // Only deletes the row if it belongs to the requesting user
    const [result] = await db.execute(
      'DELETE FROM cart WHERE cart_id = ? AND user_id = ?',
      [cart_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item not found or does not belong to you.' });
    }

    return res.status(200).json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Remove from cart error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while removing item.', error: error.message });
  }
};

module.exports = { AddToCart, getCart, RemoveFromCart };