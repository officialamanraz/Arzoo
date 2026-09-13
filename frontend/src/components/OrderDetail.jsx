import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../getImageUrl';
import './OrderDetail.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const statusConfig = {
  pending:    { label: 'Pending',    bg: '#fff3cd', text: '#856404' },
  processing: { label: 'Processing', bg: '#e0ecff', text: '#1d4ed8' },
  shipped:    { label: 'Shipped',    bg: '#e0f2fe', text: '#0369a1' },
  delivered:  { label: 'Delivered',  bg: '#dcfce7', text: '#15803d' },
  cancelled:  { label: 'Cancelled',  bg: '#fee2e2', text: '#b91c1c' }
};

const statusOrder = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function AdminOrderDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndices, setActiveImageIndices] = useState({});

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders/admin/order/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      
      if (res.success) {
        setOrder(res.data);
      } else {
        alert('Failed to fetch order details');
        navigate('/admin/orders');
      }
    } catch (err) {
      console.error('[ADMIN_ORDER_DETAIL] ❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }) 
      });
      
      const res = await response.json();
      if (res.success) {
        setOrder({ ...order, status: newStatus });
        alert('Status Updated Successfully! ✅');
      } else {
        alert(`Failed to update status: ${res.message}`);
      }
    } catch (err) {
      alert('Server Error occurred while updating status.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-loading-full">
        <div className="spinner"></div>
        <p>Loading Deep Order Details...</p>
      </div>
    );
  }

  if (!order) return null;

  const currentStatusConfig = statusConfig[order.status] || statusConfig.pending;

  let totalMrp = 0;
  let totalBasePrice = 0;

  order.items?.forEach(item => {
    const qty = Number(item.quantity) || 1;
    const itemMrp = Number(item.mrp) || Number(item.unit_price) || 0;
    const itemBase = Number(item.dealer_base_price) || 0;
    totalMrp += itemMrp * qty;
    totalBasePrice += itemBase * qty;
  });

  const totalSellingPrice = Number(order.financial_summary?.total_order_value) || 0;
  const totalDiscountAmt = totalMrp > totalSellingPrice ? (totalMrp - totalSellingPrice) : 0;
  const totalDealerPayout = Number(order.financial_summary?.total_dealer_payout) || 0;
  const netAdminProfit = Number(order.financial_summary?.net_admin_profit) || (totalSellingPrice - totalDealerPayout);

  return (
    <div className="order-detail-page">
      <div className="order-detail-container">
        
        {/* HEADER SECTION */}
        <div className="od-header">
          <div className="od-header-left">
            <button className="od-back-btn" onClick={() => navigate('/admin/orders')}>
              ← Back to Orders
            </button>
            <div className="od-title-row">
              <h1 className="od-main-heading">Order #{order.order_id}</h1>
              <span 
                className="od-status-badge"
                style={{ backgroundColor: currentStatusConfig.bg, color: currentStatusConfig.text }}
              >
                {currentStatusConfig.label}
              </span>
            </div>
            <p className="od-date">Placed on: {formatDate(order.ordered_at)}</p>
          </div>
          
          <div className="od-header-right">
             <select
               value={order.status}
               onChange={(e) => handleStatusChange(e.target.value)}
               className="od-status-dropdown"
             >
               {statusOrder.map((s) => (
                 <option key={s} value={s}>{statusConfig[s].label}</option>
               ))}
             </select>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="od-grid">
          
          {/* LEFT COLUMN */}
          <div className="od-main-content">
            
            <div className="od-card">
              <h2 className="od-card-title">📦 Ordered Products ({order.items?.length || 0})</h2>
              <div className="od-items-list">
                {order.items?.map((item, idx) => {
                  const itemImages = item.images && Array.isArray(item.images) && item.images.length > 0 
                    ? item.images 
                    : [item.image_url || "/saare_1.jpeg"];
                  
                  const activeIdx = activeImageIndices[idx] || 0;
                  const currentImg = itemImages[activeIdx] || "/saare_1.jpeg";

                  return (
                    <div key={idx} className="od-item-row">
                      
                      <div className="od-item-gallery-wrapper">
                        <div className="od-main-img-box">
                          <img 
                            src={getImageUrl(currentImg)} 
                            alt={item.product_name} 
                            className="od-item-main-img" 
                            onError={(e) => { e.currentTarget.src = '/saare_1.jpeg'; }}
                          />
                        </div>
                        {itemImages.length > 1 && (
                          <div className="od-thumbnail-row">
                            {itemImages.map((img, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={getImageUrl(img)}
                                alt={`Thumb ${imgIdx + 1}`}
                                className={`od-thumbnail ${activeIdx === imgIdx ? 'active-thumb' : ''}`}
                                onClick={() => setActiveImageIndices({ ...activeImageIndices, [idx]: imgIdx })}
                                onError={(e) => { e.currentTarget.src = '/saare_1.jpeg'; }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="od-item-info">
                        <h3 className="od-product-name">{item.product_name}</h3>
                        <p className="od-item-cat">
                          {item.category_info?.category || 'General'} {item.category_info?.subcategory ? `- ${item.category_info.subcategory}` : ''}
                        </p>
                        
                        <div className="od-item-price-qty">
                          <span>Qty: <strong>{item.quantity}</strong></span>
                          <span>Selling Price: <strong>₹{Number(item.unit_price || item.price || 0).toLocaleString('en-IN')}</strong>/pc</span>
                          <span className="od-item-total">Total: ₹{Number(item.financials?.total_item_price || (item.unit_price * item.quantity)).toLocaleString('en-IN')}</span>
                        </div>

                        <div className="od-dealer-tag">
                          <span>🤝 Sourced from: <strong>{item.dealer_info?.name || 'Direct / Warehouse'}</strong></span>
                          {item.dealer_info?.phone && item.dealer_info?.phone !== 'N/A' && <span>📞 {item.dealer_info.phone}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {order.tracking_history && order.tracking_history.length > 0 && (
              <div className="od-card">
                <h2 className="od-card-title">🚚 Tracking History</h2>
                <div className="od-timeline">
                  {order.tracking_history.map((track, i) => (
                    <div key={i} className="od-timeline-item">
                      <div className="od-timeline-dot"></div>
                      <div className="od-timeline-content">
                        <strong>{track.status}</strong>
                        <p>{track.status_message}</p>
                        <span className="od-time">{formatDate(track.updated_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="od-sidebar">
            
            <div className="od-card">
              <h2 className="od-card-title">👤 Customer & Shipping</h2>
              <div className="od-info-block">
                <p><strong>Name:</strong> {order.shipping_address?.name || 'N/A'}</p>
                <p><strong>Phone:</strong> {order.shipping_address?.phone || 'N/A'}</p>
                <p><strong>Email:</strong> {order.fetched_user_email || order.email || 'N/A'}</p>
              </div>
              <hr className="od-divider" />
              <div className="od-info-block">
                <p><strong>Delivery Address:</strong></p>
                <p className="od-address-text">{order.shipping_address?.full_address || 'No address provided'}</p>
              </div>
            </div>

            <div className="od-card">
              <h2 className="od-card-title">💳 Payment Details</h2>
              <div className="od-info-block">
                <p>
                  <strong>Status:</strong>{' '}
                  {order.payment_status === 'paid' || order.payment_status === 'success' ? (
                    <span className="od-badge-success">Paid ✅</span>
                  ) : (
                    <span className="od-badge-danger">Unpaid / COD ❌</span>
                  )}
                </p>
                {order.razorpay_order_id && (
                  <p><strong>Razorpay ID:</strong> {order.razorpay_order_id}</p>
                )}
                {order.payment_id && (
                  <p><strong>Transaction ID:</strong> {order.payment_id}</p>
                )}
              </div>
            </div>

            <div className="od-card od-profit-card">
              <h2 className="od-card-title">💰 Financial Summary</h2>
              <div className="od-financial-list">
                
                <div className="od-fin-row od-fin-muted">
                  <span>Total MRP:</span>
                  <span>₹{totalMrp.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="od-fin-row od-fin-discount">
                  <span>Total Discount:</span>
                  <span>- ₹{totalDiscountAmt.toLocaleString('en-IN')}</span>
                </div>

                <div className="od-fin-row">
                  <span>Order Total (Paid):</span>
                  <span className="od-total-val">₹{totalSellingPrice.toLocaleString('en-IN')}</span>
                </div>
                
                <hr className="od-divider" />

                <div className="od-fin-row od-fin-base">
                  <span>Total Dealer Base Price:</span>
                  <span>₹{totalBasePrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="od-fin-row od-dealer-payout">
                  <span>Total Dealer Payout:</span>
                  <span>₹{totalDealerPayout.toLocaleString('en-IN')}</span>
                </div>
                
                <hr className="od-divider" />

                <div className="od-fin-row od-admin-profit">
                  <span>Net Admin Profit:</span>
                  <span>+ ₹{netAdminProfit.toLocaleString('en-IN')}</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminOrderDetail;