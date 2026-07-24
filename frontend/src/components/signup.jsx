import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Signup() {
  const navigate = useNavigate();

  // Stores states and their cities, fetched from the backend
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch states/cities list from the backend
  useEffect(() => {
    const controller = new AbortController();

    const fetchLocations = async () => {
      console.log('[Signup] Fetching locations data...');
      try {
        const res = await fetch(`${API_BASE_URL}/api/location/states-districts`, {
          signal: controller.signal,
        });
        
        // DEBUGGING STEP: Read the response as raw text first
        const textData = await res.text(); 
        console.log("[Signup] Raw response from server:", textData);

        // Attempt to parse the text into JSON
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

  const handleStateChange = (e) => {
    console.log(`[Signup] State changed to: ${e.target.value}`);
    setFormData({
      ...formData,
      state: e.target.value,
      city: '', // Reset city whenever state changes
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    console.log("[Signup] Registering user with data:", formData);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("[Signup] Server response:", data);

      if (res.ok && data.token) {
        // Auto-login after successful signup — store the token and
        // go straight to the home page, same as a normal login.
        localStorage.setItem('token', data.token);
        navigate('/');
        window.location.reload(); // Refresh Navbar so it shows logged-in state
      } else {
        console.warn("[Signup] Failed to register:", data.message);
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

        <input
          type="text"
          placeholder="Full Name"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="signup-input"
        />
        
        <input
          type="email"
          placeholder="Email Address"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="signup-input"
        />
        
        <input
          type="password"
          placeholder="Password (min. 6 characters)"
          minLength="6"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          className="signup-input"
        />
        
        <input
          type="tel"
          placeholder="Phone Number"
          pattern="[0-9]{10}"
          title="Enter a 10-digit phone number"
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          className="signup-input"
          maxLength="10"
        />

        {/* Smart Address Section (powered by backend location data) */}
        <div className="form-row">
          {/* State Dropdown */}
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

          {/* City Dropdown */}
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
          placeholder="House No, Building, Street, Area..."
          onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
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