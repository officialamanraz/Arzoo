import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Payment.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract all state passed from OrderSummary exactly once
  const { addressId, totalAmount, buyNowProduct, customerEmail } = location.state || {};

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[PaymentPage] Initializing component. State received:', location.state);
    
    // Can't reach payment without completing the address step first
    if (!addressId) {
      console.warn('[PaymentPage] Missing addressId, redirecting to /add-address');
      navigate('/add-address');
    }
  }, [addressId, navigate]);

  const handlePlaceOrder = async () => {
    console.log('[PaymentPage] Place order (COD) clicked.');
    setPlacingOrder(true);
    setError('');
    const token = localStorage.getItem('token');
    
    try {
      const payload = { 
        addressId,
        buyNowProduct
      };
      console.log('[PaymentPage] Submitting payload to checkout API:', payload);

      const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        // ✅ Fixed: Backend reads req.body.addressId
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      console.log('[PaymentPage] Server response:', data);

      if (data.success) {
        console.log(`[PaymentPage] Order successful! Navigating to tracking page for ID: ${data.orderId}`);
        navigate(`/track-order/${data.orderId}`);
      } else {
        console.error('[PaymentPage] Order placement failed:', data.message || data.error);
        setError(data.message || data.error || 'Could not place your order.');
      }
    } catch (err) {
      console.error('[PaymentPage] Order placement exception:', err);
      setError('Something went wrong while placing your order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!addressId) return null;

  return (
    <div className="payment-page">

      {/* Header & Stepper */}
      <div className="payment-header">
        <h2>Checkout</h2>
        <div className="stepper-container">
          <Step number={1} label="Address" completed />
          <StepLine completed />
          <Step number={2} label="Order Summary" completed />
          <StepLine completed />
          <Step number={3} label="Payment" active />
        </div>
      </div>

      <div className="payment-content-wrapper">

        {/* LEFT: Payment method (COD only) */}
        <div className="payment-left-pane">
          <div className="payment-card">
            <h3 className="section-title">PAYMENT METHOD</h3>

            <div className="payment-method-box">
              <input type="radio" checked readOnly className="payment-radio" />
              <div>
                <p className="payment-method-title">💵 Cash on Delivery</p>
                <p className="payment-method-desc">
                  Pay the delivery agent in cash when your order arrives.
                </p>
              </div>
            </div>

            <p className="payment-coming-soon">
              Online payment options will be added soon.
            </p>

            {error && (
              <p className="payment-error-message">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Total + Place order */}
        <div className="payment-right-pane">
          <div className="payment-card">
            <h3 className="order-total-header">
              ORDER TOTAL
            </h3>
            
            <div className="total-amount-row">
              <span>Total Amount</span>
              <span>₹{Number(totalAmount || 0).toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className={`place-order-btn ${placingOrder ? 'btn-disabled' : ''}`}
            >
              {placingOrder ? 'Placing Order...' : 'Place Order (COD)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Subcomponents
function Step({ number, label, active, completed }) {
  return (
    <div className="step-wrapper">
      <div className={`step-circle ${active || completed ? 'active' : ''}`}>
        {completed ? '✓' : number}
      </div>
      <span className={`step-label ${active || completed ? 'active-text' : ''} ${active ? 'bold-text' : ''}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ completed }) {
  return <div className={`step-line ${completed ? 'completed-line' : ''}`} />;
}