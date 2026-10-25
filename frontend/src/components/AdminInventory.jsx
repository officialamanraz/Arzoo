import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getImageUrl } from '../getImageUrl';
import AdminNav from './AdminNav';
import './AdminInventory.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function AdminInventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/all?page=1&limit=500`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result && result.data) setProducts(result.data);
    } catch (error) {
      console.error('Error fetching products:', error.message);
      toast.error('Failed to load inventory.');
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
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        const errorData = await response.json();
        toast.error(`Delete failed: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Delete failed due to a network or server error.');
    }
  };

  // ⚠️ DELETE ALL INVENTORY HANDLER
  const handleDeleteAllInventory = async () => {
    const confirmFirst = window.confirm("⚠️ WARNING: Are you sure you want to delete ALL inventory items? This action cannot be undone!");
    if (!confirmFirst) return;

    const confirmSecond = window.prompt("Type 'DELETE ALL' to confirm this destructive action:");
    if (confirmSecond !== "DELETE ALL") {
      toast.error("Action cancelled. Confirmation text did not match.");
      return;
    }

    setIsDeletingAll(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory/delete-all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "All inventory deleted successfully!");
        setProducts([]); // Clear state immediately
      } else {
        toast.error(data.message || "Failed to clear inventory.");
      }
    } catch (err) {
      console.error("Network error deleting inventory:", err);
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Filter Logic: Search by Name, ID, Group ID, or Color
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

      {/* Search Bar & Action Buttons Row */}
      <div className="inventory-actions">
        <input
          type="text"
          placeholder="🔍 Search by Name, ID, Group ID, or Color..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="inventory-search-input"
        />
        <div className="inventory-btn-group">
          <button
            onClick={() => navigate('/admin/add-product')}
            className="admin-submit-btn admin-add-new-btn"
          >
            + Add New Product
          </button>
          
          {products.length > 0 && (
            <button
              onClick={handleDeleteAllInventory}
              disabled={isDeletingAll}
              className="admin-danger-btn admin-delete-all-btn"
            >
              {isDeletingAll ? 'Deleting All...' : '⚠️ Delete All Inventory'}
            </button>
          )}
        </div>
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