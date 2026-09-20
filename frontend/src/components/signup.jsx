import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Signup() {
  const navigate = useNavigate();

  const [locationData, setLocationData] = useState({});
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    state: '',
    city: '',
    fullAddress: '',
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchLocations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/location/states-districts`, {
          signal: controller.signal,
        });
        const textData = await res.text(); 
        const data = JSON.parse(textData);
        setLocationData(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('[Signup] Location API Error:', error);
        }
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchLocations();
    return () => controller.abort();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStateChange = (e) => {
    setFormData({
      ...formData,
      state: e.target.value,
      city: '',
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const dataToSend = new FormData();
      dataToSend.append('name', formData.name);
      dataToSend.append('email', formData.email);
      dataToSend.append('password', formData.password);
      dataToSend.append('phone', formData.phone);
      dataToSend.append('state', formData.state);
      dataToSend.append('city', formData.city);
      dataToSend.append('fullFormattedAddress', formData.fullAddress);
      
      if (profileImageFile) {
        dataToSend.append('profile_image', profileImageFile);
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: dataToSend,
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        navigate('/');
        window.location.reload();
      } else {
        setErrorMessage(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('[Signup] Request error:', err);
      setErrorMessage('Could not reach the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <h2 className="signup-title">Create Account</h2>

      <form onSubmit={handleSignup} className="signup-form">
        {errorMessage && (
          <div className="signup-error-box">
            {errorMessage}
          </div>
        )}

        {/* Profile Picture Upload Section */}
        <div className="signup-avatar-container">
          <div className="signup-avatar-preview">
            {imagePreview ? (
              <img src={imagePreview} alt="Avatar Preview" />
            ) : (
              <span className="avatar-placeholder-icon">👤</span>
            )}
          </div>
          <label htmlFor="profileImageInput" className="signup-avatar-label">
            Upload Profile Picture (Optional)
          </label>
          <input 
            type="file" 
            id="profileImageInput" 
            accept="image/*" 
            onChange={handleImageChange} 
            style={{ display: 'none' }} 
          />
        </div>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="signup-input"
        />
        
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
          className="signup-input"
        />

        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password (min. 6 characters)"
            minLength="6"
            value={formData.password}
            onChange={handleChange}
            required
            className="signup-input"
          />
          <button 
            type="button" 
            className="password-toggle-btn" 
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              /* Open Eye */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              /* Eye with Slash */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            )}
          </button>
        </div>
        
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          pattern="[0-9]{10}"
          title="Enter a 10-digit phone number"
          value={formData.phone}
          onChange={handleChange}
          required
          className="signup-input"
          maxLength="10"
        />

        <div className="form-row">
          <select
            value={formData.state}
            onChange={handleStateChange}
            required
            className="signup-select"
          >
            <option value="">{loadingLocations ? 'Loading...' : 'Select State'}</option>
            {!loadingLocations &&
              Object.keys(locationData).map((stateName) => (
                <option key={stateName} value={stateName}>
                  {stateName}
                </option>
              ))}
          </select>

          <select
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
            disabled={!formData.state}
            className={`signup-select ${!formData.state ? 'select-disabled' : ''}`}
          >
            <option value="">Select City</option>
            {formData.state &&
              locationData[formData.state] &&
              locationData[formData.state].map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
          </select>
        </div>

        <textarea
          name="fullAddress"
          placeholder="House No, Building, Street, Area..."
          value={formData.fullAddress}
          onChange={handleChange}
          required
          className="signup-textarea"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="signup-submit-btn"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="signup-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="signup-login-link">
            Sign In here
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Signup;