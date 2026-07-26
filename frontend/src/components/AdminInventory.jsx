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
      // 1. Get the token from wherever you saved it during login (e.g., localStorage)
      const token = localStorage.getItem('token'); // Change 'token' if you saved it under a different key

      const response = await fetch(`${API_BASE_URL}/api/products/product/${id}`, { 
        method: 'DELETE',
        // 2. Attach the Authorization header
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchProducts();
      } else {
        // Optional: Handle backend error messages nicely
        const errorData = await response.json();
        alert(`Delete failed: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failed due to a network or server error.');
    }
  };
  if (loading) return <div className="admin-loading">Loading Inventory...</div>;

  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>Product Inventory</h2>
        <div className="stat-badge">Total Products in DB: <strong>{products.length}</strong></div>
      </div>

      <AdminNav />

      <button
        onClick={() => navigate('/admin/add-product')}
        className="admin-submit-btn admin-add-new-btn"
      >
        ➕ Add New Product
      </button>

      <div className="admin-list-glass admin-list-glass-full">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="4" className="admin-empty-row">No products found.</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product.product_id}>
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