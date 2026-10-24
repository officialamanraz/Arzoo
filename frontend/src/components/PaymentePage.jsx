import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import './Payment.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { addressId, totalAmount, buyNowProduct, customerEmail } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isCartKotaDoriya, setIsCartKotaDoriya] = useState(false);
  const [checkingCart, setCheckingCart] = useState(!buyNowProduct);

  // 1. Check if Buy-Now item contains Kota Doriya
  const isBuyNowKotaDoriya = Boolean(
    buyNowProduct &&
    buyNowProduct.name &&
    buyNowProduct.name.toLowerCase().includes('kota doriya')
  );

  // 2. If it's a regular cart checkout, check cart items from backend
  useEffect(() => {
    if (!buyNowProduct) {
      const checkCartForKotaDoriya = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          setCheckingCart(false);
          return;
        }
        try {
          const res = await fetch(`${API_BASE_URL}/api/cart`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          const items = data.items || data.cart || (Array.isArray(data) ? data : []);
          const hasKota = items.some(item =>
            (item.name && item.name.toLowerCase().includes('kota doriya')) ||
            (item.title && item.title.toLowerCase().includes('kota doriya'))
          );
          if (hasKota) {
            setIsCartKotaDoriya(true);
          }
        } catch (err) {
          console.error('[PaymentPage] Error checking cart:', err);
        } finally {
          setCheckingCart(false);
        }
      };
      checkCartForKotaDoriya();
    }
  }, [buyNowProduct]);

  // Combined rule: Kota Doriya is strictly restricted from COD
  const isKotaDoriya = isBuyNowKotaDoriya || isCartKotaDoriya;

  // Auto-switch to online if Kota Doriya is detected
  useEffect(() => {
    if (isKotaDoriya && paymentMethod === 'cod') {
      setPaymentMethod('online');
    }
  }, [isKotaDoriya, paymentMethod]);

  useEffect(() => {
    console.log('[PaymentPage] Initializing component. State received:', location.state);
    if (!addressId) {
      console.warn('[PaymentPage] Missing addressId, redirecting to /add-address');
      navigate('/add-address');
    }
  }, [addressId, navigate]);

  // Razorpay Payment Flow
  const startRazorpayPayment = async (internalOrderId, displayOrderId, token) => {
    try {
      if (!window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
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
        toast.error('Failed to start payment: ' + (razorpayData.message || 'Error'));
        setPlacingOrder(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayData.amount,
        currency: razorpayData.currency || 'INR',
        name: 'Arzoo Saree',
        description: 'Purchase Checkout',
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
              toast.error('Payment verification failed. Please contact support.');
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
        toast.error('Payment failed. Please try again.');
        setPlacingOrder(false);
      });
      rzp.open();
    } catch (err) {
      console.error('[PaymentPage] Razorpay error:', err);
      toast.error('Something went wrong starting online payment.');
      setPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Strict block guard
    if (isKotaDoriya && paymentMethod === 'cod') {
      toast.error('Cash on Delivery (COD) is not allowed for Kota Doriya Sarees.');
      return;
    }

    setPlacingOrder(true);
    const token = localStorage.getItem('token');
    
    try {
      const storedTrackingRef = sessionStorage.getItem('tracking_ref') || null;
      const payload = { 
        addressId,
        paymentMethod,
        ...(buyNowProduct && { buyNowProduct }),
        tracking_ref: storedTrackingRef,
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

      if (!data.success) {
        console.error('[PaymentPage] Order placement failed:', data.message || data.error);
        toast.error(data.message || data.error || 'Could not place your order.');
        setPlacingOrder(false);
        return;
      }

      if (paymentMethod === 'cod') {
        sessionStorage.removeItem('tracking_ref');
        toast.success('Order placed successfully!');
        navigate(`/track-order/${data.orderId || data.order_id}`);
        setPlacingOrder(false);
      } else {
        // Proceed to Razorpay
        await startRazorpayPayment(data.order_id, data.orderId, token);
      }
    } catch (err) {
      console.error('[PaymentPage] Order placement exception:', err);
      toast.error('Something went wrong while placing your order.');
      setPlacingOrder(false);
    }
  };

  if (!addressId) return null;

  if (checkingCart) {
    return (
      <div className="payment-loading-screen" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p className="payment-loading-text" style={{ color: '#741434', fontWeight: 600 }}>
          Verifying order items & payment options...
        </p>
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
            <h3 className="section-title">SELECT PAYMENT METHOD</h3>

            {/* Online Payment Option */}
            <div 
              className={`payment-method-box ${paymentMethod === 'online' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('online')}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                borderRadius: '8px',
                border: paymentMethod === 'online' ? '2px solid #741434' : '1px solid #e2e8f0',
                background: paymentMethod === 'online' ? '#fdf5eb' : '#fff',
                marginBottom: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              <input 
                type="radio" 
                name="paymentMethod" 
                value="online" 
                checked={paymentMethod === 'online'} 
                onChange={() => setPaymentMethod('online')}
                className="payment-radio" 
              />
              <FaCreditCard size={22} color="#741434" />
              <div>
                <p className="payment-method-title" style={{ fontWeight: 600, margin: 0, color: '#1a202c' }}>
                  Pay Online (UPI, Cards, Netbanking)
                </p>
                <p className="payment-method-desc" style={{ fontSize: '0.85rem', color: '#718096', margin: '2px 0 0' }}>
                  Safe & fast transaction via Razorpay.
                </p>
              </div>
            </div>

            {/* Cash on Delivery Option (Blocked if Kota Doriya) */}
            <div 
              className={`payment-method-box ${paymentMethod === 'cod' ? 'selected' : ''}`}
              onClick={() => {
                if (!isKotaDoriya) setPaymentMethod('cod');
              }}
              style={{
                cursor: isKotaDoriya ? 'not-allowed' : 'pointer',
                opacity: isKotaDoriya ? 0.45 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                borderRadius: '8px',
                border: paymentMethod === 'cod' ? '2px solid #2f855a' : '1px solid #e2e8f0',
                background: isKotaDoriya ? '#f8f9fa' : (paymentMethod === 'cod' ? '#f0fff4' : '#fff'),
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              <input 
                type="radio" 
                name="paymentMethod" 
                value="cod" 
                checked={paymentMethod === 'cod'} 
                disabled={isKotaDoriya || placingOrder}
                onChange={() => {
                  if (!isKotaDoriya) setPaymentMethod('cod');
                }}
                className="payment-radio" 
              />
              <FaMoneyBillWave size={22} color={isKotaDoriya ? '#a0aec0' : '#2f855a'} />
              <div>
                <p className="payment-method-title" style={{ fontWeight: 600, margin: 0, color: isKotaDoriya ? '#718096' : '#1a202c' }}>
                  Cash on Delivery (COD)
                </p>
                <p className="payment-method-desc" style={{ fontSize: '0.85rem', color: '#718096', margin: '2px 0 0' }}>
                  Pay the delivery agent in cash when your order arrives.
                </p>
              </div>
            </div>

            {/* Warning when COD is blocked */}
            {isKotaDoriya && (
              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                backgroundColor: '#fff5f5',
                borderLeft: '4px solid #e53e3e',
                borderRadius: '4px',
                color: '#c53030',
                fontSize: '0.86rem',
                fontWeight: 500
              }}>
                ⚠️ <strong>COD Unavailable:</strong> Cash on Delivery is not supported for authentic Kota Doriya Handcrafted Sarees. Please use online payment to complete your order.
              </div>
            )}
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
              {placingOrder 
                ? 'Processing...' 
                : (paymentMethod === 'cod' ? 'Place Order (COD)' : 'Proceed to Pay Online')}
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