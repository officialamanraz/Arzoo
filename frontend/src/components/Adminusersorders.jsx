import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Adminusersoders.css'; // Importing the separate CSS file

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status Update States
  const [customMessage, setCustomMessage] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Assuming your backend URL is set up
      const response = await axios.get('/api/orders/userorders');
      setOrders(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  };

  // 1. Smart Search: Matches Customer Name OR Product Name
  const filteredOrders = orders.filter(order => {
    const matchUser = order.user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProduct = order.items.some(item => 
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchUser || matchProduct;
  });

  // 2. Handle Status Switch / Trigger Email
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await axios.post('/api/emails/order-status', {
        order_id: orderId,
        status: newStatus,
        customMessage: customMessage,
        tracking_number: trackingNumber
      });
      
      // Update local state to reflect change without reloading
      setOrders(orders.map(o => o.order_id === orderId ? { ...o, order_status: newStatus } : o));
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, order_status: newStatus });
      }
      
      alert(`Status updated to ${newStatus} and email sent!`);
      setCustomMessage(''); // Reset input
      setTrackingNumber('');
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status and send email.");
    }
    setUpdatingStatus(false);
  };

  const closeCard = () => {
    setSelectedOrder(null);
    setCustomMessage('');
    setTrackingNumber('');
  };

  if (loading) return <div className="loader">Loading Orders...</div>;

  return (
    <div className="admin-orders-container">
      <div className="orders-header">
        <h2>Order Management</h2>
        <input 
          type="text" 
          className="search-bar" 
          placeholder="Search by Product Name or Customer Name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid of Order Cards */}
      <div className="orders-grid">
        {filteredOrders.map(order => {
          const mainProduct = order.items[0]; // Assuming first item is the main cover
          return (
            <div className="order-card" key={order.order_id} onClick={() => setSelectedOrder(order)}>
              <div className="card-image-wrapper">
                <img 
                  src={mainProduct?.product_image || '/saare_1.jpeg'} 
                  alt={mainProduct?.product_name} 
                  className="card-cover-image" 
                />
                <span className={`status-badge ${order.order_status?.toLowerCase()}`}>
                  {order.order_status}
                </span>
              </div>
              <div className="card-info">
                <h3>{order.user.name}</h3>
                <p className="sub-text">Order #{order.order_id}</p>
                <p className="price-text">₹{order.total_amount}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={closeCard}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeCard}>&times;</button>
            
            <div className="modal-header">
              <h2>Order #{selectedOrder.order_id} Details</h2>
              <span className={`status-badge ${selectedOrder.order_status?.toLowerCase()}`}>
                {selectedOrder.order_status}
              </span>
            </div>

            {/* STATUS UPDATE SWITCH CARDS */}
            <div className="status-update-section">
              <h3>Update Status & Notify User</h3>
              <div className="status-cards-row">
                {['Processing', 'Shipped', 'Delivered'].map(status => (
                  <div className={`status-action-card ${selectedOrder.order_status === status ? 'active' : ''}`} key={status}>
                    <h4>{status}</h4>
                    <textarea 
                      placeholder={`Custom message for ${status}... (Leave blank for default)`}
                      value={selectedOrder.order_status === status ? '' : customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      disabled={selectedOrder.order_status === status}
                    />
                    {status === 'Shipped' && (
                      <input 
                        type="text" 
                        placeholder="Tracking AWB Number" 
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        disabled={selectedOrder.order_status === status}
                      />
                    )}
                    <button 
                      className={`switch-btn ${status.toLowerCase()}`}
                      disabled={selectedOrder.order_status === status || updatingStatus}
                      onClick={() => handleStatusUpdate(selectedOrder.order_id, status)}
                    >
                      {selectedOrder.order_status === status ? 'Current Status' : `Switch to ${status}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-body">
              {/* Left Column: Product & Contact */}
              <div className="left-col">
                <div className="product-summary">
                  {selectedOrder.items.map((item, idx) => (
                    <div className="product-row" key={idx}>
                      <img src={item.product_image || '/saare_1.jpeg'} alt={item.product_name} />
                      <div>
                        <h4>{item.product_name}</h4>
                        <p>Qty: {item.quantity} | Selling Price: ₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="contact-box">
                  <h4>Contact Info</h4>
                  <p><strong>Email:</strong> {selectedOrder.user.email}</p>
                  <p><strong>Phone:</strong> {selectedOrder.user.checkout_address?.match(/Phone: (.*?)$/)?.[1] || 'N/A'}</p>
                </div>
              </div>

              {/* Right Column: Address & Finance */}
              <div className="right-col">
                <div className="address-box">
                  <h4>Smart Address</h4>
                  {selectedOrder.user.profile_address === selectedOrder.user.checkout_address ? (
                    <div>
                      <span className="addr-tag">Matched Address</span>
                      <p>{selectedOrder.user.checkout_address}</p>
                    </div>
                  ) : (
                    <div className="split-addresses">
                      <div className="addr-block">
                        <span className="addr-tag checkout">Checkout Delivery Address</span>
                        <p>{selectedOrder.user.checkout_address}</p>
                      </div>
                      <div className="addr-block mt-2">
                        <span className="addr-tag profile">Profile Saved Address</span>
                        <p>{selectedOrder.user.profile_address || 'No profile address saved.'}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="finance-box">
                  <h4>Financial & Payment Summary</h4>
                  <div className="finance-row"><span>Payment ID:</span> <strong>{selectedOrder.payment_id}</strong></div>
                  <div className="finance-row"><span>Payment Method:</span> <strong>Online Payment</strong></div>
                  <div className="finance-row"><span>Total Paid by User:</span> <strong className="highlight">₹{selectedOrder.total_amount}</strong></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;