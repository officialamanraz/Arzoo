import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Define your API URL directly
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    console.log("DEBUG: Login request starting...");

    try {
      // 2. Use native fetch with explicit headers
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("DEBUG: Got response from server, parsing JSON...");
      const data = await res.json();
      console.log("DEBUG: Parsed data:", data);

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user); 
        
        if (data.user === 'admin') {
          navigate('/admin');
        } else {
          navigate('/'); 
        }
      } else {
        setErrorMessage(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Network error. Is your backend server running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (keep your return statement exactly the same)
  return (
    <div style={{ marginTop: '120px', textAlign: 'center', padding: '20px', minHeight: '60vh' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Login to Aman Saare</h2>
      <form
        onSubmit={handleLogin}
        style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto' }}
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
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '12px',
            background: isSubmitting ? '#ffab8a' : '#ff5722',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login;