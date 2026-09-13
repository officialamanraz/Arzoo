import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
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
        } else {
          setError(res.message || 'Could not load your orders.');
        }
      } catch (err) {
        console.error("Network Error fetching orders:", err);
        setError('Network error while loading your orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        alert("Order cancelled successfully!");
        setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: 'cancelled' } : o));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Something went wrong");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const buildInvoiceHtml = (order) => {
    const items = order.items || [];
    const itemsSubtotal = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);

    const itemRows = items.length > 0
      ? items.map(item => {
          const itemDiscount = Number(item.discount || 0);
          const lineTotal = (item.quantity * item.unit_price) - itemDiscount;
          return `
            <tr>
              <td>
                <div class="item-name">${item.name}</div>
                <div class="item-variant">HSN: ${item.hsn_code || 'N/A'} | SKU: PROD-${item.product_id || 'N/A'}</div>
              </td>
              <td class="align-center">${item.quantity}</td>
              <td class="align-right">₹${Number(item.unit_price).toFixed(2)}</td>
              <td class="align-right">₹${itemDiscount.toFixed(2)}</td>
              <td class="align-right">₹${lineTotal.toFixed(2)}</td>
            </tr>`;
        }).join('')
      : '<tr><td colspan="5" class="align-center">No items found</td></tr>';

    const supportLine = (SUPPORT_EMAIL || SUPPORT_PHONE)
      ? `Need help? Contact us at <strong>${[SUPPORT_EMAIL, SUPPORT_PHONE].filter(Boolean).join('</strong> or <strong>')}</strong><br>`
      : '';

    const invoiceNumber = order.invoice_number || order.payment_id;
    const gstinRowHtml = (SELLER_GSTIN && SELLER_GSTIN !== 'N/A') ? `GSTIN: ${SELLER_GSTIN}<br>` : '';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <title>Invoice - ${invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #eceae4; padding: 40px 20px; color: #242824; }
        .invoice { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
        .invoice-header { background: linear-gradient(135deg, #ad3764, #d28a2e); color: #ffffff; padding: 32px 40px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; }
        .seller-block .store-name { font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
        .seller-block .store-tagline { font-size: 12px; opacity: 0.85; margin-top: 4px; }
        .seller-block .store-meta { margin-top: 14px; font-size: 12px; line-height: 1.6; opacity: 0.9; }
        .invoice-meta { text-align: right; }
        .invoice-meta .invoice-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; }
        .invoice-meta .invoice-number-box { display: inline-block; border: 1px dashed rgba(255,255,255,0.6); border-radius: 6px; padding: 6px 12px; margin-top: 6px; font-size: 15px; font-weight: 700; }
        .invoice-meta .invoice-date { font-size: 12px; margin-top: 10px; opacity: 0.9; line-height: 1.6; }
        .order-meta-strip { display: flex; gap: 30px; padding: 16px 40px; border-bottom: 1px solid #eee; background: #faf9f7; font-size: 12.5px; color: #555; flex-wrap: wrap; }
        .order-meta-strip strong { color: #222; }
        .parties-section { display: flex; gap: 30px; padding: 28px 40px; border-bottom: 1px solid #eee; flex-wrap: wrap; }
        .party-block { flex: 1; min-width: 220px; }
        .party-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #ad3764; margin-bottom: 10px; }
        .party-block p { font-size: 13.5px; line-height: 1.6; color: #444; }
        .party-block p.name { font-weight: 700; color: #222; font-size: 14.5px; }
        .items-section { padding: 28px 40px; }
        table.items-table { width: 100%; border-collapse: collapse; }
        .items-table thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #ad3764; padding: 0 8px 12px; border-bottom: 2px solid #ad3764; }
        .items-table thead th.align-center { text-align: center; }
        .items-table thead th.align-right { text-align: right; }
        .items-table tbody td { padding: 14px 8px; border-bottom: 1px solid #f0f0f0; font-size: 13.5px; color: #333; vertical-align: top; }
        .items-table tbody td.align-center { text-align: center; }
        .items-table tbody td.align-right { text-align: right; }
        .item-name { font-weight: 600; color: #222; }
        .item-variant { font-size: 12px; color: #888; margin-top: 2px; }
        .totals-section { padding: 0 40px 28px; display: flex; justify-content: flex-end; }
        .totals-box { width: 100%; max-width: 280px; }
        .totals-row { display: flex; justify-content: space-between; font-size: 13.5px; color: #555; padding: 6px 0; }
        .totals-row.grand-total { border-top: 2px solid #242824; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 700; color: #ad3764; }
        .info-strip { display: flex; gap: 30px; padding: 24px 40px; background: #f7f6f2; border-top: 1px solid #eee; flex-wrap: wrap; }
        .info-block { flex: 1; min-width: 220px; }
        .info-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
        .info-block p { font-size: 13px; color: #333; line-height: 1.7; }
        .signature-block { padding: 20px 40px 0; display: flex; justify-content: flex-end; text-align: center; font-size: 12px; color: #666; }
        .signature-block .sig-line { border-top: 1px solid #999; width: 180px; padding-top: 6px; }
        .invoice-footer { text-align: center; padding: 24px 40px 32px; font-size: 11.5px; color: #999; line-height: 1.7; }
        @media print { body { background: #fff; padding: 0; } .invoice { box-shadow: none; border-radius: 0; } }
      </style>
      </head>
      <body>
        <div class="invoice">
          <div class="invoice-header">
            <div class="seller-block">
              <div class="store-name">${STORE_NAME}</div>
              <div class="store-tagline">${STORE_TAGLINE}</div>
              <div class="store-meta">
                ${gstinRowHtml}
                ${SELLER_ADDRESS_1}<br>${SELLER_ADDRESS_2}
              </div>
            </div>
            <div class="invoice-meta">
              <div class="invoice-label">Bill of Supply</div>
              <div class="invoice-number-box">${invoiceNumber}</div>
              <div class="invoice-date">
                Order Date: ${formatDateOnly(order.ordered_at)}<br>
                Invoice Date: ${formatDateOnly(order.ordered_at)}
              </div>
            </div>
          </div>
          <div class="order-meta-strip">
            <span>Order ID: <strong>${order.payment_id}</strong></span>
          </div>
          <div class="parties-section">
            <div class="party-block">
              <h4>Billing Address</h4>
              <p class="name">${order.delivery_name || order.customer_name || 'Customer'}</p>
              <p>${order.shipping_address || 'Address not available'}</p><br>
              <p>Email: ${order.customer_email || 'Not available'}</p>
            </div>
            <div class="party-block">
              <h4>Shipping Address</h4>
              <p class="name">${order.delivery_name || order.customer_name || 'Customer'}</p>
              <p>${order.shipping_address || 'Address not available'}</p>
            </div>
          </div>
          <div class="items-section">
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="align-center">Qty</th>
                  <th class="align-right">Price</th>
                  <th class="align-right">Discount</th>
                  <th class="align-right">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </div>
          <div class="totals-section">
            <div class="totals-box">
              <div class="totals-row"><span>Subtotal</span><span>₹${itemsSubtotal.toFixed(2)}</span></div>
              <div class="totals-row"><span>Discount</span><span>−₹0.00</span></div>
              <div class="totals-row grand-total"><span>Grand Total</span><span>₹${Number(order.total_amount).toFixed(2)}</span></div>
            </div>
          </div>
          <div class="info-strip">
            <div class="info-block">
              <h4>Payment Details</h4>
              <p>Method: ${order.payment_method ? order.payment_method.toUpperCase() : 'Not available'}</p>
              <p>Status: ${order.payment_status ? order.payment_status.toUpperCase() : 'Not available'}</p>
            </div>
            <div class="info-block">
              <h4>Order Details</h4>
              <p>Current Status: ${order.status ? order.status.toUpperCase() : 'Not available'}</p>
              ${order.estimated_delivery ? `<p>Estimated Delivery: ${formatDateOnly(order.estimated_delivery)}</p>` : ''}
            </div>
          </div>
          <div class="signature-block">
            <div class="sig-line">Authorized Signatory<br>${STORE_NAME}</div>
          </div>
          <div class="invoice-footer">
            This is a computer-generated document.<br>${supportLine}
            Thank you for shopping with ${STORE_NAME}!
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(buildInvoiceHtml(order));
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  if (loading) {
    return <div className="orders-loading">Loading your orders...</div>;
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '100px 20px 60px', textAlign: 'left' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
        <h1 style={{ marginBottom: '30px', color: '#0f172a', fontSize: '2rem', fontWeight: 800, textAlign: 'left' }}>My Orders</h1>

        {error && <div style={{ background: '#fdecea', color: '#c0392b', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', textAlign: 'left' }}>{error}</div>}

        {orders.length === 0 && !error ? (
          <div style={{ background: '#fff', padding: '50px', textAlign: 'center', borderRadius: '20px' }}>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet.</p>
            <Link to="/" style={{ color: '#A8325E', fontWeight: 600 }}>Start Shopping</Link>
          </div>
        ) : (
          orders.map((order) => {
            const meta = STATUS_META[order.status] || { label: order.status, className: '', icon: '' };
            return (
              <div key={order.order_id} style={{ background: '#fff', padding: '30px', marginBottom: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', textAlign: 'left' }}>
                
                {/* Order Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px', textAlign: 'left' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', textAlign: 'left' }}>Order #{order.order_id}</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', textAlign: 'left' }}>Placed on {formatDate(order.ordered_at)}</p>
                  </div>
                  <span style={{ padding: '8px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85em', textAlign: 'left' }}>
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

                    return (
                      <div key={idx} style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '15px', textAlign: 'left' }}>
                        
                        {/* Left Column: Large Image + Action Buttons Below It */}
                        <div style={{ width: '300px', flexShrink: 0, textAlign: 'left' }}>
                          <img
                            src={getImageUrl(item.image_url || item.image)} 
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '300px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                              border: '1px solid #cbd5e1',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              background: '#fff',
                              display: 'block',
                              marginBottom: '15px'
                            }}
                            onError={(e) => { e.target.src = '/saare_1.jpeg'; }}
                          />

                          {/* Buttons directly below the image */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                            {(order.status === 'pending' || order.status === 'processing') && (
                              <button 
                                onClick={() => handleCancelOrder(order.order_id)} 
                                style={{
                                  padding: '10px 16px', background: 'transparent', color: '#dc3545',
                                  border: '1px solid #dc3545', borderRadius: '8px', cursor: 'pointer',
                                  fontWeight: 'bold', fontSize: '0.9em', textAlign: 'center', width: '100%'
                                }}
                              >
                                Cancel Order
                              </button>
                            )}
                            <Link 
                              to={`/track-order/${order.payment_id}`} 
                              style={{
                                display: 'block', padding: '10px 16px', backgroundColor: '#A8325E',
                                color: '#fff', borderRadius: '8px', textDecoration: 'none',
                                fontWeight: 700, fontSize: '0.9em', textAlign: 'center'
                              }}
                            >
                              Track Order
                            </Link>
                            <button 
                              onClick={() => handleDownloadInvoice(order)} 
                              style={{
                                padding: '10px 16px', backgroundColor: '#fff', color: '#0f172a',
                                border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 700, fontSize: '0.9em', textAlign: 'center', width: '100%'
                              }}
                            >
                              Invoice
                            </button>
                          </div>
                        </div>

                        {/* Right Column: Left/Top-Aligned Text & Order Info */}
                        <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', alignItems: 'flex-start' }}>
                          <h2 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 700, color: '#0f172a', lineHeight: '1.3', textAlign: 'left' }}>
                            {item.name}
                          </h2>

                         {/* Pricing Display with Discount, MRP and Quantity */}
<div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', alignItems: 'flex-start' }}>
  <div className="order-item-price-row" style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', textAlign: 'left' }}>
    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#A8325E', textAlign: 'left' }}>
      ₹{Number(order.total_amount || (item.unit_price * item.quantity)).toLocaleString('en-IN')}
    </span>

    {/* Fallback check: agar item.mrp available hai aur price se bada hai */}
    {(Number(item.mrp) > Number(item.unit_price || order.total_amount)) && (
      <>
        <span style={{ fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 500 }}>
          ₹{(Number(item.mrp) * (item.quantity || 1)).toLocaleString('en-IN')}
        </span>
        <span className="order-discount-badge" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
          {Math.round(((Number(item.mrp) - Number(item.unit_price || order.total_amount)) / Number(item.mrp)) * 100)}% OFF
        </span>
      </>
    )}
  </div>

  <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '500', textAlign: 'left' }}>
    Quantity: {item.quantity || 1}
  </span>
</div>

                          {/* Payment & Delivery strip */}
                          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'left' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', textAlign: 'left' }}>
                              <strong>Payment:</strong> {order.payment_method ? order.payment_method.toUpperCase() : 'N/A'} ({order.payment_status ? order.payment_status.toUpperCase() : 'N/A'})
                            </p>
                            {order.estimated_delivery && (
                              <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', textAlign: 'left' }}>
                                <strong>Estimated Delivery:</strong> {formatDateOnly(order.estimated_delivery)}
                              </p>
                            )}
                          </div>

                          {/* Delivery Address Card */}
                          {(order.shipping_address || order.city) && (
                            <div className="order-delivery-address-card" style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', textAlign: 'left' }}>
                              <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', textAlign: 'left' }}>
                                📍 Delivery Address:
                              </p>
                              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, textAlign: 'left' }}>
                                {order.delivery_name && <strong style={{ color: '#1e293b' }}>{order.delivery_name}<br /></strong>}
                                {order.shipping_address ? (
                                  order.shipping_address
                                ) : (
                                  `${order.house_no || ''}, ${order.road_area || ''}${order.landmark ? ', ' + order.landmark : ''}, ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}`
                                )}
                              </p>
                              {order.delivery_phone && (
                                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#64748b', textAlign: 'left' }}>
                                  📞 Contact: {order.delivery_phone}
                                </p>
                              )}
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No items in this order</p>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default UserOrders;