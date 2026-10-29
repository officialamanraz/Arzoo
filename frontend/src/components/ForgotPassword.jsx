import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        // Automatically move to OTP screen, passing the email via state
        navigate('/reset-password', { state: { email: email } });
      } else {
        setIsError(true);
        setMessage(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Could not reach the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h2>Forgot Password</h2>
        <p className="subtitle-text">
          Enter your account email. We'll send you a 6-digit OTP to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {message && (
            <div className={`message-box ${isError ? 'message-error' : 'message-success'}`}>
              {message}
            </div>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          
          <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
            {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
          </button>

          <div className="back-to-login">
            <Link to="/login" className="login-link">Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;