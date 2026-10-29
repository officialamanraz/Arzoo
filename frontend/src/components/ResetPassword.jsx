import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ResetPassword.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the email passed from ForgotPassword (if available)
  const passedEmail = location.state?.email || '';

  const [email, setEmail] = useState(passedEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (otp.length < 5) {
      toast.error('Please enter a valid OTP.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 🌟 No token in URL anymore. Send email, OTP, and new password via Body.
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Password reset successfully! Redirecting...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(data.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      toast.error('Could not reach the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h2>Verify OTP & Reset Password</h2>
        <p className="subtitle-text">Check your email inbox for the 6-digit code.</p>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <input
            type="email"
            placeholder="Account Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly={!!passedEmail}
            className={`auth-input ${passedEmail ? 'readonly-input' : ''}`}
            title={passedEmail ? "Email is locked from previous step" : ""}
          />

          <input
            type="text"
            placeholder="Enter 6-Digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength="6"
            className="auth-input otp-input"
            style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
          />

          <input
            type="password"
            placeholder="New Password (min. 6 chars)"
            minLength="6"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="auth-input"
          />
          
          <input
            type="password"
            placeholder="Confirm New Password"
            minLength="6"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="auth-input"
          />
          
          <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
            {isSubmitting ? 'Verifying...' : 'Reset Password'}
          </button>

          <div className="back-to-login">
            <Link to="/login" className="login-link">Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;