import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://arzoo-saree.onrender.com';

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
      console.log("Admin Orders Response:", res);

      if (res.success) {
        const allOrders = res.data || [];
        setOrders(allOrders);
        setFilteredOrders(allOrders);
        calculateStats(allOrders);
      } else {
        console.error("Orders fetch failed:", res.message);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
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
    if (status === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.status === status));
    }
  };

  // Fixed: Accepts the full 'order' object now
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
          orderId: order.order_id,   // backend looks up by payment_id
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
        
        // Ensure the filter updates smoothly
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
      console.error('Error updating status:', err);
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
    return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Orders... ⏳</div>;
  }

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '30px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header with Back Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#333' }}>📦 Order Management</h1>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ← Back to Admin Panel
          </button>
        </div>

        {/* Stats Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <StatBadge label="Total Orders" count={stats.total} bgColor="#007bff" />
          <StatBadge label="Pending" count={stats.pending} bgColor="#ffc107" />
          <StatBadge label="Processing" count={stats.processing} bgColor="#17a2b8" />
          <StatBadge label="Shipped" count={stats.shipped} bgColor="#20c997" />
          <StatBadge label="Delivered" count={stats.delivered} bgColor="#28a745" />
        </div>

        {/* Filter Dropdown */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ marginRight: '10px', fontWeight: 'bold', color: '#333' }}>Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '1em',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
          <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '0.9em' }}>
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>

        {/* Orders Cards */}
        {filteredOrders.length === 0 ? (
          <div style={{
            background: '#fff',
            padding: '50px',
            textAlign: 'center',
            borderRadius: '12px',
            color: '#666'
          }}>
            <p>No orders found with this filter.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {filteredOrders.map((order) => (
              <div
                key={order.order_id}
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #eee',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                {/* Order Header */}
                <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>Order #{order.order_id}</h3>
                      <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.9em' }}>
                        📅 {formatDate(order.ordered_at)}
                      </p>
                    </div>
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        backgroundColor: statusColors[order.status]?.bg,
                        color: statusColors[order.status]?.text,
                        fontWeight: 'bold',
                        fontSize: '0.85em',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {statusColors[order.status]?.icon} {order.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div style={{ marginBottom: '15px', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '0.9em' }}>👤 Customer:</p>
                  <p style={{ margin: '0', fontWeight: '500', color: '#333' }}>{order.user_id}</p>
                </div>

                {/* Items */}
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.9em', fontWeight: 'bold' }}>📦 Items:</p>
                  {order.items && order.items.length > 0 ? (
                    <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ padding: '6px 0', borderBottom: idx !== order.items.length - 1 ? '1px solid #eee' : 'none', fontSize: '0.9em' }}>
                          <span style={{ fontWeight: '500', color: '#333' }}>{item.name}</span>
                          <span style={{ color: '#666', marginLeft: '8px' }}>x{item.quantity}</span>
                          <span style={{ color: '#d63031', marginLeft: '8px', fontWeight: 'bold' }}>₹{(item.quantity * item.unit_price).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#999', fontSize: '0.9em' }}>No items</p>
                  )}
                </div>

                {/* Total */}
                <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, color: '#666' }}>Total Amount:</p>
                    <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold', color: '#d63031' }}>
                      ₹{Number(order.total_amount).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Status Change - FIXED TO PASS ENTIRE ORDER OBJECT */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#666', fontWeight: '500' }}>
                    Change Status:
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '0.9em',
                      cursor: 'pointer',
                      fontWeight: '500',
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
function StatBadge({ label, count, bgColor }) {
  return (
    <div
      style={{
        background: bgColor,
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', opacity: 0.9 }}>{label}</p>
      <h2 style={{ margin: 0, fontSize: '2em', fontWeight: 'bold' }}>{count}</h2>
    </div>
  );
}

export default AdminOrders;