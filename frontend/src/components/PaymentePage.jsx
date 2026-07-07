import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL ||  'https://arzoo-3.onrender.com';


export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Extract all state passed from OrderSummary exactly once
  const { addressId, totalAmount, buyNowProduct, customerEmail } = location.state || {};

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Can't reach payment without completing the address step first
    if (!addressId) {
      navigate('/add-address');
    }
  }, [addressId, navigate]);

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    setError('');
    const token = localStorage.getItem('token');
try {
  const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    // ✅ Fixed: backend padhta hai req.body.addressId
    body: JSON.stringify({ 
  addressId,
  buyNowProduct
})
  });
      const data = await res.json();

      if (data.success) {
        navigate(`/track-order/${data.orderId}`);
      } else {
        setError(data.message || data.error || 'Could not place your order.');
      }
    } catch (err) {
      console.error('Order placement error:', err);
      setError('Something went wrong while placing your order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!addressId) return null;

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', paddingBottom: '40px' }}>

      {/* Header & Stepper */}
      <div style={{ background: '#fff', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
        <h2 style={{ margin: 0, color: '#333', textAlign: 'center' }}>Checkout</h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '24px', gap: '8px' }}>
          <Step number={1} label="Address" completed />
          <StepLine completed />
          <Step number={2} label="Order Summary" completed />
          <StepLine completed />
          <Step number={3} label="Payment" active />
        </div>
      </div>

      <div style={{
        maxWidth: '900px', margin: '24px auto', display: 'flex', gap: '20px',
        padding: '0 20px', alignItems: 'flex-start', flexWrap: 'wrap'
      }}>

        {/* LEFT: Payment method (COD only) */}
        <div style={{ flex: '1 1 60%', ...cardStyle }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#878787' }}>PAYMENT METHOD</h3>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            border: '2px solid #A8325E', borderRadius: '8px', padding: '18px',
            backgroundColor: '#fdf7f4'
          }}>
            <input type="radio" checked readOnly style={{ width: '18px', height: '18px' }} />
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#212121' }}>💵 Cash on Delivery</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85em', color: '#878787' }}>
                Pay the delivery agent in cash when your order arrives.
              </p>
            </div>
          </div>

          <p style={{ marginTop: '16px', fontSize: '0.8em', color: '#aaa' }}>
            Online payment options will be added soon.
          </p>

          {error && (
            <p style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '8px', fontSize: '0.9em', marginTop: '16px' }}>
              {error}
            </p>
          )}
        </div>

        {/* RIGHT: Total + Place order */}
        <div style={{ flex: '1 1 30%', ...cardStyle }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#878787', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
            ORDER TOTAL
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '20px' }}>
            <span>Total Amount</span>
            <span>₹{Number(totalAmount || 0).toFixed(2)}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            style={{
              width: '100%',
              backgroundColor: placingOrder ? '#c98a2c99' : '#A8325E',
              color: '#fff',
              border: 'none',
              padding: '16px',
              fontSize: '1.05rem',
              fontWeight: 'bold',
              borderRadius: '8px',
              cursor: placingOrder ? 'not-allowed' : 'pointer'
            }}
          >
            {placingOrder ? 'Placing Order...' : 'Place Order (COD)'}
          </button>
        </div>

      </div>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  borderRadius: '8px',
  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)',
  padding: '24px'
};

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