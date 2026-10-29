import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ResetPassword.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const passedEmail = location.state?.email || '';

  const [email, setEmail] = useState(passedEmail);
  const [otp, setOtp] = useState('');
  
  // 🌟 Naya State: Step 1 = Verify OTP, Step 2 = Set Password
  const [step, setStep] = useState(1); 
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1: Sirf OTP Backend se Verify karna
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 5) {
      toast.error('Please enter a valid OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Action 'verify' bhej rahe hain taaki backend sirf check kare
        body: JSON.stringify({ email, otp, action: 'verify' }), 
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('OTP Verified successfully!');
        setStep(2); // ✅ OTP sahi hai, ab password fields dikhao
      } else {
        toast.error(data.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      toast.error('Could not reach the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Naya Password Save karna
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Action 'reset' bhej rahe hain taaki backend password update kare
        body: JSON.stringify({ email, otp, newPassword, action: 'reset' }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Password reset successfully! Redirecting...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      toast.error('Could not reach the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        
        {step === 1 ? (
          <>
            <h2>Verify OTP</h2>
            <p className="subtitle-text">Check your email inbox for the 6-digit code.</p>
            
            <form onSubmit={handleVerifyOTP} className="reset-password-form">
              <input
                type="email"
                placeholder="Account Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly={!!passedEmail}
                className={`auth-input ${passedEmail ? 'readonly-input' : ''}`}
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
              
              <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
                {isSubmitting ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>Create New Password</h2>
            <p className="subtitle-text">Your OTP is verified. Please enter a new password.</p>
            
            <form onSubmit={handleResetPassword} className="reset-password-form">
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
                {isSubmitting ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <div className="back-to-login">
          <Link to="/login" className="login-link">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;