import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// FIX: added fallback -- consistent with the rest of the app, so a
// missing VITE_API_URL doesn't silently break login.
const API_BASE_URL = import.meta.env.VITE_API_URL;

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
    console.log('[LOGIN] Request starting -- email:', email);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[LOGIN] Response received, parsing JSON...');
      const data = await res.json();
      console.log('[LOGIN] Parsed data:', data);

      if (res.ok && data.token) {
        // FIX: key must be 'token' everywhere it's read -- checkout page
        // and other protected pages were reading 'authToken', which never
        // existed, so every protected request went out with no token.
        localStorage.setItem('token', data.token);

        // NOTE: currently data.user is just a role string ('user'/'admin')
        // from the backend. If/when you update loginUser to return
        // { id, name, email, role }, switch this to:
        //   localStorage.setItem('user', JSON.stringify(data.user));
        //   const role = data.user.role;
        // and update every place that reads localStorage 'role' or
        // compares data.user === 'admin' to use .role instead.
        localStorage.setItem('role', data.user);
        console.log('[LOGIN] Success -- role:', data.user);

        if (data.user === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        console.warn('[LOGIN] Failed:', data.message);
        setErrorMessage(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('[LOGIN] Network/error:', err);
      setErrorMessage('Network error. Is your backend server running?');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          <Link to="/forgot-password" style={{ color: '#e07a5f', textDecoration: 'none' }}>
            Forgot Password?
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Login;