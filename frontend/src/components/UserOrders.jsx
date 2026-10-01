import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { getImageUrl } from '../getImageUrl';
import './UserOrders.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const SITE_NAME = import.meta.env.VITE_SITE_NAME || '';
const STORE_NAME = import.meta.env.VITE_STORE_NAME || SITE_NAME || 'Store Name';
const STORE_TAGLINE = import.meta.env.VITE_STORE_TAGLINE || '';
const SELLER_GSTIN = import.meta.env.VITE_SELLER_GSTIN || 'N/A';
const SELLER_ADDRESS_1 = import.meta.env.VITE_SELLER_ADDRESS_1 || '';
const SELLER_ADDRESS_2 = import.meta.env.VITE_SELLER_ADDRESS_2 || '';
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';
const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE || '';

const STATUS_META = {
  pending: { label: 'Pending', className: 'status-pending', icon: '⏳' },
  processing: { label: 'Processing', className: 'status-processing', icon: '⚙️' },
  shipped: { label: 'Shipped', className: 'status-shipped', icon: '📦' },
  delivered: { label: 'Delivered', className: 'status-delivered', icon: '✅' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled', icon: '❌' }
};

const RATING_TAGS = [
  { id: 'skip', label: 'Skip', color: '#ef4444' },
  { id: 'timepass', label: 'Timepass', color: '#f59e0b' },
  { id: 'go_for_it', label: 'Go for it', color: '#3b82f6' },
  { id: 'perfection', label: 'Perfection', color: '#22c55e' }
];

function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review Modal States
  const [reviewModal, setReviewModal] = useState({ isOpen: false, item: null, orderId: null });
  const [reviewData, setReviewData] = useState({ rating: 5, ratingType: 'go_for_it', comment: '', image: null });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  const openReviewModal = (item, orderId) => {
    console.log(`[USER_ORDERS] ⭐ Opening review modal for Product ID: ${item.product_id}, Order ID: ${orderId}`);
    setReviewModal({ isOpen: true, item, orderId });
    setReviewData({ rating: 5, ratingType: 'go_for_it', comment: '', image: null });
  };

  const closeReviewModal = () => {
    console.log('[USER_ORDERS] ✖️ Closing review modal');
    setReviewModal({ isOpen: false, item: null, orderId: null });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    console.log(`[USER_ORDERS] 🚀 Submitting review for Product ID: ${reviewModal.item.product_id}`);
    setIsSubmittingReview(true);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('product_id', reviewModal.item.product_id);
      formData.append('order_id', reviewModal.orderId);
      formData.append('rating', reviewData.rating);
      formData.append('rating_type', reviewData.ratingType);
      formData.append('comment', reviewData.comment);
      if (reviewData.image) {
        formData.append('image', reviewData.image);
      }

      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Review submitted successfully!');
        console.log('[USER_ORDERS] ✅ Review submitted successfully');
        closeReviewModal();
      } else {
        toast.error(data.message || 'Failed to submit review');
        console.warn('[USER_ORDERS] ⚠️ Review submission failed:', data.message);
      }
    } catch (error) {
      console.error('[USER_ORDERS] ❌ Error submitting review:', error);
      toast.error('Something went wrong while submitting review');
    } finally {
      setIsSubmittingReview(false);
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

  const buildInvoiceHtml = (order) => {
    const items = order.items || [];
    const itemsSubtotal = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
    const itemRows = items.length > 0 ? items.map(item => {
      const itemDiscount = Number(item.discount || 0);
      const lineTotal = (item.quantity * item.unit_price) - itemDiscount;
      return `<tr><td><div class="item-name">${item.name}</div><div class="item-variant">HSN: ${item.hsn_code || 'N/A'} | SKU: PROD-${item.product_id || 'N/A'}</div></td><td class="align-center">${item.quantity}</td><td class="align-right">₹${Number(item.unit_price).toFixed(2)}</td><td class="align-right">₹${itemDiscount.toFixed(2)}</td><td class="align-right">₹${lineTotal.toFixed(2)}</td></tr>`;
    }).join('') : '<tr><td colspan="5" class="align-center">No items found</td></tr>';

    const supportLine = (SUPPORT_EMAIL || SUPPORT_PHONE) ? `Need help? Contact us at <strong>${[SUPPORT_EMAIL, SUPPORT_PHONE].filter(Boolean).join('</strong> or <strong>')}</strong><br>` : '';
    const invoiceNumber = order.invoice_number || order.payment_id;
    const gstinRowHtml = (SELLER_GSTIN && SELLER_GSTIN !== 'N/A') ? `GSTIN: ${SELLER_GSTIN}<br>` : '';

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Invoice - ${invoiceNumber}</title><style>* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #eceae4; padding: 40px 20px; color: #242824; } .invoice { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; } .invoice-header { background: linear-gradient(135deg, #ad3764, #d28a2e); color: #ffffff; padding: 32px 40px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; } .seller-block .store-name { font-size: 26px; font-weight: 700; letter-spacing: 0.5px; } .seller-block .store-tagline { font-size: 12px; opacity: 0.85; margin-top: 4px; } .seller-block .store-meta { margin-top: 14px; font-size: 12px; line-height: 1.6; opacity: 0.9; } .invoice-meta { text-align: right; } .invoice-meta .invoice-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; } .invoice-meta .invoice-number-box { display: inline-block; border: 1px dashed rgba(255,255,255,0.6); border-radius: 6px; padding: 6px 12px; margin-top: 6px; font-size: 15px; font-weight: 700; } .invoice-meta .invoice-date { font-size: 12px; margin-top: 10px; opacity: 0.9; line-height: 1.6; } .order-meta-strip { display: flex; gap: 30px; padding: 16px 40px; border-bottom: 1px solid #eee; background: #faf9f7; font-size: 12.5px; color: #555; flex-wrap: wrap; } .order-meta-strip strong { color: #222; } .parties-section { display: flex; gap: 30px; padding: 28px 40px; border-bottom: 1px solid #eee; flex-wrap: wrap; } .party-block { flex: 1; min-width: 220px; } .party-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #ad3764; margin-bottom: 10px; } .party-block p { font-size: 13.5px; line-height: 1.6; color: #444; } .party-block p.name { font-weight: 700; color: #222; font-size: 14.5px; } .items-section { padding: 28px 40px; } table.items-table { width: 100%; border-collapse: collapse; } .items-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #ad3764; padding: 0 8px 12px; border-bottom: 2px solid #ad3764; } .items-table thead th.align-center { text-align: center; } .items-table thead th.align-right { text-align: right; } .items-table tbody td { padding: 14px 8px; border-bottom: 1px solid #f0f0f0; font-size: 13.5px; color: #333; vertical-align: top; } .items-table tbody td.align-center { text-align: center; } .items-table tbody td.align-right { text-align: right; } .item-name { font-weight: 600; color: #222; } .item-variant { font-size: 12px; color: #888; margin-top: 2px; } .totals-section { padding: 0 40px 28px; display: flex; justify-content: flex-end; } .totals-box { width: 100%; max-width: 280px; } .totals-row { display: flex; justify-content: space-between; font-size: 13.5px; color: #555; padding: 6px 0; } .totals-row.grand-total { border-top: 2px solid #242824; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 700; color: #ad3764; } .info-strip { display: flex; gap: 30px; padding: 24px 40px; background: #f7f6f2; border-top: 1px solid #eee; flex-wrap: wrap; } .info-block { flex: 1; min-width: 220px; } .info-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; } .info-block p { font-size: 13px; color: #333; line-height: 1.7; } .signature-block { padding: 20px 40px 0; display: flex; justify-content: flex-end; text-align: center; font-size: 12px; color: #666; } .signature-block .sig-line { border-top: 1px solid #999; width: 180px; padding-top: 6px; } .invoice-footer { text-align: center; padding: 24px 40px 32px; font-size: 11.5px; color: #999; line-height: 1.7; } @media print { body { background: #fff; padding: 0; } .invoice { box-shadow: none; border-radius: 0; } }</style></head><body><div class="invoice"><div class="invoice-header"><div class="seller-block"><div class="store-name">${STORE_NAME}</div><div class="store-tagline">${STORE_TAGLINE}</div><div class="store-meta">${gstinRowHtml}${SELLER_ADDRESS_1}<br>${SELLER_ADDRESS_2}</div></div><div class="invoice-meta"><div class="invoice-label">Bill of Supply</div><div class="invoice-number-box">${invoiceNumber}</div><div class="invoice-date">Order Date: ${formatDateOnly(order.ordered_at)}<br>Invoice Date: ${formatDateOnly(order.ordered_at)}</div></div></div><div class="order-meta-strip"><span>Order ID: <strong>${order.payment_id}</strong></span></div><div class="parties-section"><div class="party-block"><h4>Billing Address</h4><p class="name">${order.delivery_name || order.customer_name || 'Customer'}</p><p>${order.shipping_address || 'Address not available'}</p><br><p>Email: ${order.customer_email || 'Not available'}</p></div><div class="party-block"><h4>Shipping Address</h4><p class="name">${order.delivery_name || order.customer_name || 'Customer'}</p><p>${order.shipping_address || 'Address not available'}</p></div></div><div class="items-section"><table class="items-table"><thead><tr><th>Description</th><th class="align-center">Qty</th><th class="align-right">Price</th><th class="align-right">Discount</th><th class="align-right">Amount</th></tr></thead><tbody>${itemRows}</tbody></table></div><div class="totals-section"><div class="totals-box"><div class="totals-row"><span>Subtotal</span><span>₹${itemsSubtotal.toFixed(2)}</span></div><div class="totals-row"><span>Discount</span><span>−₹0.00</span></div><div class="totals-row grand-total"><span>Grand Total</span><span>₹${Number(order.total_amount).toFixed(2)}</span></div></div></div><div class="info-strip"><div class="info-block"><h4>Payment Details</h4><p>Method: ${order.payment_method ? order.payment_method.toUpperCase() : 'Not available'}</p><p>Status: ${order.payment_status ? order.payment_status.toUpperCase() : 'Not available'}</p></div><div class="info-block"><h4>Order Details</h4><p>Current Status: ${order.status ? order.status.toUpperCase() : 'Not available'}</p>${order.estimated_delivery ? `<p>Estimated Delivery: ${formatDateOnly(order.estimated_delivery)}</p>` : ''}</div></div><div class="signature-block"><div class="sig-line">Authorized Signatory<br>${STORE_NAME}</div></div><div class="invoice-footer">This is a computer-generated document.<br>${supportLine}Thank you for shopping with ${STORE_NAME}!</div></div></body></html>`;
  };

  const handleDownloadInvoice = (order) => {
    console.log(`[USER_ORDERS] 📄 Generating invoice for Order ID: ${order.order_id}`);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(buildInvoiceHtml(order));
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
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
                          <Link 
                            to={`/product/${item.product_id}`} 
                            className="order-item-img-zoom-box"
                            title="Click to view product details"
                          >
                            <img
                              src={getImageUrl(item.image_url || item.image)} 
                              alt={item.name}
                              className="order-item-main-img"
                              onError={(e) => { e.target.src = '/saare_1.jpeg'; }}
                            />
                            <div className="zoom-hover-indicator">🔍 View Product</div>
                          </Link>

                          <div className="order-item-actions-stack">
                            {(order.status === 'pending' || order.status === 'processing') && (
                              <button 
                                onClick={() => handleCancelOrder(order.order_id)} 
                                className="order-action-cancel"
                              >
                                Cancel Order
                              </button>
                            )}
                            <Link 
                              to={`/track-order/${order.payment_id}`} 
                              className="order-action-track"
                            >
                              Track Order
                            </Link>
                            <button 
                              onClick={() => handleDownloadInvoice(order)} 
                              className="order-action-invoice"
                            >
                              Invoice
                            </button>
                            
                            {/* ⭐ RATE & REVIEW BUTTON (Only for Delivered Items) */}
                            {order.status === 'delivered' && (
                              <button 
                                onClick={() => openReviewModal(item, order.order_id)} 
                                className="order-action-review"
                              >
                                ★ Rate & Review
                              </button>
                            )}
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

      {/* ⭐ REVIEW MODAL OVERLAY */}
      {reviewModal.isOpen && (
        <div className="review-modal-overlay">
          <div className="review-modal-content">
            <div className="review-modal-header">
              <h3>Write a Review</h3>
              <button className="review-modal-close" onClick={closeReviewModal}>×</button>
            </div>
            
            <form onSubmit={handleReviewSubmit} className="review-modal-body">
              <div className="review-product-preview">
                <img src={getImageUrl(reviewModal.item.image_url || reviewModal.item.image)} alt="Product" />
                <span>{reviewModal.item.name}</span>
              </div>

              {/* Star Rating */}
              <div className="review-form-group">
                <label>Overall Rating</label>
                <div className="review-stars-container">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      className={`review-star ${reviewData.rating >= star ? 'active' : ''}`}
                      onClick={() => {
                        setReviewData({ ...reviewData, rating: star });
                        console.log(`[USER_ORDERS] ⭐ Star rating updated to: ${star}`);
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {/* Opinion Tags */}
              <div className="review-form-group">
                <label>Product Verdict</label>
                <div className="review-tags-container">
                  {RATING_TAGS.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`review-tag-btn ${reviewData.ratingType === tag.id ? 'active' : ''}`}
                      style={{ 
                        borderColor: reviewData.ratingType === tag.id ? tag.color : '',
                        backgroundColor: reviewData.ratingType === tag.id ? `${tag.color}15` : ''
                      }}
                      onClick={() => {
                        setReviewData({ ...reviewData, ratingType: tag.id });
                        console.log(`[USER_ORDERS] 🏷️ Verdict tag updated to: ${tag.id}`);
                      }}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Written Review */}
              <div className="review-form-group">
                <label>Add a written review</label>
                <textarea
                  className="review-textarea"
                  placeholder="What did you like or dislike? What did you use this product for?"
                  rows="4"
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  required
                ></textarea>
              </div>

              {/* Add Photo (Optional) */}
              <div className="review-form-group">
                <label>Add a photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="review-file-input"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setReviewData({ ...reviewData, image: e.target.files[0] });
                      console.log(`[USER_ORDERS] 📸 Photo selected: ${e.target.files[0].name}`);
                    }
                  }}
                />
              </div>

              <div className="review-modal-actions">
                <button type="button" className="review-btn-cancel" onClick={closeReviewModal}>Cancel</button>
                <button type="submit" className="review-btn-submit" disabled={isSubmittingReview}>
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserOrders;