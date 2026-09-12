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

  // 🧮 CALCULATE TOTALS FOR FINANCIAL SUMMARY
  let totalMrp = 0;
  let totalBasePrice = 0;

  order.items?.forEach(item => {
    const qty = item.quantity || 1;
    totalMrp += (Number(item.mrp) || Number(item.unit_price) || 0) * qty;
    totalBasePrice += (Number(item.dealer_base_price) || 0) * qty;
  });

  const totalSellingPrice = Number(order.financial_summary?.total_order_value) || 0;
  const totalDiscountAmt = totalMrp > totalSellingPrice ? (totalMrp - totalSellingPrice) : 0;

  return (
    <div className="order-detail-page">
      <div className="order-detail-container">
        
        {/* 1. HEADER SECTION */}
        <div className="od-header">
          <div className="od-header-left">
            <button className="od-back-btn" onClick={() => navigate('/admin/orders')}>
              ← Back to Orders
            </button>
            <div className="od-title-row">
              <h1>Order #{order.order_id}</h1>
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

        {/* 2. MAIN CONTENT GRID */}
        <div className="od-grid">
          
          {/* LEFT COLUMN: Items & Tracking */}
          <div className="od-main-content">
            
            {/* Products List */}
            <div className="od-card">
              <h2 className="od-card-title">📦 Ordered Products ({order.items?.length})</h2>
              <div className="od-items-list">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="od-item-row">
                    <img 
                      src={getImageUrl(item.image_url)} 
                      alt={item.product_name} 
                      className="od-item-img" 
                    />
                    <div className="od-item-info">
                      <h3>{item.product_name}</h3>
                      <p className="od-item-cat">{item.category_info?.category} - {item.category_info?.subcategory}</p>
                      
                      <div className="od-item-price-qty">
                        <span>Qty: <strong>{item.quantity}</strong></span>
                        <span>Selling Price: <strong>₹{Number(item.unit_price || item.price).toLocaleString('en-IN')}</strong>/pc</span>
                        <span className="od-item-total">Total: ₹{Number(item.financials?.total_item_price).toLocaleString('en-IN')}</span>
                      </div>

                      {/* Dealer Data inside Item */}
                      <div className="od-dealer-tag" style={{ marginTop: '10px' }}>
                        <span>🤝 Sourced from: <strong>{item.dealer_info?.name}</strong></span>
                        {item.dealer_info?.phone !== 'N/A' && <span>📞 {item.dealer_info?.phone}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking History */}
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

          {/* RIGHT COLUMN: Sidebar Info */}
          <div className="od-sidebar">
            
            {/* Customer & Address */}
            <div className="od-card">
              <h2 className="od-card-title">👤 Customer & Shipping</h2>
              <div className="od-info-block">
                <p><strong>Name:</strong> {order.shipping_address?.name}</p>
                <p><strong>Phone:</strong> {order.shipping_address?.phone}</p>
                <p><strong>Email:</strong> {order.fetched_user_email || order.email || 'N/A'}</p>
              </div>
              <hr className="od-divider" />
              <div className="od-info-block">
                <p><strong>Address:</strong></p>
                <p className="od-address-text">{order.shipping_address?.full_address}</p>
              </div>
            </div>

            {/* Payment Details */}
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
                  <p><strong>Order ID:</strong> {order.razorpay_order_id}</p>
                )}
                {order.payment_id && (
                  <p><strong>Transaction ID:</strong> {order.payment_id}</p>
                )}
              </div>
            </div>

            {/* FINANCIALS & PROFIT BREAKDOWN */}
            <div className="od-card od-profit-card">
              <h2 className="od-card-title">💰 Financial Summary</h2>
              <div className="od-financial-list">
                
                <div className="od-fin-row" style={{ color: '#64748b' }}>
                  <span>Total MRP:</span>
                  <span>₹{totalMrp.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="od-fin-row" style={{ color: '#16a34a' }}>
                  <span>Discount:</span>
                  <span>- ₹{totalDiscountAmt.toLocaleString('en-IN')}</span>
                </div>

                <div className="od-fin-row">
                  <span>Order Total (Paid):</span>
                  <span className="od-total-val">₹{totalSellingPrice.toLocaleString('en-IN')}</span>
                </div>
                
                <hr className="od-divider" />

                <div className="od-fin-row" style={{ color: '#ef4444' }}>
                  <span>Total Dealer Base Price:</span>
                  <span>₹{totalBasePrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="od-fin-row od-dealer-payout">
                  <span>Total Dealer Payout:</span>
                  <span>₹{Number(order.financial_summary?.total_dealer_payout).toLocaleString('en-IN')}</span>
                </div>
                
                <hr className="od-divider" />

                <div className="od-fin-row od-admin-profit">
                  <span>My Profit (Admin):</span>
                  <span>+ ₹{Number(order.financial_summary?.net_admin_profit).toLocaleString('en-IN')}</span>
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