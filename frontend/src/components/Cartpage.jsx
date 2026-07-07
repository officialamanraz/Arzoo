import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://arzoo-3.onrender.com';

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
        } else {
          console.error('Cart fetch failed:', res.message);
        }
      } catch (err) {
        console.error('Error fetching cart:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

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
      console.error('Remove Error:', error);
    }
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + Number(item.price || 0) * (item.quantity || 1),
    0
  );

  if (loading) return <div style={{ padding: '150px', textAlign: 'center' }}>Loading Cart...</div>;

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '100px 20px' }}>
      {cartItems.length === 0 ? (
        <div style={{ background: '#fff', padding: '50px', textAlign: 'center', maxWidth: '500px', margin: '0 auto', borderRadius: '20px' }}>
          <h3>Cart is empty!</h3>
          <Link to="/">Go Back to Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '30px', maxWidth: '1100px', margin: '0 auto', flexWrap: 'wrap' }}>
          <div style={{ flex: '2', background: '#fff', padding: '20px', borderRadius: '20px' }}>
            <h2>My Cart ({cartItems.length} Items)</h2>
            {cartItems.map((item) => (
              <div key={item.cart_id} style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eee' }}>
                <img
                  src={`${API_BASE_URL}/uploads/${item.image_url || 'saare_1.jpeg'}`}
                  alt={item.name || 'Saree'}
                  style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '12px', marginRight: '20px' }}
                  onError={(e) => { e.target.src = '/saare_1.jpeg'; }}
                />
                <div style={{ flex: 1 }}>
                  <h4>{item.name || 'Saree'}</h4>
                  <p>Qty: {item.quantity}</p>
                  <strong>₹{Number(item.price || 0).toLocaleString('en-IN')}</strong>
                </div>
                <button onClick={() => handleRemoveItem(item.cart_id)}>Remove</button>
              </div>
            ))}
          </div>

          <div style={{ flex: '1', minWidth: '300px', background: '#fff', padding: '30px', borderRadius: '20px' }}>
            <h3>Bill Details</h3>
            <p>Total: ₹{totalAmount.toLocaleString('en-IN')}</p>

            <button
              onClick={() => navigate('/add-address')}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: '#A8325E',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '1em',
                cursor: 'pointer',
                marginTop: '16px'
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