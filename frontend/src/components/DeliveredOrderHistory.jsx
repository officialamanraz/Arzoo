import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DeliveredOrderHistory.css'; // Import the new CSS file

const DeliveredOrderHistory = () => {
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDeliveredOrders = async () => {
      try {
        const token = localStorage.getItem('token'); 
        const response = await axios.get('/api/orders/delivered-history', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setDeliveredOrders(response.data.data.orders);
        }
      } catch (err) {
        setError('Failed to load past orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveredOrders();
  }, []);

  if (loading) {
    return <div className="state-message state-loading">Loading your luxury collection...</div>;
  }
  
  if (error) {
    return <div className="state-message state-error">{error}</div>;
  }
  
  if (deliveredOrders.length === 0) {
    return <div className="state-message state-empty">You have no past deliveries yet.</div>;
  }

  return (
    <div className="history-container">
      <h2 className="history-header">
        Your Wardrobe (Past Orders)
      </h2>

      <div className="orders-list">
        {deliveredOrders.map((order) => (
          <div key={order.order_id} className="order-card">
            
            {/* Header: Order Info */}
            <div className="order-card-header">
              <div>
                <p className="label-text">ORDER PLACED</p>
                <p className="value-text">{new Date(order.ordered_at).toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="label-text">TOTAL</p>
                <p className="price-text">₹{order.total_amount}</p>
              </div>
            </div>

            {/* Body: Product Details & Tracking Info */}
            <div className="order-card-body">
              <div className="product-info">
                {/* Product Image Box */}
                <div className="product-image-placeholder">
                  {/* <img src={item.image_url} alt="Saree" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.25rem'}} /> */}
                </div>
                
                {/* Product Details */}
                <div>
                  <h3 className="product-title">Arzoo Premium Saree</h3>
                  <p className="product-detail-text">
                    Delivered by {order.courier_partner || 'Courier'}
                  </p>
                  <p className="product-detail-text" style={{ color: '#9ca3af' }}>
                    AWB: {order.tracking_awb_number}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="action-buttons">
                <button className="btn-primary">
                  Buy Again
                </button>
                <button className="btn-secondary">
                  Write Review
                </button>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeliveredOrderHistory;