// src/components/AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Adminusersoders.css'; 

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken'); // Ensure we grab the right token
      const response = await axios.get(`${API_BASE_URL}/api/orders/userorders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Orders List Response:", response.data); // Add this to debug!
      setOrders(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error.response?.data || error.message);
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchUser = order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProduct = order.items?.some(item => 
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchUser || matchProduct;
  });

  if (loading) return <div className="admin-orders-container"><div className="loader">Loading Orders...</div></div>;

  return (
    <div className="admin-orders-container">
      <div className="orders-header">
        <h2>Order Management</h2>
        <input 
          type="text" 
          className="search-bar" 
          placeholder="Search by Product or Customer Name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="orders-grid">
        {filteredOrders.map(order => {
          const mainProduct = order.items[0]; 
          return (
            <div 
              className="order-card" 
              key={order.order_id} 
              // Navigate to the full detail page when clicked
              onClick={() => navigate(`/admin/userorders/${order.order_id}`)}
            >
              <div className="card-image-wrapper">
                <img 
                  src={mainProduct?.product_image || '/saare_1.jpeg'} 
                  alt={mainProduct?.product_name} 
                  className="card-cover-image" 
                />
                <span className={`status-badge ${order.order_status?.toLowerCase() || 'processing'}`}>
                  {order.order_status || 'Processing'}
                </span>
              </div>
              <div className="card-info">
                <h3>{order.user?.name || 'Customer'}</h3>
                <p className="sub-text">Order #{order.order_id}</p>
                <p className="price-text">₹{order.total_amount}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOrders;