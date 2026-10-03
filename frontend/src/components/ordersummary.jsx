import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uiTranslations } from '../languages'; 
import { getImageUrl } from '../getImageUrl';
import './OrderSummary.css'; 

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ==========================================
// HELPER FUNCTIONS FOR NEW COLUMNS & PRICING
// ==========================================

// 1. Dynamic Discount Percentage Calculator
const calculateDiscountPercent = (mrp, price, backendDiscount) => {
  if (backendDiscount && Number(backendDiscount) > 0) {
    return Math.round(Number(backendDiscount));
  }
  const numMrp = Number(mrp || 0);
  const numPrice = Number(price || 0);
  if (numMrp > numPrice && numPrice > 0) {
    return Math.round(((numMrp - numPrice) / numMrp) * 100);
  }
  return 0;
};

// 2. Delivery Date Formatter with Safe Fallback
const formatDeliveryDate = (dateString) => {
  try {
    let date = dateString ? new Date(dateString) : null;
    // Fallback: If date is missing or invalid, estimate 5 days from today
    if (!date || isNaN(date.getTime())) {
      date = new Date();
      date.setDate(date.getDate() + 5);
    }
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  } catch (err) {
    return 'Within 5-7 business days';
  }
};

// 3. Indian Currency Formatter (₹)
const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// 4. Totals Calculation Function
const calculateTotals = (items = []) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unit_price || 0) * (item.quantity || 1),
    0
  );
  const totalMRP = items.reduce(
    (sum, item) => sum + Number(item.mrp || item.unit_price || 0) * (item.quantity || 1),
    0
  );
  const totalDiscount = Math.max(0, totalMRP - subtotal);
  return { subtotal, totalMRP, totalDiscount };
};

export default function OrderSummary({ language }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { addressId, buyNowProduct } = location.state || {};

  const [address, setAddress] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

        // 1. Fetch Address
        const addressRes = await fetch(`${API_BASE_URL}/api/addresses/${addressId}`, { headers });
        const addressData = await addressRes.json();

        if (addressData.success) {
          setAddress(addressData.address);
        } else {
          toast.error(t('error') || 'Failed to load address');
          setLoading(false);
          return; 
        }

        // 2. Fetch Products
        if (buyNowProduct) {
          const unitPrice = Number(buyNowProduct.price || buyNowProduct.unit_price || 0);
          const mrp = Number(buyNowProduct.mrp || unitPrice);
          const discount = calculateDiscountPercent(mrp, unitPrice, buyNowProduct.discount_percentage);

          setCartItems([{
            ...buyNowProduct,
            product_id: buyNowProduct.product_id || buyNowProduct.id, 
            product_name: buyNowProduct.product_name || buyNowProduct.name,
            unit_price: unitPrice,
            mrp: mrp,
            discount_percentage: discount,
            estimated_delivery: buyNowProduct.estimated_delivery || null,
            quantity: buyNowProduct.quantity || 1
          }]);
        } else {
          const cartRes = await fetch(`${API_BASE_URL}/api/orders/cart`, { headers });
          const cartData = await cartRes.json();

          if (cartData.success) {
            const rawItems = cartData.data || cartData.cart || [];
            const items = rawItems.map(item => {
              const unitPrice = Number(item.price || item.unit_price || 0);
              const mrp = Number(item.mrp || unitPrice);
              const discount = calculateDiscountPercent(mrp, unitPrice, item.discount_percentage);

              return {
                ...item,
                unit_price: unitPrice,
                mrp: mrp,
                discount_percentage: discount,
                estimated_delivery: item.estimated_delivery || null
              };
            });
            setCartItems(items);
          } else {
            toast.error(t('error') || 'Failed to load cart items');
          }
        }
      } catch (err) {
        toast.error('Network error while loading checkout data.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [addressId, buyNowProduct, navigate, language]);

  // Dynamic calculations via helper function
  const { subtotal, totalMRP, totalDiscount } = calculateTotals(cartItems);

  const handleContinueToPayment = () => {
    navigate('/payment', {
      state: { 
        addressId, 
        totalAmount: subtotal,
        buyNowProduct
      }
    });
  };

  const extractImage = (item) => {
    try {
      let rawData = item.images || item.image_url || item.image || item.thumbnail;
      if (!rawData) return '/placeholder.png';

      if (typeof rawData === 'string' && rawData.startsWith('[')) {
        rawData = JSON.parse(rawData);
      }

      let imageName = Array.isArray(rawData) ? rawData[0] : rawData;
      return getImageUrl(imageName);
    } catch (e) {
      console.error("[OrderSummary] Image extraction failed for:", item.product_name);
      return '/placeholder.png';
    }
  };

  if (loading) return <div className="loading-state">{t('loading')}</div>;

  return (
    <div className="summary-page">
      <div className="summary-header">
        {/* Redundant CART heading removed */}
        <div className="stepper-container" style={{ marginTop: '20px' }}>
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
                        alt={item.product_name || item.name} 
                        className="cart-item-img"
                        onError={(e) => { e.target.src = "/saare_1.jpeg"; }} 
                      />
                    </div>
                    <div className="cart-item-info">
                      <h4>{item.product_name || item.name}</h4>
                      <span className="cart-item-qty">Qty: {item.quantity || 1}</span>
                      
                      {/* Price, MRP, and Discount Percentage Row */}
                      <div className="item-pricing" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                        <span className="cart-item-price" style={{ fontWeight: 'bold', fontSize: '16px' }}>
                          {formatCurrency(Number(item.unit_price) * (item.quantity || 1))}
                        </span>
                        
                        {Number(item.mrp) > Number(item.unit_price) && (
                          <>
                            <span style={{ textDecoration: 'line-through', color: '#878787', fontSize: '13px' }}>
                              {formatCurrency(Number(item.mrp) * (item.quantity || 1))}
                            </span>
                            {item.discount_percentage > 0 && (
                              <span style={{ color: '#388e3c', fontSize: '13px', fontWeight: 'bold' }}>
                                ↓{item.discount_percentage}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Delivery Date Column */}
                      <div style={{ marginTop: '8px', fontSize: '13px', color: '#212121' }}>
                        Delivery by <strong style={{ fontWeight: '600' }}>{formatDeliveryDate(item.estimated_delivery)}</strong>
                      </div>
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
            
            {/* Price Row (MRP) */}
            <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span>Price ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
              <span>{formatCurrency(totalMRP)}</span>
            </div>
            
            {/* Discount Row */}
            {totalDiscount > 0 && (
              <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>Discount</span>
                <span style={{ color: '#388e3c' }}>− {formatCurrency(totalDiscount)}</span>
              </div>
            )}

            {/* Delivery Charge Row */}
            <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span>Delivery Charges</span>
              <span style={{ color: '#388e3c', fontWeight: '500' }}>Free</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed #e0e0e0', margin: '15px 0' }} />

            {/* Total Amount Row */}
            <div className="total-amount-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginBottom: '15px' }}>
              <span>Total Amount</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {/* Savings Badge */}
            {totalDiscount > 0 && (
              <p style={{ color: '#388e3c', fontSize: '14px', fontWeight: '500', marginBottom: '15px' }}>
                You will save {formatCurrency(totalDiscount)} on this order
              </p>
            )}

            <button
              onClick={handleContinueToPayment}
              disabled={cartItems.length === 0}
              className="continue-btn"
              style={{ width: '100%', padding: '14px', backgroundColor: '#8b1c31', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
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