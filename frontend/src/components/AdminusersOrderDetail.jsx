// src/components/AdminOrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Adminusersoders.css'; // Uses the same CSS file

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AdminOrderDetail = () => {
  const { id } = useParams(); // Gets order ID from URL
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [customMessage, setCustomMessage] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchSpecificOrder();
  }, [id]);

  const fetchSpecificOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetching all orders and finding the specific one (Simplest approach for now)
      const response = await axios.get(`${API_BASE_URL}/api/orders/user-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const foundOrder = response.data.data.find(o => String(o.order_id) === String(id));
      setOrder(foundOrder);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching order detail:", error);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/emails/order-status`, {
        order_id: order.order_id,
        status: newStatus,
        customMessage: customMessage,
        tracking_number: trackingNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrder({ ...order, order_status: newStatus });
      alert(`Status updated to ${newStatus} and email sent to user!`);
      setCustomMessage(''); 
      setTrackingNumber('');
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status and send email.");
    }
    setUpdatingStatus(false);
  };

  if (loading) return <div className="admin-orders-container"><div className="loader">Loading Details...</div></div>;
  if (!order) return <div className="admin-orders-container"><h2>Order Not Found</h2><button onClick={() => navigate('/admin/userorders')}>Go Back</button></div>;

  return (
    <div className="admin-orders-container detail-page-container">
      <button className="back-btn" onClick={() => navigate('/admin/userorders')}>
        &larr; Back to All Orders
      </button>

      <div className="detail-header">
        <h2>Order #{order.order_id} Details</h2>
        <span className={`status-badge large ${order.order_status?.toLowerCase() || 'processing'}`}>
          {order.order_status || 'Processing'}
        </span>
      </div>

      {/* STATUS UPDATE CARDS */}
      <div className="status-update-section">
        <h3>Change Status & Trigger Email</h3>
        <div className="status-cards-row">
          {['Processing', 'Shipped', 'Delivered'].map(status => (
            <div className={`status-action-card ${order.order_status === status ? 'active' : ''}`} key={status}>
              <h4>{status}</h4>
              <textarea 
                placeholder={`Write message for ${status}... (Leave blank for default email)`}
                value={order.order_status === status ? '' : customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                disabled={order.order_status === status}
              />
              {status === 'Shipped' && (
                <input 
                  type="text" 
                  placeholder="Tracking / AWB Number" 
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  disabled={order.order_status === status}
                />
              )}
              <button 
                className={`switch-btn ${status.toLowerCase()}`}
                disabled={order.order_status === status || updatingStatus}
                onClick={() => handleStatusUpdate(status)}
              >
                {order.order_status === status ? 'Current Status' : `Switch & Send Email`}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-body">
        {/* Left Column: Product & Contact */}
        <div className="left-col">
          <div className="detail-box product-summary">
            <h4>Products in Order</h4>
            {order.items.map((item, idx) => (
              <div className="product-row" key={idx}>
                <img src={item.product_image || '/saare_1.jpeg'} alt={item.product_name} />
                <div>
                  <h5>{item.product_name}</h5>
                  <p>Qty: {item.quantity} | Selling Price: ₹{item.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="detail-box contact-box">
            <h4>Customer Contact</h4>
            <p><strong>Name:</strong> {order.user?.name}</p>
            <p><strong>Email:</strong> {order.user?.email}</p>
            <p><strong>Phone:</strong> {order.user?.checkout_address?.match(/Phone: (.*?)$/)?.[1] || 'N/A'}</p>
          </div>
        </div>

        {/* Right Column: Address & Finance */}
        <div className="right-col">
          <div className="detail-box address-box">
            <h4>Smart Address Validation</h4>
            {order.user?.profile_address === order.user?.checkout_address ? (
              <div>
                <span className="addr-tag checkout">Matched Address</span>
                <p>{order.user?.checkout_address}</p>
              </div>
            ) : (
              <div className="split-addresses">
                <div className="addr-block">
                  <span className="addr-tag checkout">Checkout Delivery Address</span>
                  <p>{order.user?.checkout_address}</p>
                </div>
                <div className="addr-block mt-2">
                  <span className="addr-tag profile">Profile Saved Address</span>
                  <p>{order.user?.profile_address || 'No profile address saved.'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="detail-box finance-box">
            <h4>Financial Summary</h4>
            <div className="finance-row"><span>Payment ID:</span> <strong>{order.payment_id}</strong></div>
            <div className="finance-row"><span>Method:</span> <strong>Online Payment</strong></div>
            <div className="finance-row total-row">
              <span>User Paid:</span> 
              <strong className="highlight">₹{order.total_amount}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;