import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCreditCard } from 'react-icons/fa';
import './Payment.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { addressId, totalAmount, buyNowProduct, customerEmail } = location.state || {};

  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!addressId) {
      navigate('/add-address');
    }
  }, [addressId, navigate]);

  const startRazorpayPayment = async (internalOrderId, displayOrderId, token) => {
    try {
      if (!window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Check your internet connection.');
        setPlacingOrder(false);
        return;
      }

      const razorpayRes = await fetch(`${API_BASE_URL}/api/orders/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ order_id: internalOrderId })
      });

      const razorpayData = await razorpayRes.json();

      if (!razorpayData.success) {
        toast.error('Payment initiation failed: ' + (razorpayData.message || ''));
        setPlacingOrder(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayData.amount,
        currency: razorpayData.currency || 'INR',
        name: 'Arzoo Saree',
        description: 'Order Checkout',
        order_id: razorpayData.razorpay_order_id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              sessionStorage.removeItem('tracking_ref');
              toast.success(`Payment Successful! Order ID: ${displayOrderId}`);
              navigate(`/track-order/${displayOrderId}`);
            } else {
              toast.error('Payment verification failed.');
            }
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPlacingOrder(false);
          }
        },
        theme: { color: '#741434' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        toast.error('Payment failed. Please retry.');
        setPlacingOrder(false);
      });
      rzp.open();
    } catch (err) {
      console.error('[PaymentPage] Razorpay Error:', err);
      toast.error('Payment error encountered.');
      setPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    const token = localStorage.getItem('token');

    try {
      const storedTrackingRef = sessionStorage.getItem('tracking_ref') || null;
      const payload = {
        addressId,
        paymentMethod: 'online', // Strictly locked to online
        ...(buyNowProduct && { buyNowProduct }),
        tracking_ref: storedTrackingRef,
        customerEmail
      };

      const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || data.error || 'Failed to place order.');
        setPlacingOrder(false);
        return;
      }

      // Directly start Razorpay payment
      await startRazorpayPayment(data.order_id, data.orderId, token);
      
    } catch (err) {
      console.error('[PaymentPage] Checkout error:', err);
      toast.error('Error processing your order.');
      setPlacingOrder(false);
    }
  };

  if (!addressId) return null;

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

            {/* ONLY Online Payment Option Rendered */}
            <div
              className="payment-method-box selected"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                borderRadius: '8px',
                border: '2px solid #741434',
                background: '#fdf5eb',
                marginBottom: '14px'
              }}
            >
              <input
                type="radio"
                checked={true}
                readOnly
                className="payment-radio"
              />
              <FaCreditCard size={22} color="#741434" />
              <div>
                <p style={{ fontWeight: 600, margin: 0, color: '#1a202c' }}>
                  Pay Online (UPI, Cards, Netbanking)
                </p>
                <p style={{ fontSize: '0.85rem', color: '#718096', margin: '2px 0 0' }}>
                  100% Secure payment via Razorpay.
                </p>
              </div>
            </div>
            
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#f8f9fa',
              borderLeft: '4px solid #718096',
              borderRadius: '4px',
              color: '#4a5568',
              fontSize: '0.85rem'
            }}>
              ℹ️ <strong>Note:</strong> We currently only accept prepaid online orders to ensure secure and fast delivery.
            </div>
            
          </div>
        </div>

        <div className="payment-right-pane">
          <div className="payment-card">
            <h3 className="order-total-header">ORDER TOTAL</h3>

            <div className="total-amount-row">
              <span>Total Amount</span>
              <span>₹{Number(totalAmount || 0).toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className={`place-order-btn ${placingOrder ? 'btn-disabled' : ''}`}
            >
              {placingOrder ? 'Processing...' : 'Proceed to Pay Online'}
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