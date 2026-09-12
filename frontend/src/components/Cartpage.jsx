import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../getImageUrl';
import './CartPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function CartPage({ currency, rates }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Tracking ID Handler
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingRef = urlParams.get('ref');

    if (trackingRef) {
      sessionStorage.setItem('tracking_ref', trackingRef);
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }, []);

  // Fetch Cart Items
  const fetchCart = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/data`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      const res = await response.json();
      if (res.success) {
        setCartItems(res.data || res.cart || []);
      }
    } catch (err) {
      console.error('[CartPage] Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Handle Quantity Update (+ / -)
  const handleUpdateQuantity = async (cartId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartId);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cart_id: cartId, quantity: newQuantity })
      });

      const res = await response.json();
      if (res.success) {
        setCartItems((prev) =>
          prev.map((item) => (item.cart_id === cartId ? { ...item, quantity: newQuantity } : item))
        );
      }
    } catch (error) {
      console.error('[CartPage] Update Qty Error:', error);
    }
  };

  // Remove Single Item
  const handleRemoveItem = async (cartId) => {
    if (!window.confirm('Remove this item?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cart/remove/${cartId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await response.json();
      
      if (res.success) {
        setCartItems((prev) => prev.filter((item) => item.cart_id !== cartId));
      }
    } catch (error) {
      console.error('[CartPage] Remove Error:', error);
    }
  };

  // Remove All Products (Clear Cart)
  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to remove all products from your cart?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await response.json();

      if (res.success) {
        setCartItems([]);
      }
    } catch (error) {
      console.error('[CartPage] Clear Cart Error:', error);
    }
  };

  // Single Product Buy Now Handler
  const handleSingleBuyNow = (item) => {
    navigate('/add-address', {
      state: {
        buyNowProduct: {
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url
        }
      }
    });
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + Number(item.price || 0) * (item.quantity || 1),
    0
  );

  if (loading) return <div className="cart-loading">Loading Cart...</div>;

  return (
    <div className="cart-page-container">
      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <h3>Cart is empty!</h3>
          <Link to="/" className="cart-link">Go Back to Shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          
          <div className="cart-items-section">
            <div className="cart-section-header">
              <h2>My Cart ({cartItems.length} Items)</h2>
              <button className="btn-clear-all" onClick={handleClearCart}>
                Remove All
              </button>
            </div>

            {cartItems.map((item) => (
              <div key={item.cart_id} className="cart-item">
                <img
                  src={getImageUrl(item.image_url)}
                  alt={item.name || 'Product'}
                  className="cart-item-img"
                  onError={(e) => { e.target.src = '/saare_1.jpeg'; }}
                />
                
                <div className="cart-item-details">
                  <h4>{item.name || 'Product'}</h4>
                  
                  {/* QUANTITY TOGGLER */}
                  {/* QUANTITY TOGGLER */}
                  <div className="cart-qty-controls">
                    <button onClick={() => handleUpdateQuantity(item.cart_id, Number(item.quantity) - 1)}>-</button>
                    <span>{item.quantity}</span>
                    
                    {/* 🚨 FIX: Stock limit check added here */}
                    <button 
                      onClick={() => {
                        if (item.quantity >= item.stock_qty) {
                          alert(`Sorry! Only ${item.stock_qty} items are available in stock.`);
                          return;
                        }
                        handleUpdateQuantity(item.cart_id, Number(item.quantity) + 1);
                      }}
                      disabled={item.quantity >= item.stock_qty}
                      style={{ opacity: item.quantity >= item.stock_qty ? 0.4 : 1, cursor: item.quantity >= item.stock_qty ? 'not-allowed' : 'pointer' }}
                    >
                      +
                    </button>
                  </div>

                  <strong>₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</strong>
                </div>

                <div className="cart-item-actions">
                  <button className="btn-buy-single" onClick={() => handleSingleBuyNow(item)}>
                    Buy Now
                  </button>
                  <button className="btn-remove" onClick={() => handleRemoveItem(item.cart_id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-bill-section">
            <h3>Bill Details</h3>
            <p className="total-amount">Total: ₹{totalAmount.toLocaleString('en-IN')}</p>
            <button
              className="btn-proceed"
              onClick={() => {
                navigate('/add-address', { state: { cartItems, totalAmount } });
              }}
            >
              Proceed to Buy
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default CartPage;