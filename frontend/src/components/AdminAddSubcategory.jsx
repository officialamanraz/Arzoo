import React, { useState, useEffect } from 'react';
import './AdminAddSubcategory.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function AdminAddSubcategory() {
  const [subcategoryName, setSubcategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/subcategories/`);

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
           throw new Error("Received HTML instead of JSON. Verify backend endpoint.");
        }

        const data = await response.json();
        if (data && data.data) {
          setCategories(data.data);
          if (data.data.length > 0) {
            setCategoryId(String(data.data[0].category_id));
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error.message);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/subcategories/add-subcategory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subcategory_name: subcategoryName,
          category_id: categoryId
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Subcategory added successfully!');
        setSubcategoryName('');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error.message);
      alert('Failed to add subcategory. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subcategory-page-wrapper">
      <div className="admin-form-glass">
        <h2>Add New Subcategory</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category:</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="admin-input"
              required
            >
              <option value="" disabled>Select Category...</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subcategory Name:</label>
            <input
              type="text"
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              placeholder="e.g., Bridal Wear"
              className="admin-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-submit-btn"
          >
            {loading ? 'Adding...' : 'Add Subcategory'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminAddSubcategory;