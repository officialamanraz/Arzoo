import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE_URL = 'https://arzoo-saree.onrender.com';

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
      setLoading(true);
      const token = localStorage.getItem('token');

      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/tracking/${orderId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const res = await response.json();
        if (res.success) {
          setData(res);
        } else {
          setError(res.message || 'Order not found');
        }
      } catch (err) {
        console.error('Error fetching tracking:', err);
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
    return <div style={{ padding: '150px', textAlign: 'center' }}>Loading tracking details... ⏳</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2 style={{ color: '#721c24' }}>{error}</h2>
        <Link to="/my-orders" style={{ color: '#A8325E' }}>← Back to My Orders</Link>
      </div>
    );
  }

  const { currentStatus, orderedAt, history } = data;
  const isCancelled = currentStatus === 'cancelled';
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '100px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <Link to="/my-orders" style={{ color: '#A8325E', textDecoration: 'none', fontSize: '0.9em' }}>
          ← Back to My Orders
        </Link>

        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '30px',
          marginTop: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#A8325E', fontFamily: 'Fraunces, serif' }}>
              Order {orderId}
            </h2>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>
              Placed on {formatDate(orderedAt)}
            </p>
          </div>

          {/* Timeline */}
          {!isCancelled ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '40px 0 48px' }}>
              <div style={{
                position: 'absolute', top: '9px', left: 0, right: 0,
                height: '2px', backgroundColor: '#e5d3c8', zIndex: 0
              }} />
              {STATUS_FLOW.map((status, idx) => {
                const completed = idx <= currentIndex;
                const active = idx === currentIndex;
                return (
                  <div key={status} style={{ position: 'relative', zIndex: 1, flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      margin: '0 auto 10px', border: '2px solid #e5d3c8',
                      backgroundColor: completed ? '#A8325E' : '#fff',
                      borderColor: completed ? '#A8325E' : '#e5d3c8',
                      boxShadow: active ? '0 0 0 4px rgba(168,50,94,0.15)' : 'none',
                      transition: 'all 0.3s ease'
                    }} />
                    <div style={{
                      fontSize: '12px',
                      fontWeight: completed ? 700 : 500,
                      color: completed ? '#333' : '#999'
                    }}>
                      {STATUS_LABELS[status]}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '16px', margin: '20px 0',
              backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', fontWeight: 'bold'
            }}>
              ❌ This order was cancelled
            </div>
          )}

          {/* History */}
          <div style={{ backgroundColor: '#fdf7f4', borderRadius: '12px', padding: '18px 20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#A8325E' }}>Update History</h3>
            {history.length === 0 ? (
              <p style={{ color: '#999', fontSize: '0.9em' }}>No updates yet.</p>
            ) : (
              history.map((h, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 0',
                    borderBottom: idx !== history.length - 1 ? '1px solid #eee0d8' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#333' }}>
                      {STATUS_LABELS[h.status] || h.status}
                    </span>
                    <span style={{ color: '#a39c94', fontSize: '13px' }}>
                      {formatDate(h.updated_at)}
                    </span>
                  </div>
                  {h.status_message && (
                    <p style={{ margin: '4px 0 0 0', color: '#8a8580', fontSize: '13px', fontStyle: 'italic' }}>
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