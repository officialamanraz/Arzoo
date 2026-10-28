// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import { uiTranslations } from '../languages'; 
// import { getImageUrl } from '../getImageUrl';
// import './OrderSummary.css'; 

// const API_BASE_URL = import.meta.env.VITE_API_URL;

// export default function OrderSummary({ language }) {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const { addressId, buyNowProduct } = location.state || {};

//   const [address, setAddress] = useState(null);
//   const [cartItems, setCartItems] = useState([]);
//   const [pricing, setPricing] = useState({
//     total_mrp: 0,
//     total_discount: 0,
//     delivery_charge: 0,
//     subtotal: 0,
//     total_payable: 0
//   });
//   const [loading, setLoading] = useState(true);

//   const t = (key) => {
//     const currentLang = language || 'en';
//     return uiTranslations[currentLang]?.[key] || uiTranslations['en'][key] || key;
//   };

//   const formatDeliveryDate = (dateString) => {
//     try {
//       let date = dateString ? new Date(dateString) : null;
//       if (!date || isNaN(date.getTime())) {
//         date = new Date();
//         date.setDate(date.getDate() + 5);
//       }
//       return new Intl.DateTimeFormat('en-US', { 
//         weekday: 'short', 
//         month: 'short', 
//         day: 'numeric' 
//       }).format(date);
//     } catch (err) {
//       return 'Within 5 days';
//     }
//   };

//   useEffect(() => {
//     if (!addressId) {
//       navigate('/add-address');
//       return;
//     }

//     const fetchSummaryData = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const headers = { Authorization: `Bearer ${token}` };

//         let apiUrl = `${API_BASE_URL}/api/orders/summary?address_id=${addressId}`;
        
//         if (buyNowProduct) {
//           const pId = buyNowProduct.product_id || buyNowProduct.id;
//           const pQty = buyNowProduct.quantity || 1;
//           apiUrl += `&buy_now_product_id=${pId}&buy_now_qty=${pQty}`;
//         }

//         const res = await fetch(apiUrl, { headers });
//         const data = await res.json();

//         if (data.success && data.data) {
//           setAddress(data.data.address);
//           setCartItems(data.data.items || []);
//           if (data.data.pricing) {
//             setPricing(data.data.pricing);
//           }
//         } else {
//           toast.error(data.message || 'Failed to load order summary');
//         }
//       } catch (err) {
//         console.error('[ORDER_SUMMARY] Fetch error:', err);
//         toast.error('Network error loading summary.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSummaryData();
//   }, [addressId, buyNowProduct, navigate]);

//   const handleContinueToPayment = () => {
//     navigate('/payment', {
//       state: { 
//         addressId, 
//         totalAmount: pricing.total_payable || pricing.subtotal,
//         buyNowProduct
//       }
//     });
//   };

//   const extractImage = (item) => {
//     try {
//       let rawData = item.images || item.image_url || item.image || item.thumbnail;
//       if (!rawData) return '/saare_1.jpeg';

//       if (typeof rawData === 'string' && rawData.startsWith('[')) {
//         rawData = JSON.parse(rawData);
//       }

//       let imageName = Array.isArray(rawData) ? rawData[0] : rawData;
//       return getImageUrl(imageName);
//     } catch (e) {
//       return '/saare_1.jpeg';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="summary-loading-screen">
//         <div className="summary-spinner"></div>
//         <p className="summary-loading-text">Loading Order Summary...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="summary-page">
//       <div className="summary-header">
//         <div className="stepper-container">
//           <Step number={1} label="Address" completed />
//           <StepLine completed />
//           <Step number={2} label="Order Summary" active />
//           <StepLine />
//           <Step number={3} label="Payment" />
//         </div>
//       </div>

//       <div className="summary-content-wrapper">
//         <div className="summary-left-pane">

//           {address && (
//             <div className="summary-card">
//               <div className="card-header">
//                 <h3>DELIVER TO:</h3>
//                 <button onClick={() => navigate('/add-address')} className="change-btn">Change</button>
//               </div>
//               <div className="address-name-row">
//                 <strong>{address.full_name}</strong>
//                 <strong>{address.phone}</strong>
//               </div>
//               <p className="address-details">
//                 {address.house_no}, {address.road_area}, {address.landmark && `${address.landmark}, `}
//                 {address.city}, {address.state} - <strong>{address.pincode}</strong>
//               </p>
//             </div>
//           )}

//           <div className="summary-card no-padding">
//             {cartItems.length === 0 ? (
//               <p className="empty-cart-text">{t('cartEmpty')}</p>
//             ) : (
//               cartItems.map((item, index) => {
//                 const unitPrice = Number(item.unit_price || item.price || 0);
//                 const mrp = Number(item.mrp || 0);
//                 const hasDiscount = mrp > unitPrice;

//                 return (
//                   <div key={item.product_id || index} className={`cart-item-row ${index !== cartItems.length - 1 ? 'border-bottom' : ''}`}>
//                     <div className="cart-item-details">
                      
//                       <div className="cart-item-img-container">
//                         <img 
//                           src={extractImage(item)} 
//                           alt={item.product_name || item.name} 
//                           className="cart-item-img"
//                           onError={(e) => { e.target.src = "/saare_1.jpeg"; }} 
//                         />
//                       </div>

//                       <div className="cart-item-info">
//                         <h4>{item.product_name || item.name}</h4>
//                         <span className="cart-item-qty">Qty: {item.quantity || 1}</span>
                        
//                         <div className="item-pricing-row">
//                           <span className="cart-item-final-price">
//                             ₹{(unitPrice * (item.quantity || 1)).toLocaleString('en-IN')}
//                           </span>
                          
//                           {hasDiscount && (
//                             <>
//                               <span className="cart-item-mrp">
//                                 ₹{(mrp * (item.quantity || 1)).toLocaleString('en-IN')}
//                               </span>
//                               <span className="cart-item-discount-tag">
//                                 {item.discount_percentage}% OFF
//                               </span>
//                             </>
//                           )}
//                         </div>

//                         <div className="cart-item-delivery">
//                           Delivery by <strong>{formatDeliveryDate(item.estimated_delivery)}</strong>
//                         </div>
//                       </div>

//                     </div>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         <div className="summary-right-pane">
//           <div className="summary-card">
//             <h3 className="price-details-header">PRICE DETAILS</h3>
            
//             <div className="price-row">
//               <span>Price ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
//               <span>₹{Number(pricing.total_mrp).toLocaleString('en-IN')}</span>
//             </div>
            
//             {pricing.total_discount > 0 && (
//               <div className="price-row">
//                 <span>Discount</span>
//                 <span style={{ color: '#388e3c' }}>− ₹{Number(pricing.total_discount).toLocaleString('en-IN')}</span>
//               </div>
//             )}

//             <div className="price-row">
//               <span>Delivery Charges</span>
//               <span style={{ color: '#388e3c', fontWeight: '600' }}>
//                 {pricing.delivery_charge === 0 ? 'Free' : `₹${pricing.delivery_charge}`}
//               </span>
//             </div>

//             <div className="total-amount-row">
//               <span>Total Amount</span>
//               <span>₹{Number(pricing.total_payable).toLocaleString('en-IN')}</span>
//             </div>

//             {pricing.total_discount > 0 && (
//               <p style={{ color: '#388e3c', fontSize: '13px', fontWeight: '500', marginBottom: '15px' }}>
//                 You will save ₹{Number(pricing.total_discount).toLocaleString('en-IN')} on this order
//               </p>
//             )}

//             <button
//               onClick={handleContinueToPayment}
//               disabled={cartItems.length === 0}
//               className="continue-btn"
//             >
//               CONTINUE TO PAYMENT
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Step({ number, label, active, completed }) {
//   return (
//     <div className="step-wrapper">
//       <div className={`step-circle ${active || completed ? 'active' : ''}`}>
//         {completed ? '✓' : number}
//       </div>
//       <span className={`step-label ${active || completed ? 'active-text' : ''} ${active ? 'bold-text' : ''}`}>
//         {label}
//       </span>
//     </div>
//   );
// }

// function StepLine({ completed }) {
//   return <div className={`step-line ${completed ? 'completed-line' : ''}`} />;
// }

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uiTranslations } from '../languages'; 
import { getImageUrl } from '../getImageUrl';
import './OrderSummary.css'; 

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Values the screen needs, kept here instead of typed inside the markup
const ROUTES = { address: '/add-address', payment: '/payment' };
const SUMMARY_ENDPOINT = '/api/orders/summary';
const FALLBACK_IMAGE = '/saare_1.jpeg';
const SUCCESS_COLOR = '#388e3c';
const MAX_FRACTION_DIGITS = 2;
const DEFAULT_QUANTITY = 1;

// Used only when the backend does not send "meta" (the backend sends the real values from the database side)
const DEFAULT_META = { currency_code: 'INR', locale: 'en-IN', delivery_min_days: 5, delivery_days: 5 };
const DEFAULT_PRICING = { total_mrp: 0, total_discount: 0, delivery_charge: 0, subtotal: 0, total_payable: 0 };

const CHECKOUT_STEPS = [
  { key: 'address', labelKey: 'os_stepAddress' },
  { key: 'summary', labelKey: 'os_stepOrderSummary' },
  { key: 'payment', labelKey: 'os_stepPayment' }
];
const CURRENT_STEP_KEY = 'summary';

// English texts. If ../languages has the same key for the selected language, that is used instead.
const DEFAULT_LABELS = {
  os_stepAddress: 'Address',
  os_stepOrderSummary: 'Order Summary',
  os_stepPayment: 'Payment',
  os_loading: 'Loading Order Summary...',
  os_deliverTo: 'DELIVER TO:',
  os_change: 'Change',
  os_noAddress: 'No delivery address selected.',
  cartEmpty: 'Your cart is empty.',
  os_qty: 'Qty',
  os_percentOff: '{percent}% OFF',
  os_deliveryBy: 'Delivery by',
  os_priceDetails: 'PRICE DETAILS',
  os_price: 'Price',
  os_itemSingular: 'item',
  os_itemPlural: 'items',
  os_discount: 'Discount',
  os_deliveryCharges: 'Delivery Charges',
  os_free: 'Free',
  os_totalAmount: 'Total Amount',
  os_saveNote: 'You will save {amount} on this order',
  os_continue: 'CONTINUE TO PAYMENT',
  os_loadFailed: 'Failed to load order summary',
  os_networkError: 'Network error loading summary.',
  os_withinDays: 'Within {days} days'
};

const fillTemplate = (template, values) =>
  Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, value), template);

export default function OrderSummary({ language }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { addressId, buyNowProduct } = location.state || {};

  const [address, setAddress] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [loading, setLoading] = useState(true);

  const t = (key) => {
    const currentLang = language || 'en';
    return uiTranslations?.[currentLang]?.[key] || uiTranslations?.en?.[key] || DEFAULT_LABELS[key] || key;
  };

  // Money text follows the currency + locale sent by the backend, e.g. INR / en-IN -> "₹27,906"
  const formatMoney = useMemo(() => {
    try {
      const formatter = new Intl.NumberFormat(meta.locale, {
        style: 'currency',
        currency: meta.currency_code,
        minimumFractionDigits: 0,
        maximumFractionDigits: MAX_FRACTION_DIGITS
      });
      return (amount) => formatter.format(Number(amount) || 0);
    } catch (err) {
      return (amount) => `${meta.currency_code} ${Number(amount) || 0}`;
    }
  }, [meta.locale, meta.currency_code]);

  const formatDeliveryDate = (dateString, fallbackDays) => {
    try {
      let date = dateString ? new Date(dateString) : null;
      if (!date || isNaN(date.getTime())) {
        date = new Date();
        date.setDate(date.getDate() + fallbackDays);
      }
      return new Intl.DateTimeFormat(meta.locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (err) {
      return fillTemplate(t('os_withinDays'), { days: fallbackDays });
    }
  };

  // "Tue, Nov 3 - Fri, Nov 6" for the customer's state (min and max days come from shipping_zones)
  const formatDeliveryRange = (item) => {
    const latest = formatDeliveryDate(item.estimated_delivery, meta.delivery_days);
    const earliest = formatDeliveryDate(item.estimated_delivery_min, meta.delivery_min_days);
    return earliest === latest ? latest : `${earliest} - ${latest}`;
  };

  useEffect(() => {
    if (!addressId) {
      navigate(ROUTES.address, { state: { buyNowProduct } });
      return;
    }

    const fetchSummaryData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        let apiUrl = `${API_BASE_URL}${SUMMARY_ENDPOINT}?address_id=${addressId}`;

        if (buyNowProduct) {
          const pId = buyNowProduct.product_id || buyNowProduct.id;
          const pQty = buyNowProduct.quantity || DEFAULT_QUANTITY;
          apiUrl += `&buy_now_product_id=${pId}&buy_now_qty=${pQty}`;
        }

        const res = await fetch(apiUrl, { headers });
        const data = await res.json();

        if (data.success && data.data) {
          setAddress(data.data.address || null);
          setCartItems(data.data.items || []);
          if (data.data.pricing) {
            setPricing({ ...DEFAULT_PRICING, ...data.data.pricing });
          }
          if (data.data.meta) {
            setMeta({ ...DEFAULT_META, ...data.data.meta });
          }
        } else {
          toast.error(data.message || t('os_loadFailed'));
        }
      } catch (err) {
        console.error('[ORDER_SUMMARY] Fetch error:', err);
        toast.error(t('os_networkError'));
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [addressId, buyNowProduct, navigate]);

  const handleContinueToPayment = () => {
    navigate(ROUTES.payment, {
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
      if (!rawData) return FALLBACK_IMAGE;

      if (typeof rawData === 'string' && rawData.startsWith('[')) {
        rawData = JSON.parse(rawData);
      }

      let imageName = Array.isArray(rawData) ? rawData[0] : rawData;
      return getImageUrl(imageName) || FALLBACK_IMAGE;
    } catch (e) {
      return FALLBACK_IMAGE;
    }
  };

  // "House 40, Main Road, Kota" - empty parts are skipped, so no stray commas
  const buildAddressLine = (addr) =>
    [addr.house_no, addr.road_area, addr.landmark, addr.city, addr.state].filter(Boolean).join(', ');

  if (loading) {
    return (
      <div className="summary-loading-screen">
        <div className="summary-spinner"></div>
        <p className="summary-loading-text">{t('os_loading')}</p>
      </div>
    );
  }

  return (
    <div className="summary-page">
      <div className="summary-header">
        <div className="stepper-container">
          {CHECKOUT_STEPS.map((step, index) => {
            const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.key === CURRENT_STEP_KEY);
            return (
              <React.Fragment key={step.key}>
                {index > 0 && <StepLine completed={index <= currentIndex} />}
                <Step
                  number={index + 1}
                  label={t(step.labelKey)}
                  completed={index < currentIndex}
                  active={index === currentIndex}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="summary-content-wrapper">
        <div className="summary-left-pane">

          <div className="summary-card">
            <div className="card-header">
              <h3>{t('os_deliverTo')}</h3>
              <button onClick={() => navigate(ROUTES.address, { state: { buyNowProduct } })} className="change-btn">{t('os_change')}</button>
            </div>
            {address ? (
              <>
                <div className="address-name-row">
                  <strong>{address.full_name}</strong>
                  <strong>{address.phone}</strong>
                </div>
                <p className="address-details">
                  {buildAddressLine(address)}
                  {address.pincode && <> - <strong>{address.pincode}</strong></>}
                </p>
              </>
            ) : (
              <p className="address-details">{t('os_noAddress')}</p>
            )}
          </div>

          <div className="summary-card no-padding">
            {cartItems.length === 0 ? (
              <p className="empty-cart-text">{t('cartEmpty')}</p>
            ) : (
              cartItems.map((item, index) => {
                const quantity = Number(item.quantity) || DEFAULT_QUANTITY;
                const unitPrice = Number(item.unit_price || item.price || 0);
                const mrp = Number(item.mrp || 0);
                const hasDiscount = mrp > unitPrice;

                return (
                  <div key={item.cart_id ?? item.product_id ?? index} className={`cart-item-row ${index !== cartItems.length - 1 ? 'border-bottom' : ''}`}>
                    <div className="cart-item-details">
                      
                      <div className="cart-item-img-container">
                        <img 
                          src={extractImage(item)} 
                          alt={item.product_name || item.name} 
                          className="cart-item-img"
                          onError={(e) => { e.target.src = FALLBACK_IMAGE; }} 
                        />
                      </div>

                      <div className="cart-item-info">
                        <h4>{item.product_name || item.name}</h4>
                        <span className="cart-item-qty">{t('os_qty')}: {quantity}</span>
                        
                        <div className="item-pricing-row">
                          <span className="cart-item-final-price">
                            {formatMoney(unitPrice * quantity)}
                          </span>
                          
                          {hasDiscount && (
                            <>
                              <span className="cart-item-mrp">
                                {formatMoney(mrp * quantity)}
                              </span>
                              <span className="cart-item-discount-tag">
                                {fillTemplate(t('os_percentOff'), { percent: item.discount_percentage })}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="cart-item-delivery">
                          {t('os_deliveryBy')} <strong>{formatDeliveryRange(item)}</strong>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="summary-right-pane">
          <div className="summary-card">
            <h3 className="price-details-header">{t('os_priceDetails')}</h3>
            
            <div className="price-row">
              <span>{t('os_price')} ({cartItems.length} {cartItems.length === 1 ? t('os_itemSingular') : t('os_itemPlural')})</span>
              <span>{formatMoney(pricing.total_mrp)}</span>
            </div>
            
            {pricing.total_discount > 0 && (
              <div className="price-row">
                <span>{t('os_discount')}</span>
                <span style={{ color: SUCCESS_COLOR }}>− {formatMoney(pricing.total_discount)}</span>
              </div>
            )}

            <div className="price-row">
              <span>{t('os_deliveryCharges')}</span>
              <span style={{ color: SUCCESS_COLOR, fontWeight: '600' }}>
                {Number(pricing.delivery_charge) === 0 ? t('os_free') : formatMoney(pricing.delivery_charge)}
              </span>
            </div>

            <div className="total-amount-row">
              <span>{t('os_totalAmount')}</span>
              <span>{formatMoney(pricing.total_payable)}</span>
            </div>

            {pricing.total_discount > 0 && (
              <p style={{ color: SUCCESS_COLOR, fontSize: '13px', fontWeight: '500', marginBottom: '15px' }}>
                {fillTemplate(t('os_saveNote'), { amount: formatMoney(pricing.total_discount) })}
              </p>
            )}

            <button
              onClick={handleContinueToPayment}
              disabled={cartItems.length === 0 || !address}
              className="continue-btn"
            >
              {t('os_continue')}
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