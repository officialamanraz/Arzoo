import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../getImageUrl'; // agar components/ folder se import kar rahe ho
import AdminNav from './AdminNav';
import './AdminInventory.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function AdminInventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // 🌟 Search State Add Ki Gayi

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/all?page=1&limit=500`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result && result.data) setProducts(result.data);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    navigate('/admin/add-product', { state: { product } });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = localStorage.getItem('token'); 

      const response = await fetch(`${API_BASE_URL}/api/products/product/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const errorData = await response.json();
        alert(`Delete failed: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failed due to a network or server error.');
    }
  };

  // 🌟 Filter Logic: Search by Name, ID, Group ID, or Color
  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(search) ||
      product.product_id?.toString().includes(search) ||
      product.group_id?.toLowerCase().includes(search) ||
      product.base_color?.toLowerCase().includes(search)
    );
  });

  if (loading) return <div className="admin-loading">Loading Inventory...</div>;

  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>Product Inventory</h2>
        <div className="stat-badge">Showing <strong>{filteredProducts.length}</strong> of {products.length}</div>
      </div>

      <AdminNav />

      {/* 🌟 Search Bar & Add Button Row */}
      <div className="inventory-actions">
        <input
          type="text"
          placeholder="🔍 Search by Name, ID, Group ID, or Color..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="inventory-search-input"
        />
        <button
          onClick={() => navigate('/admin/add-product')}
          className="admin-submit-btn admin-add-new-btn"
        >
          ➕ Add New Product
        </button>
      </div>

      <div className="admin-list-glass admin-list-glass-full">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID / Group</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan="5" className="admin-empty-row" style={{textAlign: 'center', padding: '20px'}}>No matching products found.</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.product_id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>#{product.product_id}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{product.group_id || 'No Group'}</div>
                    </td>
                    <td>
                      <img
                        src={getImageUrl(product.image_url)}
                        alt={product.name || 'Product'}
                        className="admin-list-img"
                        onError={(e) => e.target.src = '/saare_1.jpeg'}
                      />
                    </td>
                    <td className="admin-list-name">{product.name}</td>
                    <td className="admin-list-price">₹{product.price}</td>
                    <td className="admin-list-actions">
                      <button onClick={() => handleEdit(product)} className="action-btn edit-btn">Edit</button>
                      <button onClick={() => handleDelete(product.product_id)} className="action-btn delete-btn">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminInventory;