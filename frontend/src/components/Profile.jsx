import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUserCircle, FaCamera, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Profile.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [editSection, setEditSection] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    profile_image: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 1. Initial Load & Fetch Fresh Profile Data
  useEffect(() => {
    console.log('[PROFILE_UI] 🔄 Initializing Profile component...');
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[PROFILE_UI] ⚠️ No auth token found. Redirecting to login.');
      navigate('/login');
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('[PROFILE_UI] 📦 Loaded user from localStorage:', storedUser);
    setUser(storedUser);
    setFormData(prev => ({
      ...prev,
      name: storedUser.name || '',
      email: storedUser.email || '',
      phone: storedUser.phone || '',
      profile_image: storedUser.profile_image || ''
    }));

    console.log('[PROFILE_UI] 🌐 Fetching fresh user profile from backend...');
    fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      console.log('[PROFILE_UI] 📥 Profile fetch response received:', data);
      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setFormData(prev => ({
          ...prev,
          name: data.user.name || prev.name,
          email: data.user.email || prev.email,
          phone: data.user.phone || prev.phone,
          profile_image: data.user.profile_image || prev.profile_image
        }));
        console.log('[PROFILE_UI] ✅ Profile state updated with fresh data.');
      } else {
        console.warn('[PROFILE_UI] ⚠️ Failed to load fresh profile data:', data.message);
      }
    })
    .catch(err => console.error('[PROFILE_UI] ❌ Error fetching fresh user data:', err));

  }, [navigate]);

  // 2. Form Input Change Handler
  const handleChange = (e) => {
    console.log(`[PROFILE_UI] ✍️ Field changed: ${e.target.name} = ${e.target.value}`);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Profile Image Upload Handler
  const handleImageChange = async (e) => {
    const file = e.target.files[0]; 
    if (!file) return;

    console.log('[PROFILE_UI] 📸 Profile image selected:', file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profile_image: reader.result }));
    };
    reader.readAsDataURL(file);

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dataToSend = new FormData();
      dataToSend.append('profile_image', file); 
      
      console.log('[PROFILE_UI] 🚀 Sending profile image update request...');
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: dataToSend
      });
      const data = await response.json();
      console.log('[PROFILE_UI] 📥 Image upload response:', data);
      
      if (response.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setFormData(prev => ({ ...prev, profile_image: data.user.profile_image }));
        toast.success('Profile photo updated successfully!');
        console.log('[PROFILE_UI] ✅ Profile photo updated successfully.');
      } else {
        toast.error(data.message || 'Failed to upload image.');
        console.warn('[PROFILE_UI] ⚠️️ Image upload failed:', data.message);
      }
    } catch (error) {
      console.error('[PROFILE_UI] ❌ Image upload exception:', error);
      toast.error('Failed to upload image.');
    } finally {
      setIsLoading(false); 
    }
  };

  // 4. General Profile Details Update Handler (Name, Email, Phone)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    console.log('[PROFILE_UI] 📝 Submitting profile update with data:', { name: formData.name, email: formData.email, phone: formData.phone });
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
      console.log('[PROFILE_UI] 📥 Profile update response:', data);

      if (response.ok && data.success) {
        toast.success('Profile updated successfully!');
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setEditSection(null);
        console.log('[PROFILE_UI] ✅ Profile updated and state synchronized.');
      } else {
        toast.error(data.message || 'Failed to update profile.');
        console.warn('[PROFILE_UI] ⚠️ Profile update failed:', data.message);
      }
    } catch (error) {
      console.error('[PROFILE_UI] ❌ Profile update exception:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Password Update Handler
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    console.log('[PROFILE_UI] 🔒 Submitting password change request...');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dataToSend = new FormData();
      dataToSend.append('currentPassword', formData.currentPassword);
      dataToSend.append('newPassword', formData.newPassword);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: dataToSend
      });

      const data = await response.json();
      console.log('[PROFILE_UI] 📥 Password change response:', data);

      if (response.ok && data.success) {
        toast.success('Password changed successfully!');
        setEditSection(null);
        setFormData({ ...formData, currentPassword: '', newPassword: '' });
        console.log('[PROFILE_UI] ✅ Password changed successfully.');
      } else {
        toast.error(data.message || 'Failed to change password.');
        console.warn('[PROFILE_UI] ⚠️ Password change failed:', data.message);
      }
    } catch (error) {
      console.error('[PROFILE_UI] ❌ Password change exception:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Logout Handler
  const handleLogout = () => {
    console.log('[PROFILE_UI] 🚪 Logging out user. Clearing localStorage.');
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
               <img src={formData.profile_image} alt="User Avatar" style={{ opacity: isLoading ? 0.6 : 1 }} />
            ) : (
               <span className="avatar-placeholder"><FaUserCircle size={64} color="#a0aec0" /></span>
            )}
            
            {isLoading && (
              <div className="avatar-loading-overlay">
                <div className="spinner"></div>
              </div>
            )}

            <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} disabled={isLoading} />
            <label htmlFor="imageUpload" className="avatar-edit-badge" title="Change Photo">
              <FaCamera />
            </label>
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
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
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
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
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