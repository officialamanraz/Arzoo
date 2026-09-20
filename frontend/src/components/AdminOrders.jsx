import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../getImageUrl';
import socket from '../socket';
import './AdminOrders.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const statusConfig = {
  pending:    { label: 'Pending',    bg: '#fff3cd', text: '#856404', dot: '#f5b400' },
  processing: { label: 'Processing', bg: '#e0ecff', text: '#1d4ed8', dot: '#3b82f6' },
  shipped:    { label: 'Shipped',    bg: '#e0f2fe', text: '#0369a1', dot: '#0ea5e9' },
  delivered:  { label: 'Delivered',  bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  cancelled:  { label: 'Cancelled',  bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' }
};

const statusOrder = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [liveUpdateFlash, setLiveUpdateFlash] = useState(null);
  const [stats, setStats] = useState({
    total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0
  });

  useEffect(() => {
    fetchOrders();

    socket.on('order_updated', (data) => {
      const updatedOrder = data.order;
      setOrders((prevOrders) => {
        const exists = prevOrders.find(o => o.order_id === updatedOrder.order_id);
        let newOrders;
        if (exists) {
          newOrders = prevOrders.map((o) =>
            o.order_id === updatedOrder.order_id ? { ...o, ...updatedOrder } : o
          );
        } else {
          newOrders = [updatedOrder, ...prevOrders];
        }
        calculateStats(newOrders);
        return newOrders;
      });

      setLiveUpdateFlash(updatedOrder.order_id);
      setTimeout(() => setLiveUpdateFlash(null), 3000);
    });

    return () => {
      socket.off('order_updated');
    };
  }, []);

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.status === filterStatus));
    }
  }, [orders, filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/admin/all`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (res.success) {
        const allOrders = res.data || [];
        setOrders(allOrders);
        calculateStats(allOrders);
      }
    } catch (err) {
      console.error('[AdminOrders] Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const newStats = {
      total: ordersData.length,
      pending: ordersData.filter(o => o.status === 'pending').length,
      processing: ordersData.filter(o => o.status === 'processing').length,
      shipped: ordersData.filter(o => o.status === 'shipped').length,
      delivered: ordersData.filter(o => o.status === 'delivered').length
    };
    setStats(newStats);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
  };

  const handleStatusChange = async (order, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/admin/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: order.order_id,
          newStatus,
          adminNote: `Order status updated to ${newStatus}`
        })
      });
      const res = await response.json();
      if (res.success) {
        const updatedOrders = orders.map((o) =>
          o.order_id === order.order_id ? { ...o, status: newStatus } : o
        );
        setOrders(updatedOrders);
        calculateStats(updatedOrders);
      } else {
        alert('Failed to update status: ' + res.message);
      }
    } catch (err) {
      console.error('[AdminOrders] Error updating status:', err);
      alert('Error updating status');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-orders-page">
      <div className="orders-container">

        <div className="orders-header">
          <div>
            <h1>Order Management</h1>
            <p className="orders-subtitle">Track and update customer orders in real time</p>
          </div>
          <button className="back-btn" onClick={() => navigate('/admin')}>
            ← Back to Admin Panel
          </button>
        </div>

        <div className="stats-grid">
          <StatCard label="Total Orders" count={stats.total} color="#6366f1" />
          <StatCard label="Pending" count={stats.pending} color="#f5b400" />
          <StatCard label="Processing" count={stats.processing} color="#3b82f6" />
          <StatCard label="Shipped" count={stats.shipped} color="#0ea5e9" />
          <StatCard label="Delivered" count={stats.delivered} color="#22c55e" />
        </div>

        <div className="filter-section">
          <div className="filter-pills">
            {['all', ...statusOrder].map((s) => (
              <button
                key={s}
                className={`filter-pill ${filterStatus === s ? 'active' : ''}`}
                onClick={() => handleFilterChange(s)}
              >
                {s === 'all' ? 'All' : statusConfig[s].label}
              </button>
            ))}
          </div>
          <p className="filter-info">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <p>No orders found with this filter.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const firstItem = order.items?.[0];

              return (
                <div
                  key={order.order_id}
                  className={`order-card ${liveUpdateFlash === order.order_id ? 'order-card-flash' : ''}`}
                  onClick={() => navigate(`/admin/orders/${order.order_id}`)}
                >
                  {/* 1. Header */}
                  <div className="order-header-new">
                    <div className="customer-profile">
                      <span className="customer-avatar">
                        {(order.user_name || 'U').charAt(0).toUpperCase()}
                      </span>
                      <span className="customer-name">{order.user_name || 'Unknown Customer'}</span>
                    </div>
                    <span className="order-id">#{order.order_id}</span>
                  </div>

                  {/* 2. Media */}
                  <div className="order-main-image">
                    {firstItem?.image_url ? (
                      <img src={getImageUrl(firstItem.image_url)} alt={firstItem?.name} />
                    ) : (
                      <div className="img-placeholder">📦</div>
                    )}
                    {order.items?.length > 1 && (
                      <div className="more-items-badge">+{order.items.length - 1} more item(s)</div>
                    )}
                  </div>

                  {/* 3 & 4. Details & Pricing */}
                  <div className="order-product-details">
                    <div className="product-name-qty">
                      <span className="product-name">{firstItem?.name || 'Unknown Product'}</span>
                      <span className="product-qty">Qty: {firstItem?.quantity || 1}</span>
                    </div>
                    <div className="order-product-price">
                      ₹{Number(order.total_amount).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Cleaned up Contact & Payment Info Block */}
                  <div className="admin-order-extra-details">
                    <p>
                      <strong>📞 Phone:</strong> {order.phone || order.customer_phone || 'N/A'}
                    </p>
                    <p>
                      <strong>💳 Payment:</strong> {' '}
                      {order.payment_status === 'paid' || order.payment_status === 'success' ? (
                        <span className="badge-paid">Paid ✅ (Webhook)</span>
                      ) : (
                        <span className="badge-unpaid">Unpaid ❌</span>
                      )}
                    </p>
                    {order.tracking_ref && (
                      <p>
                        <strong>🔗 Dealer Ref:</strong> <span className="dealer-ref-text">{order.tracking_ref}</span>
                      </p>
                    )}
                  </div>

                  {/* 5. Footer */}
                  <div className="order-footer-new">
                    <div className="order-time-display">
                      <span className="time-label">Ordered at</span>
                      <span className="time-label time-value">{formatDate(order.ordered_at)}</span>
                    </div>

                    <div className="status-update-section" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        className="status-select"
                        style={{ backgroundColor: config.bg, color: config.text }}
                      >
                        {statusOrder.map((s) => (
                          <option key={s} value={s}>{statusConfig[s].label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, count, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <p className="stat-label">{label}</p>
      <h2 className="stat-count" style={{ color }}>{count}</h2>
    </div>
  );
}

export default AdminOrders;