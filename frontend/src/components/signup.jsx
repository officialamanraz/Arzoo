import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api';

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
  try {
    const res = await fetch('https://arzoo-saree.onrender.com/api/location/states-districts', {
      signal: controller.signal,
    });
    
    // DEBUGGING STEP: Read the response as raw text first
    const textData = await res.text(); 
    console.log("🔍 RAW RESPONSE FROM SERVER:", textData);

    // Attempt to parse the text into JSON
    const data = JSON.parse(textData);
    setLocationData(data);

  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Location API Error:', error);
    }
  } finally {
    setLoadingLocations(false);
  }
};
    fetchLocations();
    return () => controller.abort();
  }, []);

  const handleStateChange = (e) => {
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

    try {
      console.log("registering user..."+JSON.stringify(formData));
      const res = await fetch('https://arzoo-saree.onrender.com/api/auth/register', {
        method: 'POST',
          headers: { 'Content-Type': 'application/json' },   // 👈 yeh line add karo

        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        console.log(res.data);
        // Auto-login after successful signup — store the token and
        // go straight to the home page, same as a normal login.
        localStorage.setItem('token', data.token);
        navigate('/');
        window.location.reload(); // refresh Navbar so it shows logged-in state
      } else {
        setErrorMessage(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.log(err )
      console.error('Signup error:', err);
      setErrorMessage('Could not reach the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    outline: 'none',
    fontSize: '15px',
  };

  return (
    <div style={{ marginTop: '80px', textAlign: 'center', padding: '20px', minHeight: '60vh' }}>
      <h2 style={{ color: '#7c3f2f', marginBottom: '25px', fontFamily: 'Playfair Display, serif' }}>
        Create Account
      </h2>

      <form
        onSubmit={handleSignup}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          maxWidth: '350px',
          margin: '0 auto',
          background: '#fff',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        }}
      >
        {errorMessage && (
          <div
            style={{
              background: '#fdecea',
              color: '#b3261e',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'left',
            }}
          >
            {errorMessage}
          </div>
        )}

        <input
          type="text"
          placeholder="Full Name"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="Email Address"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password (min. 6 characters)"
          minLength="6"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          style={inputStyle}
        />
        <input
          type="tel"
          placeholder="Phone Number"
          pattern="[0-9]{10}"
          title="Enter a 10-digit phone number"
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          style={inputStyle}
          maxLength="10"
        />

        {/* Smart Address Section (powered by backend location data) */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* State Dropdown */}
          <select
            value={formData.state}
            onChange={handleStateChange}
            required
            style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
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
            style={{
              ...inputStyle,
              flex: 1,
              cursor: formData.state ? 'pointer' : 'not-allowed',
              background: formData.state ? '#fff' : '#f5f5f5',
            }}
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
          style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '14px',
            background: isSubmitting ? '#a87c6f' : '#7c3f2f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginTop: '10px',
            transition: '0.3s',
          }}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>

        <div style={{ marginTop: '15px', fontSize: '14px', color: '#555' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#e07a5f', fontWeight: 'bold', textDecoration: 'none' }}>
            Sign In here
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Signup;