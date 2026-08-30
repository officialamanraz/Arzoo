import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    profile_image: ''
  });
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      username: storedUser.username || '',
      email: storedUser.email || '',
      profile_image: storedUser.profile_image || ''
    });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. Image select hone par sirf UI mein preview dikhane ke liye
  const handleImageChange = (e) => {
    const file = e.target.files[0]; 
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Form submit hone par Text + File dono ek sath backend ko bhejna
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const token = localStorage.getItem('token');
      
      // JSON ki jagah FormData banayenge (Kyunki file bhejni hai)
      const dataToSend = new FormData();
      dataToSend.append('name', formData.name);
      dataToSend.append('email', formData.email);
      dataToSend.append('username', formData.username);

      // Agar user ne nayi photo select ki hai, toh use FormData mein add karein
      const fileInput = document.getElementById('imageUpload');
      if (fileInput && fileInput.files[0]) {
        dataToSend.append('image', fileInput.files[0]); 
      }

      // 🚨 DHYAN DEIN: URL ko check kar lein. Agar aapka auth router '/api/auth' par set hai toh yeh sahi hai.
      // Agar wo '/api/users' par set hai, toh isko `${API_BASE_URL}/api/users/profile` kar dijiyega.
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // YAHAN 'Content-Type' NAHI LIKHNA HAI! Browser FormData ke liye ise khud handle karta hai.
        },
        body: dataToSend
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Profile updated successfully!');
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        setTimeout(() => window.location.reload(), 1500); 
      } else {
        setIsError(true);
        setMessage(data.message || 'Failed to update profile.');
      }
    } catch (error) {
      setIsError(true);
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-sidebar">
        <div className="profile-sidebar-header">
          <div className="profile-avatar">
            {user.profile_image ? (
               <img src={user.profile_image} alt="User Avatar" />
            ) : (
               <span className="avatar-placeholder">👤</span>
            )}
          </div>
          <h3>{user.username || user.name || 'User'}</h3>
          <p>{user.email}</p>
        </div>
        
        <ul className="profile-menu">
          <li className="active">Account Settings</li>
          <li onClick={() => navigate('/my-orders')}>My Orders</li>
          <li onClick={() => {
            localStorage.clear();
            navigate('/login');
            window.location.reload();
          }} className="logout-btn">Log Out</li>
        </ul>
      </div>

      <div className="profile-content">
        <h2>Account Settings</h2>
        <p className="profile-subtext">Update your personal information and username.</p>

        {message && (
          <div className={`status-message ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              placeholder="e.g. aman_raza"
            />
            <small>This will be visible on your reviews and profile.</small>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Profile Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              
              {formData.profile_image && (
                <img 
                  src={formData.profile_image} 
                  alt="Preview" 
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }} 
                />
              )}

              <input 
                type="file" 
                id="imageUpload" 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{ display: 'none' }} 
              />

              <label 
                htmlFor="imageUpload" 
                style={{ cursor: 'pointer', padding: '10px 15px', background: '#f8f9fa', border: '1px solid #ccc', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
              >
                📷 Select File & Upload
              </label>
            </div>
          </div>

          <button type="submit" className="save-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;