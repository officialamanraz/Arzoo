import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function OrderSummary() {
  const location = useLocation();
  const navigate = useNavigate();

  const { addressId, buyNowProduct } = location.state || {};

  const [address, setAddress] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // NEW: State for customer email (required for invoice)
  const [customerEmail, setCustomerEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (!addressId) {
      navigate('/add-address');
      return;
    }

    const fetchOrderData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const addressRes = await fetch(`${API_BASE_URL}/api/addresses/${addressId}`, { headers });
        const addressData = await addressRes.json();

        if (addressData.success) {
          setAddress(addressData.address);
        } else {
          setError('Failed to load address details.');
          setLoading(false);
          return; 
        }

        if (buyNowProduct) {
          setCartItems([{
            ...buyNowProduct,
            product_id: buyNowProduct.product_id || buyNowProduct.id, 
            product_name: buyNowProduct.product_name || buyNowProduct.name,
            unit_price: buyNowProduct.price || buyNowProduct.unit_price, 
            quantity: buyNowProduct.quantity || 1
          }]);
        } else {
          const cartRes = await fetch(`${API_BASE_URL}/api/orders/cart`, { headers });
          const cartData = await cartRes.json();

          if (cartData.success) {
            const items = cartData.data.map(item => ({
              ...item,
              unit_price: item.price
            }));
            setCartItems(items);
          } else {
            setError('Failed to load cart details.');
          }
        }
      } catch (err) {
        setError('Network error.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [addressId, buyNowProduct, navigate]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.unit_price) * (item.quantity || 1),
    0
  );

  const handleContinueToPayment = () => {
    // Validate Email before continuing
    if (!customerEmail || !customerEmail.includes('@')) {
      setEmailError('Please provide a valid email ID for the invoice.');
      return;
    }
    
    navigate('/payment', {
      state: { 
        addressId, 
        totalAmount: subtotal,
        buyNowProduct,
        customerEmail // Passing email to the final checkout step
      }
    });
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Order Summary...</div>;
  if (error) return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', paddingBottom: '40px' }}>
      
      <div style={{ background: '#fff', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
        <h2 style={{ margin: 0, color: '#333', textAlign: 'center' }}>Checkout</h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '24px', gap: '8px' }}>
          <Step number={1} label="Address" completed />
          <StepLine completed />
          <Step number={2} label="Order Summary" active />
          <StepLine />
          <Step number={3} label="Payment" />
        </div>
      </div>

      <div style={{
        maxWidth: '1200px', margin: '24px auto', display: 'flex', gap: '20px',
        padding: '0 20px', alignItems: 'flex-start', flexWrap: 'wrap'
      }}>
        
        <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {address && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#878787' }}>DELIVER TO:</h3>
                <button onClick={() => navigate('/add-address')} style={{ color: '#2874f0', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  Change
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '1.1rem' }}>{address.full_name}</strong>
                <strong style={{ fontSize: '1.1rem' }}>{address.phone}</strong>
              </div>
              <p style={{ margin: '8px 0 0 0', color: '#212121', lineHeight: '1.5' }}>
                {address.house_no}, {address.road_area}, {address.landmark && `${address.landmark}, `}
                {address.city}, {address.state} - <strong style={{ color: '#000' }}>{address.pincode}</strong>
              </p>
            </div>
          )}

          {/* NEW: Email Input Section for Invoice */}
          <div style={cardStyle}>
             <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#878787' }}>INVOICE DETAILS:</h3>
             <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#212121' }}>Email ID required for digital invoice and delivery tracking.</p>
             <input 
                type="email" 
                placeholder="Enter your Email ID" 
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  setEmailError('');
                }}
                style={{ width: '100%', maxWidth: '400px', padding: '12px', border: emailError ? '1px solid red' : '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' }}
             />
             {emailError && <p style={{ color: 'red', fontSize: '0.85rem', margin: '5px 0 0 0' }}>{emailError}</p>}
          </div>

          <div style={{ ...cardStyle, padding: 0 }}>
            {cartItems.length === 0 ? (
              <p style={{ padding: '24px', color: '#878787' }}>Your cart is empty.</p>
            ) : (
              cartItems.map((item, index) => {
                const itemImage = Array.isArray(item.images) && item.images.length > 0 
                  ? item.images[0] 
                  : (item.image_url || item.image);

                return (
                  <div
                    key={item.product_id || index}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '24px',
                      borderBottom: index !== cartItems.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    {/* UPDATED: Bigger Image and Centered Text Container */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ width: '140px', height: '180px', flexShrink: 0 }}>
                        <img 
                          src={itemImage ? `${API_BASE_URL}/uploads/${itemImage}` : '/placeholder.png'} 
                          alt={item.product_name} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                          onError={(e) => { e.target.src = "/placeholder.png"; }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', color: '#212121', fontWeight: '500' }}>
                          {item.product_name}
                        </h4>
                        <span style={{ color: '#878787', fontSize: '1rem', marginBottom: '12px' }}>Qty: {item.quantity || 1}</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#212121' }}>
                          ₹{(Number(item.unit_price) * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 30%', position: 'sticky', top: '20px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#878787', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
              PRICE DETAILS
            </h3>
            <div style={priceRowStyle}>
              <span>Price ({cartItems.length} items)</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px dashed #e0e0e0', borderBottom: '1px dashed #e0e0e0',
              padding: '16px 0', margin: '16px 0', fontWeight: 'bold', fontSize: '1.2rem'
            }}>
              <span>Total Amount</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handleContinueToPayment}
              disabled={cartItems.length === 0}
              style={{
                width: '100%', backgroundColor: cartItems.length === 0 ? '#ccc' : '#fb641b',
                color: '#fff', border: 'none', padding: '16px', fontSize: '1.1rem',
                fontWeight: 'bold', borderRadius: '2px', cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0,0,0,.2)'
              }}
            >
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { background: '#fff', borderRadius: '2px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)', padding: '24px' };
const priceRowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1rem', color: '#212121' };

function Step({ number, label, active, completed }) {
  const bgColor = active || completed ? '#2874f0' : '#e0e0e0';
  const color = active || completed ? '#fff' : '#888';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, color, fontWeight: 'bold' }}>
        {completed ? '✓' : number}
      </div>
      <span style={{ marginTop: '6px', fontSize: '0.85em', color: active || completed ? '#333' : '#999', fontWeight: active ? 'bold' : 'normal' }}>
        {label}
      </span>
    </div>
  );
}
function StepLine({ completed }) {
  return <div style={{ width: '80px', height: '2px', backgroundColor: completed ? '#2874f0' : '#e0e0e0', marginBottom: '20px' }} />;
}