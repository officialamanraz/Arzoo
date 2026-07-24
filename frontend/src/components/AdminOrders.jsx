import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminOrders.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const statusColors = {
  pending: { bg: '#fff3cd', text: '#856404', icon: '⏳' },
  processing: { bg: '#cfe2ff', text: '#084298', icon: '⚙️' },
  shipped: { bg: '#d1ecf1', text: '#0c5460', icon: '📦' },
  delivered: { bg: '#d4edda', text: '#155724', icon: '✅' },
  cancelled: { bg: '#f8d7da', text: '#721c24', icon: '❌' }
};

function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    console.log('[AdminOrders] Fetching all orders...');
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/admin/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const res = await response.json();
      console.log('[AdminOrders] Orders fetch response:', res);

      if (res.success) {
        const allOrders = res.data || [];
        setOrders(allOrders);
        setFilteredOrders(allOrders);
        calculateStats(allOrders);
      } else {
        console.error('[AdminOrders] Orders fetch failed:', res.message);
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
    console.log('[AdminOrders] Calculated Stats:', newStats);
    setStats(newStats);
  };

  const handleFilterChange = (status) => {
    console.log(`[AdminOrders] Filtering orders by status: ${status}`);
    setFilterStatus(status);
    if (status === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.status === status));
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    console.log(`[AdminOrders] Updating order #${order.order_id} to status: ${newStatus}`);
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
      console.log('[AdminOrders] Status update response:', res);
      
      if (res.success) {
        const updatedOrders = orders.map((o) =>
          o.order_id === order.order_id ? { ...o, status: newStatus } : o
        );
        setOrders(updatedOrders);
        calculateStats(updatedOrders);
        
        if (filterStatus === 'all') {
           setFilteredOrders(updatedOrders);
        } else {
           setFilteredOrders(updatedOrders.filter(o => o.status === filterStatus));
        }
        
        alert('Order status updated! ✅');
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="admin-loading">Loading Orders... ⏳</div>;
  }

  return (
    <div className="admin-orders-page">
      <div className="orders-container">
        
        {/* Header with Back Button */}
        <div className="orders-header">
          <h1>📦 Order Management</h1>
          <button className="back-btn" onClick={() => navigate('/admin')}>
            ← Back to Admin Panel
          </button>
        </div>

        {/* Stats Badges */}
        <div className="stats-grid">
          <StatBadge label="Total Orders" count={stats.total} bgColor="#007bff" />
          <StatBadge label="Pending" count={stats.pending} bgColor="#ffc107" textColor="#333" />
          <StatBadge label="Processing" count={stats.processing} bgColor="#17a2b8" />
          <StatBadge label="Shipped" count={stats.shipped} bgColor="#20c997" />
          <StatBadge label="Delivered" count={stats.delivered} bgColor="#28a745" />
        </div>

        {/* Filter Dropdown */}
        <div className="filter-section">
          <label className="filter-label">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
          <p className="filter-info">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>

        {/* Orders Cards */}
        {filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <p>No orders found with this filter.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => (
              <div key={order.order_id} className="order-card">
                
                {/* Order Header */}
                <div className="order-card-header">
                  <div className="order-header-info">
                    <h3>Order #{order.order_id}</h3>
                    <p>📅 {formatDate(order.ordered_at)}</p>
                  </div>
                  <div 
                    className="order-status-badge"
                    style={{
                      backgroundColor: statusColors[order.status]?.bg,
                      color: statusColors[order.status]?.text
                    }}
                  >
                    {statusColors[order.status]?.icon} {order.status.toUpperCase()}
                  </div>
                </div>

                {/* User Info */}
                <div className="order-user-info">
                  <p className="user-label">👤 Customer:</p>
                  <p className="user-id">{order.user_id}</p>
                </div>

                {/* Items */}
                <div className="order-items-section">
                  <p className="items-label">📦 Items:</p>
                  {order.items && order.items.length > 0 ? (
                    <div className="order-items-list">
                      {order.items.map((item, idx) => (
                        <div key={idx} className={`order-item ${idx !== order.items.length - 1 ? 'border-bottom' : ''}`}>
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty">x{item.quantity}</span>
                          <span className="item-price">₹{(item.quantity * item.unit_price).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-items">No items</p>
                  )}
                </div>

                {/* Total */}
                <div className="order-total-section">
                  <p>Total Amount:</p>
                  <p className="total-price">
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Status Change */}
                <div className="status-update-section">
                  <label>Change Status:</label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order, e.target.value)}
                    className="status-select"
                    style={{
                      backgroundColor: statusColors[order.status]?.bg,
                      color: statusColors[order.status]?.text
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Badge Component
function StatBadge({ label, count, bgColor, textColor = 'white' }) {
  return (
    <div className="stat-badge" style={{ background: bgColor, color: textColor }}>
      <p>{label}</p>
      <h2>{count}</h2>
    </div>
  );
}

export default AdminOrders;