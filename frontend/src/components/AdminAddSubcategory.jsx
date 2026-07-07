import React, { useState } from 'react';

const API_BASE_URL = `https://arzoo-3.onrender.com';

function AdminAddSubcategory() {
  const [subcategoryName, setSubcategoryName] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/subcategories/add`, {
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
      console.error('Error:', error);
      alert('Failed to add subcategory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto', padding: '20px' }}>
      <h2>Add New Subcategory</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Category:</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="1">Sarees</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Subcategory Name:</label>
          <input
            type="text"
            value={subcategoryName}
            onChange={(e) => setSubcategoryName(e.target.value)}
            placeholder="e.g., Bridal Wear"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#d63031',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Adding...' : 'Add Subcategory'}
        </button>
      </form>
    </div>
  );
}

export default AdminAddSubcategory;