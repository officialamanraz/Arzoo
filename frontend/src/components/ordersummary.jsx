import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './OrderSummary.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function OrderSummary() {
  const location = useLocation();
  const navigate = useNavigate();

  const { addressId, buyNowProduct } = location.state || {};

  const [address, setAddress] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for customer email (required for invoice)
  const [customerEmail, setCustomerEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    console.log('[OrderSummary] Initializing component. State received:', location.state);
    
    if (!addressId) {
      console.warn('[OrderSummary] No address ID found. Redirecting to /add-address');
      navigate('/add-address');
      return;
    }

    const fetchOrderData = async () => {
      try {
        console.log(`[OrderSummary] Fetching data for address ID: ${addressId}`);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const addressRes = await fetch(`${API_BASE_URL}/api/addresses/${addressId}`, { headers });
        const addressData = await addressRes.json();

        if (addressData.success) {
          console.log('[OrderSummary] Address data loaded:', addressData.address);
          setAddress(addressData.address);
        } else {
          console.error('[OrderSummary] Failed to load address details:', addressData.message);
          setError('Failed to load address details.');
          setLoading(false);
          return; 
        }

        if (buyNowProduct) {
          console.log('[OrderSummary] Processing Buy Now product:', buyNowProduct);
          setCartItems([{
            ...buyNowProduct,
            product_id: buyNowProduct.product_id || buyNowProduct.id, 
            product_name: buyNowProduct.product_name || buyNowProduct.name,
            unit_price: buyNowProduct.price || buyNowProduct.unit_price, 
            quantity: buyNowProduct.quantity || 1
          }]);
        } else {
          console.log('[OrderSummary] Fetching cart items...');
          const cartRes = await fetch(`${API_BASE_URL}/api/orders/cart`, { headers });
          const cartData = await cartRes.json();

          if (cartData.success) {
            console.log(`[OrderSummary] Cart items loaded (${cartData.data.length} items)`);
            const items = cartData.data.map(item => ({
              ...item,
              unit_price: item.price
            }));
            setCartItems(items);
          } else {
            console.error('[OrderSummary] Failed to load cart details:', cartData.message);
            setError('Failed to load cart details.');
          }
        }
      } catch (err) {
        console.error('[OrderSummary] Network error during data fetch:', err);
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
    console.log('[OrderSummary] Continue to payment clicked.');
    
    // Validate Email before continuing
    if (!customerEmail || !customerEmail.includes('@')) {
      console.warn('[OrderSummary] Invalid email provided.');
      setEmailError('Please provide a valid email ID for the invoice.');
      return;
    }
    
    console.log('[OrderSummary] Proceeding to payment route with state.');
    navigate('/payment', {
      state: { 
        addressId, 
        totalAmount: subtotal,
        buyNowProduct,
        customerEmail // Passing email to the final checkout step
      }
    });
  };

  if (loading) return <div className="loading-state">Loading Order Summary...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div className="summary-page">
      
      {/* Header and Stepper */}
      <div className="summary-header">
        <h2>Checkout</h2>
        <div className="stepper-container">
          <Step number={1} label="Address" completed />
          <StepLine completed />
          <Step number={2} label="Order Summary" active />
          <StepLine />
          <Step number={3} label="Payment" />
        </div>
      </div>

      <div className="summary-content-wrapper">
        
        {/* Left Side: Address, Email, Items */}
        <div className="summary-left-pane">

          {address && (
            <div className="summary-card">
              <div className="card-header">
                <h3>DELIVER TO:</h3>
                <button onClick={() => navigate('/add-address')} className="change-btn">
                  Change
                </button>
              </div>
              <div className="address-name-row">
                <strong>{address.full_name}</strong>
                <strong>{address.phone}</strong>
              </div>
              <p className="address-details">
                {address.house_no}, {address.road_area}, {address.landmark && `${address.landmark}, `}
                {address.city}, {address.state} - <strong>{address.pincode}</strong>
              </p>
            </div>
          )}

          {/* Email Input Section for Invoice */}
          <div className="summary-card">
             <h3 className="section-subtitle">INVOICE DETAILS:</h3>
             <p className="section-desc">Email ID required for digital invoice and delivery tracking.</p>
             <input 
                type="email" 
                placeholder="Enter your Email ID" 
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  setEmailError('');
                }}
                className={`email-input ${emailError ? 'input-error' : ''}`}
             />
             {emailError && <p className="error-text">{emailError}</p>}
          </div>

          {/* Cart Items */}
          <div className="summary-card no-padding">
            {cartItems.length === 0 ? (
              <p className="empty-cart-text">Your cart is empty.</p>
            ) : (
              cartItems.map((item, index) => {
                const itemImage = Array.isArray(item.images) && item.images.length > 0 
                  ? item.images[0] 
                  : (item.image_url || item.image);

                return (
                  <div
                    key={item.product_id || index}
                    className={`cart-item-row ${index !== cartItems.length - 1 ? 'border-bottom' : ''}`}
                  >
                    <div className="cart-item-details">
                      <div className="cart-item-img-container">
                        <img 
                          src={itemImage ? `${API_BASE_URL}/uploads/${itemImage}` : '/placeholder.png'} 
                          alt={item.product_name} 
                          className="cart-item-img"
                          onError={(e) => { 
                            console.log(`[OrderSummary] Failed to load image for ${item.product_name}. Using fallback.`);
                            e.target.src = "/placeholder.png"; 
                          }} 
                        />
                      </div>
                      <div className="cart-item-info">
                        <h4>{item.product_name}</h4>
                        <span className="cart-item-qty">Qty: {item.quantity || 1}</span>
                        <span className="cart-item-price">
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

        {/* Right Side: Price Details */}
        <div className="summary-right-pane">
          <div className="summary-card">
            <h3 className="price-details-header">PRICE DETAILS</h3>
            <div className="price-row">
              <span>Price ({cartItems.length} items)</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="total-amount-row">
              <span>Total Amount</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handleContinueToPayment}
              disabled={cartItems.length === 0}
              className="continue-btn"
            >
              CONTINUE
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