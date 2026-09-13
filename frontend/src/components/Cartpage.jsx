import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../getImageUrl';
import './CartPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function CartPage({ currency, rates }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingRef = urlParams.get('ref');
    if (trackingRef) {
      sessionStorage.setItem('tracking_ref', trackingRef);
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await response.json();
      if (res.success) setCartItems(res.data || res.cart || []);
    } catch (err) {
      console.error('[CartPage] Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartId, newQuantity) => {
    if (newQuantity <= 0) return handleRemoveItem(cartId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cart_id: cartId, quantity: newQuantity })
      });
      const res = await response.json();
      if (res.success) {
        setCartItems((prev) => prev.map((item) => (item.cart_id === cartId ? { ...item, quantity: newQuantity } : item)));
      }
    } catch (error) {
      console.error('[CartPage] Update Qty Error:', error);
    }
  };

  const handleRemoveItem = async (cartId) => {
    if (!window.confirm('Remove this item?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cart/remove/${cartId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await response.json();
      if (res.success) setCartItems((prev) => prev.filter((item) => item.cart_id !== cartId));
    } catch (error) {
      console.error('[CartPage] Remove Error:', error);
    }
  };

  const handleSingleBuyNow = (item) => {
    navigate('/add-address', {
      state: { buyNowProduct: { product_id: item.product_id, name: item.name, price: item.price, quantity: item.quantity, image_url: item.image_url } }
    });
  };

  const formatDeliveryDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', weekday: 'short' }).format(date);
  };

  const totalAmount = cartItems.reduce((total, item) => total + Number(item.price || 0) * (item.quantity || 1), 0);
  const totalMRP = cartItems.reduce((total, item) => total + (Number(item.mrp || item.price || 0) * (item.quantity || 1)), 0);
  const totalDiscount = totalMRP - totalAmount;

  if (loading) return <div className="cart-loading">Loading Cart...</div>;

  return (
    <div className="cart-page-container">
      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <h3>Cart is empty!</h3>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/" className="cart-link">Go Back to Shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          
          {/* LEFT COLUMN: CART ITEMS DATA EXACTLY LIKE SCREENSHOT */}
          <div className="cart-items-section">
            <div className="cart-section-header">
              <h2>My Cart ({cartItems.length})</h2>
            </div>

            {cartItems.map((item) => (
              <div key={item.cart_id} className="cart-item-card">
                
                {/* TOP HALF: Image, Qty, Details */}
                <div className="cart-item-data-row">
                  
                  {/* Image & Qty Column (Left) */}
                  <div className="cart-item-visual-col">
                    <Link to={`/product/${item.product_id}`}>
                      <img src={getImageUrl(item.image_url)} alt={item.name} className="cart-item-img" onError={(e) => { e.target.src = '/saare_1.jpeg'; }} />
                    </Link>
                    
                    <div className="cart-qty-controls">
                      <button onClick={() => handleUpdateQuantity(item.cart_id, Number(item.quantity) - 1)} disabled={item.quantity <= 1}>–</button>
                      <div className="qty-display">{item.quantity}</div>
                      <button 
                        onClick={() => {
                          if (item.quantity >= item.stock_qty) return alert(`Only ${item.stock_qty} available in stock.`);
                          handleUpdateQuantity(item.cart_id, Number(item.quantity) + 1);
                        }}
                        disabled={item.quantity >= item.stock_qty}
                      >+</button>
                    </div>
                  </div>

                  {/* Info Column (Right) */}
                  <div className="cart-item-info-col">
                    <Link to={`/product/${item.product_id}`} className="cart-product-title-link">
                      <h4 className="cart-product-title">{item.name}</h4>
                    </Link>
                    <p className="cart-seller-info">Seller: Arzoo Saree</p>

                    {/* Price structure: Discount -> MRP -> Final Price */}
                    <div className="cart-price-block">
                      {item.mrp > item.price && (
                        <span className="cart-discount-percent">↓{item.discount_percentage}%</span>
                      )}
                      {item.mrp > item.price && (
                        <span className="cart-original-mrp">₹{(Number(item.mrp) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                      )}
                      <span className="cart-final-price">₹{(Number(item.price) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                    </div>

                    {item.estimated_delivery && (
                      <p className="cart-delivery-date">Delivery by {formatDeliveryDate(item.estimated_delivery)}</p>
                    )}
                  </div>
                </div>

                {/* BOTTOM HALF: Horizontal Action Buttons */}
                <div className="cart-item-action-row">
                  <button className="cart-action-btn" onClick={() => handleRemoveItem(item.cart_id)}>Remove</button>
                  <button className="cart-action-btn cart-buy-now-btn" onClick={() => handleSingleBuyNow(item)}>⚡ Buy this now</button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT COLUMN: PRICE DETAILS BLOCK */}
          <div className="cart-bill-section">
            <h3 className="bill-header">PRICE DETAILS</h3>
            
            <div className="bill-body">
              <div className="bill-row">
                <span>Price ({cartItems.length} items)</span>
                <span>₹{totalMRP.toLocaleString('en-IN')}</span>
              </div>
              
              {totalDiscount > 0 && (
                <div className="bill-row">
                  <span>Discount</span>
                  <span className="bill-green-text">− ₹{totalDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              
              <div className="bill-row">
                <span>Delivery Charges</span>
                <span className="bill-green-text">Free</span>
              </div>
              
              <div className="bill-total-row">
                <span>Total Amount</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              
              {totalDiscount > 0 && (
                <div className="bill-savings-msg">
                  You will save ₹{totalDiscount.toLocaleString('en-IN')} on this order
                </div>
              )}
            </div>

            <div className="bill-trust-badge">
              🛡️ Safe and secure payments. 100% Authentic products.
            </div>

            <button className="btn-place-order" onClick={() => navigate('/add-address', { state: { cartItems, totalAmount } })}>
              PLACE ORDER
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default CartPage;