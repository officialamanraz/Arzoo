const { 
  RemoveFromCartindb,
  getcartbydb,
  addtocartindb,
  ItemNotFoundError,
  updateCartQuantityInDB,
  clearCartService
} = require('../services/cartservice'); 

// ==========================================
// 1. ADD TO CART (UPSERT: update quantity if it exists, otherwise insert)
// ==========================================
const AddToCart = async (req, res) => {
  const userId = req.user.id; 
  const { product_id, quantity } = req.body; 
  console.log(`[CART] Add-to-cart — user_id: ${userId}, product_id: ${product_id}, qty: ${quantity}`);

  if (!product_id) {
    console.warn(`[CART] Add-to-cart failed — no product_id (user_id: ${userId})`);
    return res.status(400).json({ success: false, message: 'Product ID is required.' });
  }

  try {
    const result = await addtocartindb(userId, product_id, quantity);
    const message = result.action === 'updated' ? 'Cart quantity updated.' : 'Item added to cart.';
    
    return res.status(201).json({
      success: true,
      message: message,
      result: result
    });
  } catch (error) {
    console.error(`[CART] Add-to-cart error (user_id: ${userId}):`, error.message);
    return res.status(500).json({ success: false, message: 'Server error while updating cart.', error: error.message });
  }
};

// ==========================================
// 2. GET CART (joined with products for name/price/image/stock)
// ==========================================
const getCart = async (req, res) => {
  const user_id = req.user.id;
  console.log(`[CART] Fetching cart — user_id: ${user_id}`);

  try {
    const cartitem = await getcartbydb(user_id);
    return res.status(200).json({ success: true, data: cartitem });
  } catch (error) {
    console.error(`[CART] Get-cart error (user_id: ${user_id}):`, error.message);
    return res.status(500).json({ success: false, message: 'Server error while fetching cart.', error: error.message });
  }
};

// ==========================================
// 3. REMOVE FROM CART (scoped to the logged-in user)
// ==========================================
const RemoveFromCart = async (req, res) => {
  const user_id = req.user.id;
  const { cart_id } = req.params;
  console.log(`[CART] Remove item — user_id: ${user_id}, cart_id: ${cart_id}`);

  try {
    await RemoveFromCartindb(cart_id, user_id);
    return res.status(200).json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    console.error(`[CART] Remove error (user_id: ${user_id}):`, error.message);
    
    if (error instanceof ItemNotFoundError) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }
    
    return res.status(500).json({ success: false, message: 'Server error while removing item.', error: error.message });
  }
};

// ==========================================
// 4. UPDATE CART QUANTITY
// ==========================================
// ==========================================
// 4. UPDATE CART QUANTITY
// ==========================================
const updateCartItemQuantity = async (req, res) => {
    const user_id = req.user.id;
    
    // 🚨 FIX: ab cart_id aur quantity dono req.body se aayenge
    const { cart_id, quantity } = req.body;  

    console.log(`[CART] Update quantity -- user_id: ${user_id}, cart_id: ${cart_id}, qty: ${quantity}`);

    if (!cart_id || quantity === undefined || quantity === null) {
        return res.status(400).json({ success: false, message: 'Cart ID and Quantity are required.' });
    }

    try {
        await updateCartQuantityInDB(cart_id, user_id, quantity);
        return res.status(200).json({ success: true, message: 'Cart quantity updated successfully.' });
    } catch (error) {
        console.error(`[CART] Update quantity error (user_id: ${user_id}):`, error.message);
        
        if (error.message === 'INVALID_QUANTITY') {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
        }
        
        if (error instanceof ItemNotFoundError) {
            return res.status(404).json({ success: false, message: 'Cart item not found or unauthorized.' });
        }
        
        return res.status(500).json({ success: false, message: 'Server error while updating cart.', error: error.message });
    }
};
// ==========================================
// 5. CLEAR FULL CART (Remove All)
// ==========================================
const clearCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        
        // Backend se saare items delete karega
        await clearCartService(user_id);
        
        // Nayi (khali) list wapas mangwayega (Yahan getCartService ki jagah getcartbydb use kiya hai)
        const updatedCart = await getcartbydb(user_id); 

        // Frontend ko { success: true, data: [] } bhejega
        return res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: updatedCart 
        });
    } catch (error) {
        console.error('[CART CONTROLLER] Error clearing cart:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { 
  AddToCart, 
  getCart, 
  RemoveFromCart, 
  updateCartItemQuantity, 
  clearCart
};