import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './OrderTracking.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Same status set used across Admin/User order pages -- keep in sync
const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS = {
  pending: 'Order Placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

function OrderTrackingPage() {
  const { orderId } = useParams(); // this is the payment_id, e.g. ORD-1719999999999
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTracking = async () => {
      console.log(`[OrderTracking] Fetching tracking info for order: ${orderId}`);
      setLoading(true);
      const token = localStorage.getItem('token');

      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/tracking/${orderId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const res = await response.json();
        console.log('[OrderTracking] Server response:', res);
        
        if (res.success) {
          setData(res);
        } else {
          console.warn('[OrderTracking] Order not found or error:', res.message);
          setError(res.message || 'Order not found');
        }
      } catch (err) {
        console.error('[OrderTracking] Error fetching tracking details:', err);
        setError('Could not load tracking info. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [orderId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="tracking-loading">Loading tracking details... ⏳</div>;
  }

  if (error) {
    return (
      <div className="tracking-error">
        <h2>{error}</h2>
        <Link to="/my-orders" className="back-link">← Back to My Orders</Link>
      </div>
    );
  }

  const { currentStatus, orderedAt, history } = data;
  const isCancelled = currentStatus === 'cancelled';
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="tracking-page">
      <div className="tracking-container">
        <Link to="/my-orders" className="back-link-small">
          ← Back to My Orders
        </Link>

        <div className="tracking-card">
          
          {/* Header */}
          <div className="tracking-header">
            <h2>Order {orderId}</h2>
            <p>Placed on {formatDate(orderedAt)}</p>
          </div>

          {/* Timeline */}
          {!isCancelled ? (
            <div className="timeline-container">
              <div className="timeline-line-background" />
              {STATUS_FLOW.map((status, idx) => {
                const completed = idx <= currentIndex;
                const active = idx === currentIndex;
                return (
                  <div key={status} className="timeline-step">
                    <div className={`timeline-circle ${completed ? 'completed' : ''} ${active ? 'active' : ''}`} />
                    <div className={`timeline-label ${completed ? 'label-completed' : ''}`}>
                      {STATUS_LABELS[status]}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cancelled-banner">
              ❌ This order was cancelled
            </div>
          )}

          {/* History */}
          <div className="history-section">
            <h3>Update History</h3>
            {history.length === 0 ? (
              <p className="no-history-text">No updates yet.</p>
            ) : (
              history.map((h, idx) => (
                <div key={idx} className={`history-item ${idx !== history.length - 1 ? 'border-bottom' : ''}`}>
                  <div className="history-header">
                    <span className="history-status">
                      {STATUS_LABELS[h.status] || h.status}
                    </span>
                    <span className="history-date">
                      {formatDate(h.updated_at)}
                    </span>
                  </div>
                  {h.status_message && (
                    <p className="history-message">
                      {h.status_message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderTrackingPage;