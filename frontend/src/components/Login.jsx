import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        const userRole = data.user.role; 
        localStorage.setItem('role', userRole);
        
        console.log('[Login] Authentication successful -- assigned role:', userRole);
        toast.success('Logged in successfully!');

        if (userRole === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        console.warn('[Login] Authentication failed:', data.message);
        toast.error(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('[Login] Network/error:', err);
      toast.error('Network error. Is your backend server running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Login to Arzoo Saree</h2>
        
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
            <button 
              type="button" 
              className="password-toggle-btn" 
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
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