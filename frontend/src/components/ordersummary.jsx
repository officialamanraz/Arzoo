import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { uiTranslations } from '../languages'; 
import { getImageUrl } from '../getImageUrl'; // 👈 YAHAN ADD KIYA HAI HOME PAGE WALA FUNCTION
import './OrderSummary.css'; 

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function OrderSummary({ language }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { addressId, buyNowProduct } = location.state || {};

  const [address, setAddress] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dynamic Translation Function
  const t = (key) => {
    const currentLang = language || 'en';
    return uiTranslations[currentLang]?.[key] || uiTranslations['en'][key] || key;
  };

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
          setError(t('error')); 
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
            setError(t('error'));
          }
        }
      } catch (err) {
        setError('Network error.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [addressId, buyNowProduct, navigate, language]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.unit_price) * (item.quantity || 1),
    0
  );

  const handleContinueToPayment = () => {
    navigate('/payment', {
      state: { 
        addressId, 
        totalAmount: subtotal,
        buyNowProduct
      }
    });
  };

  // 🚨 SMART IMAGE EXTRACTOR: Ab yeh Home Page wale getImageUrl() ko use karega!
  const extractImage = (item) => {
    try {
      let rawData = item.images || item.image_url || item.image || item.thumbnail;
      if (!rawData) return '/placeholder.png';

      // Agar JSON string me array aaya hai, usko parse karo
      if (typeof rawData === 'string' && rawData.startsWith('[')) {
        rawData = JSON.parse(rawData);
      }

      let imageName = Array.isArray(rawData) ? rawData[0] : rawData;
      
      // Home page wale function me image bhej do
      return getImageUrl(imageName);
    } catch (e) {
      console.error("[OrderSummary] Image extraction failed for:", item.product_name);
      return '/placeholder.png';
    }
  };

  if (loading) return <div className="loading-state">{t('loading')}</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div className="summary-page">
      <div className="summary-header">
        <h2>{t('navCart') || 'Checkout'}</h2>
        <div className="stepper-container">
          <Step number={1} label="Address" completed />
          <StepLine completed />
          <Step number={2} label="Order Summary" active />
          <StepLine />
          <Step number={3} label="Payment" />
        </div>
      </div>

      <div className="summary-content-wrapper">
        <div className="summary-left-pane">

          {address && (
            <div className="summary-card">
              <div className="card-header">
                <h3>DELIVER TO:</h3>
                <button onClick={() => navigate('/add-address')} className="change-btn">Change</button>
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

          <div className="summary-card no-padding">
            {cartItems.length === 0 ? (
              <p className="empty-cart-text">{t('cartEmpty')}</p>
            ) : (
              cartItems.map((item, index) => (
                <div key={item.product_id || index} className={`cart-item-row ${index !== cartItems.length - 1 ? 'border-bottom' : ''}`}>
                  <div className="cart-item-details">
                    <div className="cart-item-img-container">
                      <img 
                        src={extractImage(item)} 
                        alt={item.product_name} 
                        className="cart-item-img"
                        onError={(e) => { e.target.src = "/saare_1.jpeg"; }} 
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
              ))
            )}
          </div>
        </div>

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
              CONTINUE TO PAYMENT
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