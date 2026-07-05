import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style_of_userorder.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://arzoo-saree.onrender.com';

// Site identity comes from env config, not hardcoded here.
// Set these in your frontend .env file (e.g., VITE_STORE_NAME=Aman Saare)
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
        console.error("Error fetching orders:", err);
        setError('Network error while loading your orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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

  // Builds the invoice using the new beautiful HTML template and dynamic data
 // Builds the invoice using the improved layout -- Bill of Supply style (no GST, no GSTIN yet)
const buildInvoiceHtml = (order) => {
  const items = order.items || [];

  const itemsSubtotal = items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity, 0
  );

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

  // Only show a GSTIN row if one is actually set (honest -- no fake "N/A" clutter)
  const gstinRowHtml = (SELLER_GSTIN && SELLER_GSTIN !== 'N/A') ? `GSTIN: ${SELLER_GSTIN}<br>` : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <title>Invoice - ${invoiceNumber}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background: #eceae4;
        padding: 40px 20px;
        color: #242824;
      }

      .invoice {
        max-width: 800px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        overflow: hidden;
      }

      .invoice-header {
        background: linear-gradient(135deg, #ad3764, #d28a2e);
        color: #ffffff;
        padding: 32px 40px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 20px;
      }

      .seller-block .store-name { font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
      .seller-block .store-tagline { font-size: 12px; opacity: 0.85; margin-top: 4px; }
      .seller-block .store-meta { margin-top: 14px; font-size: 12px; line-height: 1.6; opacity: 0.9; }

      .invoice-meta { text-align: right; }
      .invoice-meta .invoice-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; }
      .invoice-meta .invoice-number-box {
        display: inline-block;
        border: 1px dashed rgba(255,255,255,0.6);
        border-radius: 6px;
        padding: 6px 12px;
        margin-top: 6px;
        font-size: 15px;
        font-weight: 700;
      }
      .invoice-meta .invoice-date { font-size: 12px; margin-top: 10px; opacity: 0.9; line-height: 1.6; }

      .order-meta-strip {
        display: flex;
        gap: 30px;
        padding: 16px 40px;
        border-bottom: 1px solid #eee;
        background: #faf9f7;
        font-size: 12.5px;
        color: #555;
        flex-wrap: wrap;
      }
      .order-meta-strip strong { color: #222; }

      .parties-section {
        display: flex; gap: 30px; padding: 28px 40px; border-bottom: 1px solid #eee; flex-wrap: wrap;
      }
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
      .info-block p span.field-label { color: #888; }

      .signature-block {
        padding: 20px 40px 0;
        display: flex;
        justify-content: flex-end;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .signature-block .sig-line {
        border-top: 1px solid #999;
        width: 180px;
        padding-top: 6px;
      }

      .invoice-footer { text-align: center; padding: 24px 40px 32px; font-size: 11.5px; color: #999; line-height: 1.7; }
      .invoice-footer strong { color: #666; }
      .eoe-note { text-align: right; padding: 0 40px; font-size: 11px; color: #aaa; }

      @media print {
        body { background: #fff; padding: 0; }
        .invoice { box-shadow: none; border-radius: 0; }
      }
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
              ${SELLER_ADDRESS_1}<br>
              ${SELLER_ADDRESS_2}
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
            <p class="name">${order.customer_name || 'Customer'}</p>
            <p>${order.shipping_address || 'Address not available'}</p>
            <br>
            <p>Email: ${order.customer_email || 'Not available'}</p>
          </div>
          <div class="party-block">
            <h4>Shipping Address</h4>
            <p class="name">${order.customer_name || 'Customer'}</p>
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
            <tbody>
              ${itemRows}
            </tbody>
          </table>
        </div>

        <div class="totals-section">
          <div class="totals-box">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>₹${itemsSubtotal.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Discount</span>
              <span>−₹0.00</span>
            </div>
            <div class="totals-row grand-total">
              <span>Grand Total</span>
              <span>₹${Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="info-strip">
          <div class="info-block">
            <h4>Payment Details</h4>
            <p><span class="field-label">Method:</span> ${order.payment_method ? order.payment_method.toUpperCase() : 'Not available'}</p>
            <p><span class="field-label">Status:</span> ${order.payment_status ? order.payment_status.toUpperCase() : 'Not available'}</p>
          </div>
          <div class="info-block">
            <h4>Order Details</h4>
            <p><span class="field-label">Current Status:</span> ${order.status ? order.status.toUpperCase() : 'Not available'}</p>
            ${order.estimated_delivery ? `<p><span class="field-label">Estimated Delivery:</span> ${formatDateOnly(order.estimated_delivery)}</p>` : ''}
          </div>
        </div>

        <div class="signature-block">
          <div class="sig-line">Authorized Signatory<br>${STORE_NAME}</div>
        </div>

        <div class="eoe-note">E. &amp; O.E.</div>

        <div class="invoice-footer">
          This is a computer-generated document and does not require a physical signature.<br>
          ${supportLine}
          Return/Exchange available within 7 days of delivery.<br><br>
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
            return (
              <div key={order.order_id} className="order-card">

                <div className="order-card-header">
                  <div>
                    <h3 className="order-id">Order #{order.order_id}</h3>
                    <p className="order-date">Placed on {formatDate(order.ordered_at)}</p>
                  </div>
                  <span className={`order-status-badge ${meta.className}`}>
                    {meta.icon} {meta.label}
                  </span>
                </div>
                  <div className="order-card-header">
  <div>
    <h3 className="order-id">Order #{order.order_id}</h3>
    <p className="order-date">Placed on {formatDate(order.ordered_at)}</p>
  </div>
  <span className={`order-status-badge ${meta.className}`}>
    {meta.icon} {meta.label}
  </span>
</div>

{/* NEW: Payment + Delivery info strip */}
<div className="order-extra-info">
  <p>
    <span className="field-label">Payment:</span>{' '}
    {order.payment_method ? order.payment_method.toUpperCase() : 'N/A'}
    {' '}({order.payment_status ? order.payment_status.toUpperCase() : 'N/A'})
  </p>
  {order.estimated_delivery && (
    <p>
      <span className="field-label">Estimated Delivery:</span>{' '}
      {formatDateOnly(order.estimated_delivery)}
    </p>
  )}
</div>
                <div className="order-items-block">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <img
                          src={`${API_BASE_URL}/uploads/${item.image_url || 'saare_1.jpeg'}`}
                          alt={item.name}
                          className="order-item-thumb"
                          onError={(e) => { e.target.src = '/saare_1.jpeg'; }}
                        />
                        <div className="order-item-info">
                          <p className="order-item-name">{item.name}</p>
                          <p className="order-item-meta">
                            Qty: {item.quantity} × ₹{Number(item.unit_price).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <p className="order-item-total">
                          ₹{(item.quantity * item.unit_price).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="order-items-empty">No items in this order</p>
                  )}
                </div>

                <div className="order-card-footer">
                  <div className="order-card-footer">
  <div className="order-footer-actions">
    <Link to={`/track-order/${order.payment_id}`} className="track-order-btn">
      Track Order
    </Link>
    <button onClick={() => handleDownloadInvoice(order)} className="invoice-btn">
      Invoice
    </button>
  </div>

  <div className="order-total-block">
    {order.subtotal && (
      <p className="order-subtotal-line">
        Subtotal: ₹{Number(order.subtotal).toLocaleString('en-IN')}
      </p>
    )}
    <p className="order-total-label">Total Amount</p>
    <h3 className="order-total-value">
      ₹{Number(order.total_amount).toLocaleString('en-IN')}
    </h3>
  </div>
</div>
                  <div className="order-footer-actions">
                    <Link to={`/track-order/${order.payment_id}`} className="track-order-btn">
                      Track Order
                    </Link>
                    <button onClick={() => handleDownloadInvoice(order)} className="invoice-btn">
                      Invoice
                    </button>
                  </div>

                  <div className="order-total-block">
                    <p className="order-total-label">Total Amount</p>
                    <h3 className="order-total-value">
                      ₹{Number(order.total_amount).toLocaleString('en-IN')}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default UserOrders;