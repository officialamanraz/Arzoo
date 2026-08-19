import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../getImageUrl'; // agar components/ folder se import kar rahe ho
import './CartPage.css'; // Importing the separate CSS file

const API_BASE_URL = import.meta.env.VITE_API_URL;

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
// 👉 NAYA CODE: URL se Tracking ID pakadne wala logic
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingRef = urlParams.get('ref');

    if (trackingRef) {
      sessionStorage.setItem('tracking_ref', trackingRef);
      console.log('[CartPage] Tracking ID saved in session:', trackingRef);

      // URL clean karna taaki ?ref=... hat jaye
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }, []);
  useEffect(() => {
    const fetchCart = async () => {
      console.log('[CartPage] Fetching cart data...');
      setLoading(true);
      const token = localStorage.getItem('token');

      try {
        const response = await fetch(`${API_BASE_URL}/api/cart/data`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });

        const res = await response.json();
        console.log('[CartPage] Cart data response:', res);

        if (res.success) {
          setCartItems(res.data || res.cart || []);
        } else {
          console.error('[CartPage] Cart fetch failed:', res.message);
        }
      } catch (err) {
        console.error('[CartPage] Error fetching cart:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleRemoveItem = async (cartId) => {
    if (!window.confirm('Remove this item?')) return;
    console.log(`[CartPage] Attempting to remove item with cartId: ${cartId}`);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cart/remove/${cartId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await response.json();
      
      console.log('[CartPage] Remove item response:', res);
      if (res.success) {
        setCartItems((prev) => prev.filter((item) => item.cart_id !== cartId));
      }
    } catch (error) {
      console.error('[CartPage] Remove Error:', error);
    }
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
            <h2>My Cart ({cartItems.length} Items)</h2>
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
                  <p>Qty: {item.quantity}</p>
                  <strong>₹{Number(item.price || 0).toLocaleString('en-IN')}</strong>
                </div>
                <button 
                  className="btn-remove" 
                  onClick={() => handleRemoveItem(item.cart_id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-bill-section">
            <h3>Bill Details</h3>
            <p className="total-amount">Total: ₹{totalAmount.toLocaleString('en-IN')}</p>
            <button
              className="btn-proceed"
              onClick={() => {
                console.log('[CartPage] Proceeding to buy. Total amount:', totalAmount);
                navigate('/add-address');
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