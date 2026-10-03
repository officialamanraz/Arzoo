import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uiTranslations } from '../languages'; 
import { getImageUrl } from '../getImageUrl';
import './OrderSummary.css'; 

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function OrderSummary({ language }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { addressId, buyNowProduct } = location.state || {};

  const [address, setAddress] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [pricing, setPricing] = useState({
    total_mrp: 0,
    total_discount: 0,
    delivery_charge: 0,
    subtotal: 0,
    total_payable: 0
  });
  const [loading, setLoading] = useState(true);

  const t = (key) => {
    const currentLang = language || 'en';
    return uiTranslations[currentLang]?.[key] || uiTranslations['en'][key] || key;
  };

  const formatDeliveryDate = (dateString) => {
    try {
      let date = dateString ? new Date(dateString) : null;
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
      return 'Within 5 days';
    }
  };

  useEffect(() => {
    if (!addressId) {
      navigate('/add-address');
      return;
    }

    const fetchSummaryData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Agar Direct Buy Now se aaye hain
        if (buyNowProduct) {
          // Address fetch alag se address table se
          const addrRes = await fetch(`${API_BASE_URL}/api/addresses/${addressId}`, { headers });
          const addrData = await addrRes.json();
          if (addrData.success) {
            setAddress(addrData.address);
          }

          const unitPrice = Number(buyNowProduct.price || buyNowProduct.unit_price || 0);
          const mrp = Number(buyNowProduct.mrp && buyNowProduct.mrp > unitPrice ? buyNowProduct.mrp : Math.round(unitPrice * 1.4));
          const discountPercent = buyNowProduct.discount_percentage || Math.round(((mrp - unitPrice) / mrp) * 100);
          const qty = Number(buyNowProduct.quantity || 1);

          const buyItem = {
            ...buyNowProduct,
            product_id: buyNowProduct.product_id || buyNowProduct.id,
            product_name: buyNowProduct.product_name || buyNowProduct.name,
            unit_price: unitPrice,
            mrp: mrp,
            discount_percentage: discountPercent,
            estimated_delivery: buyNowProduct.estimated_delivery || null,
            quantity: qty
          };

          setCartItems([buyItem]);
          
          const sub = unitPrice * qty;
          const totMrp = mrp * qty;
          setPricing({
            total_mrp: totMrp,
            total_discount: Math.max(0, totMrp - sub),
            delivery_charge: 0,
            subtotal: sub,
            total_payable: sub
          });
        } 
        // 2. Normal Cart Checkout: CALLING THE NEW SUMMARY API
        else {
          const res = await fetch(`${API_BASE_URL}/api/orders/summary?address_id=${addressId}`, { headers });
          const data = await res.json();

          if (data.success && data.data) {
            setAddress(data.data.address);
            setCartItems(data.data.items || []);
            if (data.data.pricing) {
              setPricing(data.data.pricing);
            }
          } else {
            toast.error(data.message || 'Failed to load order summary');
          }
        }
      } catch (err) {
        console.error('[ORDER_SUMMARY] Fetch error:', err);
        toast.error('Network error loading summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [addressId, buyNowProduct, navigate]);

  const handleContinueToPayment = () => {
    navigate('/payment', {
      state: { 
        addressId, 
        totalAmount: pricing.total_payable || pricing.subtotal,
        buyNowProduct
      }
    });
  };

  const extractImage = (item) => {
    try {
      let rawData = item.images || item.image_url || item.image || item.thumbnail;
      if (!rawData) return '/saare_1.jpeg';

      if (typeof rawData === 'string' && rawData.startsWith('[')) {
        rawData = JSON.parse(rawData);
      }

      let imageName = Array.isArray(rawData) ? rawData[0] : rawData;
      return getImageUrl(imageName);
    } catch (e) {
      return '/saare_1.jpeg';
    }
  };

  if (loading) return <div className="loading-state">{t('loading')}</div>;

  return (
    <div className="summary-page">
      <div className="summary-header">
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

          {/* Delivery Address Card */}
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

          {/* Products List Card */}
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
                      
                      {/* Price, MRP, and Discount Percentage */}
                      <div className="item-pricing-row">
                        <span className="cart-item-final-price">
                          ₹{(Number(item.unit_price) * (item.quantity || 1)).toLocaleString('en-IN')}
                        </span>
                        
                        {Number(item.mrp) > Number(item.unit_price) && (
                          <>
                            <span className="cart-item-mrp">
                              ₹{(Number(item.mrp) * (item.quantity || 1)).toLocaleString('en-IN')}
                            </span>
                            <span className="cart-item-discount-tag">
                              {item.discount_percentage}% OFF
                            </span>
                          </>
                        )}
                      </div>

                      {/* Delivery Date */}
                      <div className="cart-item-delivery">
                        Delivery by <strong>{formatDeliveryDate(item.estimated_delivery)}</strong>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane Price Summary */}
        <div className="summary-right-pane">
          <div className="summary-card">
            <h3 className="price-details-header">PRICE DETAILS</h3>
            
            <div className="price-row">
              <span>Price ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
              <span>₹{Number(pricing.total_mrp).toLocaleString('en-IN')}</span>
            </div>
            
            {pricing.total_discount > 0 && (
              <div className="price-row">
                <span>Discount</span>
                <span style={{ color: '#388e3c' }}>− ₹{Number(pricing.total_discount).toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="price-row">
              <span>Delivery Charges</span>
              <span style={{ color: '#388e3c', fontWeight: '600' }}>
                {pricing.delivery_charge === 0 ? 'Free' : `₹${pricing.delivery_charge}`}
              </span>
            </div>

            <div className="total-amount-row">
              <span>Total Amount</span>
              <span>₹{Number(pricing.total_payable).toLocaleString('en-IN')}</span>
            </div>

            {pricing.total_discount > 0 && (
              <p style={{ color: '#388e3c', fontSize: '13px', fontWeight: '500', marginBottom: '15px' }}>
                You will save ₹{Number(pricing.total_discount).toLocaleString('en-IN')} on this order
              </p>
            )}

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