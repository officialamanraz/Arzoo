import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNav from './AdminNav';
import './AdminAddDealer.css';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';

function AdminAddDealer() {
  const navigate = useNavigate();
  const { id } = useParams(); // Agar URL mein ID hai, matlab hum Edit mode mein hain
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    razorpay_linked_account_id: '',
    commission_percentage: 0,
    status: 'active'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Agar Edit mode hai, toh pehle se registered dealer ka data fetch karke form mein bharein
  useEffect(() => {
    if (isEditMode) {
      console.log(`[ADMIN_DEALER_FORM] 🔄 Edit mode active. Fetching details for Dealer ID: ${id}`);
      fetchDealerForEdit();
    }
  }, [id]);

  const fetchDealerForEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      // Yeh wahi admin detail API hai jo humne pehle banai thi
      const response = await fetch(`${API_BASE_URL}/api/dealer/admin/dealer/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();

      if (res && res.success && res.data?.dealer) {
        const d = res.data.dealer;
        console.log('[ADMIN_DEALER_FORM] ✅ Dealer data fetched for editing:', d);
        
        setFormData({
          name: d.name || '',
          email: d.email || '',
          phone: d.phone || '',
          razorpay_linked_account_id: d.razorpay_linked_account_id || '',
          commission_percentage: d.commission_percentage || 0,
          status: d.status || 'active'
        });

        if (d.image_url) {
          setImagePreview(d.image_url);
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to load dealer details for editing.' });
      }
    } catch (err) {
      console.error('[ADMIN_DEALER_FORM] ❌ Error fetching dealer for edit:', err);
      setMessage({ type: 'error', text: 'Network error while fetching dealer details.' });
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('[ADMIN_DEALER_FORM] 🖼️ New image selected:', file.name);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    console.log(isEditMode ? `[ADMIN_DEALER_FORM] 🚀 Updating Dealer ID: ${id}...` : '[ADMIN_DEALER_FORM] 🚀 Registering new dealer...', formData);

    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('razorpay_linked_account_id', formData.razorpay_linked_account_id);
      submitData.append('commission_percentage', formData.commission_percentage);
      submitData.append('status', formData.status);

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      // Dynamic URL & Method: POST for Add, PUT for Update
      const endpoint = isEditMode 
        ? `${API_BASE_URL}/api/dealer/admin/update/${id}` 
        : `${API_BASE_URL}/api/dealer/admin/add`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      const res = await response.json();
      console.log('[ADMIN_DEALER_FORM] Server response:', res);

      if (res.success) {
        const successMsg = isEditMode ? 'Dealer updated successfully!' : 'Dealer successfully registered in the system!';
        console.log(`[ADMIN_DEALER_FORM] ✅ ${successMsg}`);
        setMessage({ type: 'success', text: successMsg });

        setTimeout(() => {
          navigate('/admin/dealers');
        }, 1500);
      } else {
        console.warn('[ADMIN_DEALER_FORM] ⚠️ Server rejected request:', res.message);
        setMessage({ type: 'error', text: res.message || 'Operation failed.' });
      }
    } catch (error) {
      console.error('[ADMIN_DEALER_FORM] ❌ Error:', error);
      setMessage({ type: 'error', text: 'Network connection error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="admin-wrapper" style={{ padding: '60px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading Dealer Details for Editing...</p>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>{isEditMode ? `✏️ Edit Dealer (ID: #${id})` : '➕ Register New Dealer'}</h2>
      </div>

      <AdminNav />

      <div className="admin-add-dealer-container">
        <div className="form-card">
          <p className="form-description">
            {isEditMode ? 'Update the vendor details below and save changes.' : "Enter the vendor's details below to onboard them into the management system."}
          </p>

          {message.text && (
            <div className={`message-box ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="dealer-form">
            <h3 className="section-heading">Basic Information</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Dealer / Business Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Aman Saree Emporium"
                />
              </div>

              <div className="input-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="aman@example.com"
                />
              </div>

              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="input-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="active">Active (Can supply products)</option>
                  <option value="pending">Pending (Under review)</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Dealer Photo / Logo (Optional)</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="dealer-preview-img"
                  />
                )}
              </div>
            </div>

            <h3 className="section-heading" style={{ marginTop: '30px' }}>Financial Settings</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Razorpay Account ID (Optional)</label>
                <input
                  type="text"
                  name="razorpay_linked_account_id"
                  value={formData.razorpay_linked_account_id}
                  onChange={handleChange}
                  placeholder="acc_XYZ12345"
                />
                <small>Used for automated payouts if connected to Razorpay Route.</small>
              </div>

              <div className="input-group">
                <label>Default Commission % (Admin Cut)</label>
                <input
                  type="number"
                  name="commission_percentage"
                  value={formData.commission_percentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <small>Percentage of gross revenue that goes to the platform.</small>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/admin/dealers')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? (isEditMode ? 'Updating...' : 'Adding Dealer...') : (isEditMode ? 'Update Dealer' : 'Register Dealer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminAddDealer;