import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../getImageUrl';
import './AdminBanners.css';

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
  const [image, setImage] = useState(null);             // Desktop Image File
  const [mobileImage, setMobileImage] = useState(null); // Mobile Image File
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBanners = async () => {
    console.log('[AdminBanners] Fetching banners...');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/banners/all`);
      const result = await response.json();
      console.log('[AdminBanners] Fetched result:', result);
      if (result.success) setBanners(result.data);
    } catch (err) {
      console.error('[AdminBanners] Fetch error:', err.message);
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
    setMobileImage(null);
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[AdminBanners] Submitting banner form with dual assets...', form);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('subtitle', form.subtitle);
    formData.append('button_text', form.button_text);
    formData.append('button_link', form.button_link);
    formData.append('display_order', form.display_order);
    formData.append('is_active', form.is_active ? '1' : '0');

    // Append both desktop and mobile images if selected
    if (image) formData.append('image', image);
    if (mobileImage) formData.append('mobile_image', mobileImage);

    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/banners/${editId}`
        : `${API_BASE_URL}/api/banners`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, { method, body: formData });
      if (response.ok) {
        alert(isEditing ? 'Banner updated successfully!' : 'Banner added successfully!');
        fetchBanners();
        resetForm();
      } else {
        alert('Something went wrong. Server error.');
      }
    } catch (err) {
      console.error('[AdminBanners] Submission error:', err);
      alert('Unable to connect to the backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    console.log('[AdminBanners] Editing banner:', banner);
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
    setMobileImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    console.log(`[AdminBanners] Deleting banner ID: ${id}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchBanners();
      } else {
        alert('Failed to delete the banner.');
      }
    } catch (err) {
      console.error('[AdminBanners] Delete error:', err);
      alert('Delete failed.');
    }
  };

  if (loading) return <div className="admin-loading">Loading banners...</div>;

  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>Banner Manager (Desktop & Mobile)</h2>
        <div className="stat-badge">Total Banners: <strong>{banners.length}</strong></div>
      </div>

      <div className="admin-layout">
        {/* Left: Form */}
        <div className="admin-form-glass banner-form-section">
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
              <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', marginTop: '28px' }}>
                <input type="checkbox" checked={form.is_active} onChange={handleChange('is_active')} id="is_active" style={{ marginRight: '8px', width: '18px', height: '18px' }} />
                <label htmlFor="is_active" style={{ margin: 0, cursor: 'pointer' }}>Active (Visible on homepage)</label>
              </div>
            </div>

            {/* 💻 Desktop Banner Upload */}
            <div className="form-group">
              <label>🖥️ Desktop Banner Image (Landscape)</label>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                className="admin-file-input"
                accept="image/*"
                required={!isEditing}
              />
              {isEditing && <small className="edit-note">Leave empty to keep existing desktop image.</small>}
            </div>

            {/* 📱 Mobile Banner Upload */}
            <div className="form-group">
              <label>📱 Mobile Banner Image (Portrait / Vertical - Optional)</label>
              <input
                type="file"
                onChange={(e) => setMobileImage(e.target.files[0])}
                className="admin-file-input"
                accept="image/*"
              />
              <small className="edit-note">If not uploaded, desktop image will be scaled on mobile.</small>
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
        <div className="admin-list-glass banner-list-section">
          <h3>All Banners</h3>
          <div className="admin-table-container">
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px' }}>Desktop</th>
                  <th style={{ padding: '10px' }}>Mobile</th>
                  <th style={{ padding: '10px' }}>Title</th>
                  <th style={{ padding: '10px' }}>Order</th>
                  <th style={{ padding: '10px' }}>Active</th>
                  <th style={{ padding: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state" style={{ textAlign: 'center', padding: '20px' }}>No banners found.</td></tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner.banner_id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>
                        <img
                          src={getImageUrl(banner.image_url)}
                          alt="Desktop"
                          style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => e.target.src = '/saare_1.jpeg'}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        {banner.mobile_image_url ? (
                          <img
                            src={getImageUrl(banner.mobile_image_url)}
                            alt="Mobile"
                            style={{ width: '30px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => e.target.src = '/saare_1.jpeg'}
                          />
                        ) : (
                          <span style={{ fontSize: '11px', color: '#888' }}>Using Desktop</span>
                        )}
                      </td>
                      <td className="admin-list-name" style={{ padding: '10px', fontWeight: '500' }}>{banner.title || '—'}</td>
                      <td style={{ padding: '10px' }}>{banner.display_order}</td>
                      <td style={{ padding: '10px' }}>{banner.is_active ? '✅' : '❌'}</td>
                      <td className="admin-list-actions" style={{ padding: '10px' }}>
                        <button onClick={() => handleEdit(banner)} className="action-btn edit-btn" style={{ marginRight: '6px', padding: '6px 12px', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(banner.banner_id)} className="action-btn delete-btn" style={{ padding: '6px 12px', cursor: 'pointer' }}>Delete</button>
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