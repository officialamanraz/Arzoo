const db = require('../DATABASE/mysql');
const { getFullImageUrl } = require('../utils/imageUtils');

const addtocartindb = async(userId, product_id, quantity) => {
    const qty = Number(quantity) > 0 ? Number(quantity) : 1; 
    const [existing] = await db.execute(
      'SELECT cart_id FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existing.length > 0) {
      // Already in cart — increment the quantity
      await db.execute(
        'UPDATE cart SET quantity = quantity + ?, updated_at = NOW() WHERE user_id = ? AND product_id = ?',
        [qty, userId, product_id]
      );
   
      console.log(`[CART] Quantity updated — cart_id: ${existing[0].cart_id}, +${qty}`);
      return { action: 'updated', cart_id: existing[0].cart_id };
    }

    // Not in cart yet — insert a new row
    const [insertResult] = await db.execute(
      'INSERT INTO cart (user_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [userId, product_id, qty]
    );
    console.log(`[CART] Item inserted — cart_id: ${insertResult.insertId}`);
    return { action: 'inserted', cart_id: insertResult.insertId };
};

const getcartbydb = async (user_id) => {
    // 🚨 FIX: SQL Query mein hi MRP aur Discount dono directly nikal liye
    const [rows] = await db.execute(
        `SELECT c.cart_id, c.user_id, c.product_id, c.quantity,
                p.name, p.price, p.mrp, p.stock_qty, p.image_url,
                -- Database khud har product ka discount calculate karega
                IF(p.mrp > p.price, ROUND(((p.mrp - p.price) / p.mrp) * 100), 0) AS discount_percentage
         FROM cart c
         INNER JOIN products p ON c.product_id = p.product_id
         WHERE c.user_id = ?`,
        [user_id]
    );

    const formatted = rows.map((item) => {
        // SQL se directly exact numbers aayenge
        const price = Number(item.price || 0);
        const mrp = Number(item.mrp || price);
        const discountPercent = Number(item.discount_percentage || 0);

        // Calculate estimated delivery (Current date + 5 days)
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5); 

        return {
            cart_id: item.cart_id,
            product_id: item.product_id,
            name: item.name,
            price: price,
            mrp: mrp,                              // Exact MRP for this specific product
            discount_percentage: discountPercent,  // Exact Discount for this specific product
            estimated_delivery: deliveryDate,
            quantity: item.quantity,
            stock_qty: item.stock_qty,
            image_url: getFullImageUrl(item.image_url), // Make sure getFullImageUrl is available in this file
            item_total: price * item.quantity,
            in_stock: item.stock_qty >= item.quantity
        };
    });

    console.log(`[CART] Returned ${formatted.length} item(s) for user_id: ${user_id}`);
    
    return formatted;
};

class ItemNotFoundError extends Error {
  constructor(cart_id) {
    super(`Cart item not found or does not belong to this user: ${cart_id}`);
    this.name = 'ItemNotFoundError';
  }
}

const RemoveFromCartindb = async(cart_id, user_id) => {
     const [result] = await db.execute(
      'DELETE FROM cart WHERE cart_id = ? AND user_id = ?',
      [cart_id, user_id]
    );

    if (result.affectedRows === 0) {
      console.warn(`[CART] Remove failed — cart_id ${cart_id} not found for user_id ${user_id}`);
      throw new ItemNotFoundError(cart_id);
    }

    console.log(`[CART] Item removed — cart_id: ${cart_id}`);
    return true;
};

const updateCartQuantityInDB = async(cart_id, user_id, quantity) => {
    const qty = Number(quantity);

    if (qty < 1) {
        throw new Error('INVALID_QUANTITY');
    }
    
    // FIX: Added comma and corrected variable/column names
    const updatequery = 'UPDATE cart SET quantity = ?, updated_at = NOW() WHERE cart_id = ? AND user_id = ?';
    const [result] = await db.execute(updatequery, [qty, cart_id, user_id]);
    
    if (result.affectedRows === 1) {
        return true;
    }
    
    if (result.affectedRows === 0) {
        throw new ItemNotFoundError(cart_id); 
    }
    return true;
};

const clearCartService = async (user_id) => {
    await db.execute('DELETE FROM cart WHERE user_id = ?', [user_id]);
    return { success: true };
};

module.exports = {
    RemoveFromCartindb,
    getcartbydb,
    addtocartindb,
    ItemNotFoundError,
    updateCartQuantityInDB,
    clearCartService
};