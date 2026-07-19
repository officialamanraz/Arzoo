import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const emptyFormState = {
  name: '',
  price: '',
  description: '',
  baseColor: '',
  categoryId: '',
  subcategoryId: '',
  stockQty: '10',
  primaryColor: '',
  otherColor: '',
  borderType: '',
  pattern: '',
  craft: '',
  weave: '',
  zariType: '',
  blouse: '',
  borderMotifs: '',
  origin: '',
  fabric: '',
  khats: '',
  weight: '',
  blouseLength: '',
  producer: '',
  maker: ''
};

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState(emptyFormState);
  const [images, setImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAdminProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/all?page=1&limit=500`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      if (result && result.data) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // NOTE: Verify this backend route. If it returns 404, check your backend routes.
      // It might need to be /api/categories/get-categories instead.
      const response = await fetch(`${API_BASE_URL}/api/category/get-categories`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories. Server responded with status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON data. Check the endpoint URL.");
      }

      const result = await response.json();
      if (result && result.data) {
        setCategories(result.data);
        setForm((prev) => ({
          ...prev,
          categoryId: prev.categoryId || String(result.data[0]?.category_id || '')
        }));
      }
    } catch (error) {
      console.error("Error fetching categories:", error.message);
    }
  };

  useEffect(() => {
    fetchAdminProducts();
    fetchCategories();
  }, []);

  // Fetch subcategories whenever the selected category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!form.categoryId) {
        setSubcategories([]);
        return;
      }
      try {
        // const response = await fetch(`${API_BASE_URL}/api/category/add-subcategory`);
        const response = await fetch(`${API_BASE_URL}/api/category/get-subcategories/${form.categoryId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch subcategories. Status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned HTML instead of JSON for subcategories.");
        }

        const result = await response.json();

        if (result && result.data) {
          setSubcategories(result.data);
          if (!isEditing && result.data.length > 0) {
            setForm((prev) => ({
              ...prev,
              subcategoryId: String(result.data[0].subcategory_id)
            }));
          }
        } else {
          setSubcategories([]);
        }
      } catch (error) {
        console.error("Error fetching subcategories:", error.message);
        setSubcategories([]);
      }
    };

    fetchSubcategories();
  }, [form.categoryId, isEditing]);

  const handleFieldChange = (field) => (e) => {
    if (field === 'categoryId') {
      setForm((prev) => ({ ...prev, [field]: e.target.value, subcategoryId: '' }));
    } else {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    }
  };

  const resetForm = () => {
    setForm({
      ...emptyFormState,
      categoryId: String(categories[0]?.category_id || '')
    });
    setImages([]);
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price', form.price);
    formData.append('description', form.description);
    formData.append('base_color', form.baseColor);
    formData.append('category_id', form.categoryId);
    formData.append('subcategory_id', form.subcategoryId);
    formData.append('stock_qty', form.stockQty);

    // Detailed saree fields
    formData.append('primary_color', form.primaryColor);
    formData.append('other_color', form.otherColor);
    formData.append('border_type', form.borderType);
    formData.append('pattern', form.pattern);
    formData.append('craft', form.craft);
    formData.append('weave', form.weave);
    formData.append('zari_type', form.zariType);
    formData.append('blouse', form.blouse);
    formData.append('border_motifs', form.borderMotifs);
    formData.append('origin', form.origin);
    formData.append('fabric', form.fabric);
    formData.append('khats', form.khats);
    formData.append('weight', form.weight);
    formData.append('blouse_length', form.blouseLength);
    formData.append('producer', form.producer);
    formData.append('maker', form.maker);

    if (images && images.length > 0) {
      Array.from(images).forEach(img => formData.append('image', img));
    }

    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/products/product/${editId}`
        : `${API_BASE_URL}/api/products/product`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, { method, body: formData });
      if (response.ok) {
        alert(isEditing ? "Product updated successfully!" : "Product added successfully!");
        fetchAdminProducts();
        resetForm();
      } else {
        alert("Action failed. Server returned an error.");
      }
    } catch (err) {
      alert("Action failed. Please check the server connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/product/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchAdminProducts();
        }
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  const handleEditSetup = (product) => {
    setIsEditing(true);
    setEditId(product.product_id);
    setForm({
      name: product.name || '',
      price: product.price || '',
      description: product.description || '',
      baseColor: product.base_color || '',
      categoryId: product.category_id ? String(product.category_id) : '',
      subcategoryId: product.subcategory_id ? String(product.subcategory_id) : '',
      stockQty: product.stock_qty != null ? String(product.stock_qty) : '10',
      primaryColor: product.primary_color || '',
      otherColor: product.other_color || '',
      borderType: product.border_type || '',
      pattern: product.pattern || '',
      craft: product.craft || '',
      weave: product.weave || '',
      zariType: product.zari_type || '',
      blouse: product.blouse || '',
      borderMotifs: product.border_motifs || '',
      origin: product.origin || '',
      fabric: product.fabric || '',
      khats: product.khats || '',
      weight: product.weight || '',
      blouseLength: product.blouse_length || '',
      producer: product.producer || '',
      maker: product.maker || ''
    });
    setImages([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="admin-loading">Loading Inventory...</div>;

  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>Admin Dashboard</h2>
        <div className="stat-badge">Total Products in DB: <strong>{products.length}</strong></div>
      </div>

      <Link
        to="/admin/orders"
        style={{
          display: 'inline-block',
          margin: '16px 0',
          padding: '12px 24px',
          backgroundColor: '#b3244c',
          color: '#fff',
          borderRadius: '8px',
          fontWeight: 'bold',
          textDecoration: 'none'
        }}
      >
        📦 View All Orders
      </Link>

      <div className="admin-layout">
        {/* Left Side: ADD / EDIT FORM */}
        <div className="admin-form-glass">
          <h3>{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} className="admin-form">

            <div className="form-group">
              <label>Product Name</label>
              <input type="text" value={form.name} onChange={handleFieldChange('name')} required className="admin-input" />
            </div>
<Link to="/admin/banners" style={{ /* same style */ }}>
  🖼️ Manage Banners
</Link>
            <div className="form-group-row">
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" value={form.price} onChange={handleFieldChange('price')} required className="admin-input" />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" value={form.stockQty} onChange={handleFieldChange('stockQty')} className="admin-input" min="0" required />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={handleFieldChange('description')} required className="admin-input" rows="3"></textarea>
            </div>

            {/* --- CATEGORY AND SUBCATEGORY --- */}
            <div className="form-group-row">
              <div className="form-group">
                <label>Category</label>
                <select value={form.categoryId} onChange={handleFieldChange('categoryId')} className="admin-input" required>
                  <option value="" disabled>Select Category...</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subcategory</label>
                <select
                  value={form.subcategoryId}
                  onChange={handleFieldChange('subcategoryId')}
                  className="admin-input"
                  required
                  disabled={!form.categoryId || subcategories.length === 0}
                >
                  <option value="" disabled>Select Subcategory...</option>
                  {subcategories.map((sub) => (
                    <option key={sub.subcategory_id} value={sub.subcategory_id}>
                      {sub.subcategory_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* --- Detailed Attributes --- */}
            <fieldset className="admin-fieldset">
              <legend>Product Details</legend>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Base Color</label>
                  <input type="text" value={form.baseColor} onChange={handleFieldChange('baseColor')} className="admin-input" placeholder="e.g. Red, Blue" />
                </div>
                <div className="form-group">
                  <label>Primary Color</label>
                  <input type="text" value={form.primaryColor} onChange={handleFieldChange('primaryColor')} className="admin-input" />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Other Color</label>
                  <input type="text" value={form.otherColor} onChange={handleFieldChange('otherColor')} className="admin-input" />
                </div>
                <div className="form-group">
                  <label>Border Type</label>
                  <input type="text" value={form.borderType} onChange={handleFieldChange('borderType')} className="admin-input" />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Pattern</label>
                  <input type="text" value={form.pattern} onChange={handleFieldChange('pattern')} className="admin-input" />
                </div>
                <div className="form-group">
                  <label>Craft</label>
                  <input type="text" value={form.craft} onChange={handleFieldChange('craft')} className="admin-input" />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Weave</label>
                  <input type="text" value={form.weave} onChange={handleFieldChange('weave')} className="admin-input" />
                </div>
                <div className="form-group">
                  <label>Zari Type</label>
                  <input type="text" value={form.zariType} onChange={handleFieldChange('zariType')} className="admin-input" />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Blouse</label>
                  <input type="text" value={form.blouse} onChange={handleFieldChange('blouse')} className="admin-input" />
                </div>
                <div className="form-group">
                  <label>Blouse Length</label>
                  <input type="text" value={form.blouseLength} onChange={handleFieldChange('blouseLength')} className="admin-input" />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Border Motifs</label>
                  <input type="text" value={form.borderMotifs} onChange={handleFieldChange('borderMotifs')} className="admin-input" />
                </div>
                <div className="form-group">
                  <label>Origin</label>
                  <input type="text" value={form.origin} onChange={handleFieldChange('origin')} className="admin-input" placeholder="e.g. Kaithoon, Kota, Rajasthan" />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Fabric</label>
                  <input type="text" value={form.fabric} onChange={handleFieldChange('fabric')} className="admin-input" />
                </div>
                <div className="form-group">
                  <label>Khats</label>
                  <input type="text" value={form.khats} onChange={handleFieldChange('khats')} className="admin-input" />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Weight</label>
                  <input type="text" value={form.weight} onChange={handleFieldChange('weight')} className="admin-input" placeholder="e.g. 600g" />
                </div>
                <div className="form-group">
                  <label>Producer</label>
                  <input type="text" value={form.producer} onChange={handleFieldChange('producer')} className="admin-input" />
                </div>
              </div>

              <div className="form-group">
                <label>Maker</label>
                <input type="text" value={form.maker} onChange={handleFieldChange('maker')} className="admin-input" />
              </div>
            </fieldset>

            <div className="form-group">
              <label>Upload Product Image(s)</label>
              <input
                type="file"
                multiple
                onChange={(e) => setImages(e.target.files)}
                className="admin-file-input"
                accept="image/*"
                required={!isEditing}
              />
              {isEditing && <small className="edit-note">Leave empty to keep existing images.</small>}
            </div>

            <button type="submit" disabled={isSubmitting} className="admin-submit-btn">
              {isSubmitting ? "Processing..." : (isEditing ? "Update Product" : "Add Product")}
            </button>

            {isEditing && (
              <button type="button" onClick={resetForm} className="admin-cancel-btn">
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Right Side: PRODUCT LIST */}
        <div className="admin-list-glass">
          <h3>Inventory List</h3>
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
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No products found.</td></tr>
                ) : (
                  products.map(product => (
                    <tr key={product.product_id}>
                      <td>
                        <img
                          src={`${API_BASE_URL}/uploads/${product.image_url || 'saare_1.jpeg'}`}
                          alt={product.name || 'Product'}
                          className="admin-list-img"
                          onError={(e) => e.target.src = '/saare_1.jpeg'}
                        />
                      </td>
                      <td className="admin-list-name">{product.name}</td>
                      <td className="admin-list-price">₹{product.price}</td>
                      <td className="admin-list-actions">
                        <button onClick={() => handleEditSetup(product)} className="action-btn edit-btn">Edit</button>
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
    </div>
  );
}

export default AdminDashboard;