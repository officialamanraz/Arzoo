import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

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

      if (res.ok && data.token && data.user) {
        // 1. Token save karein
        localStorage.setItem('token', data.token);
        
        // 2. User ka poora data JSON string banakar save karein (Navbar mein name/image ke liye zaroori hai)
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 3. Role ko specifically alag se save karein taaki [object Object] na aaye
        const userRole = data.user.role; 
        localStorage.setItem('role', userRole);
        
        console.log('[Login] Authentication successful -- assigned role:', userRole);

        // 4. Role check karke redirect karein
        if (userRole === 'admin') {
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