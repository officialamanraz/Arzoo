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

  // Aggregate Calculation Variables across all ordered items
  let totalMrp = 0;
  let totalBasePrice = 0;
  let totalPackagingCost = 0;
  let totalRazorpayFee = 0;
  let totalNetProfitAfterCuts = 0;
  let totalAdminProfitShare = 0;
  let totalDealerProfitShare = 0;
  let totalFinalDealerPayout = 0;

  order.items?.forEach(item => {
    const qty = Number(item.quantity) || 1;
    const itemMrp = Number(item.mrp) || Number(item.unit_price) || 0;
    const itemSellingTotal = Number(item.unit_price || item.price || 0) * qty;
    const itemBaseTotal = Number(item.dealer_base_price || 0) * qty;
    const itemPackagingTotal = Number(item.packaging_cost || 0) * qty;
    
    // Razorpay 2.4% cut calculation
    const itemRazorpayFee = Number(item.financials?.razorpay_fee_cut) || (itemSellingTotal * 0.024);
    
    // Net profit after all cuts
    const netProfit = Number(item.financials?.net_remaining_profit) || 
      (itemSellingTotal - (itemRazorpayFee + itemPackagingTotal + itemBaseTotal));
    
    const profitShare = netProfit > 0 ? (netProfit / 2) : 0;
    const dealerTotalPayout = itemBaseTotal + profitShare;

    totalMrp += itemMrp * qty;
    totalBasePrice += itemBaseTotal;
    totalPackagingCost += itemPackagingTotal;
    totalRazorpayFee += itemRazorpayFee;
    totalNetProfitAfterCuts += netProfit;
    totalAdminProfitShare += profitShare;
    totalDealerProfitShare += profitShare;
    totalFinalDealerPayout += dealerTotalPayout;
  });

  const totalSellingPrice = Number(order.financial_summary?.total_order_value) || 0;
  const totalDiscountAmt = totalMrp > totalSellingPrice ? (totalMrp - totalSellingPrice) : 0;

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

                  // Item Math values
                  const qty = Number(item.quantity) || 1;
                  const sp = Number(item.financials?.selling_price) || (Number(item.unit_price || item.price || 0) * qty);
                  const base = Number(item.financials?.dealer_base_price) || (Number(item.dealer_base_price || 0) * qty);
                  const pack = Number(item.financials?.packaging_cut) || (Number(item.packaging_cost || 0) * qty);
                  const rzpFee = Number(item.financials?.razorpay_fee_cut) || (sp * 0.024);
                  const netProf = Number(item.financials?.net_remaining_profit) || (sp - (rzpFee + pack + base));
                  const admProf50 = Number(item.financials?.admin_profit_50) || (netProf > 0 ? netProf / 2 : 0);
                  const dlrProf50 = Number(item.financials?.dealer_profit_50) || (netProf > 0 ? netProf / 2 : 0);
                  const finalDlrPayout = Number(item.financials?.dealer_payout) || (base + dlrProf50);

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
                          <span>Qty: <strong>{qty}</strong></span>
                          <span>Selling Price: <strong>₹{Number(item.unit_price || item.price || 0).toLocaleString('en-IN')}</strong>/pc</span>
                          <span className="od-item-total">Total: ₹{sp.toLocaleString('en-IN')}</span>
                        </div>

                        {/* DETAILED PER-ITEM FINANCIAL BREAKDOWN */}
                        <div style={{
                          marginTop: '10px',
                          padding: '10px 14px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '13px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '8px 12px'
                        }}>
                          <div><span style={{ color: '#64748b' }}>Selling Price:</span> <strong style={{ color: '#0f172a' }}>₹{sp.toFixed(2)}</strong></div>
                          <div><span style={{ color: '#dc2626' }}>Razorpay (2.4%):</span> <strong>-₹{rzpFee.toFixed(2)}</strong></div>
                          <div><span style={{ color: '#d97706' }}>Packaging Cost:</span> <strong>-₹{pack.toFixed(2)}</strong></div>
                          <div><span style={{ color: '#475569' }}>Dealer Base:</span> <strong>-₹{base.toFixed(2)}</strong></div>
                          <div><span style={{ color: '#0284c7' }}>Remaining Profit:</span> <strong>₹{netProf.toFixed(2)}</strong></div>
                          <div><span style={{ color: '#16a34a' }}>Dealer 50% Profit:</span> <strong>+₹{dlrProf50.toFixed(2)}</strong></div>
                          <div><span style={{ color: '#15803d' }}>Admin 50% Profit:</span> <strong>+₹{admProf50.toFixed(2)}</strong></div>
                          <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginTop: '2px' }}>
                            <span style={{ color: '#0f172a' }}>Total Dealer Payout (Base + 50%):</span> <strong style={{ color: '#2563eb' }}>₹{finalDlrPayout.toFixed(2)}</strong>
                          </div>
                        </div>

                        <div className="od-dealer-tag" style={{ marginTop: '10px' }}>
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
                  <span>Order Total (Collected):</span>
                  <span className="od-total-val">₹{totalSellingPrice.toLocaleString('en-IN')}</span>
                </div>
                
                <hr className="od-divider" />

                <div className="od-fin-row" style={{ color: '#dc2626' }}>
                  <span>Razorpay Fee Cut (2.4%):</span>
                  <span>- ₹{totalRazorpayFee.toFixed(2)}</span>
                </div>

                <div className="od-fin-row" style={{ color: '#d97706' }}>
                  <span>Total Packaging Cost:</span>
                  <span>- ₹{totalPackagingCost.toFixed(2)}</span>
                </div>

                <div className="od-fin-row od-fin-base">
                  <span>Total Dealer Base Price:</span>
                  <span>- ₹{totalBasePrice.toFixed(2)}</span>
                </div>

                <div className="od-fin-row" style={{ color: '#0284c7', fontWeight: 600 }}>
                  <span>Net Pool for 50/50 Split:</span>
                  <span>₹{totalNetProfitAfterCuts.toFixed(2)}</span>
                </div>

                <hr className="od-divider" />

                <div className="od-fin-row od-dealer-payout">
                  <span>Total Dealer Payout (Base + 50%):</span>
                  <span style={{ fontWeight: 700, color: '#2563eb' }}>₹{totalFinalDealerPayout.toFixed(2)}</span>
                </div>

                <div className="od-fin-row od-admin-profit">
                  <span>Net Admin Profit (50%):</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>+ ₹{totalAdminProfitShare.toFixed(2)}</span>
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