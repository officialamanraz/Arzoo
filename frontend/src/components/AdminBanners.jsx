import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const emptyForm = {
  title: '',
  subtitle: '',
  button_text: '',
  button_link: '',
  display_order: '0',
  is_active: true
};

function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/banners/all`);
      const result = await response.json();
      if (result.success) setBanners(result.data);
    } catch (err) {
      console.error('[ADMIN BANNER] fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleChange = (field) => (e) => {
    const value = field === 'is_active' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImage(null);
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('subtitle', form.subtitle);
    formData.append('button_text', form.button_text);
    formData.append('button_link', form.button_link);
    formData.append('display_order', form.display_order);
    formData.append('is_active', form.is_active ? '1' : '0');
    if (image) formData.append('image', image);

    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/banners/${editId}`
        : `${API_BASE_URL}/api/banners`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, { method, body: formData });
      if (response.ok) {
        alert(isEditing ? 'Banner updated!' : 'Banner added!');
        fetchBanners();
        resetForm();
      } else {
        alert('Kuch galat ho gaya. Server error.');
      }
    } catch (err) {
      alert('Backend se connect nahi ho pa raha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    setIsEditing(true);
    setEditId(banner.banner_id);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      button_text: banner.button_text || '',
      button_link: banner.button_link || '',
      display_order: String(banner.display_order ?? 0),
      is_active: !!banner.is_active
    });
    setImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ye banner delete karna hai?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, { method: 'DELETE' });
      if (response.ok) fetchBanners();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  if (loading) return <div className="admin-loading">Banners load ho rahe hain...</div>;

  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>Banner Manager</h2>
        <div className="stat-badge">Total Banners: <strong>{banners.length}</strong></div>
      </div>

      <div className="admin-layout">
        {/* Left: Form */}
        <div className="admin-form-glass">
          <h3>{isEditing ? 'Edit Banner' : 'Add New Banner'}</h3>
          <form onSubmit={handleSubmit} className="admin-form">

            <div className="form-group">
              <label>Title</label>
              <input type="text" value={form.title} onChange={handleChange('title')} className="admin-input" placeholder="e.g. New Kota Doria Collection" />
            </div>

            <div className="form-group">
              <label>Subtitle</label>
              <input type="text" value={form.subtitle} onChange={handleChange('subtitle')} className="admin-input" placeholder="e.g. Handwoven from Kaithoon, Kota" />
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Button Text</label>
                <input type="text" value={form.button_text} onChange={handleChange('button_text')} className="admin-input" placeholder="Shop Now" />
              </div>
              <div className="form-group">
                <label>Button Link</label>
                <input type="text" value={form.button_link} onChange={handleChange('button_link')} className="admin-input" placeholder="/category/kota-doria" />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Display Order</label>
                <input type="number" value={form.display_order} onChange={handleChange('display_order')} className="admin-input" min="0" />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                <input type="checkbox" checked={form.is_active} onChange={handleChange('is_active')} id="is_active" />
                <label htmlFor="is_active" style={{ margin: 0 }}>Active (homepage pe dikhega)</label>
              </div>
            </div>

            <div className="form-group">
              <label>Banner Image</label>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                className="admin-file-input"
                accept="image/*"
                required={!isEditing}
              />
              {isEditing && <small className="edit-note">Leave empty to keep existing image.</small>}
            </div>

            <button type="submit" disabled={isSubmitting} className="admin-submit-btn">
              {isSubmitting ? 'Processing...' : (isEditing ? 'Update Banner' : 'Add Banner')}
            </button>

            {isEditing && (
              <button type="button" onClick={resetForm} className="admin-cancel-btn">
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Right: List */}
        <div className="admin-list-glass">
          <h3>All Banners</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Order</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Koi banner nahi mila.</td></tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner.banner_id}>
                      <td>
                        <img
                          src={`${API_BASE_URL}/uploads/${banner.image_url}`}
                          alt={banner.title || 'Banner'}
                          className="admin-list-img"
                          onError={(e) => e.target.src = '/saare_1.jpeg'}
                        />
                      </td>
                      <td className="admin-list-name">{banner.title || '—'}</td>
                      <td>{banner.display_order}</td>
                      <td>{banner.is_active ? '✅' : '❌'}</td>
                      <td className="admin-list-actions">
                        <button onClick={() => handleEdit(banner)} className="action-btn edit-btn">Edit</button>
                        <button onClick={() => handleDelete(banner.banner_id)} className="action-btn delete-btn">Delete</button>
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

export default AdminBanners;