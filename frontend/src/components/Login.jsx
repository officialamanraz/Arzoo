import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Extracted CSS

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
    console.log('[Login] Authentication request starting -- email:', email);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[Login] Response received, parsing JSON...');
      const data = await res.json();
      console.log('[Login] Parsed data:', data);

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user);
        console.log('[Login] Authentication successful -- assigned role:', data.user);

        if (data.user === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        console.warn('[Login] Authentication failed:', data.message);
        setErrorMessage(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('[Login] Network/error:', err);
      setErrorMessage('Network error. Is your backend server running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Login to Arzoo Saree</h2>
        
        <form onSubmit={handleLogin} className="login-form">
          {errorMessage && (
            <div className="message-error">
              {errorMessage}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-submit-btn"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
          
          <div className="forgot-password-link">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;