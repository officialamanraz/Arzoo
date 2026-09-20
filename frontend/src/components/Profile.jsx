import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [editSection, setEditSection] = useState(null); // 'name', 'email', 'phone', 'password', null
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    profile_image: ''
  });
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // NEW: State for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    setFormData({
      name: storedUser.name || '',
      email: storedUser.email || '',
      phone: storedUser.phone || '',
      currentPassword: '',
      newPassword: '',
      profile_image: storedUser.profile_image || ''
    });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0]; 
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profile_image: reader.result }));
    };
    reader.readAsDataURL(file);

    // Auto-upload image
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dataToSend = new FormData();
      dataToSend.append('image', file);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: dataToSend
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        showMessage('Profile photo updated successfully!', false);
      }
    } catch (error) {
      showMessage('Failed to upload image.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 3000);
  };

  // General Update for Name, Email, Phone
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dataToSend = new FormData();
      dataToSend.append('name', formData.name);
      dataToSend.append('email', formData.email);
      dataToSend.append('phone', formData.phone);

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: dataToSend
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showMessage('Profile updated successfully!', false);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setEditSection(null);
      } else {
        showMessage(data.message || 'Failed to update profile.', true);
      }
    } catch (error) {
      showMessage('Network error. Please try again.', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated Update for Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showMessage('Password changed successfully!', false);
        setEditSection(null);
        setFormData({ ...formData, currentPassword: '', newPassword: '' });
      } else {
        showMessage(data.message || 'Failed to change password.', true);
      }
    } catch (error) {
      showMessage('Network error. Please try again.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    window.location.reload();
  };

  return (
    <div className="profile-page-container">
      {/* SIDEBAR */}
      <div className="profile-sidebar">
        <div className="profile-sidebar-header">
          <div className="profile-avatar">
            {formData.profile_image ? (
               <img src={formData.profile_image} alt="User Avatar" />
            ) : (
               <span className="avatar-placeholder">👤</span>
            )}
            {/* Hidden Input for Image Upload */}
            <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <label htmlFor="imageUpload" className="avatar-edit-badge">📷</label>
          </div>
          <h3>{user.name || 'User'}</h3>
          <p>{user.email}</p>
        </div>
        
        <ul className="profile-menu">
          <li className="active">Login & Security</li>
          <li onClick={() => navigate('/my-orders')}>My Orders</li>
          <li onClick={handleLogout} className="logout-btn">Log Out</li>
        </ul>
      </div>

      {/* CONTENT AREA */}
      <div className="profile-content">
        <h2>Login & Security</h2>
        
        {message && (
          <div className={`status-message ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="security-list">
          
          {/* NAME ROW */}
          <div className="security-row">
            {editSection === 'name' ? (
              <form className="security-edit-form" onSubmit={handleUpdateProfile}>
                <label>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" className="cancel-btn" onClick={() => setEditSection(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="security-info">
                  <span className="security-label">Name:</span>
                  <span className="security-value">{user.name || 'Not set'}</span>
                </div>
                <button className="security-edit-btn" onClick={() => setEditSection('name')}>Edit</button>
              </>
            )}
          </div>

          {/* EMAIL ROW */}
          <div className="security-row">
            {editSection === 'email' ? (
              <form className="security-edit-form" onSubmit={handleUpdateProfile}>
                <label>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" className="cancel-btn" onClick={() => setEditSection(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="security-info">
                  <span className="security-label">E-mail:</span>
                  <span className="security-value">{user.email || 'Not set'}</span>
                </div>
                <button className="security-edit-btn" onClick={() => setEditSection('email')}>Edit</button>
              </>
            )}
          </div>

          {/* PHONE ROW */}
          <div className="security-row">
            {editSection === 'phone' ? (
              <form className="security-edit-form" onSubmit={handleUpdateProfile}>
                <label>Primary mobile number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. 9876543210" required />
                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" className="cancel-btn" onClick={() => setEditSection(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="security-info">
                  <span className="security-label">Primary mobile number:</span>
                  {user.phone ? (
                    <span className="security-value">{user.phone}</span>
                  ) : (
                    <span className="security-warning">⚠️ For stronger account security, add your mobile number.</span>
                  )}
                </div>
                <button className="security-edit-btn" onClick={() => setEditSection('phone')}>
                  {user.phone ? 'Edit' : 'Add'}
                </button>
              </>
            )}
          </div>

          {/* PASSWORD ROW */}
          <div className="security-row">
            {editSection === 'password' ? (
              <form className="security-edit-form" onSubmit={handleUpdatePassword}>
                <label>Current Password</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="currentPassword" 
                    value={formData.currentPassword} 
                    onChange={handleChange} 
                    required 
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} title="Toggle Password Visibility">
                    {showPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
                
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="newPassword" 
                    value={formData.newPassword} 
                    onChange={handleChange} 
                    required 
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} title="Toggle Password Visibility">
                    {showPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" className="cancel-btn" onClick={() => { setEditSection(null); setFormData({...formData, currentPassword: '', newPassword: ''}); setShowPassword(false); }}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="security-info">
                  <span className="security-label">Password:</span>
                  <span className="security-value">********</span>
                </div>
                <button className="security-edit-btn" onClick={() => setEditSection('password')}>Edit</button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;