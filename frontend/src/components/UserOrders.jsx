import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { getImageUrl } from '../getImageUrl';
import './UserOrders.css';
import ReviewModal from './ReviewModal'; // 🌟 Importing our new Flipkart-style Review Modal

const API_BASE_URL = import.meta.env.VITE_API_URL;

const STATUS_META = {
  pending: { label: 'Pending', className: 'status-pending', icon: '⏳' },
  processing: { label: 'Processing', className: 'status-processing', icon: '⚙️' },
  shipped: { label: 'Shipped', className: 'status-shipped', icon: '📦' },
  delivered: { label: 'Delivered', className: 'status-delivered', icon: '✅' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled', icon: '❌' }
};

function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 🔍 Flipkart-Style Image Zoom Lightbox State
  const [zoomModal, setZoomModal] = useState({ isOpen: false, imgUrl: '', name: '', productId: null });
  const [zoomScale, setZoomScale] = useState(1);
  
  // 🌟 Clean State for the New Review Modal
  const [reviewProductId, setReviewProductId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      console.log('[USER_ORDERS] 📡 Fetching user orders...');
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const res = await response.json();
        if (res.success) {
          setOrders(res.data || []);
          console.log(`[USER_ORDERS] ✅ Successfully fetched ${res.data?.length || 0} orders.`);
        } else {
          setError(res.message || 'Could not load your orders.');
          console.warn('[USER_ORDERS] ⚠️ Error from server:', res.message);
        }
      } catch (err) {
        console.error("[USER_ORDERS] ❌ Network Error fetching orders:", err);
        setError('Network error while loading your orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    console.log(`[USER_ORDERS] 🛑 Cancellation requested for Order ID: ${orderId}`);
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Order cancelled successfully!");
        setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: 'cancelled' } : o));
        console.log(`[USER_ORDERS] ✅ Order ${orderId} cancelled successfully.`);
      } else {
        toast.error(data.message || "Failed to cancel order.");
        console.warn(`[USER_ORDERS] ⚠️ Failed to cancel order ${orderId}:`, data.message);
      }
    } catch (error) {
      console.error("[USER_ORDERS] ❌ Cancellation Error:", error);
      toast.error("Something went wrong");
    }
  };

  // The bill is built on the backend from the database (GET /api/orders/:orderId/invoice); here we only open it
  const handleDownloadInvoice = async (order) => {
    console.log(`[USER_ORDERS] 📄 Opening bill for Order ID: ${order.order_id}`);
    const billWindow = window.open('', '_blank');
    if (!billWindow) {
      toast.error('Please allow pop-ups to open the bill.');
      return;
    }
    billWindow.document.write('<p style="font-family:sans-serif;padding:24px">Preparing your bill...</p>');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders/${order.order_id}/invoice`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Bill request failed (${response.status})`);

      const html = await response.text();
      billWindow.document.open();
      billWindow.document.write(html);
      billWindow.document.close();
    } catch (err) {
      console.error('[USER_ORDERS] ❌ Bill error:', err);
      billWindow.close();
      toast.error('Could not open the bill. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const cleanAddressText = (addrText) => {
    if (!addrText) return '';
    return addrText.replace(/,?\s*Phone:\s*[\d\w+-]+/gi, '').trim();
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-page-inner">
          <h1 className="orders-page-title"><Skeleton width={200} /></h1>
          {[1, 2, 3].map((n) => (
            <div key={n} className="order-card" style={{ padding: '20px', marginBottom: '20px', background: '#fff', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <Skeleton width={180} height={20} />
                <Skeleton width={100} height={24} borderRadius={12} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <Skeleton width={100} height={120} borderRadius={8} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="60%" height={24} style={{ marginBottom: '8px' }} />
                  <Skeleton width="40%" height={16} style={{ marginBottom: '8px' }} />
                  <Skeleton width="30%" height={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-page-inner">
        <h1 className="orders-page-title">My Orders</h1>

        {error && <div className="orders-error-banner">{error}</div>}

        {orders.length === 0 && !error ? (
          <div className="orders-empty-card">
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet.</p>
            <Link to="/" className="orders-empty-link">Start Shopping</Link>
          </div>
        ) : (
          orders.map((order) => {
            const meta = STATUS_META[order.status] || { label: order.status, className: '', icon: '' };
            const resolvedPhone = order.delivery_phone || order.phone || (order.shipping_address && order.shipping_address.match(/Phone:\s*([\d\w+-]+)/i)?.[1]);

            return (
              <div key={order.order_id} className="order-card">
                
                {/* Order Header */}
                <div className="order-card-header">
                  <div>
                    <h3 className="order-id">Order #{order.order_id}</h3>
                    <p className="order-date">Placed on {formatDate(order.ordered_at)}</p>
                  </div>
                  <span className={`order-status-badge ${meta.className}`}>
                    {meta.icon} {meta.label}
                  </span>
                </div>

                {/* Items Container */}
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => {
                    const unitPrice = Number(item.unit_price || 0);
                    const itemMrp = Number(item.mrp || 0);
                    const hasDiscount = itemMrp > unitPrice;
                    const discountPercent = hasDiscount ? Math.round(((itemMrp - unitPrice) / itemMrp) * 100) : 0;
                    const totalMrp = (itemMrp > 0 ? itemMrp : unitPrice) * item.quantity;
                    const itemTotalPrice = unitPrice * item.quantity;

                    return (
                      <div key={idx} className="order-item-detail-layout">
                        
                        <div className="order-item-left-col">
                          <div 
                            className="order-item-img-zoom-box"
                            onClick={() => setZoomModal({
                              isOpen: true,
                              imgUrl: getImageUrl(item.image_url || item.image),
                              name: item.name,
                              productId: item.product_id
                            })}
                            title="Click to zoom image"
                          >
                            <img
                              src={getImageUrl(item.image_url || item.image)} 
                              alt={item.name}
                              className="order-item-main-img"
                              onError={(e) => { e.target.src = '/saare_1.jpeg'; }}
                            />
                            <div className="zoom-hover-indicator">🔍 Zoom</div>
                          </div>

                          <div className="order-item-actions-stack">
                            {(order.status === 'pending' || order.status === 'processing') && (
                              <button 
                                onClick={() => handleCancelOrder(order.order_id)} 
                                className="order-action-cancel"
                              >
                                Cancel Order
                              </button>
                            )}
                            
                            {/* Track Order Button */}
                            <Link 
                              to={`/track-order/${order.payment_id}`} 
                              className="order-action-track"
                            >
                              Track Order
                            </Link>

                            {/* ⭐ RATE & REVIEW BUTTON (Moved exactly after Track Order) */}
                            {order.status === 'delivered' && (
                              <button 
                                onClick={() => setReviewProductId(item.product_id)} 
                                className="fk-rate-order-btn"
                              >
                                ★ Rate & Review
                              </button>
                            )}
                            
                            {/* Invoice Button */}
                            <button 
                              onClick={() => handleDownloadInvoice(order)} 
                              className="order-action-invoice"
                            >
                              Invoice
                            </button>
                          </div>
                        </div>

                        <div className="order-item-right-col">
                          <Link 
                            to={`/product/${item.product_id}`} 
                            className="order-product-name-link"
                          >
                            <h2 className="order-product-name">{item.name}</h2>
                          </Link>

                          <div className="order-price-box">
                            <div className="order-item-price-row">
                              <span className="order-price-main">
                                ₹{itemTotalPrice.toLocaleString('en-IN')}
                              </span>

                              {hasDiscount && (
                                <>
                                  <span className="order-mrp-strikethrough">
                                    ₹{totalMrp.toLocaleString('en-IN')}
                                  </span>
                                  <span className="order-discount-badge">
                                    {discountPercent}% OFF
                                  </span>
                                </>
                              )}
                            </div>

                            <span className="order-item-qty">
                              Quantity: {item.quantity}
                            </span>
                          </div>

                          <div className="order-info-substrip">
                            <p>
                              <strong>Payment:</strong> {order.payment_method ? order.payment_method.toUpperCase() : 'N/A'} ({order.payment_status ? order.payment_status.toUpperCase() : 'N/A'})
                            </p>
                            {order.estimated_delivery && (
                              <p>
                                <strong>Estimated Delivery:</strong> {formatDateOnly(order.estimated_delivery)}
                              </p>
                            )}
                          </div>

                          {(order.shipping_address || order.city) && (
                            <div className="order-delivery-address-card">
                              <p className="address-header">📍 Delivery Address:</p>
                              <p className="address-body">
                                {order.delivery_name && <strong className="address-name">{order.delivery_name}<br /></strong>}
                                {order.shipping_address ? (
                                  cleanAddressText(order.shipping_address)
                                ) : (
                                  `${order.house_no || ''}, ${order.road_area || ''}${order.landmark ? ', ' + order.landmark : ''}, ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}`
                                )}
                              </p>
                              {resolvedPhone && (
                                <p className="address-contact">
                                  📞 Contact: {resolvedPhone}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <p className="order-items-empty">No items in this order</p>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* ⭐ FLIPKART STYLE REVIEW MODAL WIDGET */}
      {reviewProductId && (
        <ReviewModal 
          productId={reviewProductId} 
          onClose={() => setReviewProductId(null)} 
          onSuccess={() => setReviewProductId(null)}
        />
      )}

      {/* 🔍 PRODUCT IMAGE ZOOM MODAL */}
      {zoomModal.isOpen && (
        <div className="order-zoom-modal-overlay" onClick={() => setZoomModal({ isOpen: false, imgUrl: '', name: '', productId: null })}>
          <div className="order-zoom-modal-topbar" onClick={(e) => e.stopPropagation()}>
            <span className="order-zoom-modal-title">{zoomModal.name}</span>
            <button
              type="button"
              className="order-zoom-close-btn"
              onClick={() => setZoomModal({ isOpen: false, imgUrl: '', name: '', productId: null })}
            >
              ×
            </button>
          </div>

          <div className="order-zoom-viewport" onClick={(e) => e.stopPropagation()}>
            <img
              src={zoomModal.imgUrl}
              alt={zoomModal.name}
              className="order-zoom-img"
              style={{ transform: `scale(${zoomScale})` }}
              onClick={() => setZoomScale((prev) => (prev >= 2.5 ? 1 : Number((prev + 0.75).toFixed(2))))}
              onError={(e) => { e.target.src = '/saare_1.jpeg'; }}
            />
          </div>

          <div className="order-zoom-controls" onClick={(e) => e.stopPropagation()}>
            {[1, 1.75, 2.5].map((scale) => (
              <button
                key={scale}
                type="button"
                className={`order-zoom-btn ${zoomScale === scale ? 'active' : ''}`}
                onClick={() => setZoomScale(scale)}
              >
                {scale}x Zoom
              </button>
            ))}
            <Link to={`/product/${zoomModal.productId}`} className="order-zoom-product-link">
              View Product Page →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserOrders;