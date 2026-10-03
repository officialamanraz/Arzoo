import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaMoneyBillWave } from 'react-icons/fa';
import './Payment.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { addressId, totalAmount, buyNowProduct, customerEmail } = location.state || {};

  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    console.log('[PaymentPage] Initializing component. State received:', location.state);
    if (!addressId) {
      console.warn('[PaymentPage] Missing addressId, redirecting to /add-address');
      navigate('/add-address');
    }
  }, [addressId, navigate]);

  const handlePlaceOrder = async () => {
    console.log('[PaymentPage] Place order (COD) clicked.');
    setPlacingOrder(true);
    const token = localStorage.getItem('token');
    
    try {
      const payload = { 
        addressId,
        buyNowProduct,
        customerEmail
      };
      console.log('[PaymentPage] Submitting payload to checkout API:', payload);

      const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      console.log('[PaymentPage] Server response:', data);

      if (data.success) {
        console.log(`[PaymentPage] Order successful! Navigating to tracking page for ID: ${data.orderId}`);
        toast.success('Order placed successfully!');
        navigate(`/track-order/${data.orderId}`);
      } else {
        console.error('[PaymentPage] Order placement failed:', data.message || data.error);
        toast.error(data.message || data.error || 'Could not place your order.');
      }
    } catch (err) {
      console.error('[PaymentPage] Order placement exception:', err);
      toast.error('Something went wrong while placing your order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!addressId) return null;
  if (loading) {
    return (
      <div className="payment-loading-screen">
        <div className="payment-spinner"></div>
        <p className="payment-loading-text">Securely loading payment options...</p>
      </div>
    );
  }

  return (
    <div className="payment-page">
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
        <div className="payment-left-pane">
          <div className="payment-card">
            <h3 className="section-title">PAYMENT METHOD</h3>

            <div className="payment-method-box">
              <input type="radio" checked readOnly className="payment-radio" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaMoneyBillWave size={22} color="#2f855a" />
                <div>
                  <p className="payment-method-title">Cash on Delivery</p>
                  <p className="payment-method-desc">
                    Pay the delivery agent in cash when your order arrives.
                  </p>
                </div>
              </div>
            </div>

            <p className="payment-coming-soon">
              Online payment options will be added soon.
            </p>
          </div>
        </div>

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